import path from 'path';
import { ociStorage } from '../objectStorage.js';
import { srtToVtt } from '../utils/mediaUtils.js';

/**
 * Handles HTTP 206 Range requests for HTML5 <video> elements.
 * Serves streams either from OCI Object Storage or directly from WebTorrent file read streams.
 *
 * @param {Object} session - Active room media session
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function streamVideoResponse(session, req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  if (!session || session.status !== 'ready') {
    return res.status(404).json({ error: 'No active video stream ready for this room' });
  }

  // If movie is archived in OCI Object Storage, stream natively from OCI
  if (session.isCachedInOci && session.infoHash) {
    return ociStorage.streamMovie(session.infoHash, req, res).catch((err) => {
      console.error('[Stream Responder OCI Error]:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream cached movie from OCI' });
      } else {
        res.destroy();
      }
    });
  }

  if (!session.videoFile) {
    return res.status(404).json({ error: 'Video file stream not found' });
  }

  const file = session.videoFile;
  const fileSize = file.length;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    let start;
    let end;

    if (parts[0] === '' && parts[1]) {
      // Suffix range: bytes=-500 requests the final 500 bytes of the file (#11)
      const suffixLength = parseInt(parts[1], 10);
      if (isNaN(suffixLength) || suffixLength <= 0) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }
      start = Math.max(0, fileSize - suffixLength);
      end = fileSize - 1;
    } else {
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start < 0 || start >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }
      // Clamp end to fileSize - 1 per RFC 7233
      if (isNaN(end) || end >= fileSize) {
        end = fileSize - 1;
      }
      if (start > end) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }
    }

    const chunksize = end - start + 1;
    const stream = file.createReadStream({ start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': session.mimeType,
      'Access-Control-Allow-Origin': '*'
    });

    stream.on('error', (err) => {
      console.warn('[Stream Error]:', err.message);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy();
      }
    });

    stream.pipe(res);

    req.on('close', () => {
      stream.destroy();
    });
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': session.mimeType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = file.createReadStream();

    stream.on('error', (err) => {
      console.warn('[Stream Error]:', err.message);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy();
      }
    });

    stream.pipe(res);

    req.on('close', () => {
      stream.destroy();
    });
  }
}

/**
 * Handles WebVTT subtitle delivery for HTML5 video tracks.
 * Uses cached memory/OCI vtt representation or dynamically converts SRT files.
 *
 * @param {Object} session - Active room media session
 * @param {string|number} subIndex - Subtitle index
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function streamSubtitleResponse(session, subIndex, req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  if (!session || !session.subtitleFiles) {
    return res.status(404).send('Subtitles not found');
  }

  const sub = session.subtitleFiles.find((s) => s.index === parseInt(subIndex, 10));
  if (!sub || !sub.fileRef) {
    return res.status(404).send('Subtitle index not found');
  }

  res.setHeader('Content-Type', 'text/vtt; charset=utf-8');

  // Return pre-cached WebVTT text directly if available
  if (sub.vttContent) {
    return res.send(sub.vttContent);
  }

  // Try reading cached subtitle from OCI Object Storage
  if (session.infoHash) {
    const ociVtt = await ociStorage.getSubtitles(session.infoHash, subIndex);
    if (ociVtt) {
      sub.vttContent = ociVtt;
      return res.send(ociVtt);
    }
  }

  try {
    const ext = path.extname(sub.fileRef.name).toLowerCase();
    const ab = await sub.fileRef.arrayBuffer();
    const text = Buffer.from(ab).toString('utf-8');
    const vtt = ext === '.srt' ? srtToVtt(text) : text;
    sub.vttContent = vtt;
    return res.send(vtt);
  } catch (err) {
    console.warn('[Torrent Subtitle Stream Error]:', err.message);
    return res.status(500).send('Error reading subtitle stream');
  }
}

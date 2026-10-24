import WebTorrent from 'webtorrent';
import axios from 'axios';
import path from 'path';

/**
 * Utility to convert SRT subtitle text to WebVTT format for HTML5 video <track> elements.
 */
export function srtToVtt(srtContent) {
  let vtt = 'WEBVTT\n\n';
  let clean = srtContent.replace(/^\uFEFF/, '');
  clean = clean.replace(/\r\n|\r/g, '\n');
  clean = clean.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return vtt + clean;
}

class TorrentManager {
  constructor() {
    this.client = new WebTorrent();
    // roomId -> { torrent, videoFile, subtitleFiles, title, status, error, progress }
    this.roomSessions = new Map();

    this.client.on('error', (err) => {
      console.error('[WebTorrent Engine Error]:', err.message);
    });
  }

  /**
   * Loads a torrent from an HTTP/HTTPS URL, magnet URI, or info hash for a room.
   */
  async setMovieSource(roomId, sourceUrl, onProgress = null) {
    // 1. Destroy any existing torrent for this room
    this.destroyRoomTorrent(roomId);

    const session = {
      roomId,
      sourceUrl,
      torrent: null,
      videoFile: null,
      subtitleFiles: [],
      title: 'Buffering...',
      fileSize: 0,
      mimeType: 'video/mp4',
      status: 'downloading_metadata',
      error: null,
      createdAt: Date.now()
    };
    this.roomSessions.set(roomId, session);

    try {
      let torrentSource = sourceUrl.trim();

      // If it's an HTTP/HTTPS URL and not a magnet link, fetch the .torrent file buffer
      if (torrentSource.startsWith('http://') || torrentSource.startsWith('https://')) {
        if (onProgress) onProgress({ status: 'fetching_torrent_file', message: 'Downloading torrent descriptor...' });
        
        const response = await axios.get(torrentSource, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        torrentSource = Buffer.from(response.data);
      }

      if (onProgress) onProgress({ status: 'connecting_swarm', message: 'Connecting to P2P swarm & resolving peers...' });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.destroyRoomTorrent(roomId);
          const err = new Error('Torrent metadata timeout. No peers found or link is offline.');
          session.status = 'error';
          session.error = err.message;
          reject(err);
        }, 45000); // 45s swarm connection timeout

        this.client.add(torrentSource, (torrent) => {
          clearTimeout(timeout);
          session.torrent = torrent;
          session.title = torrent.name || 'Untitled Cinema Stream';

          console.log(`[Torrent] Added: "${torrent.name}" for room: ${roomId} (InfoHash: ${torrent.infoHash})`);

          // Deselect whole torrent first to prevent downloading unrelated files or random pieces
          torrent.deselect(0, torrent.pieces.length - 1, false);

          // Identify candidate video files (.mp4, .mkv, .webm, .avi)
          const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];
          const videoFiles = torrent.files.filter((file) => {
            const ext = path.extname(file.name).toLowerCase();
            return videoExtensions.includes(ext);
          });

          if (videoFiles.length === 0) {
            this.destroyRoomTorrent(roomId);
            const err = new Error('No compatible video file (MP4/MKV/WebM) found in this torrent archive.');
            session.status = 'error';
            session.error = err.message;
            return reject(err);
          }

          // Prioritize the largest file (almost always the main feature film)
          videoFiles.sort((a, b) => b.length - a.length);
          const primaryVideo = videoFiles[0];

          // Set sequential priority for streaming
          primaryVideo.select();

          // Prioritize start pieces and end pieces where MP4 moov metadata atom resides
          const startPiece = primaryVideo._startPiece || 0;
          const endPiece = primaryVideo._endPiece || (torrent.pieces.length - 1);
          torrent.select(startPiece, Math.min(startPiece + 8, endPiece), 1);
          torrent.select(Math.max(startPiece, endPiece - 8), endPiece, 1);

          session.videoFile = primaryVideo;
          session.fileSize = primaryVideo.length;
          session.title = primaryVideo.name || torrent.name;

          // Determine MIME type
          const ext = path.extname(primaryVideo.name).toLowerCase();
          if (ext === '.webm') session.mimeType = 'video/webm';
          else if (ext === '.mkv') session.mimeType = 'video/x-matroska';
          else session.mimeType = 'video/mp4';

          // Identify subtitle files (.srt or .vtt)
          const subExtensions = ['.srt', '.vtt'];
          const subs = torrent.files
            .filter((file) => subExtensions.includes(path.extname(file.name).toLowerCase()))
            .map((file, idx) => ({
              index: idx,
              name: file.name,
              path: file.path,
              fileRef: file
            }));

          session.subtitleFiles = subs;
          session.status = 'ready';

          console.log(`[Torrent] Cinema Stream Ready: "${session.title}" (${(session.fileSize / (1024 * 1024)).toFixed(1)} MB, ${subs.length} subtitle tracks)`);

          resolve({
            title: session.title,
            fileSize: session.fileSize,
            mimeType: session.mimeType,
            subtitles: subs.map(s => ({ index: s.index, name: s.name }))
          });
        });
      });
    } catch (err) {
      session.status = 'error';
      session.error = err.message;
      this.destroyRoomTorrent(roomId);
      throw err;
    }
  }

  /**
   * HTTP 206 Range Streamer for HTML5 <video>
   */
  streamVideo(roomId, req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    const session = this.roomSessions.get(roomId);
    if (!session || !session.videoFile || session.status !== 'ready') {
      return res.status(404).json({ error: 'No active video stream ready for this room' });
    }

    const file = session.videoFile;
    const fileSize = file.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
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
      stream.pipe(res);

      req.on('close', () => {
        stream.destroy();
      });
    }
  }

  /**
   * Streams subtitle track converted to WebVTT
   */
  streamSubtitle(roomId, subIndex, req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    const session = this.roomSessions.get(roomId);
    if (!session || !session.subtitleFiles) {
      return res.status(404).send('Subtitles not found');
    }

    const sub = session.subtitleFiles.find(s => s.index === parseInt(subIndex, 10));
    if (!sub || !sub.fileRef) {
      return res.status(404).send('Subtitle index not found');
    }

    const file = sub.fileRef;
    const ext = path.extname(file.name).toLowerCase();

    const stream = file.createReadStream();
    let dataBuffer = '';

    stream.on('data', (chunk) => {
      dataBuffer += chunk.toString('utf-8');
    });

    stream.on('end', () => {
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (ext === '.srt') {
        res.send(srtToVtt(dataBuffer));
      } else {
        res.send(dataBuffer);
      }
    });

    stream.on('error', (err) => {
      res.status(500).send('Error reading subtitle stream');
    });
  }

  getSession(roomId) {
    return this.roomSessions.get(roomId) || null;
  }

  destroyRoomTorrent(roomId) {
    const session = this.roomSessions.get(roomId);
    if (session && session.torrent) {
      try {
        session.torrent.destroy({ destroyStore: true });
        console.log(`[Torrent] Destroyed torrent for room: ${roomId}`);
      } catch (e) {
        console.warn(`[Torrent] Error destroying torrent for room ${roomId}:`, e.message);
      }
    }
    this.roomSessions.delete(roomId);
  }
}

export const torrentManager = new TorrentManager();

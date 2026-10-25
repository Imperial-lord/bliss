import WebTorrent from 'webtorrent';
import axios from 'axios';
import { ociStorage } from './objectStorage.js';
import {
  MODERN_TRACKERS,
  cleanMovieTitle,
  srtToVtt,
  detectVideoMimeType,
  extractVideoFiles,
  extractSubtitleFiles
} from './utils/mediaUtils.js';
import { streamVideoResponse, streamSubtitleResponse } from './services/streamResponder.js';

// Re-export utilities for backward compatibility & test suites
export { MODERN_TRACKERS, cleanMovieTitle, srtToVtt };

/**
 * Manages active WebTorrent download sessions, swarm caching, and video streaming.
 */
class TorrentManager {
  constructor() {
    this.client = new WebTorrent();
    // roomId -> session descriptor
    this.roomSessions = new Map();

    this.client.on('error', (err) => {
      console.error('[WebTorrent Engine Error]:', err.message);
    });
  }

  /**
   * Loads a torrent from an HTTP/HTTPS URL, magnet URI, or info hash for a room.
   *
   * @param {string} roomId
   * @param {string} sourceUrl
   * @param {Function} [onProgress]
   * @returns {Promise<Object>} Cinema stream descriptor
   */
  async setMovieSource(roomId, sourceUrl, onProgress = null) {
    // 1. Destroy any existing torrent for this room
    this.destroyRoomTorrent(roomId);

    const session = {
      roomId,
      sourceUrl,
      infoHash: null,
      isCachedInOci: false,
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

      // Check if source contains a recognizable infoHash that is already cached in OCI
      const hashMatch = torrentSource.match(/(?:xt=urn:btih:|download\/|torrent\/)([a-fA-F0-9]{40})/i);
      if (hashMatch) {
        const candidateHash = hashMatch[1].toLowerCase();
        if (await ociStorage.hasMovie(candidateHash)) {
          console.log(`[Torrent] Movie ${candidateHash} found in OCI Object Storage! Instant cinema ready.`);
          const meta = await ociStorage.getMovieMetadata(candidateHash);
          session.infoHash = candidateHash;
          session.isCachedInOci = true;
          session.fileSize = meta.contentLength;
          session.mimeType = meta.contentType;
          session.title = cleanMovieTitle(torrentSource.split('/').pop() || 'Cached Cinema Movie');
          session.status = 'ready';

          return {
            title: session.title,
            fileSize: session.fileSize,
            mimeType: session.mimeType,
            subtitles: []
          };
        }
      }

      // If it's an HTTP/HTTPS URL and not a magnet link, fetch the .torrent file buffer
      if (torrentSource.startsWith('http://') || torrentSource.startsWith('https://')) {
        if (onProgress) {
          onProgress({ status: 'fetching_torrent_file', message: 'Downloading torrent descriptor...' });
        }

        const response = await axios.get(torrentSource, {
          responseType: 'arraybuffer',
          timeout: 15000,
          maxRedirects: 5,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        torrentSource = Buffer.from(response.data);
      }

      if (onProgress) {
        onProgress({ status: 'connecting_swarm', message: 'Connecting to P2P swarm & resolving peers...' });
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.destroyRoomTorrent(roomId);
          const err = new Error('Torrent metadata timeout. No peers found or link is offline.');
          session.status = 'error';
          session.error = err.message;
          reject(err);
        }, 45000); // 45s swarm connection timeout

        // Ingest torrent with injected modern trackers for rapid peer connection
        this.client.add(torrentSource, { announce: MODERN_TRACKERS }, async (torrent) => {
          clearTimeout(timeout);
          session.torrent = torrent;
          session.infoHash = torrent.infoHash;
          session.title = torrent.name || 'Untitled Cinema Stream';

          console.log(`[Torrent] Added: "${torrent.name}" for room: ${roomId} (InfoHash: ${torrent.infoHash})`);

          // Check if resolved infoHash is already cached in OCI
          if (await ociStorage.hasMovie(torrent.infoHash)) {
            console.log(`[Torrent] InfoHash ${torrent.infoHash} is cached in OCI Object Storage!`);
            session.isCachedInOci = true;
          }

          // Deselect whole torrent first to prevent downloading unrelated files
          torrent.deselect(0, torrent.pieces.length - 1, false);

          // Identify candidate video files
          const videoFiles = extractVideoFiles(torrent.files);
          if (videoFiles.length === 0) {
            this.destroyRoomTorrent(roomId);
            const err = new Error('No compatible video file (MP4/MKV/WebM) found in this torrent archive.');
            session.status = 'error';
            session.error = err.message;
            return reject(err);
          }

          // Prioritize the largest file (almost always the main feature film)
          const primaryVideo = videoFiles[0];
          primaryVideo.select();

          // Identify and prioritize subtitle files (.srt or .vtt)
          const subs = extractSubtitleFiles(torrent.files);
          for (const sub of subs) {
            const startP = sub.fileRef._startPiece || 0;
            const endP = sub.fileRef._endPiece || startP;
            torrent.critical(startP, endP);

            // Fetch subtitle buffer asynchronously and pre-cache WebVTT
            sub.fileRef
              .arrayBuffer()
              .then((ab) => {
                const text = Buffer.from(ab).toString('utf-8');
                sub.vttContent = sub.name.toLowerCase().endsWith('.srt') ? srtToVtt(text) : text;
                console.log(`[Torrent] Subtitle track ${sub.index} ("${sub.name}") pre-cached (${sub.vttContent.length} chars)`);
                if (torrent && torrent.infoHash) {
                  ociStorage.saveSubtitles(torrent.infoHash, sub.index, sub.vttContent);
                }
              })
              .catch((err) => {
                console.warn(`[Torrent] Warning pre-caching subtitle ${sub.name}:`, err.message);
              });
          }

          session.videoFile = primaryVideo;
          session.fileSize = primaryVideo.length;
          session.title = cleanMovieTitle(torrent.name || primaryVideo.name);
          session.subtitleFiles = subs;
          session.mimeType = detectVideoMimeType(primaryVideo.name);

          // Background upload to OCI Object Storage when torrent finishes downloading 100%
          torrent.on('done', () => {
            console.log(`[Torrent] Download complete for "${session.title}". Archiving to OCI Object Storage...`);
            ociStorage.saveMovieStream(
              torrent.infoHash,
              primaryVideo.createReadStream(),
              primaryVideo.length,
              session.mimeType
            );
          });

          // Critical priority for piece 0 (contains MP4 container headers & metadata atom)
          const startPiece = primaryVideo._startPiece || 0;
          const endPiece = primaryVideo._endPiece || torrent.pieces.length - 1;
          torrent.critical(startPiece, Math.min(startPiece + 3, endPiece));

          if (onProgress) {
            onProgress({
              status: 'buffering_stream',
              message: 'Pre-buffering initial cinema stream pieces...'
            });
          }

          // Await piece 0 verification before declaring stream ready so HTTP 206 starts instantly
          await this._waitForInitialPiece(torrent, startPiece);

          session.status = 'ready';

          console.log(
            `[Torrent] Cinema Stream Ready: "${session.title}" (${(session.fileSize / (1024 * 1024)).toFixed(1)} MB, ${subs.length} subtitle tracks)`
          );

          resolve({
            title: session.title,
            fileSize: session.fileSize,
            mimeType: session.mimeType,
            subtitles: subs.map((s) => ({ index: s.index, name: s.name }))
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
   * Helper that checks for or waits on piece 0 readiness.
   * @private
   */
  _waitForInitialPiece(torrent, startPiece) {
    return new Promise((readyResolve) => {
      if (torrent.bitfield && torrent.bitfield.get(startPiece)) {
        return readyResolve();
      }

      const onPiece = (p) => {
        if (p === startPiece) {
          torrent.off('piece', onPiece);
          clearInterval(poll);
          readyResolve();
        }
      };
      torrent.on('piece', onPiece);

      const poll = setInterval(() => {
        if (torrent.bitfield && torrent.bitfield.get(startPiece)) {
          torrent.off('piece', onPiece);
          clearInterval(poll);
          readyResolve();
        }
      }, 250);

      // 15-second safety timeout so we never hang if swarm piece 0 verification is slow
      setTimeout(() => {
        torrent.off('piece', onPiece);
        clearInterval(poll);
        readyResolve();
      }, 15000);
    });
  }

  /**
   * HTTP 206 Range Streamer for HTML5 <video>
   */
  streamVideo(roomId, req, res) {
    const session = this.roomSessions.get(roomId);
    return streamVideoResponse(session, req, res);
  }

  /**
   * Streams subtitle track converted to WebVTT
   */
  async streamSubtitle(roomId, subIndex, req, res) {
    const session = this.roomSessions.get(roomId);
    return streamSubtitleResponse(session, subIndex, req, res);
  }

  getSession(roomId) {
    return this.roomSessions.get(roomId) || null;
  }

  destroyRoomTorrent(roomId) {
    const session = this.roomSessions.get(roomId);
    if (session && session.torrent) {
      try {
        if (this.client && typeof this.client.remove === 'function') {
          this.client.remove(session.torrent, { destroyStore: true }, (err) => {
            if (err) console.warn(`[Torrent] Warning removing torrent: ${err.message}`);
          });
        } else {
          session.torrent.destroy({ destroyStore: true });
        }
        console.log(`[Torrent] Cleanly removed torrent for room: ${roomId}`);
      } catch (e) {
        console.warn(`[Torrent] Error destroying torrent for room ${roomId}:`, e.message);
      }
    }
    this.roomSessions.delete(roomId);
  }
}

export const torrentManager = new TorrentManager();

import path from 'path';

/**
 * High-availability public trackers for rapid DHT & peer discovery.
 * Injected automatically into all torrents to ensure swift connections
 * even if the original torrent archive contains deprecated/dead trackers.
 */
export const MODERN_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://explodie.org:6969/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'http://tracker.openbittorrent.com:80/announce',
  'https://opentracker.i2p.rocks:443/announce',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.webtorrent.dev'
];

/**
 * Supported video and subtitle file extensions.
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];
export const SUBTITLE_EXTENSIONS = ['.srt', '.vtt'];

/**
 * Formats messy torrent file and release names into clean, human-readable movie titles.
 * E.g. "The.Dark.Knight.2008.720p.BluRay.x264.YIFY.mp4" -> "The Dark Knight (2008)"
 *
 * @param {string} raw - Raw filename or torrent name
 * @returns {string} Clean formatted movie title
 */
export function cleanMovieTitle(raw) {
  if (!raw || typeof raw !== 'string') return 'Cinema Stream';

  let clean = raw.replace(/\.(mp4|mkv|avi|webm|mov|m4v|flv)$/i, '');
  clean = clean.replace(/\[[^\]]*\]/g, ' ');

  const parenYear = clean.match(/(.*?)\s*\((19\d{2}|20\d{2})\).*/i);
  if (parenYear && parenYear[1].trim().length > 0) {
    const title = parenYear[1].replace(/[._+]/g, ' ').replace(/\s+/g, ' ').trim();
    return `${title} (${parenYear[2]})`;
  }

  clean = clean.replace(/[._+]/g, ' ');
  const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const year = yearMatch[1];
    let titlePart = clean.slice(0, yearMatch.index).replace(/[()]/g, '').trim();
    titlePart = titlePart.replace(/\s+/g, ' ');
    if (titlePart.length > 0) {
      return `${titlePart} (${year})`;
    }
  }

  const tagsRegex = /\b(720p|1080p|2160p|4k|bluray|brrip|bdrip|webrip|web-dl|webdl|dvdrip|hdrip|x264|x265|hevc|h264|yify|yts|sparks|rarbg|galaxy|aac|ac3|dts|remastered|extended|directors cut|unrated)\b.*/i;
  clean = clean.replace(tagsRegex, '').replace(/\s+/g, ' ').trim();
  return clean || raw;
}

/**
 * Converts SubRip (SRT) subtitle text into standard WebVTT format.
 *
 * @param {string} srtContent - Raw SRT text
 * @returns {string} Formatted WebVTT text
 */
export function srtToVtt(srtContent) {
  let vtt = 'WEBVTT\n\n';
  let clean = srtContent.replace(/^\uFEFF/, '');
  clean = clean.replace(/\r\n|\r/g, '\n');
  clean = clean.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return vtt + clean;
}

/**
 * Determines appropriate MIME content type from video file name.
 *
 * @param {string} filename
 * @returns {string} MIME type
 */
export function detectVideoMimeType(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mkv') return 'video/x-matroska';
  return 'video/mp4';
}

/**
 * Filters and sorts video files from a WebTorrent files collection.
 *
 * @param {Array} files - WebTorrent files
 * @returns {Array} Filtered video files sorted by file size descending
 */
export function extractVideoFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .filter((file) => VIDEO_EXTENSIONS.includes(path.extname(file.name).toLowerCase()))
    .sort((a, b) => b.length - a.length);
}

/**
 * Filters subtitle files (.srt, .vtt) from a WebTorrent files collection.
 *
 * @param {Array} files - WebTorrent files
 * @returns {Array} Subtitle descriptor objects
 */
export function extractSubtitleFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .filter((file) => SUBTITLE_EXTENSIONS.includes(path.extname(file.name).toLowerCase()))
    .map((file, idx) => ({
      index: idx,
      name: file.name,
      path: file.path,
      fileRef: file,
      vttContent: null
    }));
}

/**
 * Formats messy torrent file and release names into clean, human-readable movie titles.
 * E.g. "The.Dark.Knight.2008.720p.BluRay.x264.YIFY.mp4" -> "The Dark Knight (2008)"
 *
 * @param {string} raw - Raw filename or torrent title
 * @returns {string} Formatted movie title
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
 * Robust WebVTT subtitle parser.
 * Converts WebVTT cue blocks into structured { start, end, text } timestamps in seconds.
 *
 * @param {string} vttText - Raw WebVTT text
 * @returns {Array<{ start: number, end: number, text: string }>} Parsed cues
 */
export function parseVttToCues(vttText) {
  if (!vttText || typeof vttText !== 'string') return [];
  const cues = [];
  const timeRegex = /(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

  const parseSeconds = (h, m, s, ms) => {
    return (
      parseInt(h || '0', 10) * 3600 +
      parseInt(m, 10) * 60 +
      parseInt(s, 10) +
      parseInt(ms, 10) / 1000
    );
  };

  const blocks = vttText.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(timeRegex);
      if (match) {
        const start = parseSeconds(match[1], match[2], match[3], match[4]);
        const end = parseSeconds(match[5], match[6], match[7], match[8]);
        const text = lines
          .slice(i + 1)
          .join('\n')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (text) cues.push({ start, end, text });
        break;
      }
    }
  }
  return cues;
}

/**
 * Formats seconds into human-readable HH:MM:SS or MM:SS timestamp.
 *
 * @param {number} secs
 * @returns {string} Formatted timestamp
 */
export function formatTime(secs) {
  if (isNaN(secs) || secs < 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

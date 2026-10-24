import { useState, useEffect } from 'react';
import { parseVttToCues } from '../utils/moviePlayerUtils';

/**
 * Custom hook to fetch WebVTT subtitle tracks and calculate the active subtitle cue.
 *
 * @param {Object} params
 * @param {string} params.roomId
 * @param {number} params.selectedSubIndex
 * @param {Array} params.subtitles
 * @param {string} params.mediaStatus
 * @param {boolean} params.showSubtitles
 * @param {number} params.currentTime
 * @returns {{ cues: Array, currentCue: string }}
 */
export function usePlayerSubtitles({
  roomId,
  selectedSubIndex,
  subtitles,
  mediaStatus,
  showSubtitles,
  currentTime
}) {
  const [cues, setCues] = useState([]);
  const [currentCue, setCurrentCue] = useState('');

  // Reset cues when status leaves 'ready'
  useEffect(() => {
    if (mediaStatus !== 'ready') {
      setCues([]);
      setCurrentCue('');
    }
  }, [mediaStatus]);

  // Fetch and parse WebVTT subtitle track
  useEffect(() => {
    if (!subtitles || subtitles.length === 0 || mediaStatus !== 'ready') {
      setCues([]);
      setCurrentCue('');
      return;
    }

    const subUrl = `/api/subtitles/${roomId}/${selectedSubIndex}.vtt`;
    let isCancelled = false;

    fetch(subUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((vttText) => {
        if (isCancelled) return;
        const parsed = parseVttToCues(vttText);
        setCues(parsed);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[Subtitles Load Warning]:', err.message);
          setCues([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [roomId, selectedSubIndex, subtitles, mediaStatus]);

  // Compute active subtitle text from currentTime
  useEffect(() => {
    if (!showSubtitles || cues.length === 0) {
      if (currentCue) setCurrentCue('');
      return;
    }

    const active = cues.find(
      (cue) => currentTime >= cue.start && currentTime <= cue.end
    );
    const newText = active ? active.text : '';
    if (newText !== currentCue) {
      setCurrentCue(newText);
    }
  }, [currentTime, cues, showSubtitles, currentCue]);

  return { cues, currentCue };
}

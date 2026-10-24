import { useEffect } from 'react';

/**
 * Custom hook to handle global keyboard shortcuts for cinema player control.
 * Automatically shields inputs, textareas, and contenteditable elements.
 *
 * @param {Object} params
 * @param {string} params.mediaStatus
 * @param {boolean} params.isHost
 * @param {Function} params.togglePlay
 * @param {Function} params.seekByOffset
 * @param {Function} params.adjustVolume
 * @param {Function} params.toggleMute
 * @param {Function} params.handleFullscreen
 * @param {Function} params.setShowSubtitles
 * @param {boolean} params.showSubtitles
 * @param {Function} params.triggerToast
 */
export function usePlayerHotkeys({
  mediaStatus,
  isHost,
  togglePlay,
  seekByOffset,
  adjustVolume,
  toggleMute,
  handleFullscreen,
  setShowSubtitles,
  showSubtitles,
  triggerToast
}) {
  useEffect(() => {
    if (mediaStatus !== 'ready') return;

    const handleKeyDown = (e) => {
      // Do not capture keyboard shortcuts if user is typing in an input field or textarea
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      // Spacebar or 'k': Toggle Play / Pause
      if (e.code === 'Space' || e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isHost) {
          togglePlay();
        } else {
          triggerToast({ type: 'locked', text: 'Host controls playback' });
        }
        return;
      }

      // Left Arrow or 'j': Seek -10s
      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (isHost) {
          seekByOffset(-10);
        } else {
          triggerToast({ type: 'locked', text: 'Host controls playback' });
        }
        return;
      }

      // Right Arrow or 'l': Seek +10s
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (isHost) {
          seekByOffset(10);
        } else {
          triggerToast({ type: 'locked', text: 'Host controls playback' });
        }
        return;
      }

      // Up Arrow: Volume Up (+10%)
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        adjustVolume(0.1);
        return;
      }

      // Down Arrow: Volume Down (-10%)
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        adjustVolume(-0.1);
        return;
      }

      // 'm': Toggle Mute
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
        return;
      }

      // 'f': Toggle Fullscreen
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFullscreen();
        return;
      }

      // 'c': Toggle Captions / Subtitles
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowSubtitles((prev) => !prev);
        triggerToast({
          type: 'volume',
          text: !showSubtitles ? 'Subtitles On' : 'Subtitles Off'
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mediaStatus,
    isHost,
    showSubtitles,
    togglePlay,
    seekByOffset,
    adjustVolume,
    toggleMute,
    handleFullscreen,
    setShowSubtitles,
    triggerToast
  ]);
}

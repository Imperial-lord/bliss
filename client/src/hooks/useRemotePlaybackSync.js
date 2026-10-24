import { useEffect } from 'react';

/**
 * Custom hook to synchronize peer HTML5 video playback with the host's authoritative actions.
 *
 * @param {Object} params
 * @param {boolean} params.isHost
 * @param {Object|null} params.remotePlayback
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef
 * @param {Function} params.setIsPlaying
 * @param {Function} params.setHasStartedPlayback
 * @param {Function} params.setIsMuted
 * @param {Function} params.setShowAutoplayMutedHint
 */
export function useRemotePlaybackSync({
  isHost,
  remotePlayback,
  videoRef,
  setIsPlaying,
  setHasStartedPlayback,
  setIsMuted,
  setShowAutoplayMutedHint
}) {
  // Sync peer video with host authoritative remote playback
  useEffect(() => {
    if (isHost || !remotePlayback || !videoRef.current) return;

    const { action, currentTime: targetTime, updatedAt } = remotePlayback;

    if (action === 'play') {
      const elapsed = Math.max(0, (Date.now() - updatedAt) / 1000);
      const expectedTime = targetTime + elapsed;

      if (Math.abs(videoRef.current.currentTime - expectedTime) > 0.8) {
        videoRef.current.currentTime = expectedTime;
      }
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlayback(true);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            // Autoplay blocked by browser policy: mute and retry smoothly
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              setShowAutoplayMutedHint(true);
              videoRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setHasStartedPlayback(true);
                })
                .catch(console.warn);
            }
          } else if (err.name !== 'AbortError') {
            console.warn('[Peer Playback Error]:', err);
          }
        });
    } else if (action === 'pause') {
      videoRef.current.pause();
      setIsPlaying(false);
      if (typeof targetTime === 'number') {
        videoRef.current.currentTime = targetTime;
      }
    } else if (action === 'seek') {
      if (typeof targetTime === 'number') {
        videoRef.current.currentTime = targetTime;
      }
    }
  }, [
    remotePlayback,
    isHost,
    videoRef,
    setIsPlaying,
    setHasStartedPlayback,
    setIsMuted,
    setShowAutoplayMutedHint
  ]);

  // Periodic drift correction for non-host peers
  useEffect(() => {
    if (isHost || !videoRef.current || !remotePlayback || remotePlayback.action !== 'play') return;

    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused) return;

      const elapsed = Math.max(0, (Date.now() - remotePlayback.updatedAt) / 1000);
      const expected = remotePlayback.currentTime + elapsed;
      const drift = Math.abs(videoRef.current.currentTime - expected);

      if (drift > 1.2) {
        console.log(`[Cinema Sync] Correcting drift (${drift.toFixed(2)}s) to ${expected.toFixed(2)}s`);
        videoRef.current.currentTime = expected;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [remotePlayback, isHost, videoRef]);
}

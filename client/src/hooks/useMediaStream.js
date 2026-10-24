import { useState, useEffect, useRef, useCallback } from 'react';

export function useMediaStream({ enabled = false, initialAudio = true, initialVideo = true } = {}) {
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(initialAudio);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideo);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Push-to-Talk (PTT) state to prevent speaker bleed
  const [isPushToTalk, setIsPushToTalk] = useState(() => {
    try {
      return localStorage.getItem('bliss-ptt') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [isPttActive, setIsPttActive] = useState(false);

  // References to keep track without causing re-renders
  const streamRef = useRef(null);
  const isPttRef = useRef(isPushToTalk);
  isPttRef.current = isPushToTalk;
  const isPttActiveRef = useRef(isPttActive);
  isPttActiveRef.current = isPttActive;

  // Stop all active media tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  // Initialize camera and microphone
  const initStream = useCallback(async () => {
    if (!enabled) {
      stopTracks();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
      } catch (err) {
        console.warn('Could not acquire both audio and video, trying audio only or video only...', err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (audioErr) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        }
      }

      // Apply initial mute states (if Push-to-Talk is on, mic is muted until key is held)
      const audioTrack = stream.getAudioTracks()[0];
      const audioInitiallyActive = isPttRef.current ? false : initialAudio;
      if (audioTrack) {
        audioTrack.enabled = audioInitiallyActive;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = initialVideo;
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(audioInitiallyActive && !!audioTrack);
      setIsVideoEnabled(initialVideo && !!videoTrack);
    } catch (err) {
      console.error('Failed to get user media:', err);
      setError(err.message || 'Unable to access camera or microphone.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, initialAudio, initialVideo, stopTracks]);

  useEffect(() => {
    if (enabled) {
      initStream();
    } else {
      stopTracks();
    }

    return () => {
      stopTracks();
    };
  }, [enabled, initStream, stopTracks]);

  // Push-to-Talk (PTT) transmitter actions
  const startPtt = useCallback(() => {
    if (!isPttRef.current || !streamRef.current) return;
    const track = streamRef.current.getAudioTracks()[0];
    if (track && !track.enabled) {
      track.enabled = true;
      setIsAudioEnabled(true);
      setIsPttActive(true);
    }
  }, []);

  const stopPtt = useCallback(() => {
    if (!isPttRef.current || !streamRef.current) return;
    const track = streamRef.current.getAudioTracks()[0];
    if (track && track.enabled) {
      track.enabled = false;
      setIsAudioEnabled(false);
      setIsPttActive(false);
    }
  }, []);

  const togglePushToTalk = useCallback(() => {
    setIsPushToTalk((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bliss-ptt', String(next));
      } catch (_) {}

      // If enabling PTT, immediately mute mic until PTT key is held
      if (streamRef.current) {
        const track = streamRef.current.getAudioTracks()[0];
        if (track) {
          track.enabled = !next;
          setIsAudioEnabled(!next);
        }
      }
      setIsPttActive(false);
      return next;
    });
  }, []);

  // Global PTT hotkey listener (Hold 'T' to talk)
  useEffect(() => {
    if (!enabled || !isPushToTalk) return;

    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        startPtt();
      }
    };

    const handleKeyUp = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        stopPtt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, isPushToTalk, startPtt, stopPtt]);

  // Toggle Audio (Mute / Unmute)
  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const newState = !audioTrack.enabled;
      audioTrack.enabled = newState;
      setIsAudioEnabled(newState);
      return newState;
    }
    return false;
  }, []);

  // Toggle Video (Camera On / Off)
  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const newState = !videoTrack.enabled;
      videoTrack.enabled = newState;
      setIsVideoEnabled(newState);
      return newState;
    }
    return false;
  }, []);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    isLoading,
    isPushToTalk,
    isPttActive,
    togglePushToTalk,
    startPtt,
    stopPtt,
    toggleAudio,
    toggleVideo,
    reinitStream: initStream
  };
}

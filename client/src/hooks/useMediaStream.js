import { useState, useEffect, useRef, useCallback } from 'react';

export function useMediaStream({ enabled = false, initialAudio = true, initialVideo = true } = {}) {
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(initialAudio);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideo);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // References to keep track without causing re-renders
  const streamRef = useRef(null);

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

      // Apply initial mute states
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = initialAudio;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = initialVideo;
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(initialAudio && !!audioTrack);
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
    toggleAudio,
    toggleVideo,
    reinitStream: initStream
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';

export function useMediaStream(initialAudio = true, initialVideo = true) {
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(initialAudio);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // References to keep track without causing re-renders
  const streamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const originalVideoTrackRef = useRef(null);

  // Initialize camera and microphone
  const initStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First attempt to get both audio and video
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
        // Fallback: try audio only, or video only
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
        originalVideoTrackRef.current = videoTrack;
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
  }, [initialAudio, initialVideo]);

  useEffect(() => {
    initStream();

    return () => {
      // Clean up tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
    };
  }, [initStream]);

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

  // Start or Stop Screen Sharing
  const toggleScreenShare = useCallback(async (onTrackReplaced) => {
    if (isScreenSharing) {
      // Stop screen sharing and revert back to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      if (originalVideoTrackRef.current && streamRef.current) {
        const currentTrack = streamRef.current.getVideoTracks()[0];
        if (currentTrack) {
          streamRef.current.removeTrack(currentTrack);
        }
        streamRef.current.addTrack(originalVideoTrackRef.current);
        if (onTrackReplaced) {
          onTrackReplaced(originalVideoTrackRef.current);
        }
      }

      setIsScreenSharing(false);
      setLocalStream(new MediaStream(streamRef.current.getTracks()));
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // When user stops screen sharing via browser native UI bar
        screenTrack.onended = () => {
          if (originalVideoTrackRef.current && streamRef.current) {
            const curTrack = streamRef.current.getVideoTracks()[0];
            if (curTrack) streamRef.current.removeTrack(curTrack);
            streamRef.current.addTrack(originalVideoTrackRef.current);
            if (onTrackReplaced) {
              onTrackReplaced(originalVideoTrackRef.current);
            }
          }
          setIsScreenSharing(false);
          screenTrackRef.current = null;
          setLocalStream(new MediaStream(streamRef.current.getTracks()));
        };

        if (streamRef.current) {
          const currentTrack = streamRef.current.getVideoTracks()[0];
          if (currentTrack) {
            streamRef.current.removeTrack(currentTrack);
          }
          streamRef.current.addTrack(screenTrack);
          if (onTrackReplaced) {
            onTrackReplaced(screenTrack);
          }
        }

        setIsScreenSharing(true);
        setLocalStream(new MediaStream(streamRef.current.getTracks()));
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  }, [isScreenSharing]);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    isLoading,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    reinitStream: initStream
  };
}

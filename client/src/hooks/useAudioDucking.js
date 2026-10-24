import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Custom hook to detect remote peer speech and dynamically "duck" (lower) movie volume
 * by 50-70% when someone speaks, preventing acoustic bleed and speaker echo.
 *
 * @param {Object} options
 * @param {Array} options.peers - Array of remote peer objects with { socketId, userName, stream, audioEnabled }
 * @param {boolean} options.isEnabled - Whether auto-ducking is enabled (defaults to true)
 * @param {number} options.baseVolume - User's movie player volume (0 to 1)
 * @param {boolean} options.isMuted - Whether movie is currently muted
 * @param {number} options.duckingFactor - Volume multiplier when speech is detected (default 0.3 = -70%)
 * @returns {{ effectiveVolume: number, isDucked: boolean, activeSpeaker: string, speakingPeers: Set<string> }}
 */
export function useAudioDucking({
  peers = [],
  isEnabled = true,
  baseVolume = 1.0,
  isMuted = false,
  duckingFactor = 0.3
}) {
  const [isDucked, setIsDucked] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('');
  const [speakingPeers, setSpeakingPeers] = useState(() => new Set());

  const audioCtxRef = useRef(null);
  // Map of socketId -> { source: MediaStreamAudioSourceNode, analyser: AnalyserNode }
  const nodesMapRef = useRef(new Map());
  const lastSpokenTimeRef = useRef(0);
  const peersRef = useRef(peers);
  peersRef.current = peers;

  // Initialize or resume Web AudioContext
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  // Manage Web Audio nodes for remote peer streams
  useEffect(() => {
    if (!isEnabled) {
      // Disconnect and clean up if ducking is disabled
      for (const { source } of nodesMapRef.current.values()) {
        try {
          source.disconnect();
        } catch (_) {}
      }
      nodesMapRef.current.clear();
      setIsDucked(false);
      setActiveSpeaker('');
      setSpeakingPeers(new Set());
      return;
    }

    const currentSocketIds = new Set(peers.map((p) => p.socketId));

    // Remove nodes for peers that left
    for (const [sId, { source }] of nodesMapRef.current.entries()) {
      if (!currentSocketIds.has(sId)) {
        try {
          source.disconnect();
        } catch (_) {}
        nodesMapRef.current.delete(sId);
      }
    }

    // Attach nodes for active peers with audio tracks
    const ctx = getAudioContext();
    if (!ctx) return;

    peers.forEach((peer) => {
      if (!peer.stream || peer.audioEnabled === false) return;
      const audioTracks = peer.stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) return;

      if (!nodesMapRef.current.has(peer.socketId)) {
        try {
          const source = ctx.createMediaStreamSource(peer.stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);

          nodesMapRef.current.set(peer.socketId, { source, analyser });
        } catch (err) {
          // Can occur if stream tracks are not yet active
        }
      }
    });
  }, [peers, isEnabled]);

  // Audio level analysis loop (runs every 60ms)
  useEffect(() => {
    if (!isEnabled) return;

    const dataBuffer = new Uint8Array(128);
    const interval = setInterval(() => {
      let currentlySpeaking = new Set();
      let loudestPeerName = '';
      let maxRms = 0;

      for (const [sId, { analyser }] of nodesMapRef.current.entries()) {
        try {
          analyser.getByteTimeDomainData(dataBuffer);
          let sumSquares = 0;
          for (let i = 0; i < dataBuffer.length; i++) {
            const val = (dataBuffer[i] - 128) / 128;
            sumSquares += val * val;
          }
          const rms = Math.sqrt(sumSquares / dataBuffer.length);

          // Calibrated speech threshold (~0.035 RMS)
          if (rms > 0.035) {
            currentlySpeaking.add(sId);
            if (rms > maxRms) {
              maxRms = rms;
              const p = peersRef.current.find((peer) => peer.socketId === sId);
              if (p) loudestPeerName = p.userName;
            }
          }
        } catch (_) {}
      }

      const now = Date.now();
      if (currentlySpeaking.size > 0) {
        lastSpokenTimeRef.current = now;
        setIsDucked(true);
        setActiveSpeaker(loudestPeerName);
        setSpeakingPeers(currentlySpeaking);
      } else {
        // Hysteresis release: hold ducking for 800ms after speech ends to prevent volume pumping
        if (now - lastSpokenTimeRef.current > 800) {
          setIsDucked(false);
          setActiveSpeaker('');
          setSpeakingPeers(new Set());
        }
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isEnabled]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      for (const { source } of nodesMapRef.current.values()) {
        try {
          source.disconnect();
        } catch (_) {}
      }
      nodesMapRef.current.clear();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Compute final effective video player volume
  const effectiveVolume = useMemo(() => {
    if (isMuted) return 0;
    if (!isEnabled || !isDucked) return baseVolume;
    // Duck volume smoothly by ducking factor (e.g. 70% reduction)
    return Math.max(0, Math.min(1, baseVolume * duckingFactor));
  }, [baseVolume, isMuted, isEnabled, isDucked, duckingFactor]);

  return {
    effectiveVolume,
    isDucked,
    activeSpeaker,
    speakingPeers
  };
}

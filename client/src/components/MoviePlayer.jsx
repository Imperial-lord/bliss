import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  Radio,
  Sparkles,
  Subtitles,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  Check,
  RotateCcw,
  RotateCw,
  Lock,
  Clock,
  Tv,
  Headphones,
  Smile
} from 'lucide-react';
import CinemaPipWidget from './CinemaPipWidget';
import { SERVER_URL } from '../config/webrtc';
import { useAudioDucking } from '../hooks/useAudioDucking';

/**
 * Formats messy torrent file and release names into clean, human-readable movie titles.
 * E.g. "The.Dark.Knight.2008.720p.BluRay.x264.YIFY.mp4" -> "The Dark Knight (2008)"
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
 */
function parseVttToCues(vttText) {
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

export default function MoviePlayer({
  roomId,
  isHost = false,
  peers = [],
  mediaStatus = 'idle',
  mediaMessage = '',
  mediaTitle = '',
  subtitles = [],
  hostErrorMessage = '',
  reactions = [],
  onCueMovie,
  onSyncPlayback,
  remotePlayback = null,
  localStream = null,
  isAudioEnabled = true,
  isVideoEnabled = true,
  userName = 'You',
  currentUser = null,
  speakingPeers = {},
  onSendReaction = null
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDuckingEnabled, setIsDuckingEnabled] = useState(true);
  const [showAutoplayMutedHint, setShowAutoplayMutedHint] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [cues, setCues] = useState([]);
  const [currentCue, setCurrentCue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipOpen, setIsPipOpen] = useState(true);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [torrentInput, setTorrentInput] = useState('');
  const [isCueing, setIsCueing] = useState(false);
  const [showCueModal, setShowCueModal] = useState(false);

  // Combine self and remote peers into consolidated video feeds for Fullscreen PiP
  const pipFeeds = React.useMemo(() => {
    const list = [];
    list.push({
      id: 'self',
      socketId: 'self',
      userName,
      displayName: `${userName} (You)`,
      avatarId: currentUser?.avatarId || 'cyber-rebel',
      stream: localStream,
      isAudioEnabled,
      isVideoEnabled,
      isSpeaking: isAudioEnabled,
      isLocal: true
    });

    if (Array.isArray(peers)) {
      peers.forEach((peer, idx) => {
        list.push({
          id: peer.socketId || `peer_${idx}`,
          socketId: peer.socketId,
          userName: peer.userName || `Viewer ${idx + 1}`,
          displayName: peer.userName || `Viewer ${idx + 1}`,
          avatarId: peer.avatarId || (idx % 2 === 0 ? 'star-voyager' : 'popcorn-fanatic'),
          stream: peer.stream,
          isAudioEnabled: peer.audioEnabled ?? true,
          isVideoEnabled: peer.videoEnabled ?? true,
          isSpeaking: Boolean(speakingPeers && speakingPeers[peer.socketId]),
          isLocal: false
        });
      });
    }
    return list;
  }, [userName, currentUser, localStream, isAudioEnabled, isVideoEnabled, peers, speakingPeers]);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playPromiseRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Auto-Ducking: Dynamically dims movie volume when remote peers speak to stop speaker bleed
  const { effectiveVolume, isDucked, activeSpeaker } = useAudioDucking({
    peers,
    isEnabled: isDuckingEnabled,
    baseVolume: volume,
    isMuted,
    duckingFactor: 0.3
  });

  // Apply effective ducked volume to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = effectiveVolume;
    }
  }, [effectiveVolume]);

  // Formatted human-readable cinema title
  const displayTitle = cleanMovieTitle(mediaTitle);

  // Trigger brief visual feedback overlay (play, pause, +/-10s, volume)
  const triggerToast = useCallback((toast) => {
    setFeedbackToast(toast);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackToast(null);
    }, 1000);
  }, []);

  // Reset playback session state when a new movie is cued
  useEffect(() => {
    if (mediaStatus !== 'ready') {
      setHasStartedPlayback(false);
      setCues([]);
      setCurrentCue('');
    }
  }, [mediaStatus]);

  // Mark started playback once the movie has played for the first time
  useEffect(() => {
    if (isPlaying) {
      setHasStartedPlayback(true);
    }
  }, [isPlaying]);

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

  // Auto-hide control bar on idle during playback
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);

  // Fullscreen container listener & handler
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(console.warn);
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.warn);
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }, []);

  const lastHardSeekTimeRef = useRef(0);
  const remotePlaybackReceivedAtRef = useRef(Date.now());
  const lastRemotePlaybackRef = useRef(remotePlayback);

  // Keep track of client timestamp when remotePlayback arrived
  useEffect(() => {
    if (remotePlayback !== lastRemotePlaybackRef.current) {
      remotePlaybackReceivedAtRef.current = remotePlayback?.receivedAt || Date.now();
      lastRemotePlaybackRef.current = remotePlayback;
    }
  }, [remotePlayback]);

  // Sync peer video with host authoritative remote playback
  useEffect(() => {
    if (isHost || !remotePlayback || !videoRef.current) return;

    const { action, currentTime: targetTime, updatedAt, isPlaying: hostIsPlaying } = remotePlayback;
    const effectiveAction = action || (hostIsPlaying ? 'play' : 'pause');
    const isEffectivePlaying = hostIsPlaying ?? (effectiveAction === 'play');

    if (effectiveAction === 'seek') {
      // Explicit host seek
      if (typeof targetTime === 'number') {
        videoRef.current.currentTime = targetTime;
        lastHardSeekTimeRef.current = Date.now();
      }
      if (isEffectivePlaying) {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasStartedPlayback(true);
          })
          .catch(console.warn);
      }
    } else if (effectiveAction === 'pause') {
      videoRef.current.pause();
      setIsPlaying(false);
      if (videoRef.current.playbackRate !== 1.0) {
        videoRef.current.playbackRate = 1.0;
      }
      if (typeof targetTime === 'number' && Math.abs(videoRef.current.currentTime - targetTime) > 1.5) {
        videoRef.current.currentTime = targetTime;
        lastHardSeekTimeRef.current = Date.now();
      }
    } else if (effectiveAction === 'play') {
      const receivedAt = remotePlayback.receivedAt || remotePlaybackReceivedAtRef.current || Date.now();
      const elapsed = Math.max(0, (Date.now() - receivedAt) / 1000);
      const expectedTime = targetTime + elapsed;

      // Only hard-seek on 'play' if drift is large (> 3.5s) to avoid canceling initial buffer
      if (Math.abs(videoRef.current.currentTime - expectedTime) > 3.5 && !videoRef.current.seeking) {
        videoRef.current.currentTime = expectedTime;
        lastHardSeekTimeRef.current = Date.now();
      }

      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlayback(true);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            // Autoplay blocked: mute and retry smoothly
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
    } else if (effectiveAction === 'heartbeat') {
      // Heartbeat: do NOT violently seek. Ensure video is playing if host is playing.
      if (isEffectivePlaying && videoRef.current.paused && !videoRef.current.seeking && videoRef.current.readyState >= 2) {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasStartedPlayback(true);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') console.warn('[Heartbeat Play Error]:', err);
          });
      }
    }
  }, [remotePlayback, isHost]);

  // Adaptive, non-disruptive drift correction for non-host peers
  useEffect(() => {
    if (isHost || !videoRef.current || !remotePlayback) return;

    const isEffectivePlaying = remotePlayback.isPlaying ?? (remotePlayback.action === 'play');
    if (!isEffectivePlaying) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;

      // Do not interrupt when actively seeking or waiting on initial buffer chunks
      if (video.seeking || video.readyState < 3) return;

      const receivedAt = remotePlayback.receivedAt || remotePlaybackReceivedAtRef.current || Date.now();
      const elapsed = Math.max(0, (Date.now() - receivedAt) / 1000);
      const expected = (remotePlayback.currentTime || 0) + elapsed;
      const diff = expected - video.currentTime; // Positive: peer is behind host. Negative: peer is ahead.
      const absDiff = Math.abs(diff);

      // Tier 1: In sync (< 0.5s difference) -> Normal speed
      if (absDiff < 0.5) {
        if (video.playbackRate !== 1.0) {
          video.playbackRate = 1.0;
        }
        return;
      }

      // Tier 2: Small drift (0.5s - 3.0s) -> Smooth pitch-neutral rate glide (NEVER hard-seek!)
      // This completely avoids aborting HTTP Range streams or triggering buffer stalls!
      if (absDiff >= 0.5 && absDiff <= 3.0) {
        if (diff > 0) {
          // Peer is slightly behind host -> play 6% faster to smoothly catch up
          video.playbackRate = 1.06;
        } else {
          // Peer is slightly ahead of host -> play 6% slower to let host catch up
          video.playbackRate = 0.94;
        }
        return;
      }

      // Tier 3: Large drift (> 3.0s) -> Rate-limited hard seek (at least 6s apart)
      const now = Date.now();
      if (absDiff > 3.0 && now - lastHardSeekTimeRef.current > 6000) {
        console.log(`[Cinema Sync] Aligning major drift (${diff.toFixed(2)}s) to ${expected.toFixed(2)}s`);
        lastHardSeekTimeRef.current = now;
        video.currentTime = expected;
        video.playbackRate = 1.0;
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.playbackRate !== 1.0) {
        videoRef.current.playbackRate = 1.0;
      }
    };
  }, [remotePlayback, isHost]);

  // Host: Send periodic sync heartbeat so peers are tightly anchored to host's real position
  useEffect(() => {
    if (!isHost || !onSyncPlayback) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && !video.seeking) {
        onSyncPlayback('heartbeat', video.currentTime);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isHost, onSyncPlayback]);

  // Host: Toggle Play/Pause with async race protection
  const togglePlay = useCallback(async () => {
    if (!videoRef.current || !isHost) return;

    if (isPlaying) {
      try {
        if (playPromiseRef.current) {
          await playPromiseRef.current;
        }
        videoRef.current.pause();
        setIsPlaying(false);
        if (onSyncPlayback) {
          onSyncPlayback('pause', videoRef.current.currentTime);
        }
      } catch (err) {
        // Paused safely
      }
    } else {
      try {
        const promise = videoRef.current.play();
        playPromiseRef.current = promise;
        await promise;
        setIsPlaying(true);
        setHasStartedPlayback(true);
        if (onSyncPlayback) {
          onSyncPlayback('play', videoRef.current.currentTime);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Video Playback Warning]:', err);
        }
      } finally {
        playPromiseRef.current = null;
      }
    }
  }, [isHost, isPlaying, onSyncPlayback, triggerToast]);

  // Host: Seek scrubber timeline
  const handleSeek = (e) => {
    if (!isHost || !videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (onSyncPlayback) {
      onSyncPlayback('seek', newTime);
    }
  };

  // Host: Skip forward / backward relative offset (+10s / -10s)
  const seekByOffset = useCallback(
    (offsetSeconds) => {
      if (!videoRef.current || !isHost) return;
      const videoDuration = videoRef.current.duration || duration || 100;
      const targetTime = Math.max(0, Math.min(videoDuration, videoRef.current.currentTime + offsetSeconds));
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      if (onSyncPlayback) {
        onSyncPlayback('seek', targetTime);
      }
      triggerToast({
        type: offsetSeconds > 0 ? 'forward' : 'backward',
        text: `${offsetSeconds > 0 ? '+' : ''}${offsetSeconds}s`
      });
    },
    [isHost, duration, onSyncPlayback, triggerToast]
  );

  // Volume & Audio control
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
    triggerToast({
      type: videoRef.current.muted ? 'volume' : 'volume',
      text: videoRef.current.muted ? 'Muted' : `${Math.round(videoRef.current.volume * 100)}%`
    });
  }, [triggerToast]);

  const adjustVolume = useCallback(
    (delta) => {
      if (!videoRef.current) return;
      const newVol = Math.max(0, Math.min(1, Math.round((videoRef.current.volume + delta) * 100) / 100));
      videoRef.current.volume = newVol;
      setVolume(newVol);
      if (newVol === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
      triggerToast({
        type: 'volume',
        text: `${Math.round(newVol * 100)}%`
      });
    },
    [triggerToast]
  );

  // KEYBOARD SHORTCUTS CONTROLLER
  useEffect(() => {
    if (mediaStatus !== 'ready') return;

    const handleKeyDown = (e) => {
      // Do not capture keyboard shortcuts if user is actively typing in an input field or textarea
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

      // 'p': Toggle Fullscreen Video Picture-in-Picture
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPipOpen((prev) => !prev);
        triggerToast({
          type: 'volume',
          text: !isPipOpen ? 'Video PiP Enabled' : 'Video PiP Hidden'
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
    triggerToast,
    isPipOpen
  ]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCueSubmit = (e) => {
    if (e) e.preventDefault();
    if (!torrentInput.trim()) return;

    setIsCueing(true);
    if (onCueMovie) {
      onCueMovie(torrentInput.trim());
    }
    setShowCueModal(false);
    setTimeout(() => setIsCueing(false), 2000);
  };

  // Stream source endpoint
  const streamSrc = `/api/stream/${roomId}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-full bg-[#080d10] ${
        isFullscreen ? 'rounded-0' : 'rounded-3xl'
      } overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center group font-sans select-none`}
    >
      {/* ========================================================================= */}
      {/* 1. IDLE STATE: WAITING FOR HOST / CUE MOVIE STAGE */}
      {/* ========================================================================= */}
      {mediaStatus === 'idle' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute w-[450px] h-[300px] bg-gradient-to-tr from-[#ff7a00]/15 to-[#ff3d2e]/10 blur-[130px] pointer-events-none rounded-full" />

          {isHost ? (
            /* HOST CUE FORM */
            <div className="relative z-10 max-w-lg w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-3 border border-[#ff7a00]/30 shadow-glow-orange">
                <Sparkles className="w-3 h-3" />
                <span>Host Cinema Authority</span>
              </div>

              <h3 className="font-display text-2xl font-extrabold text-white tracking-tight mb-2">
                Cue Torrent Movie Stream
              </h3>
              <p className="text-xs text-[#9aa6af] mb-5 leading-relaxed">
                Provide a torrent download URL or magnet link. Our backend will fetch the swarm, extract the movie, and stream it in real-time sync with all viewers.
              </p>

              {/* Host-Only Error Alert Banner */}
              {hostErrorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-start gap-2.5 text-left animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block mb-0.5">Stream Error (Host Only)</span>
                    <span>{hostErrorMessage}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleCueSubmit} className="space-y-4">
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa6af]" />
                  <input
                    type="url"
                    required
                    value={torrentInput}
                    onChange={(e) => setTorrentInput(e.target.value)}
                    placeholder="https://yts.gg/torrent/download/..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 text-xs font-mono transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#9aa6af]">
                  <span>Supports .torrent URLs & magnet:?xt=</span>
                  <button
                    type="button"
                    onClick={() => setTorrentInput('https://yts.gg/torrent/download/A54926C2E07B0E5F0243954330B599B31C804F0B')}
                    className="text-[#ff7a00] hover:underline font-mono text-[10px]"
                  >
                    Paste Sample Link
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isCueing || !torrentInput.trim()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Film className="w-4 h-4" />
                  <span>Stream Movie For Party</span>
                </button>
              </form>
            </div>
          ) : (
            /* PEER WAITING SCREEN (ZERO HOST ERRORS SHOWN) */
            <div className="relative z-10 max-w-md w-full bg-[#12171c]/70 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#ff7a00]/20 to-[#ff3d2e]/10 border border-[#ff7a00]/30 flex items-center justify-center text-3xl shadow-glow-orange animate-gentle-float mb-5">
                🍿
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>P2P Cinema Standby</span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white tracking-tight mb-2">
                Waiting For Host To Cue Movie
              </h3>
              <p className="text-xs text-[#9aa6af] leading-relaxed max-w-xs">
                Sit back with your popcorn. The room host will paste a movie link and start synchronized playback shortly.
              </p>

              <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3 text-[11px] text-[#9aa6af] font-mono">
                <Radio className="w-3.5 h-3.5 text-[#ff7a00] animate-pulse" />
                <span>SUB-SECOND SYNC READY</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BUFFERING / SWARM RESOLUTION STATE */}
      {/* ========================================================================= */}
      {['downloading_metadata', 'fetching_torrent_file', 'connecting_swarm', 'buffering_stream'].includes(mediaStatus) && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="relative z-10 max-w-md w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#ff7a00]/15 border border-[#ff7a00]/30 flex items-center justify-center text-[#ff7a00] mb-5 shadow-glow-orange animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff7a00] mb-1.5">
              P2P Cinema Swarm
            </span>

            <h3 className="font-display text-xl font-bold text-white tracking-tight mb-2">
              Buffering Movie Stream...
            </h3>
            <p className="text-xs text-[#9aa6af] leading-relaxed max-w-sm mb-6">
              {mediaMessage || 'Resolving torrent metadata, connecting to seeders, and caching stream headers. Playback will be ready in seconds.'}
            </p>

            {/* Simulated Audio/Video Equalizer Pulse */}
            <div className="flex items-center gap-1.5 h-6">
              {[40, 85, 60, 100, 75, 90, 50, 70, 95, 60].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
                  className="w-1 bg-[#ff7a00] rounded-full animate-pulse"
                />
              ))}
            </div>

            {isHost && (
              <button
                onClick={() => onCueMovie && onCueMovie('')}
                className="mt-6 text-[11px] font-mono text-[#9aa6af] hover:text-white underline underline-offset-4 transition-colors"
              >
                Cancel / Change Link
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. READY STATE: ACTIVE SYNCHRONIZED HTML5 VIDEO PLAYER */}
      {/* ========================================================================= */}
      {mediaStatus === 'ready' && (
        <>
          <video
            ref={videoRef}
            src={streamSrc}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            muted={isMuted}
            onClick={isHost ? togglePlay : undefined}
            onDoubleClick={handleFullscreen}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onPlay={() => {
              setIsPlaying(true);
              setIsBuffering(false);
              setHasStartedPlayback(true);
            }}
            onPause={() => {
              // Ignore transient browser pause triggered during seek/skip
              if (videoRef.current && videoRef.current.seeking) {
                return;
              }
              setIsPlaying(false);
              if (isHost && onSyncPlayback && videoRef.current && !videoRef.current.ended) {
                onSyncPlayback('pause', videoRef.current.currentTime);
              }
            }}
            onSeeked={() => {
              if (videoRef.current && !videoRef.current.paused) {
                setIsPlaying(true);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (isHost && onSyncPlayback && videoRef.current) {
                onSyncPlayback('pause', videoRef.current.duration || videoRef.current.currentTime);
              }
            }}
            onWaiting={() => {
              setIsBuffering(true);
            }}
            onPlaying={() => {
              setIsBuffering(false);
              if (isHost && onSyncPlayback && videoRef.current) {
                onSyncPlayback('play', videoRef.current.currentTime);
              }
            }}
            onCanPlay={() => setIsBuffering(false)}
            onError={(e) => console.warn('[Video Media Error]:', e)}
          />

          {/* Buffering Spinner Overlay while playing */}
          {isBuffering && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#12171c]/90 border border-[#ff7a00]/30 flex items-center justify-center text-[#ff7a00] shadow-glow-orange">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            </div>
          )}

          {/* Center Feedback Toast for Keyboard & Click Actions */}
          {feedbackToast && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-fade-in">
              <div className="flex flex-col items-center gap-1.5 bg-black/85 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 text-white shadow-2xl scale-110">
                {feedbackToast.type === 'forward' && <RotateCw className="w-8 h-8 text-[#ff7a00]" />}
                {feedbackToast.type === 'backward' && <RotateCcw className="w-8 h-8 text-[#ff7a00]" />}
                {feedbackToast.type === 'volume' && <Volume2 className="w-8 h-8 text-[#ff7a00]" />}
                {feedbackToast.type === 'locked' && <Lock className="w-8 h-8 text-amber-400" />}
                <span className="text-xs font-mono font-bold tracking-wider">{feedbackToast.text}</span>
              </div>
            </div>
          )}

          {/* Autoplay Muted Notification Pill for Peers */}
          {showAutoplayMutedHint && (
            <div className="absolute bottom-20 right-6 z-30 animate-fade-in">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    setIsMuted(false);
                  }
                  setShowAutoplayMutedHint(false);
                }}
                className="flex items-center gap-2 bg-[#ff7a00] hover:bg-[#ff9124] text-white text-xs font-bold px-4 py-2 rounded-full shadow-glow-orange transition-all hover:scale-105"
              >
                <VolumeX className="w-4 h-4 animate-pulse" />
                <span>Audio Muted by Browser – Click to Unmute</span>
              </button>
            </div>
          )}

          {/* Active Audio Ducking Notification Pill */}
          {isDucked && activeSpeaker && isDuckingEnabled && (
            <div className="absolute top-4 right-4 z-30 animate-fade-in pointer-events-none">
              <div className="flex items-center gap-2 bg-[#080d10]/85 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md text-xs font-semibold">
                <Headphones className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Audio ducked for {activeSpeaker} (-70%)</span>
              </div>
            </div>
          )}

          {/* CUSTOM CINEMATIC SUBTITLE OVERLAY */}
          {showSubtitles && currentCue && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-[85%] z-25 pointer-events-none text-center animate-fade-in">
              <span className="inline-block bg-black/85 backdrop-blur-md text-white text-sm sm:text-base md:text-xl font-medium px-4 py-2 rounded-xl border border-white/10 shadow-2xl tracking-wide leading-relaxed drop-shadow-md">
                {currentCue.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PLAY / PAUSE OVERLAYS */}
          {/* ========================================================================= */}

          {/* INITIAL STAGING: Host sees "Start Cinema Playback" ONLY BEFORE first play */}
          {!hasStartedPlayback && !isPlaying && isHost && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[3px] z-15 p-6 text-center">
              <div className="max-w-md w-full bg-[#12171c]/95 border border-[#ff7a00]/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-fade-in">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-3 border border-[#ff7a00]/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Stream Ready</span>
                </div>

                <h4 className="text-white font-display font-bold text-lg mb-1 truncate max-w-full">
                  {displayTitle || 'Cinema Stream Ready'}
                </h4>
                <p className="text-xs text-[#9aa6af] mb-5">
                  The movie stream is buffered and ready. Press play below or press Spacebar to start synchronized playback for all peers.
                </p>

                <button
                  onClick={togglePlay}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-glow-orange transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Cinema Playback</span>
                </button>
              </div>
            </div>
          )}

          {/* INITIAL STAGING: Peer standby card ONLY BEFORE first play */}
          {!hasStartedPlayback && !isPlaying && !isHost && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] z-15 p-6 text-center pointer-events-none">
              <div className="max-w-sm w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <Film className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-white font-display font-bold text-base mb-1 truncate max-w-full">
                  {displayTitle || 'Movie Stream Ready'}
                </h4>
                <p className="text-xs text-[#9aa6af] leading-relaxed">
                  The stream is ready on your device. Waiting for the room host to press play.
                </p>
              </div>
            </div>
          )}

          {/* NORMAL PAUSE (AFTER FIRST PLAY): Host sees clean centered play circle (NO INTRUSIVE MODAL) */}
          {hasStartedPlayback && !isPlaying && isHost && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] z-15 pointer-events-auto">
              <button
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-[#ff7a00]/90 hover:bg-[#ff7a00] text-white flex items-center justify-center shadow-glow-orange transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md border border-white/20"
                title="Resume Playback (Space)"
              >
                <Play className="w-9 h-9 fill-current ml-1" />
              </button>
            </div>
          )}

          {/* NORMAL PAUSE (AFTER FIRST PLAY): Peer sees subtle top notification pill */}
          {hasStartedPlayback && !isPlaying && !isHost && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono text-[#9aa6af] flex items-center gap-2 pointer-events-none z-20 shadow-lg animate-fade-in">
              <Pause className="w-3.5 h-3.5 text-[#ff7a00]" />
              <span>Paused by Room Host</span>
            </div>
          )}

          {/* Top Header Badge Overlay (Auto-hides on idle) */}
          <div
            className={`absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 bg-[#080d10]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white shadow max-w-[65%] truncate pointer-events-auto">
              <Film className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
              <span className="truncate">{displayTitle || 'Synchronized Cinema'}</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Host Button to change movie link */}
              {isHost && (
                <button
                  onClick={() => setShowCueModal(true)}
                  className="bg-[#12171c]/90 hover:bg-[#1b2229] border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md transition-all shadow hover:border-[#ff7a00] cursor-pointer"
                >
                  Change Movie
                </button>
              )}

              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Live Sync</span>
              </span>
            </div>
          </div>

          {/* Cinema Custom Playback Control Bar (Auto-hides on idle) */}
          <div
            className={`absolute bottom-4 left-4 right-4 bg-[#12171c]/95 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex flex-col gap-2 transition-opacity duration-300 z-20 ${
              controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Scrubber Timeline */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] font-mono font-medium text-[#9aa6af] w-12">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={!isHost}
                className={`flex-1 h-1.5 bg-[#1b2229] rounded-lg appearance-none accent-[#ff7a00] ${
                  isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                }`}
                title={isHost ? 'Seek playback' : 'Playback controlled by Host'}
              />
              <span className="text-[10px] font-mono font-medium text-[#9aa6af] w-12 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Lower Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Host -10s Rewind Button */}
                <button
                  onClick={() => seekByOffset(-10)}
                  disabled={!isHost}
                  className={`h-8 px-2.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10 bg-[#080d10]/70 ${
                    isHost
                      ? 'text-[#9aa6af] hover:text-white hover:border-[#ff7a00]/40 hover:bg-[#12171c] cursor-pointer active:scale-95'
                      : 'text-[#9aa6af]/30 border-transparent cursor-not-allowed'
                  }`}
                  title={isHost ? 'Rewind 10s (Left Arrow / J)' : 'Playback controlled by Host'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-white/90 leading-none">10s</span>
                </button>

                {/* Play/Pause Button (Host authorized, peer indicator) */}
                <button
                  onClick={togglePlay}
                  disabled={!isHost}
                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                    isHost
                      ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white shadow-glow-orange cursor-pointer active:scale-90'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  title={isHost ? (isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)') : 'Playback controlled by Host'}
                >
                  {isPlaying ? (
                    <Pause className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Host +10s Forward Button */}
                <button
                  onClick={() => seekByOffset(10)}
                  disabled={!isHost}
                  className={`h-8 px-2.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10 bg-[#080d10]/70 ${
                    isHost
                      ? 'text-[#9aa6af] hover:text-white hover:border-[#ff7a00]/40 hover:bg-[#12171c] cursor-pointer active:scale-95'
                      : 'text-[#9aa6af]/30 border-transparent cursor-not-allowed'
                  }`}
                  title={isHost ? 'Forward 10s (Right Arrow / L)' : 'Playback controlled by Host'}
                >
                  <span className="text-[11px] font-mono font-bold text-white/90 leading-none">10s</span>
                  <RotateCw className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                </button>

                <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

                {/* Local Volume Toggle */}
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:text-[#ff7a00] text-white transition-colors cursor-pointer active:scale-90"
                  title="Toggle Local Audio (M)"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Acoustic Auto-Ducking Toggle */}
                <button
                  onClick={() => {
                    setIsDuckingEnabled((prev) => {
                      const next = !prev;
                      triggerToast({
                        type: 'volume',
                        text: next ? 'Ducking: ON' : 'Ducking: OFF'
                      });
                      return next;
                    });
                  }}
                  className={`p-1.5 transition-colors cursor-pointer active:scale-90 flex items-center justify-center ${
                    isDuckingEnabled
                      ? isDucked
                        ? 'text-emerald-400 animate-pulse'
                        : 'text-emerald-500 hover:text-emerald-400'
                      : 'text-[#9aa6af]/50 hover:text-[#9aa6af]'
                  }`}
                  title={
                    isDuckingEnabled
                      ? 'Auto-Ducking: Active (Automatically lowers movie volume by 70% when friends speak)'
                      : 'Auto-Ducking: Disabled (Click to enable)'
                  }
                >
                  <Headphones className="w-5 h-5" />
                </button>

                {/* Subtitles Toggle & Track Selector */}
                {subtitles.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowSubtitles((prev) => !prev)}
                      className={`p-1.5 transition-colors cursor-pointer active:scale-90 ${
                        showSubtitles ? 'text-[#ff7a00]' : 'text-[#9aa6af] hover:text-white'
                      }`}
                      title="Toggle Captions (C)"
                    >
                      <Subtitles className="w-5 h-5" />
                    </button>

                    {subtitles.length > 1 && showSubtitles && (
                      <select
                        value={selectedSubIndex}
                        onChange={(e) => setSelectedSubIndex(parseInt(e.target.value, 10))}
                        className="bg-[#080d10] text-[#9aa6af] hover:text-white border border-white/10 rounded-lg text-[10px] font-mono px-2 py-1 outline-none focus:border-[#ff7a00] cursor-pointer"
                      >
                        {subtitles.map((s) => (
                          <option key={s.index} value={s.index}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Custom Fullscreen Toggle */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isHost
                      ? 'bg-[#ff7a00]/15 text-[#ff7a00] border-[#ff7a00]/30 shadow-glow-orange/20'
                      : 'bg-[#080d10] text-[#9aa6af] border-white/5'
                  }`}
                >
                  {isHost ? 'Host Controls Active' : 'Synced With Host'}
                </span>

                {/* Fullscreen Quick Reactions Trigger */}
                {onSendReaction && (
                  <div className="relative group/react">
                    <button
                      type="button"
                      className="p-1.5 hover:text-[#ff7a00] text-white/80 hover:text-white transition-colors cursor-pointer active:scale-90"
                      title="Send Floating Reaction"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full mb-3 right-0 sm:left-1/2 sm:-translate-x-1/2 hidden group-hover/react:flex items-center gap-1.5 bg-[#12171c]/95 border border-white/15 px-2.5 py-1.5 rounded-full shadow-2xl backdrop-blur-xl animate-fade-in pointer-events-auto z-50">
                      {['🔥', '❤️', '😂', '🍿', '👏', '😱'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onSendReaction(emoji)}
                          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-sm transition-transform hover:scale-125 active:scale-90 cursor-pointer"
                          title={`Send ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fullscreen Video PiP Toggle */}
                {isFullscreen && (
                  <button
                    type="button"
                    onClick={() => setIsPipOpen((prev) => !prev)}
                    className={`p-1.5 transition-colors cursor-pointer active:scale-90 ${
                      isPipOpen
                        ? 'text-[#ff7a00] hover:text-[#ff9e3b]'
                        : 'text-white/70 hover:text-white'
                    }`}
                    title={isPipOpen ? 'Hide Video PiP (P)' : 'Show Video PiP (P)'}
                  >
                    <Tv className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 hover:text-[#ff7a00] text-white transition-colors cursor-pointer active:scale-90"
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* FLOATING EMOJI REACTIONS OVERLAY */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 animate-float-reaction flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-2xl shadow-black/60 select-none pointer-events-none"
            style={{
              left: `${r.xOffset ?? 50}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <span className="text-2xl leading-none select-none">{r.emoji}</span>
            {r.senderName && (
              <span className="text-xs font-semibold text-white/95 max-w-[120px] truncate">
                {r.senderName}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN PICTURE-IN-PICTURE (PIP) FLOATING VIDEO WIDGET */}
      {/* ========================================================================= */}
      {isFullscreen && isPipOpen && (
        <CinemaPipWidget
          feeds={pipFeeds}
          containerRef={containerRef}
          isOpen={isPipOpen}
          onClose={() => setIsPipOpen(false)}
          initialFeedIndex={peers.length > 0 ? 1 : 0}
        />
      )}

      {/* ========================================================================= */}
      {/* HOST CHANGE MOVIE MODAL */}
      {/* ========================================================================= */}
      {showCueModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#12171c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-white mb-2">
              Cue New Torrent Stream
            </h3>
            <p className="text-xs text-[#9aa6af] mb-4">
              Enter a new torrent URL or magnet link. The current stream will be replaced for all peers.
            </p>

            <form onSubmit={handleCueSubmit} className="space-y-4">
              <input
                type="url"
                required
                value={torrentInput}
                onChange={(e) => setTorrentInput(e.target.value)}
                placeholder="https://yts.gg/torrent/download/..."
                className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] text-xs font-mono"
              />

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCueModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] text-white text-xs font-bold uppercase tracking-wider shadow-glow-orange cursor-pointer"
                >
                  Stream New Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

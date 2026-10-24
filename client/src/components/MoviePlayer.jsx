import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Film, Radio, Loader2 } from 'lucide-react';
import { cleanMovieTitle } from '../utils/moviePlayerUtils';
import { usePlayerSubtitles } from '../hooks/usePlayerSubtitles';
import { useRemotePlaybackSync } from '../hooks/useRemotePlaybackSync';
import { usePlayerHotkeys } from '../hooks/usePlayerHotkeys';
import PlayerIdleView from './movie-player/PlayerIdleView';
import PlayerBufferingView from './movie-player/PlayerBufferingView';
import PlayerControls from './movie-player/PlayerControls';
import PlayerSubtitleOverlay from './movie-player/PlayerSubtitleOverlay';
import PlayerFeedbackToasts from './movie-player/PlayerFeedbackToasts';
import PlayerStagingOverlay from './movie-player/PlayerStagingOverlay';
import CueMovieModal from './movie-player/CueMovieModal';
import ReactionOverlay from './movie-player/ReactionOverlay';

// Re-export cleanMovieTitle for backward compatibility
export { cleanMovieTitle };

/**
 * Main Synchronized Movie Player component for Bliss Cinema.
 * Handles torrent video streams, WebVTT subtitle synchronization,
 * authoritative host controls, and peer synchronization.
 */
export default function MoviePlayer({
  roomId,
  isHost = false,
  mediaStatus = 'idle',
  mediaMessage = '',
  mediaTitle = '',
  subtitles = [],
  hostErrorMessage = '',
  reactions = [],
  onCueMovie,
  onSyncPlayback,
  remotePlayback = null
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showAutoplayMutedHint, setShowAutoplayMutedHint] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [torrentInput, setTorrentInput] = useState('');
  const [isCueing, setIsCueing] = useState(false);
  const [showCueModal, setShowCueModal] = useState(false);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playPromiseRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

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
    }
  }, [mediaStatus]);

  // Mark started playback once the movie has played for the first time
  useEffect(() => {
    if (isPlaying) {
      setHasStartedPlayback(true);
    }
  }, [isPlaying]);

  // Subtitle synchronization hook
  const { currentCue } = usePlayerSubtitles({
    roomId,
    selectedSubIndex,
    subtitles,
    mediaStatus,
    showSubtitles,
    currentTime
  });

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

  // Peer remote playback sync hook
  useRemotePlaybackSync({
    isHost,
    remotePlayback,
    videoRef,
    setIsPlaying,
    setHasStartedPlayback,
    setIsMuted,
    setShowAutoplayMutedHint
  });

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
  }, [isHost, isPlaying, onSyncPlayback]);

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
      type: 'volume',
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

  // Global Keyboard Shortcuts Controller Hook
  usePlayerHotkeys({
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
  });

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
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

  const streamSrc = `/api/stream/${roomId}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-full bg-[#080d10] ${
        isFullscreen ? 'rounded-0' : 'rounded-3xl'
      } overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center group font-sans select-none`}
    >
      {/* 1. IDLE STATE */}
      {mediaStatus === 'idle' && (
        <PlayerIdleView
          isHost={isHost}
          torrentInput={torrentInput}
          setTorrentInput={setTorrentInput}
          isCueing={isCueing}
          hostErrorMessage={hostErrorMessage}
          onSubmit={handleCueSubmit}
        />
      )}

      {/* 2. BUFFERING / SWARM RESOLUTION STATE */}
      {['downloading_metadata', 'fetching_torrent_file', 'connecting_swarm', 'buffering_stream'].includes(
        mediaStatus
      ) && (
        <PlayerBufferingView
          mediaMessage={mediaMessage}
          isHost={isHost}
          onCancel={() => onCueMovie && onCueMovie('')}
        />
      )}

      {/* 3. READY STATE: HTML5 VIDEO PLAYER & CONTROLS */}
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
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
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

          {/* Center Feedback Toast & Autoplay Mute Pill */}
          <PlayerFeedbackToasts
            feedbackToast={feedbackToast}
            showAutoplayMutedHint={showAutoplayMutedHint}
            onUnmuteAutoplay={() => {
              if (videoRef.current) {
                videoRef.current.muted = false;
                setIsMuted(false);
              }
              setShowAutoplayMutedHint(false);
            }}
          />

          {/* Custom Cinematic Subtitle Overlay */}
          <PlayerSubtitleOverlay
            showSubtitles={showSubtitles}
            currentCue={currentCue}
          />

          {/* Staging & Pause Overlays */}
          <PlayerStagingOverlay
            hasStartedPlayback={hasStartedPlayback}
            isPlaying={isPlaying}
            isHost={isHost}
            displayTitle={displayTitle}
            onTogglePlay={togglePlay}
          />

          {/* Top Header Badge Overlay */}
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

          {/* Playback Control Bar */}
          <PlayerControls
            controlsVisible={controlsVisible}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            isHost={isHost}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onSeekByOffset={seekByOffset}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            subtitles={subtitles}
            showSubtitles={showSubtitles}
            onToggleSubtitles={() => setShowSubtitles((prev) => !prev)}
            selectedSubIndex={selectedSubIndex}
            onSelectSubIndex={setSelectedSubIndex}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleFullscreen}
          />
        </>
      )}

      {/* Floating Emoji Reactions Overlay */}
      <ReactionOverlay reactions={reactions} />

      {/* Host Change Movie Modal */}
      <CueMovieModal
        isOpen={showCueModal && isHost}
        onClose={() => setShowCueModal(false)}
        torrentInput={torrentInput}
        setTorrentInput={setTorrentInput}
        onSubmit={handleCueSubmit}
      />
    </div>
  );
}

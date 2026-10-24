import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Film,
  Radio,
  Sparkles,
  Subtitles,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  Check,
  RotateCcw,
  Clock,
  Tv
} from 'lucide-react';
import { SERVER_URL } from '../config/webrtc';

export default function MoviePlayer({
  roomId,
  isHost = false,
  mediaStatus = 'idle',
  mediaTitle = '',
  subtitles = [],
  hostErrorMessage = '',
  reactions = [],
  onCueMovie,
  onSyncPlayback,
  remotePlayback = null
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [torrentInput, setTorrentInput] = useState('');
  const [isCueing, setIsCueing] = useState(false);
  const [showCueModal, setShowCueModal] = useState(false);

  const videoRef = useRef(null);
  const lastSyncTimestamp = useRef(0);

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
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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
  }, [remotePlayback, isHost]);

  // Periodic drift check for non-host peers
  useEffect(() => {
    if (isHost || !videoRef.current || !remotePlayback || remotePlayback.action !== 'play') return;

    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused) return;

      const elapsed = Math.max(0, (Date.now() - remotePlayback.updatedAt) / 1000);
      const expected = remotePlayback.currentTime + elapsed;
      const drift = Math.abs(videoRef.current.currentTime - expected);

      // Smooth sync if drift exceeds 1.2 seconds
      if (drift > 1.2) {
        console.log(`[Cinema Sync] Correcting drift (${drift.toFixed(2)}s) to ${expected.toFixed(2)}s`);
        videoRef.current.currentTime = expected;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [remotePlayback, isHost]);

  // Host: Toggle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (!isHost) {
      // Peer feedback: Host is in control
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onSyncPlayback) {
        onSyncPlayback('pause', videoRef.current.currentTime);
      }
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (onSyncPlayback) {
            onSyncPlayback('play', videoRef.current.currentTime);
          }
        })
        .catch(console.warn);
    }
  };

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

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

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

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
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

  const streamSrc = `${SERVER_URL}/api/stream/${roomId}`;
  const subtitleSrc = subtitles.length > 0 ? `${SERVER_URL}/api/subtitles/${roomId}/${selectedSubIndex}.vtt` : null;

  return (
    <div className="relative w-full h-full bg-[#080d10] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center group font-sans select-none">
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
      {mediaStatus === 'downloading_metadata' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="relative z-10 max-w-md w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#ff7a00]/15 border border-[#ff7a00]/30 flex items-center justify-center text-[#ff7a00] mb-5 shadow-glow-orange animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff7a00] mb-1.5">
              P2P Swarm Buffering
            </span>

            <h3 className="font-display text-xl font-bold text-white tracking-tight mb-2">
              Connecting to Movie Swarm...
            </h3>
            <p className="text-xs text-[#9aa6af] leading-relaxed max-w-sm mb-6">
              Resolving torrent metadata, prioritizing sequential video pieces, and extracting subtitle tracks. Playback starts automatically.
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
            className="w-full h-full object-contain"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            {subtitleSrc && showSubtitles && (
              <track
                kind="subtitles"
                src={subtitleSrc}
                srcLang="en"
                label={subtitles[selectedSubIndex]?.name || 'English'}
                default
              />
            )}
          </video>

          {/* Center Play Button Overlay for Host when Paused */}
          {!isPlaying && isHost && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30 z-10"
            >
              <div className="w-20 h-20 rounded-full bg-[#ff7a00] text-white flex items-center justify-center shadow-glow-orange transition-transform hover:scale-110">
                <Play className="w-9 h-9 fill-current ml-1" />
              </div>
            </button>
          )}

          {/* Top Header Badge Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-2 bg-[#080d10]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white shadow max-w-[65%] truncate">
              <Film className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
              <span className="truncate">{mediaTitle || 'Synchronized Cinema'}</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Host Button to change movie link */}
              {isHost && (
                <button
                  onClick={() => setShowCueModal(true)}
                  className="bg-[#12171c]/90 hover:bg-[#1b2229] border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md transition-all shadow hover:border-[#ff7a00]"
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

          {/* Cinema Playback Control Bar */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#12171c]/95 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition-opacity duration-200 z-20">
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
              <div className="flex items-center gap-3">
                {/* Play/Pause Button (Host authorized, peer indicator) */}
                <button
                  onClick={togglePlay}
                  disabled={!isHost}
                  className={`p-1.5 transition-colors ${
                    isHost
                      ? 'text-white hover:text-[#ff7a00] cursor-pointer'
                      : 'text-white/60 cursor-not-allowed'
                  }`}
                  title={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Playback controlled by Host'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                </button>

                {/* Local Volume Toggle */}
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:text-[#ff7a00] text-white transition-colors cursor-pointer"
                  title="Toggle Local Audio"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Subtitles Toggle & Track Selector */}
                {subtitles.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowSubtitles((prev) => !prev)}
                      className={`p-1.5 transition-colors cursor-pointer ${
                        showSubtitles ? 'text-[#ff7a00]' : 'text-[#9aa6af] hover:text-white'
                      }`}
                      title="Toggle Captions"
                    >
                      <Subtitles className="w-5 h-5" />
                    </button>

                    {subtitles.length > 1 && showSubtitles && (
                      <select
                        value={selectedSubIndex}
                        onChange={(e) => setSelectedSubIndex(parseInt(e.target.value, 10))}
                        className="bg-[#080d10] text-[#9aa6af] hover:text-white border border-white/10 rounded-lg text-[10px] font-mono px-2 py-1 outline-none focus:border-[#ff7a00]"
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

              {/* Status & Fullscreen */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isHost
                      ? 'bg-[#ff7a00]/15 text-[#ff7a00] border-[#ff7a00]/30 shadow-glow-orange/20'
                      : 'bg-[#080d10] text-[#9aa6af] border-white/5'
                  }`}
                >
                  {isHost ? 'Host In Control' : 'Synced With Host'}
                </span>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 hover:text-[#ff7a00] text-white transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
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
            className="absolute bottom-20 right-12 animate-float-reaction flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-glow-orange"
            style={{
              right: `${Math.min(75, 10 + Math.random() * 60)}%`
            }}
          >
            <span className="text-2xl animate-bounce">{r.emoji}</span>
            <span className="text-[11px] font-bold text-white">{r.senderName}</span>
          </div>
        ))}
      </div>

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
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] text-white text-xs font-bold uppercase tracking-wider shadow-glow-orange"
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

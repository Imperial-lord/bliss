import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Film, Radio, Sparkles, Subtitles } from 'lucide-react';

export default function MoviePlayer({ reactions = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
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

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center group font-sans">
      {/* Sample open movie stream */}
      <video
        ref={videoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        className="w-full h-full object-contain"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Animated Reaction Bubbles (Teleport style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 right-12 animate-float-reaction flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-glow-orange"
            style={{
              right: `${Math.min(75, 10 + Math.random() * 60)}%`
            }}
          >
            <span className="text-2xl animate-bounce">{r.emoji}</span>
            <span className="text-[11px] font-bold text-white">{r.senderName}</span>
          </div>
        ))}
      </div>

      {/* Top Header Badge Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#080d10]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-wider shadow">
          <Film className="w-3.5 h-3.5 text-[#ff7a00]" />
          <span>Big Buck Bunny • Synced Cinema</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Live Sync</span>
          </span>
          <span className="bg-black/60 border border-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-md">
            4K UHD
          </span>
        </div>
      </div>

      {/* Video Overlay Center Play button when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30 z-10"
        >
          <div className="w-20 h-20 rounded-full bg-[#ff7a00] text-white flex items-center justify-center shadow-glow-orange transition-transform hover:scale-110">
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
        </button>
      )}

      {/* Cinema Playback Control Bar (Teleport Sleek Look) */}
      <div className="absolute bottom-4 left-4 right-4 bg-[#12171c]/90 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition-opacity duration-200 z-10">
        {/* Scrubber Timeline */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] font-mono font-medium text-[#9aa6af] w-10">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-[#1b2229] rounded-lg appearance-none cursor-pointer accent-[#ff7a00]"
          />
          <span className="text-[10px] font-mono font-medium text-[#9aa6af] w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Lower Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-[#ff7a00] text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 hover:text-[#ff7a00] text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowSubtitles((prev) => !prev)}
              className={`p-1.5 transition-colors ${
                showSubtitles ? 'text-[#ff7a00]' : 'text-[#9aa6af] hover:text-white'
              }`}
              title="Toggle Subtitles"
            >
              <Subtitles className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9aa6af] bg-[#080d10] px-2.5 py-1 rounded-full border border-white/5">
              Host Controlled
            </span>

            <button
              onClick={handleFullscreen}
              className="p-1.5 hover:text-[#ff7a00] text-white transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

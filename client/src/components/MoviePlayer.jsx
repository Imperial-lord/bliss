import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Film } from 'lucide-react';

export default function MoviePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-center items-center group">
      {/* Sample open movie stream */}
      <video
        ref={videoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        className="w-full h-full object-contain"
        loop
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Overlay Title */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#080d10]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
        <Film className="w-3.5 h-3.5 text-[#ff7a00]" />
        <span>Big Buck Bunny • Synced Demo</span>
      </div>

      {/* Video Overlay Play button when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30"
        >
          <div className="w-20 h-20 rounded-full bg-[#ff7a00] text-white flex items-center justify-center shadow-glow-orange transition-transform hover:scale-110">
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
        </button>
      )}

      {/* Minimal Movie Playback Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-[#12171c]/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-1.5 hover:text-[#ff7a00] text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 hover:text-[#ff7a00] text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-[11px] text-[#9aa6af] font-semibold uppercase tracking-wider">Live Sync Buffer</span>
        </div>

        <button
          onClick={handleFullscreen}
          className="p-1.5 hover:text-[#ff7a00] text-white transition-colors"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

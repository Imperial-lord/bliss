import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  Check,
  Tv,
  LayoutGrid
} from 'lucide-react';

export default function CallControls({
  isAudioEnabled,
  isVideoEnabled,
  viewMode,
  roomId,
  onToggleAudio,
  onToggleVideo,
  onToggleViewMode,
  onLeaveCall
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-[#12171c]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Audio Toggle */}
      <button
        onClick={onToggleAudio}
        title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        className={`p-3 rounded-full transition-all duration-150 flex items-center justify-center ${
          isAudioEnabled
            ? 'bg-[#1b2229] text-white hover:bg-[#252e37] border border-white/10'
            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
        }`}
      >
        {isAudioEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        className={`p-3 rounded-full transition-all duration-150 flex items-center justify-center ${
          isVideoEnabled
            ? 'bg-[#1b2229] text-white hover:bg-[#252e37] border border-white/10'
            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
        }`}
      >
        {isVideoEnabled ? <Video className="w-4 h-4 text-[#ff7a00]" /> : <VideoOff className="w-4 h-4" />}
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* View Mode Toggle (Movie Cinema vs Grid) */}
      <button
        onClick={onToggleViewMode}
        title={viewMode === 'cinema' ? 'Switch to Grid View' : 'Switch to Cinema Watch View'}
        className={`p-3 rounded-full transition-all duration-150 flex items-center justify-center ${
          viewMode === 'cinema'
            ? 'bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/40 shadow-glow-orange'
            : 'bg-[#1b2229] text-white hover:bg-[#252e37] border border-white/10'
        }`}
      >
        {viewMode === 'cinema' ? <Tv className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
      </button>

      {/* Copy Link / Invite */}
      <button
        onClick={handleCopyLink}
        title="Copy Invite Link"
        className="p-3 rounded-full bg-[#1b2229] text-white hover:bg-[#252e37] border border-white/10 transition-all duration-150 flex items-center justify-center relative"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Leave Call */}
      <button
        onClick={onLeaveCall}
        title="Leave Room"
        className="p-3 rounded-full bg-[#ff3d2e] hover:bg-red-600 text-white transition-all duration-150 flex items-center justify-center shadow-lg hover:scale-105"
      >
        <PhoneOff className="w-4 h-4" />
      </button>
    </div>
  );
}

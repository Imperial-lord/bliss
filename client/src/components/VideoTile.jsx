import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff, User } from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function VideoTile({
  stream,
  userName = 'Anonymous',
  avatarId = 'cyber-rebel',
  isLocal = false,
  isAudioEnabled = true,
  isVideoEnabled = true,
  isSpeaking = false
}) {
  const videoRef = useRef(null);
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative group bg-[#12171c] rounded-2xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center transition-all duration-200 ${
        isSpeaking
          ? 'ring-2 ring-emerald-500 shadow-emerald-500/20 shadow-lg'
          : 'border border-white/10 hover:border-[#ff7a00]/40'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Avoid audio feedback loop for self
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isVideoEnabled ? 'opacity-100' : 'opacity-0'
        } ${isLocal ? 'scale-x-[-1]' : ''}`}
      />

      {/* Fallback Cinema Avatar when camera is turned off */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#141a1f] to-[#080d10] text-[#9aa6af]">
          <div className={`w-16 h-16 rounded-full ${avatarObj.bg} border-2 border-white/20 flex items-center justify-center text-3xl shadow-glow-orange`}>
            {avatarObj.emoji}
          </div>
          <span className="mt-2.5 text-xs font-bold text-white tracking-wide">
            {userName} {isLocal && '(You)'}
          </span>
          <span className="text-[10px] text-[#9aa6af] uppercase tracking-wider font-semibold mt-0.5">
            Camera Off
          </span>
        </div>
      )}

      {/* Bottom Bar inside Video Tile */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="bg-[#080d10]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 shadow">
          {isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
          <span>{userName}</span>
          {isLocal && <span className="text-[#ff7a00] font-bold">(You)</span>}
        </div>

        <div className="flex items-center gap-1.5">
          {!isAudioEnabled && (
            <div className="bg-red-500/90 text-white p-1 rounded-md shadow backdrop-blur-md">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          )}
          {!isVideoEnabled && (
            <div className="bg-[#1b2229]/90 text-[#9aa6af] p-1 rounded-md shadow backdrop-blur-md border border-white/5">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * Left-hand hero headline, value propositions, and live indicators.
 */
export default function HeroHeadline() {
  return (
    <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
      {/* Eyebrow Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12171c] border border-[#ff7a00]/30 shadow-glow-orange animate-gentle-float mb-5">
        <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-ping" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff7a00]">
          Direct P2P Cinema Streaming & Video Calls
        </span>
      </div>

      {/* Clean, Impactful Hero Title */}
      <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
        Stream movies together. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] via-[#ff9433] to-[#ff3d2e]">
          Live and in sync.
        </span>
      </h1>

      <p className="mt-5 text-base sm:text-lg text-[#9aa6af] max-w-xl font-sans leading-relaxed">
        Movie playback on the left. Zoom-like peer video calling on the right. Crystal-clear WebRTC
        audio, sub-second sync, and animated party reactions.
      </p>

      {/* Feature Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-[#9aa6af]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Sub-second Sync</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]" />
          <span>Zero Cloud Storage</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>100% Ephemeral</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Film, Radio, Users, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

/**
 * Interactive Cinema Theater & Zoom Call Preview showcase for the landing page.
 *
 * @param {Object} props
 * @param {Function} props.onStartParty
 */
export default function TheaterStagePreview({ onStartParty }) {
  const [activeReaction, setActiveReaction] = useState(null);
  const [reactionCounter, setReactionCounter] = useState(0);

  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setActiveReaction({ id, emoji });
    setReactionCounter((prev) => prev + 1);
    setTimeout(() => {
      setActiveReaction((cur) => (cur?.id === id ? null : cur));
    }, 2800);
  };

  return (
    <div className="mt-12 sm:mt-16">
      <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-[#080d10] shadow-2xl">
        {/* Glow Halo */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#ff7a00]/20 to-transparent blur-[120px] pointer-events-none" />

        {/* Studio Window Chrome Header */}
        <div className="bg-[#12171c] px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs font-mono text-[#9aa6af] hidden sm:inline">
              bliss.cinema.party/live-room-7x
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Synchronized Party</span>
            </span>
            <button
              onClick={onStartParty}
              className="text-[10px] font-bold uppercase tracking-wider bg-[#ff7a00] hover:bg-[#ff9124] text-white px-3 py-1 rounded-full shadow-glow-orange transition-all cursor-pointer"
            >
              Enter Live Room
            </button>
          </div>
        </div>

        {/* Theater Split Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-black">
          {/* LHS: Movie Streaming Screen */}
          <div className="lg:col-span-8 relative flex flex-col justify-between bg-black overflow-hidden group">
            <div className="relative w-full h-full min-h-[320px] flex items-center justify-center">
              <video
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/videos/odyssey-trailer-clip.mp4" type="video/mp4" />
                <source src="/videos/odyssey-trailer-clip.webm" type="video/webm" />
              </video>

              {/* Animated Reaction Balloon Overlay */}
              {activeReaction && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-float-reaction flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-glow-orange z-30">
                  <span className="text-3xl animate-bounce">{activeReaction.emoji}</span>
                  <span className="text-xs font-bold text-white">Party reacted!</span>
                </div>
              )}

              {/* Movie Overlays */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#080d10]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-wider shadow">
                <Film className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span>Sci-Fi Cyber Odyssey • Live Cinema</span>
              </div>

              <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 backdrop-blur-md">
                4K HDR • 60FPS
              </div>
            </div>

            {/* Scrubber & Reaction Tap Bar */}
            <div className="p-4 bg-[#12171c]/95 backdrop-blur-md border-t border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#9aa6af]">
                <span>18:40</span>
                <div className="flex-1 h-1 bg-[#1b2229] rounded-full overflow-hidden relative">
                  <div className="w-[42%] h-full bg-[#ff7a00] rounded-full" />
                </div>
                <span>52:10</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Stream Active
                  </span>
                  <span className="text-[10px] text-[#9aa6af] bg-[#1b2229] px-2 py-0.5 rounded-full">
                    {reactionCounter > 0 ? `${reactionCounter} reactions` : 'Tap emojis below'}
                  </span>
                </div>

                {/* Interactive Reaction Emojis */}
                <div className="flex items-center gap-1.5 bg-[#080d10] p-1 rounded-full border border-white/10">
                  {['❤️', '🔥', '🍿', '😂', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-sm transition-transform active:scale-125 hover:scale-110 cursor-pointer"
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RHS: Zoom-like Video Call Panel */}
          <div className="lg:col-span-4 bg-[#12171c] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between">
            {/* Top Bar with Multiple Attendees Count */}
            <div className="p-3.5 bg-[#080d10] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#1b2229] px-2.5 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
                  <span>Zoom Call Tab</span>
                  <span className="text-[#ff7a00] font-mono">(4)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                P2P Connected
              </span>
            </div>

            {/* Multi-Attendee Video Tiles Grid */}
            <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto max-h-[300px]">
              {/* Attendee 1 (Host - Active Speaker) */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#080d10] border-2 border-[#ff7a00] shadow-glow-orange flex flex-col justify-between p-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-[#ff7a00] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Host
                  </span>
                  <div className="flex items-center gap-0.5 bg-black/60 px-1.5 py-1 rounded-md">
                    <span className="w-0.5 bg-emerald-400 rounded-full soundbar-1" />
                    <span className="w-0.5 bg-emerald-400 rounded-full soundbar-2" />
                    <span className="w-0.5 bg-emerald-400 rounded-full soundbar-3" />
                  </div>
                </div>
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-lg shadow-md">
                  🦊
                </div>
                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-lg truncate text-center">
                  Alex (You)
                </span>
              </div>

              {/* Attendee 2 */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex flex-col justify-between p-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Viewer
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-lg shadow-md">
                  🚀
                </div>
                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-lg truncate text-center">
                  Maya
                </span>
              </div>

              {/* Attendee 3 */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex flex-col justify-between p-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Viewer
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-lg shadow-md">
                  🍿
                </div>
                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-lg truncate text-center">
                  David
                </span>
              </div>

              {/* Attendee 4 */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex flex-col justify-between p-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Viewer
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-md">
                  ⚡
                </div>
                <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-lg truncate text-center">
                  Elena
                </span>
              </div>
            </div>

            {/* Micro Chat & Call State Footer */}
            <div className="p-3 bg-[#080d10] border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#9aa6af] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span>Ready for your friends</span>
              </span>

              <button
                onClick={onStartParty}
                className="text-xs font-bold text-white hover:text-[#ff7a00] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Join Call</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Value Badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-[#9aa6af]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#ff7a00]" />
          <span className="font-semibold text-white">Direct P2P WebRTC Mesh</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Encrypted Direct Media</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">Multi-Peer Synchronized Video</span>
        </div>
      </div>
    </div>
  );
}

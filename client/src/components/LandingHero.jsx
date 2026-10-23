import React, { useState } from 'react';
import {
  Play,
  ArrowRight,
  Maximize2,
  Film,
  KeyRound,
  Users
} from 'lucide-react';

export default function LandingHero({ onStartParty, onJoinWithCode, currentUser }) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeReaction, setActiveReaction] = useState(null);
  const [reactionCounter, setReactionCounter] = useState(0);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      onJoinWithCode(roomCodeInput.trim());
    }
  };

  const handleQuickChip = (code) => {
    setRoomCodeInput(code);
    onJoinWithCode(code);
  };

  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setActiveReaction({ id, emoji });
    setReactionCounter((prev) => prev + 1);
    setTimeout(() => {
      setActiveReaction((cur) => (cur?.id === id ? null : cur));
    }, 2800);
  };

  return (
    <section className="relative pt-10 pb-20 overflow-hidden font-sans">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-[#ff7a00]/[0.05] blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow Pill */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#11161b] border border-white/[0.08] text-xs text-[#9aa6af]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]" />
            <span className="font-medium text-white/90">
              P2P Cinema Streaming & Video Calls
            </span>
          </div>
        </div>

        {/* Clean, Editorial Hero Title */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Stream movies together, <br />
            <span className="bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] bg-clip-text text-transparent">
              live and in sync.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#9aa6af] max-w-xl mx-auto font-sans leading-relaxed">
            Synchronized cinema streaming with peer-to-peer video calling. No cloud recordings, no stored chats—just real-time movie night with your circle.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* ACTION HUB (HOST & JOIN) */}
        {/* ========================================================================= */}
        <div className="mt-9 max-w-2xl mx-auto">
          <div className="bg-[#10151a] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
              {/* PRIMARY ACTION 1: Host a Watch Party */}
              <div className="md:col-span-5 flex flex-col justify-center text-center sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ff7a00] mb-1">
                  Start Fresh
                </span>
                <h3 className="font-display text-lg font-bold text-white mb-1.5">
                  Host New Room
                </h3>
                <p className="text-xs text-[#9aa6af] mb-4">
                  Create a private theater room and invite friends via link.
                </p>

                <button
                  onClick={onStartParty}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff8f26] hover:to-[#ff5042] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Watch Screen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* DIVIDER */}
              <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-2">
                <div className="flex-1 h-[1px] md:h-12 w-full md:w-[1px] bg-white/[0.08]" />
                <span className="text-[10px] font-semibold text-[#9aa6af]/60 px-2 py-0.5 bg-[#090d11] rounded-full border border-white/[0.06]">
                  OR
                </span>
                <div className="flex-1 h-[1px] md:h-12 w-full md:w-[1px] bg-white/[0.08]" />
              </div>

              {/* PRIMARY ACTION 2: Join with Code */}
              <div className="md:col-span-5 flex flex-col justify-center text-center sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  Have an Invite?
                </span>
                <h3 className="font-display text-lg font-bold text-white mb-1.5">
                  Join With Code
                </h3>
                <p className="text-xs text-[#9aa6af] mb-4">
                  Enter the room code shared by your host.
                </p>

                <form onSubmit={handleJoinSubmit} className="space-y-2.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9aa6af]">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. CYBER-7"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toLowerCase())}
                      className="w-full pl-9 pr-20 py-2.5 rounded-xl bg-[#090d11] border border-white/[0.08] focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 text-white font-mono text-xs placeholder-[#9aa6af]/40 uppercase tracking-wider outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!roomCodeInput.trim()}
                      className="absolute right-1 top-1 bottom-1 px-3.5 rounded-lg bg-white/[0.08] hover:bg-[#ff7a00] hover:text-white disabled:opacity-30 disabled:hover:bg-white/[0.08] text-white text-xs font-semibold transition-all flex items-center justify-center"
                    >
                      Join
                    </button>
                  </div>

                  {/* Demo Rooms */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9aa6af]/80">
                    <span>Try demo:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickChip('cyber-cinema')}
                      className="font-mono text-white/70 hover:text-[#ff7a00] underline underline-offset-2 transition-colors"
                    >
                      cyber-cinema
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE THEATER STAGE (LHS MOVIE + RHS VIDEO CALL) */}
        {/* ========================================================================= */}
        <div className="mt-14 max-w-5xl mx-auto">
          {/* Header pill above the preview */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-white/90">
                Interactive Cinema Stage
              </span>
            </div>

            <button
              onClick={onStartParty}
              className="text-xs font-semibold text-[#ff7a00] hover:text-[#ff9124] flex items-center gap-1.5 transition-colors"
            >
              <span>Expand Cinema Screen</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl bg-[#10151a] border border-white/[0.08] overflow-hidden shadow-2xl">
            {/* Window Title Bar */}
            <div className="h-10 bg-[#0a0e12] px-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2.5 text-[11px] font-mono text-[#9aa6af]/70">
                  bliss.stream/room/cyber-cinema
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Sub-second Sync
                </span>
              </div>
            </div>

            {/* Theater Split Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px] bg-black">
              {/* LHS: Movie Streaming Screen */}
              <div className="lg:col-span-8 relative flex flex-col justify-between bg-black overflow-hidden group">
                <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
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
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-float-reaction flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg z-30">
                      <span className="text-2xl animate-bounce">{activeReaction.emoji}</span>
                      <span className="text-xs font-semibold text-white">Reaction sent</span>
                    </div>
                  )}

                  {/* Movie Overlays */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-[#080d10]/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-white">
                    <Film className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Sci-Fi Cyber Odyssey</span>
                  </div>

                  <div className="absolute top-3.5 right-3.5 bg-black/70 px-2 py-0.5 rounded text-[10px] font-semibold text-white/80 border border-white/10 backdrop-blur-md">
                    1080p • 60FPS
                  </div>
                </div>

                {/* Scrubber & Reaction Tap Bar */}
                <div className="p-3.5 bg-[#0f1419] border-t border-white/[0.06] flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#9aa6af]">
                    <span>0:05</span>
                    <div className="flex-1 h-1 bg-[#1a2128] rounded-full overflow-hidden relative">
                      <div className="w-[45%] h-full bg-[#ff7a00] rounded-full" />
                    </div>
                    <span>0:07</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/90">
                        Live Playback
                      </span>
                      <span className="text-[10px] text-[#9aa6af] bg-[#182027] px-2 py-0.5 rounded-full">
                        {reactionCounter > 0 ? `${reactionCounter} reactions` : 'Tap emojis'}
                      </span>
                    </div>

                    {/* Interactive Reaction Emojis */}
                    <div className="flex items-center gap-1 bg-[#090d11] p-1 rounded-full border border-white/[0.06]">
                      {['❤️', '🔥', '🍿', '😂', '👏'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => triggerReaction(emoji)}
                          className="w-7 h-7 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-xs transition-transform active:scale-125 hover:scale-110"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RHS: Video Call Panel */}
              <div className="lg:col-span-4 bg-[#0d1216] border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col justify-between">
                {/* Top Bar with Multiple Attendees Count */}
                <div className="p-3 bg-[#0a0e12] border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                    <Users className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Watch Party Call (4)</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-400">
                    Connected
                  </span>
                </div>

                {/* Multi-Attendee Video Tiles Grid */}
                <div className="p-2.5 grid grid-cols-2 gap-2 overflow-y-auto max-h-[300px]">
                  {/* Attendee 1 (Host) */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-[#ff7a00]/50 flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-[#ff7a00] text-white px-1.5 py-0.5 rounded font-semibold uppercase">
                        Host
                      </span>
                      <div className="flex items-center gap-0.5 bg-black/60 px-1 py-0.5 rounded">
                        <span className="w-0.5 bg-emerald-400 rounded-full soundbar-1" />
                        <span className="w-0.5 bg-emerald-400 rounded-full soundbar-2" />
                        <span className="w-0.5 bg-emerald-400 rounded-full soundbar-3" />
                      </div>
                    </div>
                    <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-sm shadow">
                      🦊
                    </div>
                    <span className="text-[9px] font-medium text-white/90 bg-black/70 px-1.5 py-0.5 rounded truncate text-center">
                      Alex (You)
                    </span>
                  </div>

                  {/* Attendee 2 */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/[0.08] flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-semibold uppercase">
                        Viewer
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-sm shadow">
                      🚀
                    </div>
                    <span className="text-[9px] font-medium text-white/90 bg-black/70 px-1.5 py-0.5 rounded truncate text-center">
                      Maya
                    </span>
                  </div>

                  {/* Attendee 3 */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/[0.08] flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-semibold uppercase">
                        Viewer
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-sm shadow">
                      🎬
                    </div>
                    <span className="text-[9px] font-medium text-white/90 bg-black/70 px-1.5 py-0.5 rounded truncate text-center">
                      Liam
                    </span>
                  </div>

                  {/* Attendee 4 */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/[0.08] flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-semibold uppercase">
                        Viewer
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-sm shadow">
                      🍿
                    </div>
                    <span className="text-[9px] font-medium text-white/90 bg-black/70 px-1.5 py-0.5 rounded truncate text-center">
                      Sam
                    </span>
                  </div>
                </div>

                {/* Footer Status */}
                <div className="p-3 bg-[#0a0e12] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#9aa6af]">
                  <span>P2P WebRTC Active</span>
                  <button
                    onClick={onStartParty}
                    className="text-[11px] font-semibold text-[#ff7a00] hover:text-[#ff9124] transition-colors"
                  >
                    Join Live Call →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

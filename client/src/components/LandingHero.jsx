import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Users,
  Video,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Volume2,
  Maximize2,
  Tv,
  Film,
  KeyRound
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
    <section className="relative pt-8 pb-20 overflow-hidden font-sans">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-[#ff7a00]/15 via-[#ff3d2e]/10 to-transparent blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-4 w-[300px] h-[300px] bg-[#ff7a00]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ========================================================================= */}
        {/* SIDE-BY-SIDE HERO (LHS HEADLINE, RHS ACTION HUB) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 pb-6">
          {/* LHS: Eyebrow + Main Hero Title + Description (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#12171c] border border-orange-500/30 dark:border-[#ff7a00]/30 shadow-sm dark:shadow-glow-orange animate-gentle-float mb-5">
              <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff7a00]">
                Direct P2P Cinema Streaming & Video Calls
              </span>
            </div>

            {/* Clean, Impactful Hero Title */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              Stream movies together. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] via-[#ff9433] to-[#ff3d2e]">
                Live and in sync.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-[#9aa6af] max-w-xl font-sans leading-relaxed">
              Movie playback on the left. Zoom-like peer video calling on the right. Crystal-clear WebRTC audio, sub-second sync, and animated party reactions.
            </p>

            {/* Feature Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-slate-600 dark:text-[#9aa6af]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <span>Sub-second Sync</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]" />
                <span>Zero Cloud Storage</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                <span>100% Ephemeral</span>
              </div>
            </div>
          </div>

          {/* RHS: Action Hub Card (Host New Room & Join With Code) (5 cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white/95 dark:bg-[#12171c]/90 backdrop-blur-2xl border-2 border-slate-200/80 dark:border-white/10 hover:border-[#ff7a00]/40 rounded-3xl p-6 sm:p-7 shadow-xl dark:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6">
              {/* PRIMARY ACTION 1: Host a Watch Party */}
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff7a00] mb-1">
                  Start From Scratch
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                  Host New Room
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#9aa6af] mb-4">
                  Create a private theater room and invite your friends in one click.
                </p>

                <button
                  onClick={onStartParty}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-3 shadow-glow-orange hover:-translate-y-0.5 hover:shadow-glow-orange-lg transition-all duration-200 active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Watch Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* DIVIDER */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#9aa6af] px-2.5 py-0.5 bg-slate-100 dark:bg-[#080d10] rounded-full border border-slate-200/80 dark:border-white/5">
                  OR
                </span>
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
              </div>

              {/* PRIMARY ACTION 2: Join with Code */}
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
                  Got an Invite?
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                  Join With Code
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#9aa6af] mb-3.5">
                  Enter the 6-character room code shared by your host.
                </p>

                <form onSubmit={handleJoinSubmit} className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#9aa6af]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. CYBER-7"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toLowerCase())}
                      className="w-full pl-10 pr-24 py-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d10] border border-slate-300/80 dark:border-white/15 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30 text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 dark:placeholder-[#9aa6af]/50 uppercase tracking-widest outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!roomCodeInput.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-slate-200 hover:bg-[#ff7a00] hover:text-white text-slate-700 dark:bg-white/10 dark:text-white dark:hover:bg-[#ff7a00] disabled:opacity-30 disabled:hover:bg-slate-200 dark:disabled:hover:bg-white/10 font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center shadow"
                    >
                      Join
                    </button>
                  </div>

                  {/* Quick Clickable Demo Rooms */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#9aa6af]">
                    <span>Try demo:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickChip('cyber-cinema')}
                      className="text-xs font-mono text-slate-800 dark:text-white/80 hover:text-[#ff7a00] underline underline-offset-2 transition-colors font-medium"
                    >
                      cyber-cinema
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleQuickChip('movie-night')}
                      className="text-xs font-mono text-slate-800 dark:text-white/80 hover:text-[#ff7a00] underline underline-offset-2 transition-colors font-medium"
                    >
                      movie-night
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE THEATER STAGE (LHS MOVIE + RHS ZOOM CALL - TELEPORT DESIGN) */}
        {/* ========================================================================= */}
        <div className="mt-10 w-full">
          {/* Header pill above the preview */}
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Interactive Cinema Stage
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#9aa6af]">
                (Test the video & reactions below)
              </span>
            </div>

            <button
              onClick={onStartParty}
              className="text-xs font-bold uppercase tracking-wider text-[#ff7a00] hover:text-[#ff9124] flex items-center gap-1.5 transition-colors"
            >
              <span>Expand Cinema Screen</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-200/80 dark:from-white/15 via-slate-100/40 dark:via-white/5 to-transparent shadow-xl dark:shadow-2xl">
            <div className="relative rounded-2xl bg-white dark:bg-[#12171c] border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl">
              {/* Window Title Bar */}
              <div className="h-11 bg-slate-100 dark:bg-[#080d10] px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-600 dark:text-[#9aa6af]">
                    bliss.stream/room/cyber-cinema
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    Sub-second Sync
                  </span>
                  <button
                    onClick={onStartParty}
                    className="text-[10px] font-bold uppercase tracking-wider bg-[#ff7a00] hover:bg-[#ff9124] text-white px-3 py-1 rounded-full shadow-glow-orange transition-all"
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
                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-sm transition-transform active:scale-125 hover:scale-110"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RHS: Zoom-like Video Call Panel (Teleport Look & Feel) */}
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
                        {/* Animated Voice Equalizer */}
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
                      className="text-xs font-bold text-white hover:text-[#ff7a00] flex items-center gap-1 transition-colors"
                    >
                      <span>Join Call</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-600 dark:text-[#9aa6af]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ff7a00]" />
            <span className="font-semibold text-slate-800 dark:text-white">Direct P2P WebRTC Mesh</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="font-semibold text-slate-800 dark:text-white">Encrypted Direct Media</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="font-semibold text-slate-800 dark:text-white">Multi-Peer Synchronized Video</span>
          </div>
        </div>
      </div>
    </section>
  );
}

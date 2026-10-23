import React, { useState } from 'react';
import { Play, Sparkles, Users, Video, ArrowRight, ShieldCheck, Zap, Volume2 } from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function LandingHero({ onStartParty, onJoinWithCode, currentUser }) {
  const [quickRoomCode, setQuickRoomCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (quickRoomCode.trim()) {
      onJoinWithCode(quickRoomCode.trim());
    }
  };

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#ff7a00]/15 to-[#ff3d2e]/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 right-10 w-[300px] h-[300px] bg-[#ff7a00]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141a1f] border border-[#ff7a00]/30 shadow-glow-orange">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff7a00]">
              Synchronized Cinema & Live Video Calling
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05]">
            Movies are better <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] via-[#ff9433] to-[#ff3d2e]">
              experienced together.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#9aa6af] max-w-2xl mx-auto font-sans leading-relaxed">
            Bliss combines synchronized cinema playback with crystal-clear direct peer-to-peer video calls. Laugh, react, and binge watch together in real time.
          </p>

          {/* Action Area */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onStartParty}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#ff7a00] hover:bg-[#ff9124] text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 shadow-glow-orange hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Host Watch Party</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Room Code Input */}
            <form onSubmit={handleJoin} className="w-full sm:w-auto flex items-center bg-[#141a1f] border border-white/10 rounded-full p-1.5 pl-4 focus-within:border-[#ff7a00]/50 transition-colors">
              <input
                type="text"
                placeholder="Enter room code..."
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value.toLowerCase())}
                className="bg-transparent text-xs text-white placeholder-[#9aa6af]/50 focus:outline-none w-32 sm:w-36 font-mono"
              />
              <button
                type="submit"
                disabled={!quickRoomCode.trim()}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-[#ff7a00] disabled:opacity-30 disabled:hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Join
              </button>
            </form>
          </div>

          {/* Quick Credibility Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#9aa6af]">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#ff7a00]" />
              <span>Zero-latency WebRTC P2P</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-peer Mesh Room</span>
            </div>
          </div>
        </div>

        {/* Hero Cinema Stage Mockup */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-2 bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-2xl">
            <div className="relative rounded-2xl bg-[#12171c] border border-white/10 overflow-hidden shadow-2xl">
              {/* Theater Window Bar */}
              <div className="h-10 bg-[#080d10] px-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-[11px] font-mono text-[#9aa6af]">room/cyber-cinema-live</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#ff7a00] font-bold uppercase tracking-widest bg-[#ff7a00]/10 px-2 py-0.5 rounded-md">
                  ● 4 Watching
                </div>
              </div>

              {/* Theater Split Layout Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-black">
                {/* Movie Screen */}
                <div className="md:col-span-9 relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop"
                    alt="Cinema Scene"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080d10] via-transparent to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#ff7a00] text-white flex items-center justify-center shadow-glow-orange cursor-pointer hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                    <span className="mt-3 text-xs font-semibold tracking-wide text-white uppercase bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                      Sci-Fi Odyssey • Synchronized Stream
                    </span>
                  </div>
                </div>

                {/* Video Call Sidebar Preview */}
                <div className="md:col-span-3 p-3 bg-[#12171c] border-l border-white/5 flex flex-col gap-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1">
                    In This Call
                  </div>

                  {/* Simulated Participant 1 */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff7a00] to-amber-400 flex items-center justify-center text-lg">
                      🦊
                    </div>
                    <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-medium flex items-center gap-1">
                      <span>Alex</span>
                      <span className="text-[#ff7a00] font-bold">(Host)</span>
                    </div>
                    <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Simulated Participant 2 */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-lg">
                      🚀
                    </div>
                    <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                      Maya
                    </div>
                  </div>

                  {/* Simulated Participant 3 */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-lg">
                      🍿
                    </div>
                    <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                      David
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

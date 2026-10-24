import React, { useState } from 'react';
import { Play, ArrowRight, ShieldCheck, Zap, Radio, KeyRound } from 'lucide-react';

/**
 * Right-hand hero Action Hub containing Host Party and Join with Code.
 *
 * @param {Object} props
 * @param {Function} props.onStartParty
 * @param {Function} props.onJoinWithCode
 * @param {Object} [props.currentUser]
 */
export default function HeroActionHub({ onStartParty, onJoinWithCode, currentUser }) {
  const [roomCodeInput, setRoomCodeInput] = useState('');

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

  return (
    <div className="lg:col-span-5 w-full">
      <div className="bg-[#12171c]/90 backdrop-blur-2xl border-2 border-white/10 hover:border-[#ff7a00]/40 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6">
        {/* PRIMARY ACTION 1: Host a Watch Party */}
        <div className="flex flex-col text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff7a00] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Step 1: Host a Cinema</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              INSTANT P2P
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Host New Watch Party
          </h3>
          <p className="text-xs text-[#9aa6af] mt-1 mb-4 leading-relaxed">
            Create an ephemeral room, cue any movie stream or video link, and invite your circle.
          </p>

          <button
            onClick={onStartParty}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Host Watch Party</span>
          </button>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#12171c] px-3 text-[10px] font-mono uppercase tracking-widest text-[#9aa6af]">
            OR JOIN EXISTING
          </span>
        </div>

        {/* PRIMARY ACTION 2: Join with Room Code */}
        <div className="flex flex-col text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9aa6af] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#ff7a00]" />
              <span>Step 2: Have a Code?</span>
            </span>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="Enter 8-digit Room Code (e.g. cinema-7x2)"
                className="w-full h-11 pl-4 pr-11 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 text-xs font-mono transition-all"
              />
              <button
                type="submit"
                disabled={!roomCodeInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#1b2229] hover:bg-[#ff7a00] disabled:opacity-40 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                title="Join Room"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Demo Chips */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#9aa6af]">
              <span>Sample:</span>
              <button
                type="button"
                onClick={() => handleQuickChip('cyber-noir-99')}
                className="font-mono text-[#ff7a00] hover:underline hover:text-[#ff9124] text-[10px] cursor-pointer"
              >
                cyber-noir-99
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickChip('cinephile-lounge')}
                className="font-mono text-[#ff7a00] hover:underline hover:text-[#ff9124] text-[10px] cursor-pointer"
              >
                cinephile-lounge
              </button>
            </div>
          </form>
        </div>

        {/* Trust & Identity Badge */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#9aa6af]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End P2P Data Mesh</span>
          </div>
          {currentUser ? (
            <span className="text-[#ff7a00] font-medium truncate max-w-[120px]">
              {currentUser.displayName}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-white/40">GUEST MODE READY</span>
          )}
        </div>
      </div>
    </div>
  );
}

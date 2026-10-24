import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * P2P Swarm resolution and initial piece pre-buffering view.
 *
 * @param {Object} props
 * @param {string} props.mediaMessage
 * @param {boolean} props.isHost
 * @param {Function} props.onCancel
 */
export default function PlayerBufferingView({ mediaMessage, isHost, onCancel }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="relative z-10 max-w-md w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#ff7a00]/15 border border-[#ff7a00]/30 flex items-center justify-center text-[#ff7a00] mb-5 shadow-glow-orange animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff7a00] mb-1.5">
          P2P Cinema Swarm
        </span>

        <h3 className="font-display text-xl font-bold text-white tracking-tight mb-2">
          Buffering Movie Stream...
        </h3>
        <p className="text-xs text-[#9aa6af] leading-relaxed max-w-sm mb-6">
          {mediaMessage ||
            'Resolving torrent metadata, connecting to seeders, and caching stream headers. Playback will be ready in seconds.'}
        </p>

        {/* Simulated Audio/Video Equalizer Pulse */}
        <div className="flex items-center gap-1.5 h-6">
          {[40, 85, 60, 100, 75, 90, 50, 70, 95, 60].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
              className="w-1 bg-[#ff7a00] rounded-full animate-pulse"
            />
          ))}
        </div>

        {isHost && (
          <button
            onClick={onCancel}
            className="mt-6 text-[11px] font-mono text-[#9aa6af] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            Cancel / Change Link
          </button>
        )}
      </div>
    </div>
  );
}

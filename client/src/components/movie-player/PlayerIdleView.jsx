import React from 'react';
import { Sparkles, Film, Radio, AlertCircle, Link as LinkIcon } from 'lucide-react';

/**
 * Idle screen before any movie has been cued.
 * Shows Host Cue form for host, and Popcorn Standby card for peers.
 *
 * @param {Object} props
 * @param {boolean} props.isHost
 * @param {string} props.torrentInput
 * @param {Function} props.setTorrentInput
 * @param {boolean} props.isCueing
 * @param {string} [props.hostErrorMessage]
 * @param {Function} props.onSubmit
 */
export default function PlayerIdleView({
  isHost,
  torrentInput,
  setTorrentInput,
  isCueing,
  hostErrorMessage,
  onSubmit
}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute w-[450px] h-[300px] bg-gradient-to-tr from-[#ff7a00]/15 to-[#ff3d2e]/10 blur-[130px] pointer-events-none rounded-full" />

      {isHost ? (
        /* HOST CUE FORM */
        <div className="relative z-10 max-w-lg w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-3 border border-[#ff7a00]/30 shadow-glow-orange">
            <Sparkles className="w-3 h-3" />
            <span>Host Cinema Authority</span>
          </div>

          <h3 className="font-display text-2xl font-extrabold text-white tracking-tight mb-2">
            Cue Torrent Movie Stream
          </h3>
          <p className="text-xs text-[#9aa6af] mb-5 leading-relaxed">
            Provide a torrent download URL or magnet link. Our backend will fetch the swarm, extract
            the movie, and stream it in real-time sync with all viewers.
          </p>

          {/* Host-Only Error Alert Banner */}
          {hostErrorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-start gap-2.5 text-left animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Stream Error (Host Only)</span>
                <span>{hostErrorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa6af]" />
              <input
                type="url"
                required
                value={torrentInput}
                onChange={(e) => setTorrentInput(e.target.value)}
                placeholder="https://yts.gg/torrent/download/..."
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 text-xs font-mono transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9aa6af]">
              <span>Supports .torrent URLs & magnet:?xt=</span>
              <button
                type="button"
                onClick={() =>
                  setTorrentInput(
                    'https://yts.gg/torrent/download/A54926C2E07B0E5F0243954330B599B31C804F0B'
                  )
                }
                className="text-[#ff7a00] hover:underline font-mono text-[10px] cursor-pointer"
              >
                Paste Sample Link
              </button>
            </div>

            <button
              type="submit"
              disabled={isCueing || !torrentInput.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>Stream Movie For Party</span>
            </button>
          </form>
        </div>
      ) : (
        /* PEER WAITING SCREEN (ZERO HOST ERRORS SHOWN) */
        <div className="relative z-10 max-w-md w-full bg-[#12171c]/70 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#ff7a00]/20 to-[#ff3d2e]/10 border border-[#ff7a00]/30 flex items-center justify-center text-3xl shadow-glow-orange animate-gentle-float mb-5">
            🍿
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>P2P Cinema Standby</span>
          </div>

          <h3 className="font-display text-2xl font-bold text-white tracking-tight mb-2">
            Waiting For Host To Cue Movie
          </h3>
          <p className="text-xs text-[#9aa6af] leading-relaxed max-w-xs">
            Sit back with your popcorn. The room host will paste a movie link and start synchronized
            playback shortly.
          </p>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3 text-[11px] text-[#9aa6af] font-mono">
            <Radio className="w-3.5 h-3.5 text-[#ff7a00] animate-pulse" />
            <span>SUB-SECOND SYNC READY</span>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Play, Pause, Sparkles, Film } from 'lucide-react';

/**
 * Handles video staging before first playback, and clean pause controls afterwards.
 *
 * @param {Object} props
 */
export default function PlayerStagingOverlay({
  hasStartedPlayback,
  isPlaying,
  isHost,
  displayTitle,
  onTogglePlay
}) {
  return (
    <>
      {/* INITIAL STAGING: Host sees "Start Cinema Playback" ONLY BEFORE first play */}
      {!hasStartedPlayback && !isPlaying && isHost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[3px] z-15 p-6 text-center">
          <div className="max-w-md w-full bg-[#12171c]/95 border border-[#ff7a00]/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-3 border border-[#ff7a00]/30">
              <Sparkles className="w-3 h-3" />
              <span>Stream Ready</span>
            </div>

            <h4 className="text-white font-display font-bold text-lg mb-1 truncate max-w-full">
              {displayTitle || 'Cinema Stream Ready'}
            </h4>
            <p className="text-xs text-[#9aa6af] mb-5">
              The movie stream is buffered and ready. Press play below or press Spacebar to start
              synchronized playback for all peers.
            </p>

            <button
              onClick={onTogglePlay}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-glow-orange transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Cinema Playback</span>
            </button>
          </div>
        </div>
      )}

      {/* INITIAL STAGING: Peer standby card ONLY BEFORE first play */}
      {!hasStartedPlayback && !isPlaying && !isHost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] z-15 p-6 text-center pointer-events-none">
          <div className="max-w-sm w-full bg-[#12171c]/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Film className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-white font-display font-bold text-base mb-1 truncate max-w-full">
              {displayTitle || 'Movie Stream Ready'}
            </h4>
            <p className="text-xs text-[#9aa6af] leading-relaxed">
              The stream is ready on your device. Waiting for the room host to press play.
            </p>
          </div>
        </div>
      )}

      {/* NORMAL PAUSE (AFTER FIRST PLAY): Host sees clean centered play circle */}
      {hasStartedPlayback && !isPlaying && isHost && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] z-15 pointer-events-auto">
          <button
            onClick={onTogglePlay}
            className="w-20 h-20 rounded-full bg-[#ff7a00]/90 hover:bg-[#ff7a00] text-white flex items-center justify-center shadow-glow-orange transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md border border-white/20"
            title="Resume Playback (Space)"
          >
            <Play className="w-9 h-9 fill-current ml-1" />
          </button>
        </div>
      )}

      {/* NORMAL PAUSE (AFTER FIRST PLAY): Peer sees subtle top notification pill */}
      {hasStartedPlayback && !isPlaying && !isHost && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono text-[#9aa6af] flex items-center gap-2 pointer-events-none z-20 shadow-lg animate-fade-in">
          <Pause className="w-3.5 h-3.5 text-[#ff7a00]" />
          <span>Paused by Room Host</span>
        </div>
      )}
    </>
  );
}

import React from 'react';
import { RotateCw, RotateCcw, Volume2, VolumeX, Lock } from 'lucide-react';

/**
 * Animated center feedback toasts for hotkey actions (seeking, volume, authority lock)
 * and peer autoplay mute notification pill.
 *
 * @param {Object} props
 * @param {Object|null} props.feedbackToast
 * @param {boolean} props.showAutoplayMutedHint
 * @param {Function} props.onUnmuteAutoplay
 */
export default function PlayerFeedbackToasts({
  feedbackToast,
  showAutoplayMutedHint,
  onUnmuteAutoplay
}) {
  return (
    <>
      {/* Center Feedback Toast */}
      {feedbackToast && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-fade-in">
          <div className="flex flex-col items-center gap-1.5 bg-black/85 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 text-white shadow-2xl scale-110">
            {feedbackToast.type === 'forward' && <RotateCw className="w-8 h-8 text-[#ff7a00]" />}
            {feedbackToast.type === 'backward' && <RotateCcw className="w-8 h-8 text-[#ff7a00]" />}
            {feedbackToast.type === 'volume' && <Volume2 className="w-8 h-8 text-[#ff7a00]" />}
            {feedbackToast.type === 'locked' && <Lock className="w-8 h-8 text-amber-400" />}
            <span className="text-xs font-mono font-bold tracking-wider">{feedbackToast.text}</span>
          </div>
        </div>
      )}

      {/* Autoplay Muted Notification Pill for Peers */}
      {showAutoplayMutedHint && (
        <div className="absolute bottom-20 right-6 z-30 animate-fade-in">
          <button
            onClick={onUnmuteAutoplay}
            className="flex items-center gap-2 bg-[#ff7a00] hover:bg-[#ff9124] text-white text-xs font-bold px-4 py-2 rounded-full shadow-glow-orange transition-all hover:scale-105 cursor-pointer"
          >
            <VolumeX className="w-4 h-4 animate-pulse" />
            <span>Audio Muted by Browser – Click to Unmute</span>
          </button>
        </div>
      )}
    </>
  );
}

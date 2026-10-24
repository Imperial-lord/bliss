import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Subtitles,
  Maximize,
  Minimize
} from 'lucide-react';
import { formatTime } from '../../utils/moviePlayerUtils';

/**
 * Bottom playback control bar with timeline scrubber, hotkey skip buttons,
 * volume, caption tracks, and fullscreen toggle.
 *
 * @param {Object} props
 */
export default function PlayerControls({
  controlsVisible,
  currentTime,
  duration,
  onSeek,
  isHost,
  isPlaying,
  onTogglePlay,
  onSeekByOffset,
  isMuted,
  onToggleMute,
  subtitles = [],
  showSubtitles,
  onToggleSubtitles,
  selectedSubIndex,
  onSelectSubIndex,
  isFullscreen,
  onToggleFullscreen
}) {
  return (
    <div
      className={`absolute bottom-4 left-4 right-4 bg-[#12171c]/95 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex flex-col gap-2 transition-opacity duration-300 z-20 ${
        controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Scrubber Timeline */}
      <div className="w-full flex items-center gap-3">
        <span className="text-[10px] font-mono font-medium text-[#9aa6af] w-12">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={onSeek}
          disabled={!isHost}
          className={`flex-1 h-1.5 bg-[#1b2229] rounded-lg appearance-none accent-[#ff7a00] ${
            isHost ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
          }`}
          title={isHost ? 'Seek playback' : 'Playback controlled by Host'}
        />
        <span className="text-[10px] font-mono font-medium text-[#9aa6af] w-12 text-right">
          {formatTime(duration)}
        </span>
      </div>

      {/* Lower Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Host -10s Rewind Button */}
          <button
            onClick={() => onSeekByOffset(-10)}
            disabled={!isHost}
            className={`h-8 px-2.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10 bg-[#080d10]/70 ${
              isHost
                ? 'text-[#9aa6af] hover:text-white hover:border-[#ff7a00]/40 hover:bg-[#12171c] cursor-pointer active:scale-95'
                : 'text-[#9aa6af]/30 border-transparent cursor-not-allowed'
            }`}
            title={isHost ? 'Rewind 10s (Left Arrow / J)' : 'Playback controlled by Host'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
            <span className="text-[11px] font-mono font-bold text-white/90 leading-none">10s</span>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={!isHost}
            className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${
              isHost
                ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white shadow-glow-orange cursor-pointer active:scale-90'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            title={
              isHost
                ? isPlaying
                  ? 'Pause (Space / K)'
                  : 'Play (Space / K)'
                : 'Playback controlled by Host'
            }
          >
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5 fill-current" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Host +10s Forward Button */}
          <button
            onClick={() => onSeekByOffset(10)}
            disabled={!isHost}
            className={`h-8 px-2.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10 bg-[#080d10]/70 ${
              isHost
                ? 'text-[#9aa6af] hover:text-white hover:border-[#ff7a00]/40 hover:bg-[#12171c] cursor-pointer active:scale-95'
                : 'text-[#9aa6af]/30 border-transparent cursor-not-allowed'
            }`}
            title={isHost ? 'Forward 10s (Right Arrow / L)' : 'Playback controlled by Host'}
          >
            <span className="text-[11px] font-mono font-bold text-white/90 leading-none">10s</span>
            <RotateCw className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          {/* Local Volume Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 hover:text-[#ff7a00] text-white transition-colors cursor-pointer active:scale-90"
            title="Toggle Local Audio (M)"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Subtitles Toggle & Track Selector */}
          {subtitles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleSubtitles}
                className={`p-1.5 transition-colors cursor-pointer active:scale-90 ${
                  showSubtitles ? 'text-[#ff7a00]' : 'text-[#9aa6af] hover:text-white'
                }`}
                title="Toggle Captions (C)"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {subtitles.length > 1 && showSubtitles && (
                <select
                  value={selectedSubIndex}
                  onChange={(e) => onSelectSubIndex(parseInt(e.target.value, 10))}
                  className="bg-[#080d10] text-[#9aa6af] hover:text-white border border-white/10 rounded-lg text-[10px] font-mono px-2 py-1 outline-none focus:border-[#ff7a00] cursor-pointer"
                >
                  {subtitles.map((s) => (
                    <option key={s.index} value={s.index}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Status & Custom Fullscreen Toggle */}
        <div className="flex items-center gap-2.5">
          <span
            className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isHost
                ? 'bg-[#ff7a00]/15 text-[#ff7a00] border-[#ff7a00]/30 shadow-glow-orange/20'
                : 'bg-[#080d10] text-[#9aa6af] border-white/5'
            }`}
          >
            {isHost ? 'Host Controls Active' : 'Synced With Host'}
          </span>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 hover:text-[#ff7a00] text-white transition-colors cursor-pointer active:scale-90"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

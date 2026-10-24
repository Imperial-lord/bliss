import React from 'react';

/**
 * Custom cinematic WebVTT subtitle overlay rendered cleanly over the HTML5 video canvas.
 *
 * @param {Object} props
 * @param {boolean} props.showSubtitles
 * @param {string} props.currentCue
 */
export default function PlayerSubtitleOverlay({ showSubtitles, currentCue }) {
  if (!showSubtitles || !currentCue) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-[85%] z-25 pointer-events-none text-center animate-fade-in">
      <span className="inline-block bg-black/85 backdrop-blur-md text-white text-sm sm:text-base md:text-xl font-medium px-4 py-2 rounded-xl border border-white/10 shadow-2xl tracking-wide leading-relaxed drop-shadow-md">
        {currentCue.split('\n').map((line, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
}

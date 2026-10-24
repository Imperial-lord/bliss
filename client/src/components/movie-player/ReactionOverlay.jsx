import React from 'react';

/**
 * Floating animated emoji reactions rendered on top of the cinema canvas.
 *
 * @param {Object} props
 * @param {Array} props.reactions
 */
export default function ReactionOverlay({ reactions = [] }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-20 right-12 animate-float-reaction flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-glow-orange"
          style={{
            right: `${Math.min(75, 10 + Math.random() * 60)}%`
          }}
        >
          <span className="text-2xl animate-bounce">{r.emoji}</span>
          <span className="text-[11px] font-bold text-white">{r.senderName}</span>
        </div>
      ))}
    </div>
  );
}

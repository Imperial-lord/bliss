import React from 'react';

const REACTION_EMOJIS = ['❤️', '🔥', '🍿', '😂', '👏', '😱'];

/**
 * Bottom 6-emoji quick-tap reaction bar.
 *
 * @param {Object} props
 * @param {Function} props.onSendReaction
 */
export default function ReactionPills({ onSendReaction }) {
  return (
    <div className="p-3 bg-[#080d10] border-t border-white/5 flex items-center justify-between shrink-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9aa6af]">
        React
      </span>
      <div className="flex items-center gap-1.5">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="w-8 h-8 rounded-full bg-[#141a1f] hover:bg-[#1b2229] border border-white/5 hover:border-[#ff7a00]/40 flex items-center justify-center text-sm transition-transform active:scale-125 hover:scale-110 cursor-pointer"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

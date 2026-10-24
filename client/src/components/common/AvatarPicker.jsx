import React from 'react';
import { Check } from 'lucide-react';
import { AVATAR_OPTIONS } from '../../constants/avatars';

/**
 * Reusable watch party avatar selector.
 * Supports standard cards layout and compact circular tokens layout.
 *
 * @param {Object} props
 * @param {string} props.selectedAvatarId - Currently selected avatar ID
 * @param {Function} props.onSelectAvatar - Callback with selected avatar ID
 * @param {string} [props.label] - Header label
 * @param {'cards'|'tokens'} [props.variant='cards'] - Display style
 */
export default function AvatarPicker({
  selectedAvatarId,
  onSelectAvatar,
  label = 'Choose Your Watch Persona',
  variant = 'cards'
}) {
  if (variant === 'tokens') {
    return (
      <div>
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-2">
            {label}
          </label>
        )}
        <div className="grid grid-cols-6 justify-items-center items-center py-3.5 px-2 sm:px-3 rounded-2xl bg-[#080d10] border border-white/5">
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = selectedAvatarId === avatar.id;
            return (
              <button
                type="button"
                key={avatar.id}
                onClick={() => onSelectAvatar(avatar.id)}
                className="group relative flex flex-col items-center focus:outline-none cursor-pointer"
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${avatar.bg} flex items-center justify-center text-lg shadow-md transition-all duration-150 ${
                      isSelected
                        ? 'ring-2 ring-[#ff7a00] shadow-glow-orange opacity-100'
                        : 'opacity-50 group-hover:opacity-100 group-hover:ring-1 group-hover:ring-white/20'
                    }`}
                  >
                    {avatar.emoji}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff7a00] rounded-full flex items-center justify-center text-white shadow-md z-10">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium mt-1.5 transition-colors ${
                    isSelected ? 'text-[#ff7a00] font-bold' : 'text-[#9aa6af]/70 group-hover:text-white'
                  }`}
                >
                  {avatar.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {AVATAR_OPTIONS.map((avatar) => {
          const isSelected = selectedAvatarId === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelectAvatar(avatar.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 border cursor-pointer h-20 ${
                isSelected
                  ? 'border-[#ff7a00] bg-[#ff7a00]/15 shadow-glow-orange scale-105'
                  : 'border-white/5 bg-[#080d10] hover:border-white/20'
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">
                {avatar.emoji}
              </div>
              <span className="text-[10px] font-mono text-center text-[#9aa6af] truncate w-full mt-1">
                {avatar.name}
              </span>
              {isSelected && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#ff7a00] text-black flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

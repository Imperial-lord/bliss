import React from 'react';
import { Check } from 'lucide-react';
import { MOVIE_GENRES, GENRE_EMOJIS } from '../../constants/avatars';

/**
 * Reusable cinema genre tag pills selector with festival emojis.
 *
 * @param {Object} props
 * @param {string[]} props.selectedGenres - Array of selected genre names
 * @param {Function} props.onToggleGenre - Callback with genre name to toggle
 * @param {string} [props.label] - Optional header label
 * @param {boolean} [props.showCount=false] - Show selected count in header
 */
export default function GenrePicker({
  selectedGenres = [],
  onToggleGenre,
  label = 'Favorite Cinema Genres',
  showCount = false
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {label && (
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af]">
            {label}
          </label>
        )}
        {showCount && (
          <span className="text-[11px] font-mono text-[#9aa6af]">
            {selectedGenres.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {MOVIE_GENRES.map((genre, idx) => {
          const isSelected = selectedGenres.includes(genre);
          const emoji = GENRE_EMOJIS[genre] || '🎬';
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onToggleGenre(genre)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-[#ff7a00]/25 via-[#ff3d2e]/20 to-[#ff7a00]/15 border-[#ff7a00] text-white shadow-glow-orange/30 font-semibold'
                  : 'bg-[#080d10] border-white/5 text-[#9aa6af] hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="text-sm shrink-0">{emoji}</span>
              <span>{genre}</span>
              {isSelected && <Check className="w-3 h-3 text-[#ff7a00] stroke-[3] shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

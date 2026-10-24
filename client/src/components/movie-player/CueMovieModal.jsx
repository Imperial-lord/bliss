import React from 'react';

/**
 * Modal to cue a new torrent movie while watching.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.torrentInput
 * @param {Function} props.setTorrentInput
 * @param {Function} props.onSubmit
 */
export default function CueMovieModal({
  isOpen,
  onClose,
  torrentInput,
  setTorrentInput,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#12171c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h3 className="font-display text-xl font-bold text-white mb-2">
          Cue New Torrent Stream
        </h3>
        <p className="text-xs text-[#9aa6af] mb-4">
          Enter a new torrent URL or magnet link. The current stream will be replaced for all peers.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="url"
            required
            value={torrentInput}
            onChange={(e) => setTorrentInput(e.target.value)}
            placeholder="https://yts.gg/torrent/download/..."
            className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] text-xs font-mono"
          />

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] text-white text-xs font-bold uppercase tracking-wider shadow-glow-orange cursor-pointer"
            >
              Stream New Movie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

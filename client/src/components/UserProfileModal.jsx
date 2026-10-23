import React from 'react';
import { X, Sparkles, Film, Calendar, Mail, Heart, LogOut } from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function UserProfileModal({ isOpen, onClose, user, onSignOut }) {
  if (!isOpen || !user) return null;

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === user.avatarId) || AVATAR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#12171c] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-24 h-24 rounded-full ${currentAvatar.bg} flex items-center justify-center text-4xl shadow-glow-orange border-2 border-white/20`}
          >
            {currentAvatar.emoji}
          </div>

          <div className="mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-1.5 border border-[#ff7a00]/30">
              <Sparkles className="w-3 h-3" />
              <span>{currentAvatar.name}</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">
              {user.displayName}
            </h3>
            {user.email && (
              <p className="text-xs text-[#9aa6af] flex items-center justify-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                <span>{user.email}</span>
              </p>
            )}
            {user.bio && (
              <p className="text-xs text-[#e9e9e9] italic mt-2.5 max-w-xs mx-auto">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Favorite Genres */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>Favorite Genres</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
              user.favoriteGenres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-full bg-[#1b2229] border border-white/5 text-[11px] font-medium text-white"
                >
                  {g}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#9aa6af]">All movies</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

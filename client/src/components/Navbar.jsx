import React from 'react';
import { Film, User, LogOut, Plus } from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function Navbar({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onSignOut,
  onStartWatchParty
}) {
  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === currentUser?.avatarId) || AVATAR_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d10]/90 backdrop-blur-md border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-lg tracking-tight text-white">
              BLISS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]"></span>
          </div>
        </a>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#9aa6af]">
          <button
            onClick={onStartWatchParty}
            className="flex items-center gap-1.5 text-white/90 hover:text-[#ff7a00] transition-colors font-semibold"
          >
            <span>Watch Movie</span>
          </button>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Experience
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Start party button */}
              <button
                onClick={onStartWatchParty}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ff7a00] hover:bg-[#ff8f26] text-white text-xs font-semibold transition-all duration-150 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Room</span>
              </button>

              {/* Profile Pill */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#11161b] hover:bg-[#182027] border border-white/[0.08] text-white transition-all text-xs font-medium"
              >
                <span className={`w-5 h-5 rounded-full ${currentAvatar.bg} flex items-center justify-center text-[10px]`}>
                  {currentAvatar.emoji}
                </span>
                <span className="max-w-[100px] truncate">{currentUser.displayName}</span>
              </button>

              {/* Sign out */}
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-[#11161b] hover:bg-red-500/10 hover:text-red-400 text-[#9aa6af] border border-white/[0.06] transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="text-xs font-semibold text-[#9aa6af] hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#ff7a00] hover:bg-[#ff8f26] text-white text-xs font-semibold transition-all duration-150 shadow-sm active:scale-[0.98]"
              >
                <span>Create Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

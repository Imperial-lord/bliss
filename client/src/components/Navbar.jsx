import React from 'react';
import { Film, Sparkles, User, LogOut, PlusCircle } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full bg-[#080d10]/80 backdrop-blur-xl border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center shadow-glow-orange group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-2xl tracking-tight text-white flex items-center gap-1">
              BLISS
              <span className="w-2 h-2 rounded-full bg-[#ff7a00] inline-block animate-pulse"></span>
            </span>
            <span className="text-[10px] tracking-widest uppercase text-[#9aa6af] font-medium -mt-1 font-sans">
              Watch & Connect
            </span>
          </div>
        </a>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9aa6af]">
          <button
            onClick={onStartWatchParty}
            className="flex items-center gap-1.5 text-white hover:text-[#ff7a00] font-bold transition-colors"
          >
            <Film className="w-4 h-4 text-[#ff7a00]" />
            <span>Watch Movie</span>
            <span className="text-[9px] bg-[#ff7a00]/20 text-[#ff7a00] border border-[#ff7a00]/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
              Live
            </span>
          </button>
          <a href="#features" className="hover:text-white transition-colors">
            Experience
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#community" className="hover:text-white transition-colors">
            Community
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Start party button */}
              <button
                onClick={onStartWatchParty}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff7a00] hover:bg-[#ff9124] text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-glow-orange hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Room</span>
              </button>

              {/* Profile Pill */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#141a1f] hover:bg-[#1b2229] border border-white/10 text-white transition-all text-xs font-semibold"
              >
                <span className={`w-6 h-6 rounded-full ${currentAvatar.bg} flex items-center justify-center text-xs shadow`}>
                  {currentAvatar.emoji}
                </span>
                <span className="max-w-[100px] truncate">{currentUser.displayName}</span>
              </button>

              {/* Sign out */}
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-full bg-[#141a1f] hover:bg-red-500/20 hover:text-red-400 text-[#9aa6af] transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth('signin')}
                className="text-xs font-bold uppercase tracking-wider text-[#9aa6af] hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff7a00] hover:bg-[#ff9124] text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-glow-orange hover:-translate-y-0.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

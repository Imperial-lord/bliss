import React from 'react';
import { Film, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-12 bg-[#080d10] border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">
            BLISS
          </span>
          <span className="text-xs text-[#9aa6af] ml-2">
            © {new Date().getFullYear()} Bliss. Direct WebRTC P2P Watch Parties.
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#9aa6af]">
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-[#ff7a00] fill-current" /> for cinema enthusiasts
          </span>
        </div>
      </div>
    </footer>
  );
}

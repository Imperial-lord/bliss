import React, { useState } from 'react';
import { Film, Video, VideoOff, Mic, MicOff, Sparkles, ArrowRight, ShieldCheck, ArrowLeft, User } from 'lucide-react';
import VideoTile from './VideoTile';
import ThemeToggle from './ThemeToggle';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function RoomLobby({
  initialRoomId = '',
  currentUser,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onJoinRoom,
  onBackToHome
}) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === currentUser?.avatarId) || AVATAR_OPTIONS[0];

  const generateRoomCode = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const formatted = `${code.slice(0, 3)}-${code.slice(3)}`;
    setRoomId(formatted);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    onJoinRoom(roomId.trim());
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-slate-50 text-slate-900 dark:bg-[#080d10] dark:text-[#e9e9e9] relative font-sans transition-colors duration-200">
      {/* Background Subtle Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#ff7a00]/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Back Button */}
      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-[#9aa6af] dark:hover:text-white transition-colors p-2.5 rounded-xl bg-white dark:bg-[#12171c] border border-slate-200/80 dark:border-white/5 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Top Right Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-[#141a1f] border border-orange-500/30 dark:border-[#ff7a00]/30 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-3 shadow-sm dark:shadow-glow-orange">
          <Film className="w-3.5 h-3.5" />
          <span>Bliss Cinema Staging Area</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ready for the <span className="text-[#ff7a00]">Show?</span>
        </h1>
        <p className="mt-2 text-slate-600 dark:text-[#9aa6af] max-w-md mx-auto text-sm font-sans">
          Preview your camera and audio before connecting to your watch circle.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white dark:bg-[#12171c] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl relative z-10">
        {/* Left Side: Camera Preview & Test Controls */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 aspect-video bg-black">
            <VideoTile
              stream={localStream}
              userName={currentUser?.displayName || 'You'}
              avatarId={currentUser?.avatarId || 'cyber-rebel'}
              isLocal={true}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
            />
          </div>

          {/* Quick AV Test Bar */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onToggleAudio}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                isAudioEnabled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 dark:bg-[#1b2229] dark:text-white dark:hover:bg-[#252e37] dark:border-white/10'
                  : 'bg-red-500 text-white shadow-lg'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <MicOff className="w-4 h-4" />}
              <span>{isAudioEnabled ? 'Mic Active' : 'Mic Muted'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleVideo}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                isVideoEnabled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 dark:bg-[#1b2229] dark:text-white dark:hover:bg-[#252e37] dark:border-white/10'
                  : 'bg-red-500 text-white shadow-lg'
              }`}
            >
              {isVideoEnabled ? <Video className="w-4 h-4 text-[#ff7a00]" /> : <VideoOff className="w-4 h-4" />}
              <span>{isVideoEnabled ? 'Camera On' : 'Camera Off'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Join / Create Room Form */}
        <div className="md:col-span-5 flex flex-col justify-center">
          {/* Verified User Card */}
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d10] border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full ${currentAvatar.bg} flex items-center justify-center text-xl shadow-md shrink-0`}>
              {currentAvatar.emoji}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.displayName}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#9aa6af]">
                  Cinema Room Code
                </label>
                <button
                  type="button"
                  onClick={generateRoomCode}
                  className="text-xs text-[#ff7a00] hover:text-[#ff9124] font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> New Code
                </button>
              </div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                placeholder="e.g. cyber-cinema"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#080d10] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-mono tracking-wider focus:bg-white dark:focus:bg-[#080d10]"
              />
            </div>

            <button
              type="submit"
              disabled={!roomId.trim()}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all text-xs hover:scale-[1.01]"
            >
              <span>Enter Cinema Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-[#9aa6af]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>End-to-end encrypted direct peer-to-peer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

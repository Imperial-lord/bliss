import React, { useState } from 'react';
import { Play, Sparkles, Users, Video, ArrowRight, ShieldCheck, Zap, Radio, Volume2, MessageSquare, Send } from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function LandingHero({ onStartParty, onJoinWithCode, currentUser }) {
  const [quickRoomCode, setQuickRoomCode] = useState('');
  const [previewTab, setPreviewTab] = useState('demo'); // 'demo' (Live Watch Screen) | 'overview'
  const [demoChat, setDemoChat] = useState([
    { id: 1, user: 'Maya', text: 'That cinematography is stunning! 🔥' },
    { id: 2, user: 'David', text: 'Wait for the plot twist at 12:40 🍿' }
  ]);
  const [demoInput, setDemoInput] = useState('');
  const [activeReaction, setActiveReaction] = useState(null);

  const handleJoin = (e) => {
    e.preventDefault();
    if (quickRoomCode.trim()) {
      onJoinWithCode(quickRoomCode.trim());
    }
  };

  const handleSendDemoChat = (e) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    setDemoChat((prev) => [
      ...prev,
      { id: Date.now(), user: currentUser?.displayName || 'You', text: demoInput.trim() }
    ]);
    setDemoInput('');
  };

  const triggerReaction = (emoji) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2500);
  };

  return (
    <section className="relative pt-10 pb-24 overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#ff7a00]/15 to-[#ff3d2e]/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 right-10 w-[350px] h-[350px] bg-[#ff7a00]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141a1f] border border-[#ff7a00]/30 shadow-glow-orange">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff7a00]">
              Synchronized Cinema & Zoom-Style Video Call
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05]">
            Movies are better <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] via-[#ff9433] to-[#ff3d2e]">
              experienced together.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#9aa6af] max-w-2xl mx-auto font-sans leading-relaxed">
            Movie streaming on the left. Zoom-like peer video calling on the right. Sub-second playback sync, animated reactions, and private rooms.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <button
              onClick={onStartParty}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#ff7a00] hover:bg-[#ff9124] text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 shadow-glow-orange hover:-translate-y-0.5 transition-all duration-200"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Watch Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Room Code Input */}
            <form onSubmit={handleJoin} className="w-full sm:w-auto flex items-center bg-[#141a1f] border border-white/10 rounded-full p-1.5 pl-4 focus-within:border-[#ff7a00]/50 transition-colors">
              <input
                type="text"
                placeholder="Room code..."
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value.toLowerCase())}
                className="bg-transparent text-xs text-white placeholder-[#9aa6af]/50 focus:outline-none w-28 sm:w-32 font-mono"
              />
              <button
                type="submit"
                disabled={!quickRoomCode.trim()}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-[#ff7a00] disabled:opacity-30 disabled:hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Switcher Option for the Watch Movie Screen */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="flex bg-[#12171c] p-1.5 rounded-full border border-white/10 shadow-xl">
            <button
              onClick={() => setPreviewTab('demo')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                previewTab === 'demo'
                  ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                  : 'text-[#9aa6af] hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Interactive Watch Screen (Live Demo)</span>
            </button>

            <button
              onClick={() => setPreviewTab('overview')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                previewTab === 'overview'
                  ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                  : 'text-[#9aa6af] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Architectural Overview</span>
            </button>
          </div>
        </div>

        {/* Watch Movie Screen on the Landing Page */}
        <div className="mt-6 max-w-6xl mx-auto">
          <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-2xl">
            <div className="relative rounded-2xl bg-[#12171c] border border-white/10 overflow-hidden shadow-2xl">
              {/* Theater Window Bar */}
              <div className="h-11 bg-[#080d10] px-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs font-mono text-[#9aa6af]">
                    bliss.stream/room/cyber-odyssey
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced Playback
                  </span>
                  <button
                    onClick={onStartParty}
                    className="text-[10px] font-bold uppercase tracking-wider bg-[#ff7a00] hover:bg-[#ff9124] text-white px-3 py-1 rounded-full shadow-glow-orange transition-all"
                  >
                    Enter Live Room
                  </button>
                </div>
              </div>

              {/* Split Layout: LHS Movie Streaming + RHS Zoom Video Call (Teleport Look) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px] bg-black">
                {/* LHS: Movie Streaming Screen */}
                <div className="lg:col-span-8 relative flex flex-col justify-between bg-black overflow-hidden group">
                  {/* Movie Video */}
                  <div className="relative w-full h-full min-h-[320px] flex items-center justify-center">
                    <video
                      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />

                    {/* Floating Reaction Animation */}
                    {activeReaction && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-float-reaction flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-glow-orange z-20">
                        <span className="text-3xl animate-bounce">{activeReaction}</span>
                        <span className="text-xs font-bold text-white">You reacted!</span>
                      </div>
                    )}

                    {/* Movie Stage Overlays */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#080d10]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                      <Play className="w-3.5 h-3.5 text-[#ff7a00] fill-current" />
                      <span>Sci-Fi Cyber Odyssey • Live Stream</span>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                      4K HDR • 60FPS
                    </div>
                  </div>

                  {/* Movie Scrubber & Controls */}
                  <div className="p-4 bg-[#12171c]/90 backdrop-blur-md border-t border-white/5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#9aa6af]">
                      <span>14:32</span>
                      <div className="flex-1 h-1 bg-[#1b2229] rounded-full overflow-hidden relative">
                        <div className="w-[35%] h-full bg-[#ff7a00] rounded-full" />
                      </div>
                      <span>48:20</span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Now Playing: Chapter 3
                        </span>
                      </div>

                      {/* Quick Reaction Taps */}
                      <div className="flex items-center gap-1.5 bg-[#080d10] p-1 rounded-full border border-white/10">
                        {['❤️', '🔥', '🍿', '😂', '👏'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => triggerReaction(emoji)}
                            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-xs transition-transform active:scale-125"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RHS: Zoom-like Video Call Tab (Teleport Look & Feel) */}
                <div className="lg:col-span-4 bg-[#12171c] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between">
                  {/* Top Bar with Multiple Attendees Count */}
                  <div className="p-3.5 bg-[#080d10] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-[#1b2229] px-2.5 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
                        <span>Zoom Video Tab</span>
                        <span className="text-[#ff7a00] font-mono">(4)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9aa6af]">
                      P2P Audio/Video
                    </span>
                  </div>

                  {/* Multi-Attendee Video Tiles Grid (Zoom-Style) */}
                  <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto max-h-[290px]">
                    {/* Attendee 1 (Host) */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border-2 border-[#ff7a00]/70 shadow-glow-orange flex flex-col justify-between p-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-[#ff7a00] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                          Host
                        </span>
                        {/* Audio Waveform */}
                        <div className="flex items-center gap-0.5 bg-black/60 px-1 py-0.5 rounded">
                          <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                          <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-base shadow">
                        🦊
                      </div>
                      <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded truncate">
                        Alex (You)
                      </span>
                    </div>

                    {/* Attendee 2 */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex flex-col justify-between p-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-bold uppercase">
                          Viewer
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-base shadow">
                        🚀
                      </div>
                      <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded truncate">
                        Maya
                      </span>
                    </div>

                    {/* Attendee 3 */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex flex-col justify-between p-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-bold uppercase">
                          Viewer
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-base shadow">
                        🍿
                      </div>
                      <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded truncate">
                        David
                      </span>
                    </div>

                    {/* Attendee 4 */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-[#080d10] border border-white/10 flex flex-col justify-between p-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-bold uppercase">
                          Viewer
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-base shadow">
                        ⚡
                      </div>
                      <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded truncate">
                        Elena
                      </span>
                    </div>
                  </div>

                  {/* Embedded Chat Preview in the Zoom Tab */}
                  <div className="p-3 bg-[#080d10] border-t border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9aa6af]">
                      <MessageSquare className="w-3 h-3 text-[#ff7a00]" />
                      <span>Party Chat</span>
                    </div>

                    <div className="space-y-1.5 max-h-[85px] overflow-y-auto">
                      {demoChat.map((m) => (
                        <div key={m.id} className="text-xs bg-[#141a1f] p-1.5 px-2.5 rounded-lg border border-white/5">
                          <span className="font-bold text-white mr-1.5">{m.user}:</span>
                          <span className="text-[#e9e9e9]">{m.text}</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendDemoChat} className="flex gap-1.5 mt-1">
                      <input
                        type="text"
                        placeholder="Say something to the room..."
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                        className="flex-1 bg-[#141a1f] text-xs px-2.5 py-1.5 rounded-lg text-white border border-white/10 focus:outline-none focus:border-[#ff7a00]"
                      />
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg bg-[#ff7a00] text-white hover:bg-[#ff9124] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-[#9aa6af]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ff7a00]" />
            <span className="font-semibold text-white">Direct P2P WebRTC Mesh</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">End-to-End Encrypted Feeds</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Supports Multiple Simultaneous Viewers</span>
          </div>
        </div>
      </div>
    </section>
  );
}

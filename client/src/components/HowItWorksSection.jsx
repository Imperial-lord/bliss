import React, { useState } from 'react';
import { Sparkles, Share2, Users, Check, Film, Radio } from 'lucide-react';

export default function HowItWorksSection() {
  const [copiedStep2, setCopiedStep2] = useState(false);

  const handleCopyDemoLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?room=cyber-cinema`).then(() => {
      setCopiedStep2(true);
      setTimeout(() => setCopiedStep2(false), 2200);
    });
  };

  const steps = [
    {
      num: '01',
      tag: 'STEP 01 • STAGING',
      title: 'Create Your Cinema Room',
      desc: 'Generate a private 6-character room code in one tap. Test your camera, adjust your microphone, and pick your cinema persona in the pre-call lobby.',
      icon: <Film className="w-6 h-6 text-[#ff7a00]" />,
      interactive: (
        <div className="mt-6 p-4 rounded-2xl bg-[#080d10] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9aa6af] font-mono">Room Code:</span>
            <span className="font-mono font-bold text-[#ff7a00] bg-[#ff7a00]/10 px-2.5 py-0.5 rounded-full border border-[#ff7a00]/30">
              CYBER-7
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px] text-[#9aa6af]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Camera & Mic Ready in Lobby</span>
          </div>
        </div>
      )
    },
    {
      num: '02',
      tag: 'STEP 02 • INVITE',
      title: 'Share the Instant Link',
      desc: 'Send your unique room link to friends over Discord, WhatsApp, or iMessage. No software downloads or extensions required—they just open their browser.',
      icon: <Share2 className="w-6 h-6 text-[#ff7a00]" />,
      interactive: (
        <div className="mt-6 p-4 rounded-2xl bg-[#080d10] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-[#e9e9e9] truncate max-w-[190px]">
              bliss.stream?room=cyber-7
            </span>
            <button
              onClick={handleCopyDemoLink}
              className="px-3 py-1 rounded-lg bg-[#1b2229] hover:bg-[#ff7a00] text-white text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 shrink-0"
            >
              {copiedStep2 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <span className="text-[10px] text-[#9aa6af] pt-1">
            Zero sign-up friction for guests
          </span>
        </div>
      )
    },
    {
      num: '03',
      tag: 'STEP 03 • CINEMA TIME',
      title: 'Watch & Talk in Sync',
      desc: 'Hit play! Sub-millisecond synchronization keeps everyone on the exact same frame. Talk over direct P2P video feeds on the right, react with emojis, and chat.',
      icon: <Users className="w-6 h-6 text-[#ff7a00]" />,
      interactive: (
        <div className="mt-6 p-4 rounded-2xl bg-[#080d10] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Synced Streaming</span>
            </span>
            <span className="text-[10px] text-[#ff7a00] font-bold uppercase">
              0ms Audio Drift
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#9aa6af]">
            <span>Zoom Video Sidebar</span>
            <div className="flex items-center gap-1 text-sm">
              <span>🍿</span>
              <span>🔥</span>
              <span>❤️</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#080d10] border-t border-white/5 relative font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#ff7a00]/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141a1f] border border-[#ff7a00]/30 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-4 shadow-glow-orange">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Effortless 30-Second Setup</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            How Bliss Works. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] via-[#ff9433] to-[#ff3d2e]">
              Three steps from zero to popcorn.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#9aa6af] font-sans">
            No complicated server setup, no Discord screen sharing lag, and no out-of-sync playback.
          </p>
        </div>

        {/* 3 Step Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative bg-[#12171c] hover:bg-[#161d23] border border-white/10 hover:border-[#ff7a00]/40 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-orange"
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-2xl bg-[#080d10] border border-white/10 group-hover:border-[#ff7a00]/40 transition-colors">
                    {step.icon}
                  </div>
                  <span className="font-display text-4xl font-extrabold text-white/15 group-hover:text-[#ff7a00]/30 transition-colors">
                    {step.num}
                  </span>
                </div>

                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#ff7a00] mb-2">
                  {step.tag}
                </span>

                <h3 className="font-display text-2xl font-bold text-white mb-2.5">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#9aa6af] leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Step Interactive Visual */}
              {step.interactive}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

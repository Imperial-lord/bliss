import React from 'react';
import { Video, Film, Zap, Users, Lock, Sparkles, Volume2, Shield } from 'lucide-react';

export default function FeaturesSection({ onOpenAuth }) {
  const features = [
    {
      num: '01',
      tag: 'WEBRTC MESH',
      title: 'Peer-to-Peer Encrypted Calling',
      desc: 'Crystal-clear video feeds connect directly between friends. No intermediary recording or media servers in the middle.',
      icon: <Video className="w-6 h-6 text-[#ff7a00]" />
    },
    {
      num: '02',
      tag: 'ZERO DRIFT',
      title: 'Simultaneous Cinema Sync',
      desc: 'Pause, play, and seek in unison. The Bliss signaling orchestrator keeps everyone on the exact same frame.',
      icon: <Film className="w-6 h-6 text-[#ff7a00]" />
    },
    {
      num: '03',
      tag: 'VERSATILITY',
      title: 'Dual Cinema & Mesh Modes',
      desc: 'Switch fluidly between Theater View (movie dominant + sidebar video) and Grid View (for after-movie deep discussions).',
      icon: <Users className="w-6 h-6 text-[#ff7a00]" />
    },
    {
      num: '04',
      tag: 'FIREBASE READY',
      title: 'Persistent Profiles & Circles',
      desc: 'Create your unique movie persona, save favorite genres, and get recognized across every watch party with Firebase.',
      icon: <Sparkles className="w-6 h-6 text-[#ff7a00]" />
    }
  ];

  return (
    <section id="features" className="py-24 bg-[#080d10] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141a1f] border border-[#ff7a00]/30 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-3">
              <span>Engineered For Movie Lovers</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Built for seamless <br />
              <span className="text-[#ff7a00]">social viewing.</span>
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#9aa6af] max-w-md font-sans">
            Say goodbye to "3, 2, 1, press play" over awkward discord calls. Bliss gives you the ultimate synchronized living room experience.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat) => (
            <div
              key={feat.num}
              className="group relative bg-[#12171c] hover:bg-[#182026] border border-white/5 hover:border-[#ff7a00]/40 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-orange flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-[#080d10] border border-white/10 group-hover:border-[#ff7a00]/40 transition-colors">
                    {feat.icon}
                  </div>
                  <span className="font-display text-3xl font-extrabold text-white/20 group-hover:text-[#ff7a00]/40 transition-colors">
                    {feat.num}
                  </span>
                </div>

                <div className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#ff7a00] mb-2">
                  {feat.tag}
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-3">
                  {feat.title}
                </h3>

                <p className="text-sm text-[#9aa6af] leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-white/50 group-hover:text-white transition-colors">
                <span>Explore Tech</span>
                <span className="text-[#ff7a00] group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Banner CTA */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-[#141a1f] via-[#1b2229] to-[#141a1f] border border-white/10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to start your first watch party?
            </h3>
            <p className="text-sm text-[#9aa6af] mt-2 max-w-xl">
              Create a free profile in 30 seconds, pick your avatar, and get instant access to private rooms.
            </p>
          </div>

          <button
            onClick={() => onOpenAuth('signup')}
            className="relative z-10 shrink-0 px-8 py-4 rounded-full bg-[#ff7a00] hover:bg-[#ff9124] text-white font-bold uppercase tracking-wider text-xs shadow-glow-orange hover:scale-105 transition-all"
          >
            Create Your Pass
          </button>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import HeroHeadline from './hero/HeroHeadline';
import HeroActionHub from './hero/HeroActionHub';
import TheaterStagePreview from './hero/TheaterStagePreview';

/**
 * Landing Hero section combining the LHS value proposition headline,
 * the RHS Action Hub (Host / Join with code), and the bottom interactive Theater Stage.
 *
 * @param {Object} props
 * @param {Function} props.onStartParty
 * @param {Function} props.onJoinWithCode
 * @param {Object} [props.currentUser]
 */
export default function LandingHero({ onStartParty, onJoinWithCode, currentUser }) {
  return (
    <section className="relative pt-8 pb-20 overflow-hidden font-sans">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-[#ff7a00]/15 via-[#ff3d2e]/10 to-transparent blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-4 w-[300px] h-[300px] bg-[#ff7a00]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SIDE-BY-SIDE HERO (LHS HEADLINE, RHS ACTION HUB) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 pb-6">
          <HeroHeadline />
          <HeroActionHub
            onStartParty={onStartParty}
            onJoinWithCode={onJoinWithCode}
            currentUser={currentUser}
          />
        </div>

        {/* BOTTOM INTERACTIVE THEATER STAGE PREVIEW */}
        <TheaterStagePreview onStartParty={onStartParty} />
      </div>
    </section>
  );
}

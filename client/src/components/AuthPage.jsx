import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthForm from './common/AuthForm';

/**
 * Dedicated full-page authentication view.
 *
 * @param {Object} props
 * @param {'signin'|'signup'} [props.initialMode]
 * @param {string} [props.notice]
 * @param {Function} props.onAuthSuccess
 * @param {Function} [props.onBack]
 */
export default function AuthPage({
  initialMode = 'signup',
  notice = '',
  onAuthSuccess,
  onBack
}) {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="min-h-screen bg-[#080d10] text-[#f1f5f9] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#ff7a00] selection:text-white relative overflow-hidden">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#ff7a00]/15 via-[#ff3d2e]/10 to-transparent blur-[160px] pointer-events-none rounded-full" />

      {/* Back button */}
      {onBack && (
        <div className="w-full max-w-4xl mb-4 relative z-10">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9aa6af] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      {/* Main Form Container */}
      <div className="relative w-full max-w-4xl bg-[#12171c]/95 border border-white/10 rounded-3xl shadow-2xl p-7 sm:p-10 z-10 backdrop-blur-xl">
        <AuthForm
          mode={mode}
          setMode={setMode}
          onAuthSuccess={onAuthSuccess}
          requiredNotice={notice}
        />
      </div>
    </div>
  );
}

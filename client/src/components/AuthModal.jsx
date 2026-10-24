import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AuthForm from './common/AuthForm';

/**
 * Centered modal dialog wrapper for user authentication.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {'signin'|'signup'} [props.initialMode]
 * @param {Function} props.onAuthSuccess
 * @param {string} [props.requiredNotice]
 */
export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
  requiredNotice = ''
}) {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSuccess = (profile) => {
    if (onAuthSuccess) onAuthSuccess(profile);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans selection:bg-[#ff7a00] selection:text-white">
      {/* Symmetrical Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#12171c]/95 border border-white/10 rounded-3xl shadow-2xl p-7 sm:p-10 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-20 cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <AuthForm
          mode={mode}
          setMode={setMode}
          onAuthSuccess={handleSuccess}
          requiredNotice={requiredNotice}
        />
      </div>
    </div>
  );
}

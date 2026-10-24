import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Film
} from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES } from '../../constants/avatars';
import { signUpUser, signInUser } from '../../services/userService';
import AvatarPicker from './AvatarPicker';
import GenrePicker from './GenrePicker';

/**
 * Reusable authentication form supporting Sign In and Sign Up modes.
 *
 * @param {Object} props
 * @param {'signin'|'signup'} props.mode - Current auth mode
 * @param {Function} props.setMode - Mode toggle callback
 * @param {Function} props.onAuthSuccess - Callback on successful auth with user profile
 * @param {string} [props.requiredNotice] - Optional notice message
 */
export default function AuthForm({
  mode = 'signup',
  setMode,
  onAuthSuccess,
  requiredNotice = ''
}) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_OPTIONS[0].id);
  const [selectedGenres, setSelectedGenres] = useState(['Sci-Fi & Cyberpunk', 'Action Thrillers']);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let profile;
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your display name.');
        }
        if (!email.trim() || !password.trim()) {
          throw new Error('Email and password are required.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        profile = await signUpUser({
          email,
          password,
          displayName,
          avatarId: selectedAvatarId,
          bio,
          favoriteGenres: selectedGenres
        });
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password.');
        }
        profile = await signInUser(email, password);
      }

      setLoading(false);
      if (onAuthSuccess) {
        onAuthSuccess(profile);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <div className="w-full">
      {/* Header Bar: Eyebrow + Title + Symmetrical 50/50 Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/10 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-2 border border-[#ff7a00]/30 shadow-glow-orange">
            <Sparkles className="w-3 h-3" />
            <span>Cinema Protocol</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'signup' ? 'Create Your Cinema Profile' : 'Welcome Back'}
          </h2>
          <p className="text-xs sm:text-sm text-[#9aa6af] mt-1 font-sans">
            {requiredNotice ||
              (mode === 'signup'
                ? 'Choose your cinema avatar persona, pick favorite genres, and host watch parties.'
                : 'Sign in to access your watch party rooms and sync playback with friends.')}
          </p>
        </div>

        {/* Symmetrical 50/50 Segmented Tab Control */}
        <div className="flex bg-[#0d1217] p-1.5 rounded-xl border border-white/10 w-64 shrink-0 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
            }}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all duration-150 ${
              mode === 'signin'
                ? 'bg-[#1b222a] text-white shadow-sm border border-white/[0.08]'
                : 'text-[#9aa6af] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all duration-150 ${
              mode === 'signup'
                ? 'bg-[#1b222a] text-white shadow-sm border border-white/[0.08]'
                : 'text-[#9aa6af] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form (Split Studio: Credentials on Left, Interactive Cinema Studio on Right) */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* PRIMARY INPUTS (6 COLS) */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{mode === 'signup' ? 'Account Credentials' : 'Sign In Details'}</span>
              </div>

              {/* Display Name (Only in Sign Up) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Display Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Captain Cinephile"
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                  />
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                />
              </div>

              {/* Bio / Tagline (Only in Sign Up) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                    Cinema Bio / Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Always bringing the popcorn"
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                  />
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Create Account & Enter' : 'Sign In to Bliss'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECONDARY STUDIO (6 COLS) */}
          <div className="md:col-span-6 bg-[#0d1217] p-5 sm:p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
            {mode === 'signup' ? (
              <div className="space-y-4">
                <AvatarPicker
                  selectedAvatarId={selectedAvatarId}
                  onSelectAvatar={setSelectedAvatarId}
                />
                <GenrePicker
                  selectedGenres={selectedGenres}
                  onToggleGenre={toggleGenre}
                />
              </div>
            ) : (
              /* Sign In Feature Value Showcase */
              <div className="space-y-4 flex flex-col justify-center h-full text-left py-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                  <Film className="w-3.5 h-3.5" />
                  <span>Why Join Bliss Watch Parties?</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#12171c] border border-white/5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold">Sub-Second Sync Engine</h4>
                      <p className="text-[11px] text-[#9aa6af] leading-relaxed">
                        Frame-accurate media synchronization keeps all viewers on the exact same frame.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#12171c] border border-white/5">
                    <Zap className="w-5 h-5 text-[#ff7a00] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold">Zoom-Style Video Calling</h4>
                      <p className="text-[11px] text-[#9aa6af] leading-relaxed">
                        High-definition WebRTC video feeds alongside the cinema stage with crystal clear audio.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#12171c] border border-white/5">
                    <Radio className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold">P2P Ephemeral Watch Rooms</h4>
                      <p className="text-[11px] text-[#9aa6af] leading-relaxed">
                        Zero server video storage. Secure, peer-to-peer data channels keep your watch parties private.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

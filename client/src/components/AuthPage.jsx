import React, { useState, useEffect } from 'react';
import {
  Film,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowLeft,
  Sparkles,
  Heart
} from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES } from '../constants/avatars';
import { signUpUser, signInUser } from '../services/userService';

export default function AuthPage({
  initialMode = 'signin',
  notice = '',
  onAuthSuccess,
  onBack
}) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_OPTIONS[0].id);
  const [selectedGenres, setSelectedGenres] = useState(['Sci-Fi & Cyberpunk', 'Action Thrillers']);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Synchronize when initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

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
      onAuthSuccess(profile);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080d10] text-[#e9e9e9] relative flex flex-col font-sans selection:bg-[#ff7a00] selection:text-white">
      {/* Subtle, restrained ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#ff7a00]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Clean Top Navigation */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b border-white/[0.06] bg-[#080d10]/80 backdrop-blur-md">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              BLISS
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]"></span>
            </span>
          </div>
        </a>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#9aa6af] hover:text-white border border-white/[0.08] text-xs font-semibold transition-all duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to cinema</span>
        </button>
      </header>

      {/* Main Centered Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[480px]">
          {/* Header info */}
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {mode === 'signup' ? 'Create your cinema profile' : 'Welcome back'}
            </h1>
            <p className="text-xs sm:text-sm text-[#9aa6af] mt-1.5 max-w-sm mx-auto">
              {notice || (
                mode === 'signup'
                  ? 'Join Bliss to host watch parties and sync cinema playback in real time.'
                  : 'Sign in to access your screening rooms and watch circles.'
              )}
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="flex bg-[#0f1419] p-1 rounded-xl border border-white/[0.08] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
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
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                mode === 'signup'
                  ? 'bg-[#1b222a] text-white shadow-sm border border-white/[0.08]'
                  : 'text-[#9aa6af] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Auth Card */}
          <div className="bg-[#10151a] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-xl">
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  {/* Persona Avatar Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#ff7a00]" />
                      <span>Choose Avatar Persona</span>
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_OPTIONS.map((avatar) => {
                        const isSelected = selectedAvatarId === avatar.id;
                        return (
                          <button
                            type="button"
                            key={avatar.id}
                            onClick={() => setSelectedAvatarId(avatar.id)}
                            title={avatar.name}
                            className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 ${
                              isSelected
                                ? 'bg-[#1a2129] border-[#ff7a00] shadow-sm ring-1 ring-[#ff7a00]/40'
                                : 'bg-[#0b0f13] border-white/[0.06] hover:border-white/20 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <span className="text-xl">{avatar.emoji}</span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff7a00] rounded-full flex items-center justify-center text-white">
                                <Check className="w-2 h-2 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#ff7a00]" />
                      <span>Display Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Miller"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f13] border border-white/[0.08] text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-colors text-sm font-sans"
                    />
                  </div>

                  {/* Tagline / Bio (Optional) */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                      Tagline / Bio <span className="text-[#9aa6af]/50 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Sci-Fi enthusiast & weekend director"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f13] border border-white/[0.08] text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-colors text-sm font-sans"
                    />
                  </div>

                  {/* Favorite Movie Genres */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-[#ff7a00]" />
                      <span>Favorite Genres</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {MOVIE_GENRES.map((genre) => {
                        const isSelected = selectedGenres.includes(genre);
                        return (
                          <button
                            type="button"
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/40'
                                : 'bg-[#0b0f13] text-[#9aa6af] border border-white/[0.06] hover:border-white/15 hover:text-white'
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#ff7a00]" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f13] border border-white/[0.08] text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-colors text-sm font-sans"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#ff7a00]" />
                  <span>Password {mode === 'signup' && '(min. 6 characters)'} *</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f13] border border-white/[0.08] text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-colors text-sm font-sans"
                />
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.99]"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : mode === 'signup' ? (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom footnote */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9aa6af]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firebase Authentication</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setError('');
                }}
                className="text-[#ff7a00] hover:text-[#ff9124] font-medium transition-colors"
              >
                {mode === 'signup' ? 'Already have an account? Sign in' : 'New to Bliss? Create profile'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-[11px] text-[#9aa6af]/50 border-t border-white/[0.04]">
        BLISS Cinema • P2P Real-Time Playback Synchronization
      </footer>
    </div>
  );
}

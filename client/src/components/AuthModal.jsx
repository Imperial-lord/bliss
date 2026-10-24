import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Sparkles,
  Heart,
  Ticket,
  Zap,
  Film
} from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES, GENRE_EMOJIS } from '../constants/avatars';
import { signUpUser, signInUser } from '../services/userService';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
  requiredNotice = ''
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

  // Always sync mode to initialMode whenever modal opens or initialMode prop changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];

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
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans selection:bg-[#ff7a00] selection:text-white">
      {/* Symmetrical Modal Card (Consistent max-w-4xl, Zero Dimension Jumping) */}
      <div className="relative w-full max-w-4xl bg-[#12171c]/95 border border-white/10 rounded-3xl shadow-2xl p-7 sm:p-10 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Bar: Eyebrow + Title + Symmetrical 50/50 Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 pr-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/10 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-2 border border-[#ff7a00]/30 shadow-glow-orange">
              <Sparkles className="w-3 h-3" />
              <span>Cinema Protocol</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {mode === 'signup' ? 'Create Your Cinema Profile' : 'Welcome Back'}
            </h2>
            <p className="text-xs sm:text-sm text-[#9aa6af] mt-1 font-sans">
              {requiredNotice || (
                mode === 'signup'
                  ? 'Choose your cinema avatar persona, pick favorite genres, and host watch parties.'
                  : 'Sign in to access your watch party rooms and sync playback with friends.'
              )}
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

        {/* Modal Form (Split Studio: Credentials on Left, Interactive Cinema Studio on Right) */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* ========================================================================= */}
            {/* PRIMARY INPUTS (PROMINENT, FIRST-CLASS - 6 COLS / 50%) */}
            {/* ========================================================================= */}
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
                    placeholder="alex@domain.com"
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Password {mode === 'signup' ? '(min. 6 characters)' : ''} *</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={mode === 'signup' ? 6 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                  />
                </div>

                {/* Tagline / Bio (Only in Sign Up) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                      Tagline / Bio <span className="text-[#9aa6af]/50 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Christopher Nolan enthusiast"
                      className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Primary Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Authenticating with Firebase...</span>
                  ) : mode === 'signup' ? (
                    <>
                      <span>Create Account & Enter Cinema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Sign In To Bliss</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECONDARY INTERACTIVE STUDIO (CINEMA PASS & TASTE - 6 COLS / 50%) */}
            {/* ========================================================================= */}
            <div className="md:col-span-6 flex flex-col justify-between bg-[#080d10]/60 p-6 rounded-2xl border border-white/5 space-y-5">
              {mode === 'signup' ? (
                <>
                  {/* Choose Cinema Avatar Persona */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#9aa6af] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" />
                        <span>Avatar Persona</span>
                      </label>
                      <span className="text-[11px] font-mono font-bold text-[#ff7a00] bg-[#ff7a00]/10 border border-[#ff7a00]/30 px-2.5 py-0.5 rounded-full">
                        {selectedAvatar.name}
                      </span>
                    </div>

                    {/* Circular Avatar Tokens */}
                    <div className="flex items-center justify-between gap-1 sm:gap-2 p-3 rounded-2xl bg-[#080d10] border border-white/5">
                      {AVATAR_OPTIONS.map((avatar) => {
                        const isSelected = selectedAvatarId === avatar.id;
                        return (
                          <button
                            type="button"
                            key={avatar.id}
                            onClick={() => setSelectedAvatarId(avatar.id)}
                            title={avatar.name}
                            className="group relative flex flex-col items-center focus:outline-none transition-transform"
                          >
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${avatar.bg} flex items-center justify-center text-lg sm:text-xl shadow-md transition-all duration-200 ${
                                isSelected
                                  ? 'ring-2 ring-[#ff7a00] ring-offset-2 ring-offset-[#080d10] scale-110 shadow-glow-orange'
                                  : 'opacity-50 group-hover:opacity-100 group-hover:scale-105'
                              }`}
                            >
                              {avatar.emoji}
                            </div>
                            <span
                              className={`text-[10px] font-medium mt-1.5 transition-colors ${
                                isSelected ? 'text-[#ff7a00] font-bold' : 'text-[#9aa6af]/70 group-hover:text-white'
                              }`}
                            >
                              {avatar.name.split(' ')[0]}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-0.5 w-4 h-4 bg-[#ff7a00] rounded-full flex items-center justify-center text-white shadow">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Favorite Movie Genres (Organic Cinema Badge Cloud) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#9aa6af] flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#ff7a00]" />
                        <span>Favorite Genres</span>
                      </label>
                      <span className="text-[11px] font-mono text-[#9aa6af]">
                        {selectedGenres.length} selected
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
                      {MOVIE_GENRES.map((genre, idx) => {
                        const isSelected = selectedGenres.includes(genre);
                        const emoji = GENRE_EMOJIS[genre] || '🎬';
                        const tilt = idx % 3 === 0 ? 'hover:-rotate-1' : idx % 3 === 1 ? 'hover:rotate-1' : 'hover:-rotate-0.5';
                        return (
                          <button
                            type="button"
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={`group relative px-3 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${tilt} ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#ff7a00]/25 via-[#ff3d2e]/20 to-[#ff7a00]/15 text-white border border-[#ff7a00]/60 shadow-glow-orange/30 font-semibold scale-[1.02]'
                                : 'bg-[#0d1217] text-[#9aa6af] hover:text-white hover:bg-[#141b22] border border-white/10 hover:border-white/20 hover:-translate-y-0.5'
                            }`}
                          >
                            <span className="text-xs sm:text-sm shrink-0 group-hover:scale-110 transition-transform">
                              {emoji}
                            </span>
                            <span className="tracking-tight">{genre}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-[#ff7a00] stroke-[3] shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-white/15 group-hover:bg-white/40 shrink-0 transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Cinema Pass Summary Strip */}
                  <div className="p-3.5 rounded-2xl bg-[#080d10] border border-white/10 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full ${selectedAvatar.bg} flex items-center justify-center text-lg shadow-sm shrink-0 border border-white/20`}
                      >
                        {selectedAvatar.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase text-[#ff7a00] font-bold">
                          <Ticket className="w-3 h-3" />
                          <span>Live Cinema Pass</span>
                        </div>
                        <div className="font-display text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                          {displayName.trim() || 'Your Display Name'}
                        </div>
                        <div className="text-[10px] text-[#9aa6af] truncate">
                          {selectedAvatar.name} • {selectedGenres.slice(0, 2).join(', ') || 'All Movies'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                      P2P READY
                    </span>
                  </div>
                </>
              ) : (
                /* SIGN-IN CINEMA VIP TICKET STUB */
                <div className="h-full flex flex-col justify-between py-2">
                  <div className="p-6 rounded-2xl bg-[#12171c] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#ff7a00]/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[#ff7a00] font-bold">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>VIP Pass Entry</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        P2P READY
                      </span>
                    </div>

                    <div className="flex items-center gap-4 my-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center text-3xl shadow-glow-orange shrink-0">
                        🍿
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-bold text-white tracking-tight">
                          Instant Cinema Sync
                        </h4>
                        <p className="text-xs text-[#9aa6af] mt-1 leading-relaxed">
                          Sign in to jump back into active watch parties and stream live movies with your friends.
                        </p>
                      </div>
                    </div>

                    {/* Equalizer Soundwave Indicator */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#9aa6af] font-mono">
                      <span>AUDIO SYNC PROTOCOL</span>
                      <div className="flex items-center gap-1.5 h-4">
                        {[60, 100, 45, 85, 55, 95, 70].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
                            className="w-1 bg-[#ff7a00] rounded-full animate-pulse"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#9aa6af] px-1 pt-4">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#ff7a00]" />
                      <span>Sub-second WebRTC Sync</span>
                    </span>
                    <span>Zero Cloud Recordings</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Bottom Footnote */}
        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-[#9aa6af]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secured with Firebase Authentication</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError('');
            }}
            className="text-[#ff7a00] hover:text-[#ff9124] font-bold text-xs uppercase tracking-wider transition-colors"
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : 'New to Bliss? Create profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

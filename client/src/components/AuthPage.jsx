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
  Heart,
  Ticket,
  Zap,
  Radio
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
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080d10] text-[#e9e9e9] relative flex flex-col font-sans selection:bg-[#ff7a00] selection:text-white overflow-x-hidden">
      {/* Funky Ambient Cinema Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] bg-[#ff7a00]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#ff3d2e]/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[360px] bg-[#ff7a00]/[0.06] rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Ambient Cinema Emojis (Funky Background Details) */}
      <div className="hidden md:block pointer-events-none select-none">
        <span className="absolute top-24 left-[8%] text-3xl opacity-35 animate-gentle-float">
          🍿
        </span>
        <span className="absolute top-36 right-[9%] text-2xl opacity-35 animate-gentle-float" style={{ animationDelay: '1.2s' }}>
          ⚡
        </span>
        <span className="absolute bottom-24 left-[7%] text-2xl opacity-35 animate-gentle-float" style={{ animationDelay: '2s' }}>
          🎬
        </span>
        <span className="absolute bottom-28 right-[8%] text-3xl opacity-35 animate-gentle-float" style={{ animationDelay: '0.8s' }}>
          🔥
        </span>
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-4 flex items-center justify-between border-b border-white/5 bg-[#080d10]/80 backdrop-blur-xl shrink-0">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center shadow-glow-orange group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-2xl tracking-tight text-white flex items-center gap-1">
              BLISS
              <span className="w-2 h-2 rounded-full bg-[#ff7a00] inline-block animate-pulse"></span>
            </span>
            <span className="text-[10px] tracking-widest uppercase text-[#9aa6af] font-medium -mt-1 font-sans">
              Watch & Connect
            </span>
          </div>
        </a>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141a1f] hover:bg-[#1b2229] text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all duration-150 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to cinema</span>
        </button>
      </header>

      {/* Main Centered Content (Spacious, Wide max-w-3xl) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-3xl">
          {/* Header Title & Subtitle + Even Segmented Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/10 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-1.5 border border-[#ff7a00]/30 shadow-glow-orange">
                <Sparkles className="w-3 h-3" />
                <span>Cinema Passport</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {mode === 'signup' ? 'Create Your Cinema Profile' : 'Welcome Back'}
              </h1>
              <p className="text-xs text-[#9aa6af] mt-1 font-sans">
                {notice || (
                  mode === 'signup'
                    ? 'Choose your cinema avatar persona, pick favorite genres, and host watch parties.'
                    : 'Sign in to access your watch party rooms and sync playback with friends.'
                )}
              </p>
            </div>

            {/* Symmetrical, Even-Width Segmented Tab Switcher */}
            <div className="flex bg-[#080d10] p-1 rounded-xl border border-white/10 w-64 shrink-0 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] text-white shadow-glow-orange scale-[1.02]'
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
                className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] text-white shadow-glow-orange scale-[1.02]'
                    : 'text-[#9aa6af] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Wide Auth Card (Symmetrical, Glassmorphism, Zero-Scrollbar) */}
          <div className="bg-[#12171c]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                /* WIDE TWO-COLUMN SIGN-UP FORM (Zero Vertical Scroll) */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Column 1: Persona & Identity */}
                    <div className="space-y-3.5 bg-[#080d10]/60 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Persona & Identity</span>
                      </div>

                      {/* Avatar Selector with full gradients, emojis & names */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                          Choose Cinema Avatar
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {AVATAR_OPTIONS.map((avatar) => {
                            const isSelected = selectedAvatarId === avatar.id;
                            return (
                              <button
                                type="button"
                                key={avatar.id}
                                onClick={() => setSelectedAvatarId(avatar.id)}
                                className={`relative flex flex-col items-center justify-center p-1.5 rounded-2xl border transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-[#1b2229] border-[#ff7a00] scale-105 shadow-glow-orange z-10'
                                    : 'bg-[#080d10] border-white/5 hover:border-white/20 opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-full ${avatar.bg} flex items-center justify-center text-sm shadow-md`}
                                >
                                  {avatar.emoji}
                                </div>
                                <span className="text-[9px] font-bold text-white mt-1 truncate max-w-[46px]">
                                  {avatar.name.split(' ')[0]}
                                </span>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff7a00] rounded-full flex items-center justify-center text-white shadow">
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
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#ff7a00]" />
                          <span>Display Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Captain Cinephile"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                        />
                      </div>

                      {/* Tagline / Bio (Optional) */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1">
                          Tagline / Bio
                        </label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="e.g. Christopher Nolan enthusiast"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                        />
                      </div>
                    </div>

                    {/* Column 2: Taste & Credentials */}
                    <div className="space-y-3.5 bg-[#080d10]/60 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                        <Film className="w-3.5 h-3.5" />
                        <span>Taste & Credentials</span>
                      </div>

                      {/* Favorite Movie Genres (2-Column Grid) */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-[#ff7a00]" />
                          <span>Favorite Genres</span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {MOVIE_GENRES.map((genre) => {
                            const isSelected = selectedGenres.includes(genre);
                            return (
                              <button
                                type="button"
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all text-center truncate ${
                                  isSelected
                                    ? 'bg-[#ff7a00]/20 text-[#ff7a00] border border-[#ff7a00]/50 shadow-glow-orange/30'
                                    : 'bg-[#080d10] text-[#9aa6af] border border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                                title={genre}
                              >
                                {genre}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#ff7a00]" />
                          <span>Email Address *</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@domain.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1 flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-[#ff7a00]" />
                          <span>Password (min. 6 chars) *</span>
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? (
                      <span>Creating Cinema Account...</span>
                    ) : (
                      <>
                        <span>Create Account & Enter Cinema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* WIDE BALANCED SIGN-IN FORM (Funky VIP Ticket Stub Layout) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center py-2">
                  {/* Left Column: Funky VIP Cinema Ticket Stub */}
                  <div className="h-full flex flex-col justify-between p-5 bg-[#080d10]/70 rounded-2xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff7a00]/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[#ff7a00] font-bold">
                          <Ticket className="w-3.5 h-3.5" />
                          <span>VIP Pass Entry</span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          P2P READY
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 my-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center text-2xl shadow-glow-orange shrink-0">
                          🍿
                        </div>
                        <div>
                          <h4 className="font-display text-base font-bold text-white tracking-tight">
                            Live Watch Circles
                          </h4>
                          <p className="text-[11px] text-[#9aa6af] mt-0.5">
                            Sync movie night with friends in real-time
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Equalizer Soundwave Indicator */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#9aa6af] font-mono">
                      <span>AUDIO SYNC LATENCY</span>
                      <div className="flex items-center gap-1 h-3">
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

                  {/* Right Column: Credentials Form */}
                  <div className="space-y-3.5">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#ff7a00]" />
                        <span>Email Address *</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@domain.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#ff7a00]" />
                        <span>Password *</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading ? (
                        <span>Signing In...</span>
                      ) : (
                        <>
                          <span>Sign In To Bliss</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Bottom Footnote */}
            <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-[#9aa6af]">
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
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-3 text-center text-[11px] text-[#9aa6af]/40 border-t border-white/5">
        BLISS Cinema • P2P Real-Time Playback Synchronization
      </footer>
    </div>
  );
}

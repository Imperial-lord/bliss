import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Heart,
  ArrowLeft,
  Tv,
  Volume2,
  Zap,
  Flame,
  Radio
} from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES } from '../constants/avatars';
import { signUpUser, signInUser } from '../services/userService';

export default function AuthPage({
  initialMode = 'signup',
  notice = '',
  onAuthSuccess,
  onBack
}) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(AVATAR_OPTIONS[0].id);
  const [selectedGenres, setSelectedGenres] = useState(['Sci-Fi & Cyberpunk', 'Action Thrillers']);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Floating ambient reactions
  const [floatingEmojis, setFloatingEmojis] = useState([
    { id: 1, emoji: '🍿', x: '18%', y: '25%', delay: '0s' },
    { id: 2, emoji: '⚡', x: '78%', y: '18%', delay: '1.2s' },
    { id: 3, emoji: '🔥', x: '35%', y: '65%', delay: '2.5s' },
    { id: 4, emoji: '✨', x: '82%', y: '72%', delay: '0.8s' }
  ]);

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
          throw new Error('Email and password are required to create your account.');
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
    <div className="min-h-screen bg-[#080d10] text-[#e9e9e9] relative overflow-hidden flex flex-col font-sans selection:bg-[#ff7a00] selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#ff7a00]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-[#ff3d2e]/10 blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b border-white/5 bg-[#080d10]/60 backdrop-blur-md">
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all duration-150 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cinema</span>
        </button>
      </header>

      {/* Main Cinema Split Stage */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:p-12 gap-8 items-center">
        {/* LEFT COLUMN: Funky Interactive Cinema Canvas (5 Cols) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full py-4 pr-4">
          <div>
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/30 text-[#ff7a00] text-xs font-bold uppercase tracking-wider mb-5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Cinema Protocol</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              The Living Room <br />
              <span className="bg-gradient-to-r from-[#ff7a00] via-[#ff9124] to-[#ff3d2e] bg-clip-text text-transparent">
                Is Now Infinite.
              </span>
            </h1>

            <p className="mt-4 text-sm text-[#9aa6af] leading-relaxed max-w-md">
              Synchronize cinema playback with your circle in ultra-low latency P2P WebRTC. Zero cloud recording, zero stored chats—just pure movie magic.
            </p>
          </div>

          {/* Interactive Cinema Projection Billboard */}
          <div className="relative my-8 rounded-3xl overflow-hidden border border-white/10 bg-[#12171c]/90 shadow-2xl p-6 group">
            {/* Soft Ambient Video Glow in background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080d10] via-transparent to-transparent z-10" />

            <video
              src="/videos/odyssey-trailer-clip.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 transition-opacity duration-700 pointer-events-none"
            />

            {/* Floating Persona Billboard Card */}
            <div className="relative z-20 flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl ${selectedAvatar.bg} flex items-center justify-center text-3xl shadow-glow-orange border border-white/30 shrink-0 transform group-hover:scale-105 transition-transform duration-300`}
              >
                {selectedAvatar.emoji}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff7a00]">
                  Active Persona
                </span>
                <h3 className="font-display text-xl font-bold text-white tracking-tight">
                  {selectedAvatar.name}
                </h3>
                <p className="text-xs text-[#9aa6af] mt-0.5">
                  Ready to host watch party circles
                </p>
              </div>
            </div>

            {/* Animated Equalizer Bars */}
            <div className="relative z-20 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#9aa6af]">
              <span className="font-mono text-[11px] tracking-wider uppercase text-white/70">
                P2P Audio Sync
              </span>
              <div className="flex items-center gap-1 h-3.5">
                {[60, 100, 40, 80, 50, 90, 70].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}%`, animationDelay: `${i * 0.15}s` }}
                    className="w-1 bg-[#ff7a00] rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Floating Live Reaction Badges */}
            {floatingEmojis.map((item) => (
              <span
                key={item.id}
                style={{ top: item.y, left: item.x, animationDelay: item.delay }}
                className="absolute text-xl z-20 animate-bounce pointer-events-none drop-shadow-lg opacity-80"
              >
                {item.emoji}
              </span>
            ))}
          </div>

          {/* Feature Badges */}
          <div className="flex items-center gap-6 text-xs text-[#9aa6af]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#ff7a00]" />
              <span>Sub-200ms Latency</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Firebase Verified</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Glassmorphic Auth Deck (7 Cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-2xl bg-[#12171c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl relative">
            {/* Tab Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 pb-5 border-b border-white/5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {mode === 'signup' ? 'Create Your Cinema Account' : 'Welcome Back'}
                </h2>
                <p className="text-xs text-[#9aa6af] mt-1">
                  {notice || (
                    mode === 'signup'
                      ? 'Choose your cinema avatar, tailor your favorite genres, and host watch parties.'
                      : 'Sign in to access private rooms and sync playback with friends.'
                  )}
                </p>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="flex bg-[#080d10] p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                      : 'text-[#9aa6af] hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                      : 'text-[#9aa6af] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                /* TWO EQUAL TILES FOR SIGN UP */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                    {/* Tile 1: Persona & Identity */}
                    <div className="h-full flex flex-col justify-between bg-[#080d10]/50 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Persona & Identity</span>
                      </div>

                      {/* Choose Avatar */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2">
                          Choose Persona Avatar
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {AVATAR_OPTIONS.map((avatar) => {
                            const isSelected = selectedAvatarId === avatar.id;
                            return (
                              <button
                                type="button"
                                key={avatar.id}
                                onClick={() => setSelectedAvatarId(avatar.id)}
                                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-[#1b2229] border-[#ff7a00] scale-105 shadow-glow-orange'
                                    : 'bg-[#080d10] border-white/5 hover:border-white/20 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-full ${avatar.bg} flex items-center justify-center text-base shadow-md`}
                                >
                                  {avatar.emoji}
                                </div>
                                <span className="text-[10px] font-medium text-white mt-1 truncate max-w-[50px]">
                                  {avatar.name.split(' ')[0]}
                                </span>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff7a00] rounded-full flex items-center justify-center text-white">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#ff7a00]" />
                          <span>Display Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Captain Cinephile"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                        />
                      </div>

                      {/* Tagline / Bio */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                          Tagline / Bio
                        </label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="e.g. Christopher Nolan enthusiast"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                        />
                      </div>
                    </div>

                    {/* Tile 2: Taste & Credentials */}
                    <div className="h-full flex flex-col justify-between bg-[#080d10]/50 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                        <Film className="w-3.5 h-3.5" />
                        <span>Taste & Credentials</span>
                      </div>

                      {/* Favorite Movie Genres - Clean 2-column grid */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2 flex items-center gap-1.5">
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
                                className={`px-2.5 py-2 rounded-xl text-[11px] font-medium transition-all text-center truncate ${
                                  isSelected
                                    ? 'bg-[#ff7a00]/20 text-[#ff7a00] border border-[#ff7a00]/50 shadow-sm'
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

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#ff7a00]" />
                          <span>Email Address *</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@domain.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
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
                      <span>Authenticating with Firebase...</span>
                    ) : (
                      <>
                        <span>Create Account & Enter Cinema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* FOCUSED SIGN-IN FORM */
                <div className="space-y-5 max-w-md mx-auto py-4">
                  {/* Persona Greeting Avatar */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#080d10]/60 border border-white/5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center text-xl shadow-glow-orange">
                      🍿
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Your Cinema Pass Awaits</p>
                      <p className="text-[11px] text-[#9aa6af]">Sign in to resume watching with friends</p>
                    </div>
                  </div>

                  {/* Email */}
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
                      className="w-full px-4 py-3 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
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
                      className="w-full px-4 py-3 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? (
                      <span>Authenticating with Firebase...</span>
                    ) : (
                      <>
                        <span>Sign In To Bliss</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>

            <div className="mt-7 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-[#9aa6af]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secured with Firebase Authentication</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

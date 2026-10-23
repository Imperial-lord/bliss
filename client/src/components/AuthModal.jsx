import React, { useState, useEffect } from 'react';
import { X, Sparkles, Film, Check, ArrowRight, ShieldCheck, Lock, Mail, User, Heart } from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES } from '../constants/avatars';
import { signUpUser, signInUser } from '../services/userService';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
  requiredNotice = ''
}) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
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
          avatarId: selectedAvatar,
          bio,
          favoriteGenres: selectedGenres
        });
      } else if (mode === 'signin') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full ${mode === 'signup' ? 'max-w-3xl' : 'max-w-lg'} bg-[#12171c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[92vh] overflow-y-auto transition-all duration-200`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Create Your Cinema Account' : 'Welcome Back'}
          </h2>

          <p className="text-xs sm:text-sm text-[#9aa6af] mt-1 font-sans">
            {requiredNotice || (
              mode === 'signup'
                ? 'Sign up to create private rooms, join live watch parties, and sync playback.'
                : 'Sign in to access your watch party circles and profile.'
            )}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#080d10] p-1 rounded-xl mb-6 border border-white/5 max-w-sm">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
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
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                : 'text-[#9aa6af] hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            /* WIDE TWO-COLUMN SIGN-UP FORM WITH BALANCED TILES */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Column 1: Persona & Identity */}
                <div className="h-full flex flex-col bg-[#080d10]/40 p-4 sm:p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00] mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Persona & Identity</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-3.5">
                    {/* Choose Persona Avatar */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2">
                        Choose Cinema Avatar
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {AVATAR_OPTIONS.map((avatar) => {
                          const isSelected = selectedAvatar === avatar.id;
                          return (
                            <button
                              type="button"
                              key={avatar.id}
                              onClick={() => setSelectedAvatar(avatar.id)}
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

                    {/* Bio / Tagline */}
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
                </div>

                {/* Column 2: Cinema Taste & Account Credentials */}
                <div className="h-full flex flex-col bg-[#080d10]/40 p-4 sm:p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00] mb-4">
                    <Film className="w-3.5 h-3.5" />
                    <span>Taste & Credentials</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-3.5">
                    {/* Favorite Movie Genres - Decluttered 2-Column Grid */}
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
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* CLEAN FOCUSED SIGN-IN FORM */
            <div className="space-y-4 max-w-md mx-auto">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
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

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-[#9aa6af]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured with Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
}

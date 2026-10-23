import React, { useState } from 'react';
import { X, Sparkles, Film, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES } from '../constants/avatars';
import { signUpUser, signInUser, createQuickProfile } from '../services/userService';

export default function AuthModal({ isOpen, onClose, initialMode = 'signup', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin' | 'quick'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [selectedGenres, setSelectedGenres] = useState(['Sci-Fi & Cyberpunk', 'Action Thrillers']);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          // If no password provided, create quick cinema profile
          profile = await createQuickProfile({
            displayName,
            avatarId: selectedAvatar,
            bio,
            favoriteGenres: selectedGenres
          });
        } else {
          profile = await signUpUser({
            email,
            password,
            displayName,
            avatarId: selectedAvatar,
            bio,
            favoriteGenres: selectedGenres
          });
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#12171c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/30 text-[#ff7a00] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bliss Cinema Pass</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Create Your Cinema Profile' : 'Welcome Back'}
          </h2>
          <p className="text-xs sm:text-sm text-[#9aa6af] mt-1 font-sans">
            {mode === 'signup'
              ? 'Personalize your watch party persona and join synced streams.'
              : 'Sign in to access your favorite rooms and movie circles.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#080d10] p-1 rounded-xl mb-6 border border-white/5">
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
            Create Profile
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
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <>
              {/* Choose Persona Avatar */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-2.5">
                  Choose Cinema Persona
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.id;
                    return (
                      <button
                        type="button"
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-150 ${
                          isSelected
                            ? 'bg-[#1b2229] border-[#ff7a00] scale-105 shadow-glow-orange'
                            : 'bg-[#080d10] border-white/5 hover:border-white/20 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full ${avatar.bg} flex items-center justify-center text-lg shadow-md`}
                        >
                          {avatar.emoji}
                        </div>
                        <span className="text-[10px] font-medium text-white mt-1.5 truncate max-w-[50px]">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Captain Cinephile"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                />
              </div>

              {/* Favorite Movie Genres */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-2">
                  Favorite Genres
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOVIE_GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#ff7a00]/20 text-[#ff7a00] border border-[#ff7a00]/50'
                            : 'bg-[#080d10] text-[#9aa6af] border border-white/5 hover:border-white/20'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tagline / Bio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                  Bio / Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Always up for a Christopher Nolan marathon"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
              Email {mode === 'signup' && <span className="text-[#9aa6af]/60 font-normal">(Optional for instant pass)</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@domain.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
              Password {mode === 'signup' && <span className="text-[#9aa6af]/60 font-normal">(Optional)</span>}
            </label>
            <input
              type="password"
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
            className="w-full py-3.5 px-4 rounded-xl bg-[#ff7a00] hover:bg-[#ff9124] disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <span>Saving Profile...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Launch Profile & Watch</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In To Bliss</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-[#9aa6af]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Synced with Firebase DB (Project: bliss-watchparty)</span>
        </div>
      </div>
    </div>
  );
}

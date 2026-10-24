import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Heart,
  LogOut,
  Edit3,
  Check,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Ticket,
  Film,
  Zap,
  User
} from 'lucide-react';
import { AVATAR_OPTIONS, MOVIE_GENRES, GENRE_EMOJIS } from '../constants/avatars';
import { updateUserProfile } from '../services/userService';

export default function UserProfileModal({ isOpen, onClose, user, onSignOut, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Synchronize internal state whenever user changes or modal opens
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarId(user.avatarId || AVATAR_OPTIONS[0].id);
      setBio(user.bio || '');
      setFavoriteGenres(user.favoriteGenres || []);
      setIsEditing(false);
      setError('');
      setSuccessMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const currentAvatar = AVATAR_OPTIONS.find((a) => a.id === (isEditing ? avatarId : user.avatarId)) || AVATAR_OPTIONS[0];

  const toggleGenre = (genre) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const updated = await updateUserProfile({
        displayName: displayName.trim(),
        avatarId,
        bio: bio.trim(),
        favoriteGenres
      });

      if (onUpdateProfile) {
        onUpdateProfile(updated);
      }

      setSuccessMsg('Profile updated successfully.');
      setIsSaving(false);
      setIsEditing(false);

      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setIsSaving(false);
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setDisplayName(user.displayName || '');
    setAvatarId(user.avatarId || AVATAR_OPTIONS[0].id);
    setBio(user.bio || '');
    setFavoriteGenres(user.favoriteGenres || []);
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans selection:bg-[#ff7a00] selection:text-white">
      {/* Symmetrical Modal Card (Consistent max-w-4xl across all modals) */}
      <div className="relative w-full max-w-4xl bg-[#12171c]/95 border border-white/10 rounded-3xl shadow-2xl p-7 sm:p-10 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-7 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/10 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-2 border border-[#ff7a00]/30 shadow-glow-orange">
            <Sparkles className="w-3 h-3" />
            <span>Cinema Passport</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditing ? 'Edit Cinema Profile' : 'Cinema Profile'}
          </h2>
          <p className="text-xs sm:text-sm text-[#9aa6af] mt-1 font-sans">
            {isEditing
              ? 'Update your cinema avatar persona, bio, and favorite genres.'
              : 'Your verified watch party credentials and streaming circle identity.'}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* READ-ONLY VIEW MODE (TWO-COLUMN SYMMETRICAL max-w-4xl) */}
        {/* ========================================================================= */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Identity & Actions (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-[#080d10]/60 p-6 rounded-2xl border border-white/5 text-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-24 h-24 rounded-2xl ${currentAvatar.bg} flex items-center justify-center text-4xl shadow-glow-orange border-2 border-white/20`}
                >
                  {currentAvatar.emoji}
                </div>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-xs font-bold uppercase tracking-wider mb-2 border border-[#ff7a00]/30 shadow-glow-orange/30">
                    <Sparkles className="w-3 h-3" />
                    <span>{currentAvatar.name}</span>
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {user.displayName}
                  </h3>
                  {user.email && (
                    <p className="text-xs sm:text-sm text-[#9aa6af] flex items-center justify-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user.email}</span>
                    </p>
                  )}
                  {user.bio ? (
                    <p className="text-xs sm:text-sm text-[#e9e9e9] italic mt-3 max-w-xs mx-auto">
                      "{user.bio}"
                    </p>
                  ) : (
                    <p className="text-xs text-[#9aa6af]/50 italic mt-2.5">
                      No bio set yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-7 pt-5 border-t border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Right Column: Cinema Pass Details & Favorite Genres (7 Cols) */}
            <div className="md:col-span-7 flex flex-col justify-between bg-[#080d10]/60 p-6 rounded-2xl border border-white/5 space-y-5">
              {/* VIP Pass Summary */}
              <div className="p-5 rounded-2xl bg-[#12171c] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[#ff7a00] font-bold">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Active Cinema Pass</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    VERIFIED
                  </span>
                </div>
                <h4 className="font-display text-base font-bold text-white tracking-tight">
                  Unlimited Watch Party Access
                </h4>
                <p className="text-xs text-[#9aa6af] mt-1">
                  Direct P2P WebRTC streaming with zero cloud recording
                </p>
              </div>

              {/* Favorite Genres */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-3 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Favorite Genres ({user.favoriteGenres?.length || 0})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
                    user.favoriteGenres.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1.5 rounded-full bg-[#12171c] border border-white/10 text-xs font-medium text-white/90 shadow-sm flex items-center gap-1.5"
                      >
                        <span className="text-xs">{GENRE_EMOJIS[g] || '🎬'}</span>
                        <span>{g}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#9aa6af]/50 italic">
                      All movie genres
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Protocol Notice */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#9aa6af]">
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Sub-second WebRTC Sync</span>
                </span>
                <span className="font-mono text-[10px] text-white/50">SECURED P2P</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* EDIT MODE (TWO-COLUMN SYMMETRICAL max-w-4xl) */
          /* ========================================================================= */
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch animate-fade-in">
            {/* Left Column: Name, Bio & Action Buttons (6 Cols) */}
            <div className="md:col-span-6 flex flex-col justify-between bg-[#080d10]/60 p-6 rounded-2xl border border-white/5 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff7a00]">
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Details</span>
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
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                  />
                </div>

                {/* Tagline / Bio */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                    Tagline / Bio
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Christopher Nolan enthusiast & movie lover"
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 transition-all text-sm font-sans"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Avatar Persona & Favorite Genres (6 Cols) */}
            <div className="md:col-span-6 flex flex-col justify-between bg-[#080d10]/60 p-6 rounded-2xl border border-white/5 space-y-5">
              {/* Avatar Selector */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9aa6af] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Avatar Persona</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#ff7a00] bg-[#ff7a00]/10 border border-[#ff7a00]/30 px-2.5 py-0.5 rounded-full">
                    {currentAvatar.name}
                  </span>
                </div>

                {/* Circular Avatar Tokens */}
                <div className="grid grid-cols-6 justify-items-center items-center py-3.5 px-2 sm:px-3 rounded-2xl bg-[#080d10] border border-white/5">
                  {AVATAR_OPTIONS.map((avatar) => {
                    const isSelected = avatarId === avatar.id;
                    return (
                      <button
                        type="button"
                        key={avatar.id}
                        onClick={() => setAvatarId(avatar.id)}
                        className="group relative flex flex-col items-center focus:outline-none"
                      >
                        <div className="relative">
                          <div
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${avatar.bg} flex items-center justify-center text-lg shadow-md transition-all duration-150 ${
                              isSelected
                                ? 'ring-2 ring-[#ff7a00] shadow-glow-orange opacity-100'
                                : 'opacity-50 group-hover:opacity-100 group-hover:ring-1 group-hover:ring-white/20'
                            }`}
                          >
                            {avatar.emoji}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff7a00] rounded-full flex items-center justify-center text-white shadow-md z-10">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium mt-1.5 transition-colors ${
                            isSelected ? 'text-[#ff7a00] font-bold' : 'text-[#9aa6af]/70 group-hover:text-white'
                          }`}
                        >
                          {avatar.name.split(' ')[0]}
                        </span>
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
                    {favoriteGenres.length} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
                  {MOVIE_GENRES.map((genre, idx) => {
                    const isSelected = favoriteGenres.includes(genre);
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

              {/* Footer Note */}
              <div className="p-3 rounded-xl bg-[#080d10] border border-white/5 flex items-center justify-between text-xs text-[#9aa6af]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3 h-3 text-[#ff7a00]" />
                  <span>Personalized Cinema Passport</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">SAVED TO FIREBASE</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

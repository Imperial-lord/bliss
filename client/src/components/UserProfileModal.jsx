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
import { AVATAR_OPTIONS, MOVIE_GENRES } from '../constants/avatars';
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
      {/* Symmetrical Modal Card (Consistent max-w-3xl across all modals) */}
      <div className="relative w-full max-w-3xl bg-[#12171c]/95 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/10 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-1.5 border border-[#ff7a00]/30 shadow-glow-orange">
            <Sparkles className="w-3 h-3" />
            <span>Cinema Passport</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditing ? 'Edit Cinema Profile' : 'Cinema Profile'}
          </h2>
          <p className="text-xs text-[#9aa6af] mt-0.5 font-sans">
            {isEditing
              ? 'Update your cinema avatar persona, bio, and favorite genres.'
              : 'Your verified watch party credentials and streaming circle identity.'}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* READ-ONLY VIEW MODE (TWO-COLUMN SYMMETRICAL max-w-3xl) */}
        {/* ========================================================================= */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Identity & Actions (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-[#080d10]/60 p-5 rounded-2xl border border-white/5 text-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-2xl ${currentAvatar.bg} flex items-center justify-center text-3xl shadow-glow-orange border-2 border-white/20`}
                >
                  {currentAvatar.emoji}
                </div>

                <div className="mt-3.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#ff7a00]/30 shadow-glow-orange/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{currentAvatar.name}</span>
                  </span>
                  <h3 className="font-display text-xl font-bold text-white tracking-tight">
                    {user.displayName}
                  </h3>
                  {user.email && (
                    <p className="text-xs text-[#9aa6af] flex items-center justify-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{user.email}</span>
                    </p>
                  )}
                  {user.bio ? (
                    <p className="text-xs text-[#e9e9e9] italic mt-2.5 max-w-xs mx-auto">
                      "{user.bio}"
                    </p>
                  ) : (
                    <p className="text-xs text-[#9aa6af]/50 italic mt-2">
                      No bio set yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-white/5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                  className="py-2.5 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Right Column: Cinema Pass Details & Favorite Genres (7 Cols) */}
            <div className="md:col-span-7 flex flex-col justify-between bg-[#080d10]/60 p-5 rounded-2xl border border-white/5 space-y-4">
              {/* VIP Pass Summary */}
              <div className="p-4 rounded-xl bg-[#12171c] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-[#ff7a00] font-bold">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Active Cinema Pass</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    VERIFIED
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-white tracking-tight">
                  Unlimited Watch Party Access
                </h4>
                <p className="text-[11px] text-[#9aa6af] mt-0.5">
                  Direct P2P WebRTC streaming with zero cloud recording
                </p>
              </div>

              {/* Favorite Genres */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2.5 flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-[#ff7a00]" />
                  <span>Favorite Genres ({user.favoriteGenres?.length || 0})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
                    user.favoriteGenres.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-xl bg-[#12171c] border border-white/10 text-xs font-medium text-white/90 shadow-sm"
                      >
                        {g}
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
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#9aa6af]">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Sub-second WebRTC Sync</span>
                </span>
                <span className="font-mono text-[10px] text-white/50">SECURED P2P</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* EDIT MODE (TWO-COLUMN SYMMETRICAL max-w-3xl) */
          /* ========================================================================= */
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch animate-fade-in">
            {/* Left Column: Name, Bio & Action Buttons (6 Cols) */}
            <div className="md:col-span-6 flex flex-col justify-between bg-[#080d10]/60 p-5 rounded-2xl border border-white/5 space-y-4">
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
                    className="w-full h-11 px-4 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] transition-colors text-xs font-sans"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
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
            <div className="md:col-span-6 flex flex-col justify-between bg-[#080d10]/60 p-5 rounded-2xl border border-white/5 space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center justify-between">
                  <span>Avatar Persona</span>
                  <span className="text-[10px] text-[#ff7a00] font-mono">{currentAvatar.name}</span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_OPTIONS.map((avatar) => {
                    const isSelected = avatarId === avatar.id;
                    return (
                      <button
                        type="button"
                        key={avatar.id}
                        onClick={() => setAvatarId(avatar.id)}
                        className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-200 ${
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

              {/* Favorite Movie Genres */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Favorite Genres</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MOVIE_GENRES.map((genre) => {
                    const isSelected = favoriteGenres.includes(genre);
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

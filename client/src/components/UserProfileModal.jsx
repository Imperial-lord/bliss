import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Mail,
  Heart,
  LogOut,
  Edit3,
  Check,
  Save,
  RotateCcw,
  AlertCircle
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

      setSuccessMsg('Profile updated successfully!');
      setIsSaving(false);
      setIsEditing(false);

      // Clear success notification after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setIsSaving(false);
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleCancel = () => {
    // Reset to user's current values
    setDisplayName(user.displayName || '');
    setAvatarId(user.avatarId || AVATAR_OPTIONS[0].id);
    setBio(user.bio || '');
    setFavoriteGenres(user.favoriteGenres || []);
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#12171c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* READ-ONLY VIEW MODE */}
        {!isEditing ? (
          <div>
            {/* Header & Avatar */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-24 h-24 rounded-full ${currentAvatar.bg} flex items-center justify-center text-4xl shadow-glow-orange border-2 border-white/20`}
              >
                {currentAvatar.emoji}
              </div>

              <div className="mt-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-widest mb-1.5 border border-[#ff7a00]/30">
                  <Sparkles className="w-3 h-3" />
                  <span>{currentAvatar.name}</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                  {user.displayName}
                </h3>
                {user.email && (
                  <p className="text-xs text-[#9aa6af] flex items-center justify-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{user.email}</span>
                  </p>
                )}
                {user.bio ? (
                  <p className="text-xs text-[#e9e9e9] italic mt-2.5 max-w-sm mx-auto">
                    "{user.bio}"
                  </p>
                ) : (
                  <p className="text-xs text-[#9aa6af]/60 italic mt-2">
                    No bio set yet. Click Edit Profile to add one!
                  </p>
                )}
              </div>
            </div>

            {/* Favorite Genres */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9aa6af] mb-2.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span>Favorite Genres</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
                  user.favoriteGenres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-full bg-[#1b2229] border border-white/10 text-xs font-medium text-white shadow-sm"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9aa6af] italic">
                    No genres selected yet.
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="py-2.5 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSave} className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="font-display text-xl font-bold text-white tracking-tight">
                  Edit Cinema Profile
                </h3>
                <p className="text-xs text-[#9aa6af] mt-0.5">
                  Update your identity, avatar persona, and favorite genres
                </p>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-2">
                Choose Persona Avatar
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = avatarId === avatar.id;
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => setAvatarId(avatar.id)}
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
                      <span className="text-[10px] font-medium text-white mt-1 truncate max-w-[48px]">
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

            {/* Tagline / Bio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                Tagline / Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Christopher Nolan enthusiast & Sci-Fi dreamer"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080d10] border border-white/10 text-white placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors text-sm font-sans"
              />
            </div>

            {/* Favorite Movie Genres */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                Favorite Genres
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOVIE_GENRES.map((genre) => {
                  const isSelected = favoriteGenres.includes(genre);
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

            {/* Action Buttons */}
            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

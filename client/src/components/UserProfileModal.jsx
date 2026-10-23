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
  Sparkles
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-[#0f1419] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#9aa6af] hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* READ-ONLY VIEW MODE */}
        {!isEditing ? (
          <div>
            {/* Header & Avatar */}
            <div className="flex flex-col items-center text-center pt-2">
              <div
                className={`w-20 h-20 rounded-full ${currentAvatar.bg} flex items-center justify-center text-3xl shadow-md border-2 border-white/20`}
              >
                {currentAvatar.emoji}
              </div>

              <div className="mt-3.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ff7a00]/10 text-[#ff7a00] text-[10px] font-semibold uppercase tracking-wider mb-1.5 border border-[#ff7a00]/25">
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
                  <p className="text-xs text-[#e9e9e9] italic mt-2.5 max-w-sm mx-auto">
                    "{user.bio}"
                  </p>
                ) : (
                  <p className="text-xs text-[#9aa6af]/50 italic mt-2">
                    No bio set yet.
                  </p>
                )}
              </div>
            </div>

            {/* Favorite Genres */}
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-2 flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-[#ff7a00]" />
                <span>Favorite Genres</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
                  user.favoriteGenres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg bg-[#151c23] border border-white/[0.06] text-xs font-medium text-white/90"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9aa6af]/50 italic">
                    All genres
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#ff7a00] hover:bg-[#ff8f26] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 active:scale-[0.98]"
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
                className="py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSave} className="space-y-4 animate-fade-in pt-1">
            <div className="pb-2.5 border-b border-white/[0.06]">
              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                Edit Cinema Profile
              </h3>
              <p className="text-xs text-[#9aa6af] mt-0.5">
                Customize your avatar persona, bio, and favorite genres
              </p>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5">
                Avatar Persona
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = avatarId === avatar.id;
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => setAvatarId(avatar.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#182027] border-[#ff7a00] shadow-sm ring-1 ring-[#ff7a00]/40'
                          : 'bg-[#090d11] border-white/[0.06] hover:border-white/20 opacity-70 hover:opacity-100'
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Miller"
                className="w-full px-3 py-2 rounded-xl bg-[#090d11] border border-white/[0.08] text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-colors text-xs font-sans"
              />
            </div>

            {/* Tagline / Bio */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1">
                Tagline / Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Sci-Fi enthusiast & movie lover"
                className="w-full px-3 py-2 rounded-xl bg-[#090d11] border border-white/[0.08] text-white placeholder-[#9aa6af]/40 focus:outline-none focus:border-[#ff7a00] focus:ring-1 focus:ring-[#ff7a00]/30 transition-colors text-xs font-sans"
              />
            </div>

            {/* Favorite Movie Genres */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9aa6af] mb-1.5">
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/40'
                          : 'bg-[#090d11] text-[#9aa6af] border border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#9aa6af] hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2 px-3 rounded-xl bg-[#ff7a00] hover:bg-[#ff8f26] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 active:scale-[0.98]"
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
          </form>
        )}
      </div>
    </div>
  );
}

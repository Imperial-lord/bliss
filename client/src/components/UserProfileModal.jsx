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
  Zap,
  User
} from 'lucide-react';
import { AVATAR_OPTIONS, GENRE_EMOJIS } from '../constants/avatars';
import { updateUserProfile } from '../services/userService';
import AvatarPicker from './common/AvatarPicker';
import GenrePicker from './common/GenrePicker';

/**
 * User Profile modal displaying verified credentials and supporting live edits.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.user
 * @param {Function} props.onSignOut
 * @param {Function} props.onUpdateProfile
 */
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

  const currentAvatar =
    AVATAR_OPTIONS.find((a) => a.id === (isEditing ? avatarId : user.avatarId)) || AVATAR_OPTIONS[0];

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
      {/* Symmetrical Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#12171c]/95 border border-white/10 rounded-3xl shadow-2xl p-7 sm:p-10 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white transition-all z-20 cursor-pointer"
          title="Close dialog"
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

        {/* READ-ONLY VIEW MODE */}
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
                    <p className="text-xs text-[#9aa6af]/50 italic mt-2.5">No bio set yet.</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-7 pt-5 border-t border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
                  className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                    <span className="text-xs text-[#9aa6af]/50 italic">All movie genres</span>
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
          /* EDIT MODE */
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch animate-fade-in"
          >
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
                    placeholder="e.g. Christopher Nolan enthusiast"
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
                  className="flex-1 py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa6af] hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff3d2e] hover:from-[#ff9124] hover:to-[#ff5244] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-orange transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
              <AvatarPicker
                selectedAvatarId={avatarId}
                onSelectAvatar={setAvatarId}
                variant="tokens"
                label="Avatar Persona"
              />

              <GenrePicker
                selectedGenres={favoriteGenres}
                onToggleGenre={toggleGenre}
                showCount={true}
              />

              {/* Footer Note */}
              <div className="p-3 rounded-xl bg-[#080d10] border border-white/5 flex items-center justify-between text-xs text-[#9aa6af]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Personalized Cinema Passport</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  SAVED TO FIREBASE
                </span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const LOCAL_STORAGE_KEY = 'bliss_current_user_profile';

/**
 * Get profile from localStorage fallback
 */
export function getLocalProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Save profile to localStorage fallback
 */
export function setLocalProfile(profile) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to store profile in localStorage', err);
  }
}

/**
 * Create or update user profile document in Firestore
 */
export async function saveProfileToFirestore(uid, profileData) {
  if (!db) {
    console.warn('Firestore not initialized, relying on local storage.');
    return;
  }
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        ...profileData,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore write notice (falling back to local state):', err.message);
  }
}

/**
 * Fetch profile from Firestore
 */
export async function getProfileFromFirestore(uid) {
  if (!db) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('Firestore fetch notice:', err.message);
  }
  return null;
}

/**
 * Sign up a new user with Email and Password
 */
export async function signUpUser({ email, password, displayName, avatarId, bio, favoriteGenres }) {
  let uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let userEmail = email;

  try {
    if (auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      userEmail = cred.user.email;
      await updateProfile(cred.user, { displayName });
    }
  } catch (authErr) {
    console.warn('Firebase Auth notice, registering local session:', authErr.message);
    // If auth failed because of missing backend config, we still allow local registration
  }

  const profile = {
    uid,
    displayName: displayName.trim(),
    email: userEmail,
    avatarId: avatarId || 'cyber-rebel',
    bio: bio || '',
    favoriteGenres: favoriteGenres || [],
    createdAt: new Date().toISOString()
  };

  setLocalProfile(profile);
  await saveProfileToFirestore(uid, profile);

  return profile;
}

/**
 * Sign in an existing user
 */
export async function signInUser(email, password) {
  try {
    if (auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const firestoreProfile = await getProfileFromFirestore(cred.user.uid);
      const profile = firestoreProfile || {
        uid: cred.user.uid,
        displayName: cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        avatarId: 'cyber-rebel',
        bio: '',
        favoriteGenres: []
      };
      setLocalProfile(profile);
      return profile;
    }
  } catch (err) {
    console.warn('Firebase sign in notice:', err.message);
  }

  // Fallback to local profile check
  const local = getLocalProfile();
  if (local && local.email === email) {
    return local;
  }

  // Return generated profile if demo
  const fallback = {
    uid: `user_${Date.now()}`,
    displayName: email.split('@')[0],
    email,
    avatarId: 'cyber-rebel',
    bio: '',
    favoriteGenres: ['Sci-Fi & Cyberpunk']
  };
  setLocalProfile(fallback);
  return fallback;
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    if (auth) {
      await fbSignOut(auth);
    }
  } catch (err) {
    console.warn('Sign out notice:', err.message);
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

/**
 * Quick profile creation (for instant join without password)
 */
export async function createQuickProfile({ displayName, avatarId, bio, favoriteGenres }) {
  const uid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const profile = {
    uid,
    displayName: displayName?.trim() || 'Movie Lover',
    email: `${displayName.toLowerCase().replace(/\s+/g, '')}@bliss.internal`,
    avatarId: avatarId || 'cyber-rebel',
    bio: bio || 'Ready for cinema watch party',
    favoriteGenres: favoriteGenres || ['Sci-Fi & Cyberpunk'],
    createdAt: new Date().toISOString()
  };

  setLocalProfile(profile);
  await saveProfileToFirestore(uid, profile);
  return profile;
}

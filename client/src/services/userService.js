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
 * Helper to translate Firebase Auth error codes into clean user-facing messages
 */
export function getAuthErrorMessage(error) {
  if (!error) return 'Authentication failed. Please try again.';
  const code = error.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed login attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled in this Firebase project console. Please enable Email/Password provider in the Firebase Console.';
    default:
      return error.message || 'Authentication error. Please try again.';
  }
}

/**
 * Get profile from localStorage cache
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
 * Save profile to localStorage cache
 */
export function setLocalProfile(profile) {
  try {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to store profile in localStorage', err);
  }
}

/**
 * Save user profile document in Firestore
 */
export async function saveProfileToFirestore(uid, profileData) {
  if (!db) return;
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
    console.warn('Firestore write notice:', err.message);
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
 * Sign up a new user strictly using Firebase Authentication
 */
export async function signUpUser({ email, password, displayName, avatarId, bio, favoriteGenres }) {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPass = String(password);
  const cleanName = String(displayName).trim();

  if (!cleanName) {
    throw new Error('Display name is required.');
  }
  if (!cleanEmail) {
    throw new Error('Email address is required.');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  try {
    // 1. Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const uid = cred.user.uid;

    // 2. Update display name in Firebase Auth
    await updateProfile(cred.user, { displayName: cleanName });

    // 3. Assemble full user profile
    const profile = {
      uid,
      displayName: cleanName,
      email: cred.user.email,
      avatarId: avatarId || 'cyber-rebel',
      bio: bio ? String(bio).trim() : '',
      favoriteGenres: Array.isArray(favoriteGenres) ? favoriteGenres : ['Sci-Fi & Cyberpunk'],
      createdAt: new Date().toISOString()
    };

    // 4. Save to Firestore
    await saveProfileToFirestore(uid, profile);
    setLocalProfile(profile);

    return profile;
  } catch (err) {
    console.error('Firebase signUp error:', err);
    throw new Error(getAuthErrorMessage(err));
  }
}

/**
 * Sign in an existing user strictly using Firebase Authentication
 */
export async function signInUser(email, password) {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPass = String(password);

  if (!cleanEmail || !cleanPass) {
    throw new Error('Both email and password are required.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const uid = cred.user.uid;

    // Fetch existing profile from Firestore
    let profile = await getProfileFromFirestore(uid);

    if (!profile) {
      // Create profile document if missing
      profile = {
        uid,
        displayName: cred.user.displayName || cleanEmail.split('@')[0],
        email: cred.user.email,
        avatarId: 'cyber-rebel',
        bio: '',
        favoriteGenres: ['Sci-Fi & Cyberpunk'],
        createdAt: new Date().toISOString()
      };
      await saveProfileToFirestore(uid, profile);
    }

    setLocalProfile(profile);
    return profile;
  } catch (err) {
    console.error('Firebase signIn error:', err);
    throw new Error(getAuthErrorMessage(err));
  }
}

/**
 * Sign out strictly from Firebase Authentication
 */
export async function signOutUser() {
  try {
    if (auth) {
      await fbSignOut(auth);
    }
  } catch (err) {
    console.error('Firebase signOut error:', err);
  } finally {
    setLocalProfile(null);
  }
}

/**
 * Listen to live Firebase Auth state changes
 */
export function subscribeToAuthState(callback) {
  if (!auth) {
    callback(getLocalProfile());
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const firestoreProfile = await getProfileFromFirestore(firebaseUser.uid);
      const profile = firestoreProfile || {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email,
        avatarId: 'cyber-rebel',
        bio: '',
        favoriteGenres: []
      };
      setLocalProfile(profile);
      callback(profile);
    } else {
      setLocalProfile(null);
      callback(null);
    }
  });
}

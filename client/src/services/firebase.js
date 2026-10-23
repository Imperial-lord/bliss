import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDev-BlissWatchParty2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bliss-watchparty.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bliss-watchparty",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bliss-watchparty.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

// Initialize Firebase only once
let app;
let auth;
let db;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error.message);
}

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();

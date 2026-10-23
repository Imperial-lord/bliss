import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBC8HKDgt5M9QKtGfWkdIZTQoT3mS0tnu0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bliss-watchparty.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bliss-watchparty",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bliss-watchparty.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "249672897754",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:249672897754:web:785b477cc46cd7f205c1e3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KW3HWMNTEX"
};

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
export const googleProvider = new GoogleAuthProvider();

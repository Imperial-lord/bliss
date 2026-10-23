import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBC8HKDgt5M9QKtGfWkdIZTQoT3mS0tnu0",
  authDomain: "bliss-watchparty.firebaseapp.com",
  projectId: "bliss-watchparty",
  storageBucket: "bliss-watchparty.firebasestorage.app",
  messagingSenderId: "249672897754",
  appId: "1:249672897754:web:785b477cc46cd7f205c1e3"
};

async function testLiveFirebaseAuth() {
  console.log('Testing live Firebase Authentication and Firestore for project bliss-watchparty...');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const testEmail = `test_${Date.now()}@bliss-cinema.test`;
  const testPassword = 'Password123!';

  console.log(`1. Creating test user: ${testEmail}...`);
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const user = userCredential.user;
  console.log(`✓ Firebase Auth account created successfully! UID: ${user.uid}`);

  console.log('2. Writing user profile to Firestore (users collection)...');
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    displayName: 'Automated Test User',
    email: testEmail,
    avatarId: 'cyber-rebel',
    createdAt: new Date().toISOString()
  });
  console.log('✓ Firestore profile written successfully!');

  console.log('3. Reading user profile back from Firestore...');
  const snap = await getDoc(userRef);
  if (!snap.exists() || snap.data().displayName !== 'Automated Test User') {
    throw new Error('Firestore verification failed: ' + JSON.stringify(snap.data()));
  }
  console.log('✓ Firestore profile read verified!');

  console.log('4. Cleaning up test user and Firestore doc...');
  await deleteDoc(userRef);
  await deleteUser(user);
  console.log('✓ Cleanup completed!');

  console.log('\n🎉 ALL LIVE FIREBASE AUTH & FIRESTORE TESTS PASSED 100%!');
}

testLiveFirebaseAuth()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

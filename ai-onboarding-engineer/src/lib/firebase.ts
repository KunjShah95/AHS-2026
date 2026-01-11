
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
<<<<<<< HEAD
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
=======
import { getFirestore } from 'firebase/firestore';
>>>>>>> 4992b9c1bdac2c96b0c97ec12d3258b5963b8315
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

<<<<<<< HEAD
// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firebase: Multiple tabs open, persistence disabled in this tab');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support persistence
      console.warn('Firebase: This browser does not support offline persistence');
    } else {
      console.error('Firebase persistence error:', err);
    }
  });

=======
>>>>>>> 4992b9c1bdac2c96b0c97ec12d3258b5963b8315
export default app;

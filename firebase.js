import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- THE SACRED CONNECTION ---
const firebaseConfig = {
  apiKey: "AIzaSyBlPdWgHqNAfxQ3sot8hRGdY1SomzsPOlk",
  authDomain: "excel-gam-zon.firebaseapp.com",
  databaseURL: "https://excel-gam-zon.firebaseio.com",
  projectId: "excel-gam-zon",
  storageBucket: "excel-gam-zon.firebasestorage.app",
  messagingSenderId: "849616610846",
  appId: "1:849616610846:web:cada0d004958ec3862700f",
  measurementId: "G-8Q6W427J8R"
};

// Initialize Singleton Instances
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Exporting the "Hearts" of the system
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper to handle the "Silent Entrance"
export const loginAnonymously = () => signInAnonymously(auth);

export default app;

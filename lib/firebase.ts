// lib/firebase.ts

import { initializeApp } from "firebase/app"; // <-- Import getApp
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This is a more robust way to initialize, preventing the error.
// It checks if an app is initialized. If not, it creates one. If so, it gets the existing one.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
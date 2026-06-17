import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJCbIhC6LOhwpKHRpM5nXrtp5HDTRL31Q",
  authDomain: "dark-56626.firebaseapp.com",
  projectId: "dark-56626",
  storageBucket: "dark-56626.firebasestorage.app",
  messagingSenderId: "810773972266",
  appId: "1:810773972266:web:603f2283ba90a66bc14a53"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

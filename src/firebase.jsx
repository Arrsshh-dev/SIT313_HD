import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Client-side Firebase configuration.
// Uses Vite environment variables if provided (for deployment),
// falling back to your default project configuration.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBt4BETg2ZYL9Gvk-6cwyJSxSoIxl1BaEI",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sit313-p4-6b84e.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sit313-p4-6b84e",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sit313-p4-6b84e.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1008793287520",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1008793287520:web:223eb8a3142e7f6a4a7c05",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3XK8Q5NLMW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Shared GoogleAuthProvider instance for popup authentication
export const googleProvider = new GoogleAuthProvider();

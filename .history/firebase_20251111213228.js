// lib/firebase.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { setLogLevel } from "firebase/firestore"; // Assuming you still want this

// Set log level for Firebase services (optional)
setLogLevel('debug');

// --- 1. HARDCODED FIREBASE CONFIGURATION ---
// !! WARNING: Hardcoding API keys is generally discouraged for production apps !!
const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
    authDomain: "iain-f7c30.firebaseapp.com",
    projectId: "iain-f7c30",
    storageBucket: "iain-f7c30.firebasestorage.app",
    messagingSenderId: "854098983635",
    appId: "1:854098983635:web:30a821bfed2ada47093226",
    measurementId: "G-4BRVSXBWKJ",
};

let app: FirebaseApp;
let authInstance: Auth;

// --- 2. SINGLETON PATTERN TO AVOID DUPLICATE-APP ERROR ---
// This ensures initializeApp() runs only once.
if (!getApps().length) {
    app = initializeApp(hardcodedFirebaseConfig);
} else {
    // If the app already exists (e.g., during hot reload), retrieve it.
    app = getApp();
}

// --- 3. EXPORT THE AUTH SERVICE ---
authInstance = getAuth(app);

// FIX: Access the global variable __initial_auth_token safely here if needed for initialization
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const auth = authInstance;
export { initialAuthToken }; // Export the initial token if your login component needs it
export { app };
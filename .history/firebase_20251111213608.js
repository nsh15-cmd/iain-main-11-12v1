// firebase.js (Corrected for plain JavaScript)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { setLogLevel } from "firebase/firestore";

// Set log level for Firebase services (optional)
setLogLevel('debug');

// --- 1. HARDCODED FIREBASE CONFIGURATION ---
const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyBVVzJH2a8z8DEjBAGuvO4zc8fjrm92N8",
    authDomain: "iain-f7c30.firebaseapp.com",
    projectId: "iain-f7c30",
    storageBucket: "iain-f7c30.firebasestorage.app",
    messagingSenderId: "854098983635",
    appId: "1:854098983635:web:30a821bfed2ada47093226",
    measurementId: "G-4BRVSXBWKJ",
};

// Remove the type annotations
let app;
let authInstance;

// --- 2. SINGLETON PATTERN TO AVOID DUPLICATE-APP ERROR ---
if (!getApps().length) {
    app = initializeApp(hardcodedFirebaseConfig);
} else {
    app = getApp();
}

// --- 3. EXPORT THE AUTH SERVICE ---
authInstance = getAuth(app);

// FIX: Access the global variable __initial_auth_token safely here
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const auth = authInstance;
export { initialAuthToken };
export { app };
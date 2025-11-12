// C:\Users\Renz Jericho Buday\iain-main-11-11v3\firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore"; // ⬅️ NEW: Import getFirestore here

// Set log level (optional, but keep it if you want it)
setLogLevel('debug');

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
    authDomain: "iain-f7c30.firebaseapp.com",
    projectId: "iain-f7c30",
    storageBucket: "iain-f7c30.firebasestorage.app",
    messagingSenderId: "854098983635",
    appId: "1:854098983635:web:ce7aa8bb8f04e061093226",
    measurementId: "G-2XBYBYQDX7"
};

let app;
let authInstance;

// 1. SINGLETON PATTERN to prevent the 'duplicate-app' error
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// 2. GET AUTH INSTANCE
authInstance = getAuth(app);

// 3. GET FIRESTORE INSTANCE ⬅️ NEW: Initialization
export const db = getFirestore(app);

// 4. DEFINE initialAuthToken
// Safely access the global variable __initial_auth_token
const initialAuthToken = typeof __initial_auth_token !== 'undefined'
    ? __initial_auth_token
    : null;

// 5. EXPORT all required members
export const auth = authInstance;
export { initialAuthToken };
// Note: 'db' is already exported on line 36.
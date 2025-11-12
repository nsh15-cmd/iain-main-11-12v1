// [project]/iain-main-11-11v3/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { setLogLevel } from "firebase/firestore";

// Set log level (optional, but keep it if you want it)
setLogLevel('debug');

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
    authDomain: "iain-f7c30.firebaseapp.com",
    projectId: "iain-f7c30",
    storageBucket: "iain-f7c30.firebasestorage.app",
    messagingSenderId: "854098983635",
    appId: "1:854098983635:web:ce7aa8bb8f04e061093226", // Using the latest appId you provided
    measurementId: "G-2XBYBYQDX7" // Using the latest measurementId you provided
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

// 3. DEFINE initialAuthToken
// Safely access the global variable __initial_auth_token
const initialAuthToken = typeof __initial_auth_token !== 'undefined'
    ? __initial_auth_token
    : null;

// 4. EXPORT all required members ⬅️ THIS RESOLVES THE ERROR

export const auth = authInstance;
export { initialAuthToken }; // Exporting the variable defined above
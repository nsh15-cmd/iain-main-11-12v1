// lib/firebase.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// 1. Define your Firebase Configuration
const firebaseConfig = {
    // Use environment variables or ensure this config is correct
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // ... other configs
};

let app: FirebaseApp;
let authInstance: Auth;

// 2. Implement the Singleton Pattern
if (!getApps().length) {
    // Initialize the app ONLY if it has not been initialized yet
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized.");
} else {
    // Otherwise, get the existing default app
    app = getApp();
    console.log("Using existing Firebase App.");
}

// 3. Get and export the Auth service instance
authInstance = getAuth(app);

// Export the necessary services
export const auth = authInstance;
export { app }; // Export the app instance if needed elsewhere
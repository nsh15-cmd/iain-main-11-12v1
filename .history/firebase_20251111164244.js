// firebase.js
"use client";

// Import the functions you need from Firebase SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
    authDomain: "iain-f7c30.firebaseapp.com",
    projectId: "iain-f7c30",
    storageBucket: "iain-f7c30.firebasestorage.app",
    messagingSenderId: "854098983635",
    appId: "1:854098983635:web:30a821bfed2ada47093226",
    measurementId: "G-4BRVSXBWKJ"
};

// Initialize Firebase app (avoid double initialization)
export const app = typeof window !== "undefined"
    ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
    : null;

// Initialize Firebase services and export
export const analytics = app ? getAnalytics(app) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

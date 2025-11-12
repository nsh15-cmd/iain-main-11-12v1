// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// ⭐ ADDED: Authentication and Firestore imports
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
    authDomain: "iain-f7c30.firebaseapp.com",
    projectId: "iain-f7c30",
    storageBucket: "iain-f7c30.firebasestorage.app",
    messagingSenderId: "854098983635",
    appId: "1:854098983635:web:30a821bfed2ada47093226",
    measurementId: "G-4BRVSXBWKJ"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services and Export
export const analytics = getAnalytics(app);
// ⭐ EXPORTED: Initialize Authentication for sign-in/sign-up
export const auth = getAuth(app);
// ⭐ EXPORTED: Initialize Firestore for database operations
export const db = getFirestore(app);
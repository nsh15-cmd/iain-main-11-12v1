"use client";

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Load Tailwind CSS for styling (assumed to be available)

// Main Application Component
const App = () => {
  // --- MANDATORY FIREBASE INITIALIZATION ---
  // Safely retrieve global variables
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

  // Firebase Ref and State
  const authRef = useRef(null); // Use useRef to hold the auth object reliably
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      // 1. Initialize App
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);

      // Set the auth object reference immediately
      authRef.current = auth;

      // 2. Perform Mandatory Sign-in
      const signIn = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) {
          console.error("Initial Firebase Sign-in failed:", e);
        }
      };

      // 3. Set up Auth State Listener
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          setUserId(null);
        }
        // Mark authentication setup as complete
        setIsAuthReady(true);
      });

      signIn();

      // Cleanup function for the listener
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase App Initialization Error:", e);
      setIsAuthReady(true); // Mark ready even if error occurred to show UI
    }
  }, []);

  // --- LOGIN FORM LOGIC ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check the ref. This is now the most reliable check for the auth service object.
    if (!authRef.current) {
      setError("Authentication service is not ready. Please wait.");
      setLoading(false);
      return;
    }

    try {
      // Use the initialized auth instance from the ref
      await signInWithEmailAndPassword(authRef.current, email, password);

      // In a standalone React file, we display a success message instead of routing
      setIsLoggedIn(true);

    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else {
        setError("Failed to sign in. Please check your network or try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Styling constants
  const inputContainerStyle = "relative mb-4";
  const inputStyle =
    "w-full p-3 bg-dark-3 border border-dark-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-1 transition-colors duration-150";
  const buttonStyle =
    "w-full p-3 rounded-lg bg-blue-1 text-white font-semibold hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-700 disabled:text-gray-400";

  // Show a loading/waiting screen while Firebase setup is running
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white">
        <div className="text-xl animate-pulse">Loading Authentication Service...</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
        <div className="w-full max-w-md p-8 bg-dark-2 rounded-xl shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-green-400 mb-4">Sign In Successful!</h1>
          <p className="text-lg mb-6">Welcome back! You are now authenticated.</p>
          <div className="text-xs text-gray-400 mt-8 p-2 border border-gray-700 rounded-lg">
            <p>Authenticated User ID (for Firestore access):</p>
            <p className="font-mono break-all mt-1 text-yellow-300">{userId || "N/A (Anonymous/Error)"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* Placeholder for the logo */}
          <div className="text-3xl font-extrabold text-blue-1">Iain App</div>
        </div>

        <form
          onSubmit={handleSignIn}
          className="p-8 bg-dark-2 rounded-xl shadow-2xl border border-gray-700/50"
        >
          <h1 className="text-3xl font-bold mb-2 text-center text-gray-100">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Please sign in to continue
          </p>

          <div className={inputContainerStyle}>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputStyle}
            />
          </div>

          <div className={inputContainerStyle}>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputStyle}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center p-2 bg-dark-3 rounded-lg border border-red-500/30">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={buttonStyle}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </div>
            ) : "Sign In"}
          </button>
        </form>

        {/* Legal Links */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            By signing in, you agree to our
            <a
              href="https://iain-landingpage.vercel.app/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-1 underline mx-1"
            >
              Terms and Conditions
            </a>
            and
            <a
              href="https://iain-landingpage.vercel.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-1 underline ml-1"
            >
        a      Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
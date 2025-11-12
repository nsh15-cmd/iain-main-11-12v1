"use client";

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// User-provided hardcoded configuration (used only as a fallback if global config is missing)
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
  authDomain: "iain-f7c30.firebaseapp.com",
  projectId: "iain-f7c30",
  storageBucket: "iain-f7c30.firebasestorage.app",
  messagingSenderId: "854098983635",
  appId: "1:854098983635:web:30a821bfed2ada47093226",
  measurementId: "G-4BRVSXBWKJ"
};

// --- Home Screen Component ---
const HomeScreen = ({ authRef, userId }) => {
  const handleSignOut = async () => {
    if (authRef.current) {
      try {
        await signOut(authRef.current);
      } catch (e) {
        console.error("Sign out failed:", e);
        // Displaying a message box instead of alert()
        const errorMessage = "Sign out failed. Check console for details.";
        document.getElementById('signout-message').innerText = errorMessage;
        setTimeout(() => document.getElementById('signout-message').innerText = '', 3000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-1 text-white p-4">
      <div className="w-full max-w-lg p-10 bg-dark-2 rounded-xl shadow-2xl border border-blue-1/50 text-center">
        <div className="flex items-center justify-center text-blue-1 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h1 className="text-4xl font-extrabold">Welcome Home!</h1>
        </div>

        <p className="text-lg mb-8 text-gray-300">
          You have successfully signed in and reached the main application screen.
        </p>

        <div className="text-left bg-dark-3 p-4 rounded-lg mb-6 shadow-inner">
          <p className="text-sm font-semibold text-gray-400 mb-1">
            Current User ID:
          </p>
          <p className="font-mono break-all text-yellow-300">
            {userId || "Anonymous"}
          </p>
        </div>

        <div id="signout-message" className="text-red-400 text-sm mb-2 h-4"></div>

        <button
          onClick={handleSignOut}
          className="w-full p-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200"
        >
          Sign Out
        </button>

        <p className="text-xs text-gray-500 mt-4">
          The UI successfully switched from Login to Home based on your authentication status.
        </p>
      </div>
    </div>
  );
}

// Main Application Component - RENAMED TO LoginPage FOR NEXT.JS COMPATIBILITY
const LoginPage = () => {
  // --- MANDATORY FIREBASE INITIALIZATION & CONFIGURATION ---
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  let configUsed = FALLBACK_FIREBASE_CONFIG;
  try {
    const globalConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    if (globalConfig && globalConfig.apiKey) {
      configUsed = globalConfig;
    }
  } catch (e) {
    console.error("Firebase: Failed to parse __firebase_config.", e);
  }
  const firebaseConfig = configUsed;

  // Firebase Ref and State
  const authRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [initError, setInitError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Controlled by onAuthStateChanged

  useEffect(() => {
    let unsubscribe;
    try {
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        throw new Error("Missing Firebase configuration (apiKey is required).");
      }

      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      authRef.current = auth;

      const signIn = async () => {
        try {
          const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) {
          if (e.code === "auth/invalid-api-key") {
            setInitError(`Initialization failed: ${e.message}`);
            setAuthStatus('error');
            return;
          }
          console.warn("Initial Firebase Sign-in failed (Non-critical):", e.message);
        }
      };

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsLoggedIn(true); // User is logged in (either via email/pass or initial sign-in)
        } else {
          setUserId(null);
          setIsLoggedIn(false); // User is logged out
        }
        if (authStatus !== 'error') {
          setAuthStatus('ready');
        }
      });

      signIn();

    } catch (e) {
      console.error("Firebase App Initialization CRITICAL Error:", e);
      setInitError(`Initialization failed. Check API key/config: ${e.message}`);
      setAuthStatus('error');
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseConfig.apiKey]);

  // --- LOGIN FORM LOGIC ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (authStatus !== 'ready' || !authRef.current) {
      setError("Authentication service is not initialized yet. Please try again.");
      setLoading(false);
      return;
    }

    try {
      // Sign-in will trigger onAuthStateChanged, which updates isLoggedIn state
      await signInWithEmailAndPassword(authRef.current, email, password);
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else {
        setError("Failed to sign in. Please try again later.");
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

  // --- Conditional Rendering ---

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white">
        <div className="text-xl animate-pulse">Loading Authentication Service...</div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
        <div className="w-full max-w-md p-8 bg-red-900/50 rounded-xl shadow-2xl text-center border border-red-500">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Initialization Error</h1>
          <p className="text-lg mb-6 text-red-200">The Firebase service could not be started.</p>
          <p className="text-sm text-red-300 break-all">{initError}</p>
          <p className="text-xs text-red-200 mt-4">The configuration needs checking. Using hardcoded fallback.</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    // Renders the Home Screen component after successful sign-in
    return <HomeScreen authRef={authRef} userId={userId} />;
  }

  // --- Login Form UI ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* Reverted to logo image from your query */}
          <img
            src="/icons/logo.svg"
            width={240}
            height={80}
            alt="IAIN Logo"
            style={{ height: "80px", width: "240px" }}
          />
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
            disabled={authStatus !== 'ready' || loading} // Disable button unless auth is ready or loading
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
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

export const sidebarLinks = [
  {
    imgURL: '/icons/Home.svg',
    route: '/',
    label: 'Home',
  },

  {
    imgURL: '/icons/upcoming.svg',
    route: '/upcoming',
    label: 'Upcoming',
  },
  {
    imgURL: '/icons/previous.svg',
    route: '/previous',
    label: 'Previous',
  },
  {
    imgURL: '/icons/Video.svg',
    route: '/recordings',
    label: 'Recordings',
  },

  {
    imgURL: '/icons/resume.svg',
    route: '/insert-resume',
    label: 'Resume',
  },

  {
    imgURL: '/icons/calendar.svg',
    route: '/calendar',
    label: 'Calendar',
  },
  {
    imgURL: '/icons/add-personal.svg',
    route: '/personal-room',
    label: 'Personal Room',
  },
];

export const avatarImages = [
  '/images/avatar-1.png',
  '/images/avatar-2.png',
  '/images/avatar-3.png',
  '/images/avatar-4.png',
  '/images/avatar-5.png',
];
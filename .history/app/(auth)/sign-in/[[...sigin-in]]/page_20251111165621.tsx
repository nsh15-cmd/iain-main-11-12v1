"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { signInWithEmailAndPassword, signInAnonymously, signInWithCustomToken, setPersistence, browserSessionPersistence, getAuth } from "firebase/auth";
import { initializeApp } from 'firebase/app';

// --- CONFIGURATION UPDATE (Using values from your firebase.js) ---
const defaultFirebaseConfig = {
  // Actual API Key from firebase.js
  apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
  authDomain: "iain-f7c30.firebaseapp.com",
  projectId: "iain-f7c30",
  storageBucket: "iain-f7c30.firebasestorage.app",
  messagingSenderId: "854098983635",
  appId: "1:854098983635:web:30a821bfed2ada47093226",
  // measurementId is optional for auth but included for completeness
  measurementId: "G-4BRVSXBWKJ",
};

// The configuration object is sourced from the Canvas environment, using the correct configuration as a fallback
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : defaultFirebaseConfig;
// --- END CONFIGURATION UPDATE ---

const initialAuthToken = typeof (window as any).__initial_auth_token !== 'undefined' ? (window as any).__initial_auth_token : null;

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Icons
const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h2m-2 4h2m-2 4h2M9 19h2m-2-4h2m-2-4h2M6 6v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2z" />
  </svg>
);

const App = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isConfigValid, setIsConfigValid] = useState(true);

  // Initialize auth persistence & anonymous sign-in
  useEffect(() => {
    // Explicit check for a required configuration item (API Key)
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 10) {
      const configErrorMsg = "Configuration Error: Firebase API Key is missing or invalid. Please ensure the environment provides a complete Firebase configuration.";
      setError(configErrorMsg);
      console.error(configErrorMsg);
      setIsAuthReady(true);
      setIsConfigValid(false);
      return;
    }
    setIsConfigValid(true);

    const initAuth = async () => {
      if (!auth || typeof window === "undefined") return;

      try {
        await setPersistence(auth, browserSessionPersistence);

        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e: any) {
        console.error("Auth Initialization Error:", e);
        // Catch the explicit invalid-api-key error on initialization
        if (e.code === 'auth/invalid-api-key') {
          setError("Configuration Error: Firebase API Key is invalid. Check your setup.");
        } else {
          setError("Authentication initialization failed: " + e.message);
        }
      } finally {
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Disable sign-in if configuration is known to be bad
    if (!isConfigValid) {
      setError("Configuration Error: Cannot sign in due to an invalid Firebase API Key.");
      return;
    }

    if (!isAuthReady || !auth) {
      setError("Authentication service is not ready.");
      return;
    }

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // --- SUCCESS: Redirect to home page ---
      window.location.href = "/";
      // ------------------------------------

    } catch (err: any) {
      let msg = "Sign-in failed.";
      switch (err.code) {
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
          msg = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          msg = "Too many login attempts. Try again later.";
          break;
        case "auth/invalid-api-key":
          msg = "Configuration Error: Firebase API Key is invalid. Check your setup.";
          break;
        default:
          msg = err.message || msg;
      }
      setError(msg);
      setLoading(false); // Stop loading if sign-in fails
    }
  };

  const isSuccess = error && error.includes("Success");
  const errorClass = isSuccess
    ? 'text-green-700 bg-green-100 border-green-300 dark:bg-green-900/50 dark:text-green-300'
    : 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/50 dark:text-red-300';

  // The form is disabled if loading, not ready, or configuration is invalid
  const isDisabled = loading || !isAuthReady || !isConfigValid;

  return (
    <main className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 font-inter">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Sign In</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          {error && <div className={`p-3 text-sm font-medium border rounded-lg ${errorClass}`}>{error}</div>}

          {!isAuthReady && !error && (
            <div className="flex items-center justify-center p-3 text-sm text-blue-600 dark:text-blue-400">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Initializing Authentication Service...
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><UserIcon /></span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={isDisabled}
                required
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><KeyIcon /></span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isDisabled}
                required
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400/80 transition duration-150"
          >
            {isConfigValid ? (loading ? 'Authenticating...' : 'Sign In') : 'Config Error'}
          </button>
        </form>

      </div>
    </main>
  );
};

export default App;
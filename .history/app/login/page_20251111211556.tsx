"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  Auth // <-- IMPORTED Auth TYPE
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'; // <-- IMPORTED Firestore TYPE

// Define the shape of the services state using explicit Firebase types
interface FirebaseServices {
  auth: Auth | null; // <-- Explicitly typed
  db: Firestore | null; // <-- Explicitly typed
  userId: string | null;
  isAuthReady: boolean;
}

// Component replaces the external firebase.js and page.tsx files
const App = () => {
  // State for Firebase services and readiness
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices>({
    auth: null,
    db: null,
    userId: null,
    isAuthReady: false,
  });

  // State for login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulate redirection state
  const [loginSuccess, setLoginSuccess] = useState(false);

  // 1. Firebase Initialization and Authentication Logic
  useEffect(() => {
    const initFirebase = async () => {
      // Explicitly cast global variables to 'any' to satisfy TypeScript (TS error fix #1)
      const globalConfig = (typeof (window as any).__firebase_config !== 'undefined' ? (window as any).__firebase_config : '{}');
      const globalToken = (window as any).__initial_auth_token;

      let authInstance: Auth | null = null; // <-- Explicitly typed (TS error fix #2)
      let dbInstance: Firestore | null = null;
      let unsubscribe = () => { };
      let firebaseConfig = {};

      try {
        // 1. Parse global config
        const configString = globalConfig;

        // This might throw a SyntaxError if configString is invalid JSON
        firebaseConfig = JSON.parse(configString);

        // 2. Initialize services
        const app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);

        // 3. Set up auth listener (The most reliable source of user status)
        unsubscribe = onAuthStateChanged(authInstance, (user) => {
          let currentUserId = user?.uid || crypto.randomUUID();

          setFirebaseServices(prev => ({
            auth: authInstance,
            db: dbInstance,
            userId: currentUserId,
            isAuthReady: true,
          }));

          setIsAuthenticated(!!user);
        });

        // 4. Initial sign-in
        if (globalToken) {
          await signInWithCustomToken(authInstance, globalToken);
        } else {
          await signInAnonymously(authInstance);
        }

      } catch (error) {
        // --- ENHANCED ERROR LOGGING AND DISPLAY ---
        console.error("Firebase Initialization Failed (CRITICAL):", error);
        console.log("Configuration attempted:", firebaseConfig);

        let userFriendlyError = "Application failed to initialize Firebase.";

        if (error instanceof SyntaxError) {
          userFriendlyError = "Initialization Failed: Firebase configuration is invalid JSON.";
        } else if (error.code) {
          // Clean up Firebase error codes for display
          userFriendlyError = `Initialization Failed: ${error.code.replace('app/', '').replace(/-/g, ' ')}`;
        } else {
          userFriendlyError = `Initialization Failed: ${error.message}`;
        }

        setError(userFriendlyError + " Please check console for details.");
        // --- END ENHANCED ERROR LOGGING ---

      } finally {
        // CRITICAL FIX: Ensure isAuthReady is set to true regardless of success/failure 
        // after the initial async steps have run, preventing the UI from blocking.
        setFirebaseServices(prev => ({
          ...prev,
          auth: authInstance || prev.auth,
          db: dbInstance || prev.db,
          isAuthReady: true // GUARANTEE UI unblock
        }));
      }

      return () => unsubscribe(); // Cleanup listener
    };
    initFirebase();
  }, []);

  // 2. Email/Password Sign-In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { auth } = firebaseServices;

    if (!auth) {
      setError("Firebase Authentication is not ready. Please wait.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginSuccess(true); // Simulate redirect success
    } catch (err: any) {
      console.error(err);
      // Provide user-friendly error messages
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else {
        setError("Failed to sign in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Styling constants
  const inputContainerStyle = "relative mb-4";
  const inputStyle =
    "w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200";
  const buttonStyle =
    "w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-purple-600 transition-colors duration-200 disabled:bg-gray-500 disabled:opacity-70 flex justify-center items-center";

  if (!firebaseServices.isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-medium">
          Loading services...
        </div>
      </div>
    );
  }

  if (loginSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl text-center">
          <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h1 className="text-2xl font-bold mb-2 text-green-300">
            Sign In Successful!
          </h1>
          <p className="text-gray-400">
            You are now signed in and will be redirected. (Simulated redirect)
          </p>
          <p className="mt-4 text-xs text-gray-500">
            User ID: {firebaseServices.userId}
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* Placeholder for the logo - replaced with text since original asset is not available */}
          <div className="text-4xl font-extrabold text-white tracking-widest">IAIN</div>
        </div>

        <form
          onSubmit={handleSignIn}
          className="p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700"
        >
          <h1 className="text-3xl font-bold mb-2 text-center text-gray-100">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Please sign in to continue
          </p>

          {/* Email Input */}
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

          {/* Password Input */}
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
            <p className="text-red-400 text-sm mb-4 text-center p-2 bg-red-900 bg-opacity-30 rounded-lg border border-red-800">
              {error}
            </p>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || !firebaseServices.isAuthReady}
            className={buttonStyle}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : null}
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* Display current Canvas userId for debugging/reference */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            Current Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated (Using Anonymous Token)'}
          </p>
          <p className="text-xs text-gray-500 text-center">
            User ID: {firebaseServices.userId}
          </p>


        </form>

        {/* Legal Links */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            By signing in, you agree to our
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white underline mx-1 transition-colors"
            >
              Terms and Conditions
            </a>
            and
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white underline ml-1 transition-colors"
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

export default App;
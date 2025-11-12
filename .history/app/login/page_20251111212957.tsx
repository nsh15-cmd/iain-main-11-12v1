"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithCustomToken,
  setPersistence,
  browserSessionPersistence,
  getAuth
} from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { setLogLevel } from "firebase/firestore"; // Assuming you want to keep this
import { useRouter } from "next/navigation"; // Used for Next.js redirection
import Link from "next/link"; // Used for Next.js links

// Set log level for Firebase services
// NOTE: Set to 'silent' or remove this in production.
setLogLevel('debug');

// --- FIREBASE CONFIGURATION & INITIALIZATION ---

// Configuration (using the default structure from your second component)
const defaultFirebaseConfig = {
  apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8", // **WARNING: REPLACE WITH YOUR ACTUAL KEY**
  authDomain: "iain-f7c30.firebaseapp.com",
  projectId: "iain-f7c30",
  storageBucket: "iain-f7c30.firebasestorage.app",
  messagingSenderId: "854098983635",
  appId: "1:854098983635:web:30a821bfed2ada47093226",
  measurementId: "G-4BRVSXBWKJ",
};

// Assuming the environment variables might be used, otherwise default is used
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : defaultFirebaseConfig;

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// --- LOGIN PAGE COMPONENT ---

const CombinedLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isConfigValid, setIsConfigValid] = useState(true);
  const router = useRouter(); // Initialize router for redirection

  // 1. Auth Initialization, Persistence, and Anonymous Sign-in (from the second component)
  useEffect(() => {
    // Check for required configuration
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 10) {
      const configErrorMsg = "Configuration Error: Firebase API Key is missing or invalid.";
      setError(configErrorMsg);
      console.error(configErrorMsg);
      setIsAuthReady(true);
      setIsConfigValid(false);
      return;
    }
    setIsConfigValid(true);

    const initAuth = async () => {
      if (!auth) {
        setIsAuthReady(true);
        return;
      }

      try {
        await setPersistence(auth, browserSessionPersistence);

        if (initialAuthToken) {
          console.log("Signing in with Custom Token...");
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          console.log("Signing in Anonymously...");
          await signInAnonymously(auth);
        }
      } catch (e: any) {
        console.error("Auth Initialization Error:", e);
        if (e.code === 'auth/invalid-api-key') {
          setError("Configuration Error: Firebase API Key is invalid. Check your setup.");
        } else if (e.code !== 'auth/already-signed-in') {
          // Ignore "already-signed-in" if it's the anonymous user
          setError("Authentication initialization failed: " + e.message);
        }
      } finally {
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  // 2. Handle Sign In (Combined from both components' logic)
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConfigValid) {
      setError("Configuration Error: Cannot sign in due to an invalid Firebase API Key.");
      return;
    }

    if (!isAuthReady || !auth) {
      setError("Authentication service is not ready. Please wait.");
      return;
    }

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success: Redirect using Next.js router
      router.push("/");
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to sign in. Please try again later.";
      switch (err.code) {
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
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
    } finally {
      setLoading(false);
    }
  };

  // Styling constants (from the first component, using its dark theme classes)
  const inputContainerStyle = "relative mb-4";
  const inputStyle =
    "w-full p-3 bg-dark-3 border border-dark-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-1";
  const buttonStyle =
    "w-full p-3 rounded-lg bg-blue-1 text-white font-semibold hover:bg-purple-1 transition-colors duration-200 disabled:bg-gray-500 disabled:opacity-70";

  // Disable form if loading, not ready, or configuration is invalid
  const isDisabled = loading || !isAuthReady || !isConfigValid;

  // 3. UI Rendering (Using the dark-themed UI from the first component)
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* Using Link instead of img for consistency, assuming /icons/logo.svg exists */}
          <Link href="/">
            <img
              src="/icons/logo.svg"
              width={240}
              height={80}
              alt="IAIN Logo"
              style={{ height: "80px", width: "240px" }}
            />
          </Link>
        </div>

        <form
          onSubmit={handleSignIn}
          className="p-8 bg-dark-2 rounded-lg shadow-xl"
        >
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-100">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Please sign in to continue
          </p>

          {/* Authentication Status/Error Display */}
          {!isAuthReady && !error && (
            <p className="text-blue-400 text-sm mb-4 text-center">
              Initializing Authentication Service...
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

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
              disabled={isDisabled}
              className={`${inputStyle} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
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
              disabled={isDisabled}
              className={`${inputStyle} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isDisabled}
            className={buttonStyle}
          >
            {isConfigValid ? (loading ? "Signing In..." : "Sign In") : "Config Error"}
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
              className="text-gray-400 hover:text-white underline mx-1"
            >
              Terms and Conditions
            </a>
            and
            <a
              href="https://iain-landingpage.vercel.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white underline ml-1"
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

export default CombinedLoginPage;
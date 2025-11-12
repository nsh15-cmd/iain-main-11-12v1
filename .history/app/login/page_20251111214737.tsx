// app/login/page.tsx

"use client";

import { useState, FormEvent, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithCustomToken,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { auth, initialAuthToken } from "../../firebase";


const CombinedLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setError("Firebase Authentication is not initialized.");
      setIsAuthReady(true);
      return;
    }

    const initAuth = async () => {
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
        if (e.code !== 'auth/already-signed-in') {
          setError("Authentication initialization failed: " + e.message);
        }
      } finally {
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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
        default:
          msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputContainerStyle = "relative mb-4";
  const inputStyle =
    "w-full p-3 bg-dark-3 border border-dark-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-1";
  const buttonStyle =
    "w-full p-3 rounded-lg bg-blue-1 text-white font-semibold hover:bg-purple-1 transition-colors duration-200 disabled:bg-gray-500 disabled:opacity-70";

  const isDisabled = loading || !isAuthReady;

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
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
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-100">Welcome Back</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">Please sign in to continue</p>

          {!isAuthReady && !error && (
            <p className="text-blue-400 text-sm mb-4 text-center">
              Initializing Authentication Service...
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <div className={inputContainerStyle}>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
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

          <div className={inputContainerStyle}>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
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

          <button
            type="submit"
            disabled={isDisabled}
            className={buttonStyle}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          <p>
            By signing in, you agree to our
            <a href="https://iain-landingpage.vercel.app/terms" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white underline mx-1">Terms and Conditions</a>
            and
            <a href="https://iain-landingpage.vercel.app/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white underline ml-1">Privacy Policy</a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default CombinedLoginPage;
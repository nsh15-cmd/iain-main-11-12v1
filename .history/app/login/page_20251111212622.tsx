"use client";

import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔹 Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/");
    });
    return () => unsubscribe();
  }, [router]);

  // 🔹 Email & Password Sign-In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
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

  // 🔹 Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputContainerStyle = "relative mb-4";
  const inputStyle =
    "w-full p-3 bg-dark-3 border border-dark-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-1";
  const buttonStyle =
    "w-full p-3 rounded-lg bg-blue-1 text-white font-semibold hover:bg-purple-1 transition-colors duration-200 disabled:bg-gray-500 disabled:opacity-70";

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-1 text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
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
          className="p-8 bg-dark-2 rounded-lg shadow-xl"
        >
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-100">
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
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={buttonStyle}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-700" />
            <span className="px-3 text-gray-400 text-sm">OR</span>
            <div className="flex-grow h-px bg-gray-700" />
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full p-3 rounded-lg bg-white text-gray-800 font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </form>

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

export default LoginPage;

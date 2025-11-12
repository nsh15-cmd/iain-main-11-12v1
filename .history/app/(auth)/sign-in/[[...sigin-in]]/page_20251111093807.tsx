"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
// -------------------------------------------------------------------------
// FIREBASE IMPORTS
// -------------------------------------------------------------------------
import { signInWithEmailAndPassword } from "firebase/auth";
// NOTE: Path adjusted from previous conversation history
import { auth } from "../../../../firebase";
// -------------------------------------------------------------------------

// Assuming these icons are available in your system setup
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const KeyIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h2m-2 4h2m-2 4h2M9 19h2m-2-4h2m-2-4h2M6 6v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2z" /></svg>
);


export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!email || !password) {
      setError("Email and password fields are required.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      window.location.href = '/';

    } catch (authError: any) {
      console.error("Firebase Sign-in Error:", authError);
      let errorMessage = "Sign-in failed. Please check your credentials.";

      switch (authError.code) {
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many login attempts. Try again later.";
          break;
        default:
          errorMessage = authError.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">

        {/* Header/Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Sign in to access the IAIN Admin Dashboard
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          {/* Error Message Display */}
          {error && (
            <div className="p-3 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900/50 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <UserIcon />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg transition duration-150 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <KeyIcon />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg transition duration-150 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400/80 transition duration-150"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Optional: Link to Sign Up */}
        <div className="text-center pt-4">
          <Link href="/signup" className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
            Don't have an account? Create one
          </Link>
        </div>
      </div>
    </main>
  );
}
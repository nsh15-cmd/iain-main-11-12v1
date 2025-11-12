"use client";

import { useState, useRef, useEffect } from "react";
// -------------------------------------------------------------------------
// FIREBASE IMPORTS
// -------------------------------------------------------------------------
import { collection, getDocs, orderBy, query, limit, doc, updateDoc, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../ firebase";
// -------------------------------------------------------------------------

import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MobileNav from "./MobileNav";

// Interface for the notification items
interface Notification {
  id: string;
  title: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

// Helper function to format time ago
const formatTimeAgo = (timestamp: Date) => {
  if (isNaN(timestamp.getTime())) return 'N/A';
  const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return timestamp.toLocaleDateString();
};


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for user authentication status
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // =================================================================
  // 🎯 STEP 1: AUTH STATE LISTENER (CRITICAL FOR USER ID)
  // =================================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setNotifications([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // =================================================================
  // 🎯 STEP 2: FIREBASE FETCH LOGIC (Filters by UID)
  // =================================================================
  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    try {
      // CRITICAL: Filter notifications where targetUid matches the current user's UID
      const notifQuery = query(
        collection(db, "notifications"),
        where("targetUid", "==", userId), // Filter by current user ID
        where("read", "==", false),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const querySnapshot = await getDocs(notifQuery);

      const fetchedNotifs: Notification[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtDate = data.createdAt ? data.createdAt.toDate() : new Date();

        return {
          id: doc.id,
          title: data.title || "New Notification",
          type: data.type || "General",
          read: data.read || false,
          createdAt: createdAtDate,
        };
      });

      setNotifications(fetchedNotifs);
    } catch (err) {
      console.error("Error fetching header notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ STEP 3: Trigger fetch only when UID is available
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications(currentUserId);
    }
  }, [currentUserId]); // Reruns whenever the UID state changes


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle marking a notification as read
  const handleNotificationClick = async (notifId: string) => {
    setIsOpen(false);

    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
    );

    try {
      const notifDocRef = doc(db, "notifications", notifId);
      await updateDoc(notifDocRef, { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read in DB:", error);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/sign-in';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="iain logo"
          className="max-sm:size-10"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          IAIN
        </p>
      </Link>

      <div className="flex-between gap-5">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            // Disable button if user is not logged in or loading
            className={`relative rounded-full p-2 text-white transition hover:bg-dark-2 max-sm:hidden ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!currentUserId}
          >
            <Bell size={22} />
            {/* Red dot indicator: visible if there are any unread notifications */}
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-dark-1" />
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-2 shadow-lg border border-dark-3 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-dark-3 flex justify-between items-center">
                <p className="text-sm font-semibold text-white">
                  Notifications ({currentUserId ? unreadCount : 0} new)
                </p>
              </div>

              <ul className="max-h-60 overflow-y-auto text-sm text-gray-300">
                {currentUserId === null ? (
                  <li className="px-4 py-3 text-center text-gray-400">Please sign in to view notifications.</li>
                ) : loading ? (
                  <li className="px-4 py-3 text-center">Loading...</li>
                ) : notifications.length === 0 ? (
                  <li className="px-4 py-3 text-center text-gray-500">No new notifications.</li>
                ) : (
                  notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`px-4 py-2 cursor-pointer ${notif.read ? 'hover:bg-dark-3' : 'bg-dark-3 hover:bg-dark-4 text-white'}`}
                      onClick={() => handleNotificationClick(notif.id)}
                    >
                      <p className="font-medium text-gray-100">{notif.title}</p>
                      <p className="text-xs text-blue-400 mt-0.5">[{notif.type}] - {formatTimeAgo(notif.createdAt)}</p>
                    </li>
                  ))
                )}
              </ul>

              <div className="p-2 text-center border-t border-dark-3">
                <Link
                  href="/notifications"
                  className="text-xs text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Placeholder for User Profile/Sign Out button */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition"
            title="Sign Out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
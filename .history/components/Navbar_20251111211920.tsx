// components/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Loader2, Settings, LogOut, Bell, X, CheckCircle, Upload, User as UserIcon } from "lucide-react";
import { doc, updateDoc, writeBatch, query, collection, where, getDocs, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";

// Import all necessary types and the hook from the Context
import { useAuth, UserState } from "@/context/AuthContext";

// --- Supporting Interfaces and Helpers (Assume imported or defined here) ---
// interface FirestoreNotification, formatTimeAgo, uploadImageToCloudinary, etc.
// ---

// The supporting components (`NotificationBell`, `ProfileDropdownUI`, etc.)
// need to be updated to accept `authInstance` and `dbInstance` from `useAuth`
// and should use `updateCurrentUserProfile` instead of setting state locally.

const Navbar = () => {
  // Use the global context hook
  const {
    currentUser,
    loading,
    isProfileLoading,
    updateCurrentUserProfile,
    authInstance,
    dbInstance,
  } = useAuth();

  const [isUpdating, setIsUpdating] = useState(false); // For local operations like mark read
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [isProfileSettingsModalOpen, setIsProfileSettingsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  // --- Utility Functions (using context instances) ---

  const markNotificationAsRead = async (id: string): Promise<void> => {
    if (isUpdating || !dbInstance) return;
    setIsUpdating(true);
    try {
      const notificationRef = doc(dbInstance, "notifications", id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    if (!currentUser || !dbInstance) return;

    setIsUpdating(true);
    const batch = writeBatch(dbInstance);
    try {
      const notifQuery = query(
        collection(dbInstance, "notifications"),
        where("targetUid", "==", currentUser.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(notifQuery);
      snapshot.docs.forEach((d) => {
        const docRef = doc(dbInstance, "notifications", d.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  // --- End Utility Functions ---


  useEffect(() => {
    // Handle click outside for the profile dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleSignOut = async () => {
    try {
      if (authInstance) {
        await signOut(authInstance);
      }
      // Use window.location for navigation since useRouter is unavailable here
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleProfileDropdown = () => {
    setIsProfileOpen((prev) => !prev);
  };

  // 1. Initial Auth Loading (First render after page load)
  if (loading) {
    return (
      <nav className="fixed z-30 w-full bg-dark-1 px-6 py-4 flex justify-between items-center border-b border-dark-2 shadow-lg">
        <span className="text-2xl font-extrabold text-white">IAIN Platform</span>
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </nav>
    );
  }

  // 2. Unauthenticated User (No currentUser)
  if (!currentUser) {
    // Render an unauthenticated navbar (e.g., just the logo and a Login button)
    return (
      <nav className="fixed z-30 w-full bg-dark-1 px-6 py-4 flex justify-between items-center border-b border-dark-2 shadow-lg">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-extrabold text-blue-500 tracking-wider">IAIN</span>
          <span className="text-2xl font-extrabold text-white">Platform</span>
        </Link>
        <Link href="/sign-in" className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition">
          Sign In
        </Link>
      </nav>
    );
  }

  // 3. Authenticated User (Render with profile and notifications)
  // This renders immediately after auth changes, even if isProfileLoading is true.
  return (
    <div className="relative">
      <nav className="fixed z-30 w-full bg-dark-1 px-6 py-4 flex justify-between items-center border-b border-dark-2 shadow-lg">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-extrabold text-blue-500 tracking-wider">IAIN</span>
          <span className="text-2xl font-extrabold text-white">Platform</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Show a mini-loader next to the profile if Firestore data is still being fetched */}
          {isProfileLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" title="Loading Profile Data..." />}

          <NotificationBell
            currentUser={currentUser}
            isUpdating={isUpdating}
            markNotificationAsRead={markNotificationAsRead}
            markAllNotificationsAsRead={markAllNotificationsAsRead}
            onNotificationSelect={setSelectedNotification}
            openFullList={() => { if (typeof window !== 'undefined') window.location.href = '/notifications'; }}
            db={dbInstance}
            auth={authInstance}
          />

          <div className="relative" ref={profileDropdownRef}>
            <ProfileDropdownUI
              currentUser={currentUser}
              isProfileOpen={isProfileOpen}
              toggleProfileDropdown={toggleProfileDropdown}
              handleSignOut={handleSignOut}
              openProfileSettingsModal={() => setIsProfileSettingsModalOpen(true)}
            />
          </div>
        </div>
      </nav>

      {/* Modals are placed outside the fixed navbar */}
      <NotificationDetailsModal
        selectedNotification={selectedNotification}
        markNotificationAsRead={markNotificationAsRead}
        onClose={() => setSelectedNotification(null)}
        db={dbInstance}
      />

      {currentUser && (
        <ProfileSettingsModal
          currentUser={currentUser}
          isOpen={isProfileSettingsModalOpen}
          onClose={() => setIsProfileSettingsModalOpen(false)}
          onUpdateSuccess={updateCurrentUserProfile} // Use the context update function
          db={dbInstance}
          auth={authInstance}
        />
      )}
    </div>
  );
};

export default Navbar;
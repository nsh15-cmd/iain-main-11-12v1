"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, User, Loader2, LogOut, Settings, Home, CheckCircle, X, Upload } from "lucide-react";
// Removed 'next/navigation' import

// Replaced external imports with direct Firebase component imports
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, updateProfile, Auth } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  writeBatch,
  getDoc,
  getDocs,
  limit,
  Firestore,
  getFirestore,
} from "firebase/firestore";

// --- Placeholder Firebase Configuration ---
// NOTE: These values are placeholders used for compiler stability since we cannot resolve "@/firebase".
// In a real Next.js environment, these should come from your global setup or environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyBVVzJHj2a8z8DEjBAGuvO4zc8fjrm92N8",
  authDomain: "project-id.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
// --- End Placeholder Firebase Configuration ---


interface Address {
  street?: string;
  city?: string;
  country?: string;
  zip?: string;
}

interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  address?: Address;
}

interface FirestoreNotification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: Timestamp;
  targetUid?: string;
  type?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface NotificationItemProps {
  id: string;
  title: string;
  description: string;
  time: string;
  isUnread?: boolean;
  onSelect: (notification: FirestoreNotification) => void;
  notification: FirestoreNotification;
}

const formatTimeAgo = (timestamp: Timestamp): string => {
  const now = new Date();
  const date = timestamp.toDate();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + "y ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + "mo ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + "d ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + "h ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + "m ago";
  }
  return "just now";
};

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/dupjdmjha/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'applicantprofile';

const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary.");
  }
};


const NotificationItem = ({ id, title, description, time, isUnread = false, onSelect, notification }: NotificationItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(notification);
  };
  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-pointer items-start gap-3 border-b border-dark-2 p-3 transition hover:bg-dark-2/70 ${isUnread ? "bg-dark-2/50" : "bg-dark-1/90"}`}
    >
      {isUnread && (
        <div className="absolute left-3 top-4 h-2 w-2 rounded-full bg-blue-500" title="Unread" />
      )}
      <div className="pl-6 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="text-xs text-white/60 min-w-max ml-4">{time}</span>
        </div>
        <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

const NotificationBell = ({ currentUser, isUpdating, markNotificationAsRead, markAllNotificationsAsRead, onNotificationSelect, openFullList, db, auth }: {
  currentUser: UserState | null;
  isUpdating: boolean;
  markNotificationAsRead: (id: string, db: Firestore) => Promise<void>;
  markAllNotificationsAsRead: (db: Firestore) => Promise<void>;
  onNotificationSelect: (notification: FirestoreNotification) => void;
  openFullList: () => void;
  db: Firestore | null;
  auth: Auth | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser || !db) {
      setNotifications([]);
      return;
    }

    const userUid = currentUser.uid;

    const notifQuery = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribeFirestore = onSnapshot(notifQuery, (snapshot) => {
      const rawFetchedNotifications: FirestoreNotification[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data(), } as FirestoreNotification)
      );

      const strictlyFilteredNotifications = rawFetchedNotifications.filter(
        notif => notif.targetUid === userUid
      );

      setNotifications(strictlyFilteredNotifications);
    }, (error) => {
      console.error("Error fetching notifications (Check Firestore Index): ", error);
    });
    return () => unsubscribeFirestore();
  }, [currentUser, db]);

  const hasUnread = notifications.some((notif) => !notif.read);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => setIsOpen(false);

  const handleSelectAndClose = (notif: FirestoreNotification) => {
    closeDropdown();
    onNotificationSelect(notif);
  };


  if (!currentUser) return null;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-white transition hover:bg-dark-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isUpdating}
      >
        <Bell size={22} />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-dark-1" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 max-h-[70vh] flex flex-col overflow-hidden rounded-xl bg-dark-1 text-white shadow-2xl border border-dark-2 z-50">
          <div className="p-3 border-b border-dark-2 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Notifications ({unreadCount})</h2>
            {hasUnread && (
              <button
                onClick={() => db && markAllNotificationsAsRead(db)}
                className={`text-xs transition font-medium ${isUpdating ? 'text-white/50 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Mark all as read'}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  id={notif.id}
                  title={notif.title}
                  description={notif.description || 'No description provided.'}
                  time={formatTimeAgo(notif.createdAt)}
                  isUnread={!notif.read}
                  onSelect={handleSelectAndClose}
                  notification={notif}
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/60">
                You're all caught up!
              </p>
            )}
          </div>
          <div className="p-2 text-center border-t border-dark-2">

          </div>
        </div>
      )}
    </div>
  );
};


const ProfileDropdownUI = ({ currentUser, isProfileOpen, toggleProfileDropdown, handleSignOut, openProfileSettingsModal }: {
  currentUser: UserState;
  isProfileOpen: boolean;
  toggleProfileDropdown: () => void;
  handleSignOut: () => Promise<void>;
  openProfileSettingsModal: () => void;
}) => {
  const initials = currentUser.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : currentUser.email?.substring(0, 2).toUpperCase() || 'U';

  const handleSettingsClick = () => {
    toggleProfileDropdown();
    openProfileSettingsModal();
  };

  return (
    <>
      <button
        onClick={toggleProfileDropdown}
        aria-label="User Menu"
        className="relative rounded-full h-10 w-10 bg-blue-600 flex items-center justify-center text-white text-sm cursor-pointer overflow-hidden ring-2 ring-transparent transition duration-150 hover:ring-blue-500 focus:outline-none focus:ring-blue-500"
      >
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-dark-1 z-10"
          title="Online" />

        {currentUser.profileImageUrl ? (
          <img
            src={currentUser.profileImageUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold">{initials}</span>
        )}
      </button>

      <div className={`absolute right-0 top-full mt-3 w-48 rounded-xl bg-dark-1 text-white shadow-2xl border border-dark-2 z-50 transform transition-all duration-200 ease-in-out origin-top-right ${isProfileOpen
        ? 'opacity-100 pointer-events-auto translate-y-0'
        : 'opacity-0 pointer-events-none translate-y-1'
        }`}>

        <p className="px-4 py-3 text-sm font-semibold border-b border-dark-2 truncate">
          {currentUser.displayName || currentUser.email}
        </p>

        <button
          onClick={handleSettingsClick}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-dark-2/70 transition"
        >
          <Settings size={16} /> Profile Settings
        </button>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 border-t border-dark-2 hover:bg-dark-2/70 transition"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </>
  );
};


const NotificationDetailsModal = ({ selectedNotification, markNotificationAsRead, onClose, db }: {
  selectedNotification: FirestoreNotification | null;
  markNotificationAsRead: (id: string, db: Firestore) => Promise<void>;
  onClose: () => void;
  db: Firestore | null;
}) => {
  if (!selectedNotification) return null;

  const handleMarkAsReadAndClose = async () => {
    if (!selectedNotification.read && db) {
      await markNotificationAsRead(selectedNotification.id, db);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-gray-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-dark-1 border border-dark-2 rounded-xl shadow-2xl transform scale-100 transition duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <header className="flex justify-between items-center border-b border-dark-2 pb-3 mb-4">
            <h2 className="text-xl font-bold text-white">Notification Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </header>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-semibold ${selectedNotification.read ? 'text-green-500' : 'text-red-500'}`}>
                {selectedNotification.read ? 'READ' : 'UNREAD'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{selectedNotification.type || 'General'}</span>
            </div>

            <p className="text-gray-400 pt-2">Title:</p>
            <p className="text-white font-medium text-lg">{selectedNotification.title}</p>

            <p className="text-gray-400 pt-2">Full Message:</p>
            <p className="text-gray-300 bg-gray-800 p-3 rounded-lg border border-dark-2">
              {selectedNotification.description}
            </p>

            <p className="text-gray-400 pt-2">Received:</p>
            <p className="text-gray-300">{selectedNotification.createdAt.toDate().toLocaleString()}</p>
          </div>

          <footer className="pt-5 flex justify-end">
            {!selectedNotification.read && (
              <button
                onClick={handleMarkAsReadAndClose}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Mark as Read & Close
              </button>
            )}
            {selectedNotification.read && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
              >
                Close
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
};


const ProfileSettingsModal = ({ currentUser, isOpen, onClose, onUpdateSuccess, db, auth }: {
  currentUser: UserState;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: UserState) => void;
  db: Firestore | null;
  auth: Auth | null;
}) => {
  const [firstName, setFirstName] = useState(currentUser.firstName || "");
  const [lastName, setLastName] = useState(currentUser.lastName || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [gender, setGender] = useState(currentUser.gender || "");
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || "");

  const [street, setStreet] = useState(currentUser.address?.street || "");
  const [city, setCity] = useState(currentUser.address?.city || "");
  const [country, setCountry] = useState(currentUser.address?.country || "");
  const [zip, setZip] = useState(currentUser.address?.zip || "");

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(currentUser.profileImageUrl || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstName(currentUser.firstName || "");
    setLastName(currentUser.lastName || "");
    setPhone(currentUser.phone || "");
    setGender(currentUser.gender || "");
    setBirthDate(currentUser.birthDate || "");
    setStreet(currentUser.address?.street || "");
    setCity(currentUser.address?.city || "");
    setCountry(currentUser.address?.country || "");
    setZip(currentUser.address?.zip || "");

    setPreviewImage(currentUser.profileImageUrl || "");
    setProfileImage(null);
    setMessage(null);
  }, [currentUser, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setProfileImage(null);
    setPreviewImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !db || !auth) return; // FIX: Ensure DB and Auth are available

    setLoading(true);
    setMessage(null);
    let newImageUrl = currentUser.profileImageUrl;

    try {
      if (profileImage) {
        newImageUrl = await uploadImageToCloudinary(profileImage);
      } else if (previewImage === "" && currentUser.profileImageUrl !== "") {
        newImageUrl = null;
      }

      const newFullName = `${firstName} ${lastName}`.trim();
      const user = auth.currentUser;

      if (user) {
        await updateProfile(user, {
          displayName: newFullName,
          photoURL: newImageUrl || null,
        });

        const userDocRef = doc(db, "accounts", user.uid);
        await updateDoc(userDocRef, {
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: newImageUrl,
          phone: phone,
          gender: gender,
          birthDate: birthDate,
          address: {
            street: street,
            city: city,
            country: country,
            zip: zip,
          },
        });

        const updatedUser: UserState = {
          ...currentUser,
          firstName,
          lastName,
          displayName: newFullName,
          profileImageUrl: newImageUrl,
          phone,
          gender,
          birthDate,
          address: { street, city, country, zip },
        };
        onUpdateSuccess(updatedUser);

        setMessage({ type: 'success', text: 'Profile updated successfully!' });

        setTimeout(onClose, 1500);

      } else {
        throw new Error("User not authenticated.");
      }

    } catch (error) {
      console.error("Profile Update Error:", error);
      setMessage({ type: 'error', text: `Failed to update profile: ${(error as Error).message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-gray-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-dark-1 border border-dark-2 rounded-xl shadow-2xl transform scale-100 transition duration-300 ease-out max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSave}>
          <div className="p-6">
            <header className="flex justify-between items-center border-b border-dark-2 pb-3 mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} /> Edit Profile Details
              </h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
                <X size={24} />
              </button>
            </header>

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 border-b border-dark-2 pb-6">
                <div className="relative h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl overflow-hidden border-4 border-dark-2">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                  <label htmlFor="profile-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition duration-300 cursor-pointer">
                    <Upload size={24} className="text-white" />
                  </label>
                  <input
                    type="file"
                    id="profile-upload"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    Change Photo
                  </button>
                  {currentUser.profileImageUrl || profileImage ? (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg text-red-400 bg-dark-2 hover:bg-dark-3 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      Remove Photo
                    </button>
                  ) : null}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white border-b border-dark-3 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+63 9xx xxxx xxxx"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    disabled={loading}
                  >
                    <option value="" className="bg-dark-2 text-gray-500">Select Gender</option>
                    <option value="Male" className="bg-dark-2">Male</option>
                    <option value="Female" className="bg-dark-2">Female</option>
                    <option value="Other" className="bg-dark-2">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    id="birthDate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white border-b border-dark-3 pb-2">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-1">Street / Barangay</label>
                  <input
                    type="text"
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Obando, Bulacan"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Obando"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-300 mb-1">Zip Code</label>
                  <input
                    type="text"
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3021"
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                  <input
                    type="text"
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-2 border border-dark-3 rounded-lg text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Philippines"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="pt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email (Cannot be changed here)</label>
                <input
                  type="email"
                  id="email"
                  value={currentUser.email || "N/A"}
                  className="w-full px-3 py-2 bg-dark-2/50 border border-dark-3 rounded-lg text-gray-400 cursor-not-allowed"
                  disabled
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
                  {message.text}
                </div>
              )}

            </div>

            <footer className="pt-6 border-t border-dark-2 mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};



const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [isProfileSettingsModalOpen, setIsProfileSettingsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<FirestoreNotification | null>(null);

  // --- Firebase Instances (Initialized in useEffect) ---
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      setAuth(getAuth(app));
      setDb(getFirestore(app));
    } catch (e) {
      console.error("Firebase App initialization failed:", e);
    }
  }, []);
  // --- End Firebase Instances ---

  const markNotificationAsRead = async (id: string, dbInstance: Firestore): Promise<void> => {
    if (isUpdating) return;
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

  const markAllNotificationsAsRead = async (dbInstance: Firestore): Promise<void> => {
    if (!currentUser) return;

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

  const handleProfileUpdateSuccess = useCallback((updatedUser: UserState) => {
    setCurrentUser(updatedUser);
  }, []);


  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let profileData: UserState = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          profileImageUrl: user.photoURL,
          firstName: '',
          lastName: '',
          phone: '',
          gender: '',
          birthDate: '',
          address: { street: '', city: '', country: '', zip: '' },
        };
        try {
          if (db) {
            const userDocRef = doc(db, "accounts", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data();

              profileData.firstName = data.firstName || '';
              profileData.lastName = data.lastName || '';
              profileData.phone = data.phone || '';
              profileData.gender = data.gender || '';
              profileData.birthDate = data.birthDate || '';
              profileData.profileImageUrl = data.profileImageUrl || null;

              profileData.address = {
                street: data.address?.street || '',
                city: data.address?.city || '',
                country: data.address?.country || '',
                zip: data.address?.zip || '',
              };

              const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
              profileData.displayName = fullName || user.displayName;

            }
          }

        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
        setCurrentUser(profileData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [auth, db]); // Depend on auth and db

  useEffect(() => {
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
      if (auth) {
        await signOut(auth);
      }
      // Use window.location for navigation since useRouter is unavailable
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

  if (loading) {
    return (
      <nav className="fixed z-30 w-full bg-dark-1 px-6 py-4 flex justify-between items-center border-b border-dark-2 shadow-lg">
        <span className="text-2xl font-extrabold text-white">IAIN Platform</span>
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </nav>
    );
  }

  return (
    <div className="relative">
      <nav className="fixed z-30 w-full bg-dark-1 px-6 py-4 flex justify-between items-center border-b border-dark-2 shadow-lg">
        <a href="/" className="flex items-center gap-1">
          <span className="text-2xl font-extrabold text-blue-500 tracking-wider">IAIN</span>
          <span className="text-2xl font-extrabold text-white">Platform</span>
        </a>

        <div className="flex items-center gap-4">
          <NotificationBell
            currentUser={currentUser}
            isUpdating={isUpdating}
            // FIX: Ensure a Promise<void> is returned regardless of db state
            markNotificationAsRead={(id) => db ? markNotificationAsRead(id, db) : Promise.resolve()}
            markAllNotificationsAsRead={() => db ? markAllNotificationsAsRead(db) : Promise.resolve()}
            onNotificationSelect={setSelectedNotification}
            // Use window.location for navigation since useRouter is unavailable
            openFullList={() => { if (typeof window !== 'undefined') window.location.href = '/notifications'; }}
            db={db}
            auth={auth}
          />

          {currentUser && (
            <div className="relative" ref={profileDropdownRef}>
              <ProfileDropdownUI
                currentUser={currentUser}
                isProfileOpen={isProfileOpen}
                toggleProfileDropdown={toggleProfileDropdown}
                handleSignOut={handleSignOut}
                openProfileSettingsModal={() => setIsProfileSettingsModalOpen(true)}
              />
            </div>
          )}
        </div>
      </nav>

      <NotificationDetailsModal
        selectedNotification={selectedNotification}
        markNotificationAsRead={(id) => db ? markNotificationAsRead(id, db) : Promise.resolve()}
        onClose={() => setSelectedNotification(null)}
        db={db}
      />

      {currentUser && (
        <ProfileSettingsModal
          currentUser={currentUser}
          isOpen={isProfileSettingsModalOpen}
          onClose={() => setIsProfileSettingsModalOpen(false)}
          onUpdateSuccess={handleProfileUpdateSuccess}
          db={db}
          auth={auth}
        />
      )}
    </div>
  );
};

export default Navbar;
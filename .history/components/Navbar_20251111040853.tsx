"use client";

import { useState, useRef, useEffect } from "react";
// -------------------------------------------------------------------------
// FIREBASE IMPORTS
// -------------------------------------------------------------------------
import { collection, getDocs, orderBy, query, limit, doc, updateDoc, where } from "firebase/firestore";
// NOTE: Assuming db is correctly configured and exported from root firebase setup
import { db } from "../../../firebase"; 
// -------------------------------------------------------------------------

import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";
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
    
    // Determine unread status for the red dot indicator
    const unreadCount = notifications.filter(n => !n.read).length;

    // =================================================================
    // 🎯 FIREBASE FETCH LOGIC (Focus on UNREAD for high priority)
    // =================================================================
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // Query the latest 5 UNREAD notifications
            const notifQuery = query(
                collection(db, "notifications"),
                where("read", "==", false), // Fetch only UNREAD
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
            // Silent fail for non-critical header element
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch data when component mounts
    useEffect(() => {
        fetchNotifications();
    }, []); 

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

    // Handle marking a notification as read and closing the dropdown
    const handleNotificationClick = async (notifId: string) => {
        setIsOpen(false); // Close dropdown immediately
        
        // Optimistically update local state
        setNotifications(prev => 
            prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
        );
        
        // Update Firestore in the background
        try {
            const notifDocRef = doc(db, "notifications", notifId);
            await updateDoc(notifDocRef, { read: true });
        } catch (error) {
            console.error("Failed to mark notification as read in DB:", error);
            // NOTE: Error handling for local state reversal omitted for simplicity
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
                        className="relative rounded-full p-2 text-white transition hover:bg-dark-2 max-sm:hidden"
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
                                    Notifications ({unreadCount} new)
                                </p>
                                {/* Button to View All - Could also include Mark All as Read button */}
                            </div>

                            <ul className="max-h-60 overflow-y-auto text-sm text-gray-300">
                                {loading ? (
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

                <SignedIn>
                    <UserButton afterSignOutUrl="/sign-in" />
                </SignedIn>

                <MobileNav />
            </div>
        </nav>
    );
};

export default Navbar;
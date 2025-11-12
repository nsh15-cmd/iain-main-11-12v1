"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";
import MobileNav from "./MobileNav";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-dark-1" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-2 shadow-lg border border-dark-3 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-dark-3">
                <p className="text-sm font-semibold text-white">
                  Notifications
                </p>
              </div>

              <ul className="max-h-60 overflow-y-auto text-sm text-gray-300">
                <li className="px-4 py-2 hover:bg-dark-3 cursor-pointer">
                  🎤 Your mock interview report is ready.
                </li>
                <li className="px-4 py-2 hover:bg-dark-3 cursor-pointer">
                  ⏰ Interview reminder: Tomorrow at 3PM.
                </li>
                <li className="px-4 py-2 hover:bg-dark-3 cursor-pointer">
                  🧠 New AI tip: Practice confidence-based answers.
                </li>
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
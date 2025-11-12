"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    icon: "bell",
    title: "New Meeting Scheduled",
    description: "Your meeting with 'Tech Team' is set for 10:00 AM tomorrow.",
    time: "5m ago",
    read: false,
  },
  {
    id: 2,
    icon: "bell",
    title: "Recording Ready",
    description: "Your 'Project Kickoff' meeting recording is now available.",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    icon: "bell",
    title: "Reminder",
    description: "You have an upcoming meeting in 15 minutes.",
    time: "2h ago",
    read: true,
  },
];

interface NotificationItemProps {
  title: string;
  description: string;
  time: string;
  isUnread?: boolean;
}

const NotificationItem = ({
  title,
  description,
  time,
  isUnread = false,
}: NotificationItemProps) => {
  return (
    <div
      className={`relative flex cursor-pointer gap-3 border-b border-dark-2 p-3 transition hover:bg-dark-2/70 ${
        isUnread ? "bg-dark-2" : "bg-dark-1"
      }`}
    >
      {isUnread && (
        <div className="absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
      )}
      <div className="pl-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-white/60">{time}</span>
        </div>
        <p className="text-xs text-white/80">{description}</p>
      </div>
    </div>
  );
};

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setHasNotification(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative rounded-full p-2 text-white transition hover:bg-dark-2"
      >
        <Bell size={22} />
        {hasNotification && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-dark-1" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] flex flex-col overflow-hidden rounded-xl bg-dark-1 text-white shadow-xl border border-dark-2">
          <div className="p-3 border-b border-dark-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {DUMMY_NOTIFICATIONS.length > 0 ? (
              DUMMY_NOTIFICATIONS.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  title={notif.title}
                  description={notif.description}
                  time={notif.time}
                  isUnread={!notif.read}
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/60">
                You're all caught up!
              </p>
            )}
          </div>

          <div className="p-2 text-center border-t border-dark-2">
            <a
              href="/notifications"
              className="text-sm text-blue-500 hover:underline"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

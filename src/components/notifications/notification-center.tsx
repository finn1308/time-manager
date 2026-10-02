"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Flame,
  GraduationCap,
  AlertCircle,
  CheckSquare,
  Clock,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 90 seconds
    const interval = setInterval(fetchNotifications, 90000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }).catch(() => {});

    if (link) {
      setOpen(false);
      router.push(link);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    fetch("/api/notifications/mark-all-read", { method: "POST" }).catch(() => {});
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "DEADLINE":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "EXAM":
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case "MISSED_SESSION":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "STREAK":
        return <Flame className="w-4 h-4 text-orange-500 fill-current" />;
      case "UNFINISHED_TASK":
        return <CheckSquare className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-[#2d6a4f]" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-8 h-8 rounded-full bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
        title="Thông báo"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-[#101c14] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[26px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbe7dd]/80 dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] font-semibold">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#2d6a4f] dark:text-[#52b788] hover:underline cursor-pointer"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-[#dbe7dd]/50 dark:divide-[#263d2e]/50 flex-1">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id, item.link)}
                className={`p-3.5 flex items-start space-x-3 transition-colors cursor-pointer ${
                  !item.isRead
                    ? "bg-[#f4f8f5]/80 dark:bg-[#1d3024]/40 hover:bg-[#ebf4ed]"
                    : "hover:bg-[#fcfdfc] dark:hover:bg-[#132217]"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getNotifIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${!item.isRead ? "font-bold text-[#192e22] dark:text-[#f0f7f2]" : "font-medium text-[#526b5c] dark:text-[#a3bda9]"}`}>
                      {item.title}
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 ml-1.5" style={{ display: item.isRead ? "none" : "block" }} />
                  </div>

                  <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] leading-snug">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-[#73927d]">
                    <span>
                      {new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="text-[#73927d] hover:text-rose-500 transition-colors p-1"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-12 text-center text-xs text-[#73927d] space-y-1">
                <Bell className="w-6 h-6 mx-auto opacity-30 mb-2" />
                <p>Không có thông báo mới</p>
                <p className="text-[10px] opacity-75">Tất cả bài tập, kỳ thi và streak đều trong tầm kiểm soát!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

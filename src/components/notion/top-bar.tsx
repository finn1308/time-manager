"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatVN } from "@/lib/date-utils";
import { Sparkles, Search, Plus, Bot, Calendar, BookOpen, Target, Play, Zap, Sun, Moon } from "lucide-react";
import { CommandPalette } from "./command-palette";
import { AiStudyCoachModal } from "../ai/ai-study-coach-modal";
import { QuickCaptureModal } from "./quick-capture-modal";
import { NotificationCenter } from "../notifications/notification-center";
import { usePipTimer } from "../timer/pip-timer-provider";

interface TopBarProps {
  user: {
    name: string | null;
    email: string;
  };
}

// Greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function TopBar({ user }: TopBarProps) {
  const [now] = useState(new Date());
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isQuickAddMenuOpen, setIsQuickAddMenuOpen] = useState(false);
  const { startTimer } = usePipTimer();

  // Global keyboard shortcut: Cmd+K or Ctrl+K, and 'c' for Quick Capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (
        !isInput &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "c"
      ) {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const greeting = getGreeting();
  const firstName = user.name?.split(" ").pop() || "bạn";
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 pt-safe"
        style={{
          background: "rgba(255, 250, 244, 0.88)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        {/* Left: Greeting + Date */}
        <div className="flex flex-col justify-center min-w-0">
          {/* Desktop: show greeting */}
          <p
            className="hidden md:block text-[11px] font-semibold truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {greeting}, <span style={{ color: "var(--lavender-dark)" }}>{firstName}</span> 👋
          </p>
          {/* All sizes: formatted date */}
          <p
            className="text-xs font-semibold truncate"
            style={{ color: "var(--text-subtle)" }}
          >
            <span className="hidden md:inline">
              {formatVN(now, "EEEE, dd 'thg' MM, yyyy")}
            </span>
            <span className="hidden sm:inline md:hidden">
              {formatVN(now, "dd 'thg' MM, yyyy")}
            </span>
            <span className="inline sm:hidden font-mono text-[11px]">
              {formatVN(now, "dd/MM/yyyy")}
            </span>
          </p>
        </div>

        {/* Right: Action Buttons + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search / Cmd+K */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 h-8 w-8 sm:w-auto sm:px-3 rounded-xl transition-all cursor-pointer focus-glow active:scale-95"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-subtle)",
            }}
            title="Tìm kiếm (⌘K)"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span
              className="hidden md:inline text-[11px] font-medium whitespace-nowrap"
              style={{ color: "var(--text-subtle)" }}
            >
              Tìm kiếm
            </span>
            <kbd
              className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded-md"
              style={{
                background: "var(--bg-muted)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* AI Coach Button */}
          <button
            onClick={() => setIsCoachOpen(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
            style={{
              background: "var(--lavender-bg)",
              border: "1px solid var(--lavender-soft)",
              color: "var(--lavender-dark)",
            }}
            title="AI Study Coach"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Coach</span>
          </button>

          {/* AI Schedule Link (Desktop) */}
          <Link href="/calendar" className="hidden lg:flex">
            <button
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 text-white"
              style={{
                background: "linear-gradient(135deg, var(--lavender) 0%, var(--blush) 100%)",
              }}
              title="Lập lịch AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lập lịch AI</span>
            </button>
          </Link>

          {/* Quick Capture (Zap) */}
          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
            style={{
              background: "var(--lemon-bg)",
              border: "1px solid var(--lemon-soft)",
              color: "var(--lemon-dark)",
            }}
            title="Ghi nhận nhanh (C)"
          >
            <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="hidden sm:inline">Ghi nhanh</span>
          </button>

          {/* Quick Add (+) */}
          <div className="relative">
            <button
              onClick={() => setIsQuickAddMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              style={{
                background: "linear-gradient(135deg, var(--lavender) 0%, var(--peach) 100%)",
              }}
              title="Thêm nhanh"
            >
              <Plus className="w-4 h-4" />
            </button>

            {isQuickAddMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQuickAddMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl p-1.5 z-50 animate-scale-in"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-xl)",
                  }}
                >
                  {[
                    {
                      label: "Ghi nhận nhanh (C)",
                      icon: Zap,
                      color: "var(--lemon-dark)",
                      action: () => {
                        setIsQuickAddMenuOpen(false);
                        setIsQuickCaptureOpen(true);
                      },
                    },
                    {
                      label: "Hỏi AI Coach",
                      icon: Bot,
                      color: "var(--lavender-dark)",
                      action: () => {
                        setIsQuickAddMenuOpen(false);
                        setIsCoachOpen(true);
                      },
                      mobileOnly: true,
                    },
                    {
                      label: "Bật Timer ngay",
                      icon: Play,
                      color: "var(--mint-dark)",
                      action: () => {
                        setIsQuickAddMenuOpen(false);
                        startTimer({
                          id: "quick",
                          name: "Phiên học tự do",
                          code: "STUDY",
                          color: "var(--mint)",
                        });
                      },
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          item.mobileOnly ? "sm:hidden" : ""
                        }`}
                        style={{ color: "var(--text-body)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  <div
                    className="my-1"
                    style={{ height: "1px", background: "var(--border-soft)" }}
                  />

                  {[
                    { label: "Tạo lịch học mới", href: "/calendar", icon: Calendar, color: "var(--peach)" },
                    { label: "Thêm môn học", href: "/subjects", icon: BookOpen, color: "var(--sky)" },
                    { label: "Thêm mục tiêu", href: "/goals", icon: Target, color: "var(--rose)" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsQuickAddMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                        style={{ color: "var(--text-body)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-elevated)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Notification Center */}
          <NotificationCenter />

          {/* User Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--lavender) 0%, var(--blush) 100%)",
            }}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* Modals */}
      <CommandPalette
        open={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenCoach={() => setIsCoachOpen(true)}
      />
      <QuickCaptureModal
        open={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />
      <AiStudyCoachModal
        open={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </>
  );
}

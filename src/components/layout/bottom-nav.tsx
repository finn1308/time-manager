"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  CheckSquare,
  Brain,
  Menu,
  X,
  BookOpen,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  Play,
  Sparkles,
} from "lucide-react";
import { usePipTimer } from "../timer/pip-timer-provider";

// Bottom bar — 4 primary nav items
const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
    color: "var(--lavender)",
    bg: "var(--lavender-bg)",
  },
  {
    label: "Lịch học",
    href: "/calendar",
    icon: Calendar,
    color: "var(--peach)",
    bg: "var(--peach-bg)",
  },
  {
    label: "Nhiệm vụ",
    href: "/tasks",
    icon: CheckSquare,
    color: "var(--mint)",
    bg: "var(--mint-bg)",
  },
  {
    label: "Practice",
    href: "/practice",
    icon: Brain,
    color: "var(--lemon)",
    bg: "var(--lemon-bg)",
  },
];

// Full drawer items
const drawerItems = [
  { label: "Dashboard", href: "/", icon: Home, color: "var(--lavender)" },
  { label: "Lịch học", href: "/calendar", icon: Calendar, color: "var(--peach)" },
  { label: "Nhiệm vụ", href: "/tasks", icon: CheckSquare, color: "var(--mint)" },
  { label: "Môn học", href: "/subjects", icon: BookOpen, color: "var(--sky)" },
  { label: "Practice", href: "/practice", icon: Brain, color: "var(--lemon)" },
  { label: "Skills", href: "/skills", icon: Target, color: "var(--rose)" },
  { label: "Thống kê", href: "/progress", icon: TrendingUp, color: "var(--teal)" },
  { label: "Cài đặt", href: "/settings", icon: Settings, color: "var(--lilac)" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { startTimer } = usePipTimer();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ── Mobile Bottom Bar ────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
        style={{
          background: "rgba(255, 250, 244, 0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "1px solid var(--border-soft)",
          boxShadow: "0 -4px 20px rgba(26, 21, 37, 0.06)",
        }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-full min-h-[44px] py-1 gap-0.5 transition-all"
              >
                <div
                  className="flex items-center justify-center w-9 h-7 rounded-xl transition-all"
                  style={
                    isActive
                      ? { background: item.bg }
                      : { background: "transparent" }
                  }
                >
                  <Icon
                    className="w-[18px] h-[18px] transition-all"
                    style={{
                      color: isActive ? item.color : "var(--text-muted)",
                    }}
                  />
                </div>
                <span
                  className="text-[9px] font-semibold transition-colors"
                  style={{
                    color: isActive ? item.color : "var(--text-muted)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center w-full min-h-[44px] py-1 gap-0.5 cursor-pointer"
          >
            <div className="flex items-center justify-center w-9 h-7 rounded-xl">
              <Menu
                className="w-[18px] h-[18px]"
                style={{ color: drawerOpen ? "var(--lavender)" : "var(--text-muted)" }}
              />
            </div>
            <span
              className="text-[9px] font-semibold"
              style={{ color: drawerOpen ? "var(--lavender)" : "var(--text-muted)" }}
            >
              Thêm
            </span>
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity"
            style={{ background: "rgba(26, 21, 37, 0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className="relative w-4/5 max-w-[300px] h-full flex flex-col z-50 pt-safe pb-safe overflow-y-auto animate-slide-up"
            style={{
              background: "var(--bg-sidebar)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid var(--border-soft)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--lavender) 0%, var(--peach) 100%)",
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p
                    className="text-sm font-extrabold"
                    style={{
                      color: "var(--text-ink)",
                      fontFamily: "var(--font-nunito, Nunito)",
                    }}
                  >
                    ChronoMind
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Tất cả tính năng
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-xl cursor-pointer transition-colors"
                style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Timer CTA */}
            <div className="px-4 pt-4">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  startTimer({
                    id: "general",
                    name: "Phiên học tự do",
                    code: "STUDY",
                    color: "var(--mint)",
                  });
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-bold text-white cursor-pointer active:scale-[0.98] transition-transform"
                style={{
                  background: "linear-gradient(135deg, var(--mint) 0%, var(--sky) 100%)",
                  boxShadow: "0 4px 16px rgba(58, 188, 162, 0.35)",
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bật Study Timer ngay</span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 pt-3 pb-3 space-y-0.5">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={
                      isActive
                        ? {
                            background: "var(--bg-elevated)",
                            color: item.color,
                          }
                        : { color: "var(--text-body)" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-elevated)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      }
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <span>{item.label}</span>
                    {isActive && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: item.color }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer - Logout */}
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid var(--border-soft)" }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                style={{ color: "var(--rose)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--rose-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

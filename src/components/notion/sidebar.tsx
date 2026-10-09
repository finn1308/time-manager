"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  CheckSquare,
  BookOpen,
  Target,
  Brain,
  TrendingUp,
  Settings,
  Play,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react";
import { usePipTimer } from "../timer/pip-timer-provider";

interface SidebarProps {
  user: {
    name: string | null;
    email: string;
    image?: string | null;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string;
    icon?: string | null;
  }>;
}

// Feature nav items — each with its own pastel color identity
const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
    colorVar: "lavender",
    activeBg: "var(--lavender-bg)",
    activeBorder: "var(--lavender-soft)",
    activeText: "var(--lavender-dark)",
    iconBg: "var(--lavender-bg)",
    iconColor: "var(--lavender)",
  },
  {
    label: "Lịch học",
    href: "/calendar",
    icon: Calendar,
    colorVar: "peach",
    activeBg: "var(--peach-bg)",
    activeBorder: "var(--peach-soft)",
    activeText: "var(--peach-dark)",
    iconBg: "var(--peach-bg)",
    iconColor: "var(--peach)",
  },
  {
    label: "Nhiệm vụ",
    href: "/tasks",
    icon: CheckSquare,
    colorVar: "mint",
    activeBg: "var(--mint-bg)",
    activeBorder: "var(--mint-soft)",
    activeText: "var(--mint-dark)",
    iconBg: "var(--mint-bg)",
    iconColor: "var(--mint)",
  },
  {
    label: "Môn học",
    href: "/subjects",
    icon: BookOpen,
    colorVar: "sky",
    activeBg: "var(--sky-bg)",
    activeBorder: "var(--sky-soft)",
    activeText: "var(--sky-dark)",
    iconBg: "var(--sky-bg)",
    iconColor: "var(--sky)",
  },
  {
    label: "Skills",
    href: "/skills",
    icon: Target,
    colorVar: "rose",
    activeBg: "var(--rose-bg)",
    activeBorder: "var(--rose-soft)",
    activeText: "var(--rose-dark)",
    iconBg: "var(--rose-bg)",
    iconColor: "var(--rose)",
    badge: "HOT",
  },
  {
    label: "Practice",
    href: "/practice",
    icon: Brain,
    colorVar: "lemon",
    activeBg: "var(--lemon-bg)",
    activeBorder: "var(--lemon-soft)",
    activeText: "var(--lemon-dark)",
    iconBg: "var(--lemon-bg)",
    iconColor: "var(--lemon)",
  },
  {
    label: "Thống kê",
    href: "/progress",
    icon: TrendingUp,
    colorVar: "teal",
    activeBg: "var(--teal-bg)",
    activeBorder: "var(--teal-soft)",
    activeText: "var(--teal-dark)",
    iconBg: "var(--teal-bg)",
    iconColor: "var(--teal)",
  },
  {
    label: "Cài đặt",
    href: "/settings",
    icon: Settings,
    colorVar: "lilac",
    activeBg: "var(--lilac-bg)",
    activeBorder: "var(--lilac-soft)",
    activeText: "var(--lilac-dark)",
    iconBg: "var(--lilac-bg)",
    iconColor: "var(--lilac)",
  },
];

export function Sidebar({ user, subjects = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { startTimer, activeSubject } = usePipTimer();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // User initials
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <aside
      className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-40 flex-col justify-between transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-soft)",
      }}
    >
      {/* ── Top: Logo & Brand ───────────────────────────────── */}
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div
          className="flex items-center h-14 px-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Logo mark */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: "linear-gradient(135deg, var(--lavender) 0%, var(--peach) 100%)",
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <p
                  className="text-sm font-extrabold truncate leading-tight"
                  style={{ color: "var(--text-ink)", fontFamily: "var(--font-nunito, Nunito)" }}
                >
                  ChronoMind
                </p>
                <p className="text-[10px] font-medium truncate" style={{ color: "var(--text-muted)" }}>
                  Study OS 2.0
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background: "linear-gradient(135deg, var(--lavender) 0%, var(--peach) 100%)",
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              title="Thu gọn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            title="Mở rộng"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* ── Navigation ─────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative"
                style={
                  isActive
                    ? {
                        background: item.activeBg,
                        color: item.activeText,
                        border: `1px solid ${item.activeBorder}`,
                      }
                    : {
                        color: "var(--text-subtle)",
                        border: "1px solid transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-elevated)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-ink)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-subtle)";
                  }
                }}
              >
                {/* Icon container */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: isActive ? item.iconBg : "transparent",
                  }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{
                      color: isActive ? item.iconColor : "currentColor",
                    }}
                  />
                </div>

                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 shrink-0"
                        style={{
                          background: "var(--rose)",
                          color: "#fff",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Quick Start Subjects ────────────────────────────── */}
        {!collapsed && (
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid var(--border-soft)" }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Vào học nhanh
              </span>
              <Zap className="w-3 h-3" style={{ color: "var(--lemon)" }} />
            </div>

            {subjects.length === 0 ? (
              <div
                className="p-2.5 rounded-xl text-center"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px dashed var(--border)",
                }}
              >
                <p className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Chưa có môn học
                </p>
                <Link
                  href="/subjects"
                  className="inline-flex items-center gap-1 text-[11px] font-bold"
                  style={{ color: "var(--lavender)" }}
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm môn học</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-0.5 max-h-36 overflow-y-auto">
                {subjects.map((sub) => {
                  const isCurrent = activeSubject?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className="group flex items-center justify-between px-2 py-1.5 rounded-xl transition-all cursor-default"
                      style={{
                        background: isCurrent ? "var(--bg-elevated)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = isCurrent
                          ? "var(--bg-elevated)"
                          : "transparent";
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || "var(--lavender)" }}
                        />
                        <span
                          className="truncate text-[11px] font-medium"
                          style={{ color: "var(--text-body)" }}
                        >
                          {sub.code ? `[${sub.code}] ` : ""}
                          {sub.name}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          startTimer({
                            id: sub.id,
                            name: sub.name,
                            code: sub.code,
                            color: sub.color,
                            icon: sub.icon,
                          })
                        }
                        title={`Học ${sub.name}`}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white transition-all shrink-0 cursor-pointer"
                        style={{ background: sub.color || "var(--mint)" }}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom: User Profile ────────────────────────────── */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: "1px solid var(--border-soft)" }}
      >
        <div
          className="flex items-center gap-2.5 p-2 rounded-xl transition-all"
          style={{ background: "var(--bg-elevated)" }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--lavender) 0%, var(--blush) 100%)",
            }}
          >
            {initials}
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: "var(--text-ink)" }}
                >
                  {user.name || "Người dùng"}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {user.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--rose)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--rose-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

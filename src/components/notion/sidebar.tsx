"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Flame,
  BookOpen,
  Target,
  History,
  BarChart3,
  Settings,
  CheckSquare,
  CheckCircle2,
  TrendingUp,
  Brain,
  FileText,
  Clock,
  Play,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  GraduationCap,
  Briefcase,
  Home,
  LayoutGrid,
  PlaySquare,
  ShoppingBag,
  Award,
  ArrowLeft,
  Languages,
  ShieldCheck,
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

export function Sidebar({ user, subjects = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { startTimer, activeSubject } = usePipTimer();

  const navItems = [
    { label: "Home", href: "/", icon: Home, iconColor: "text-sky-500" },
    { label: "Learn", href: "/learn", icon: BookOpen, iconColor: "text-emerald-500" },
    { label: "Vocab", href: "/vocab", icon: Brain, iconColor: "text-purple-500" },
    { label: "Schedule", href: "/schedule", icon: Calendar, iconColor: "text-amber-500" },
    { label: "Progress", href: "/progress", icon: TrendingUp, iconColor: "text-teal-500" },
    { label: "Settings", href: "/settings", icon: Settings, iconColor: "text-slate-500" },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-40 flex-col justify-between border-r border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#132217] text-[#192e22] dark:text-[#f0f7f2] transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top: Header & Brand */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 pb-3 border-b border-[#dbe7dd]/80 dark:border-[#263d2e]">
            {!collapsed && (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#52b788] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  CM
                </div>
                <div className="truncate">
                  <h2 className="text-sm font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] truncate">
                    ChronoMind
                  </h2>
                  <p className="text-[10px] text-[#526b5c] dark:text-[#a3bda9] font-medium truncate">
                    Study Operating System
                  </p>
                </div>
              </div>
            )}

            {collapsed && (
              <div className="w-9 h-9 mx-auto rounded-2xl bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#52b788] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                CM
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#73927d] hover:text-[#192e22] dark:hover:text-[#f0f7f2] cursor-pointer transition-colors"
              title={collapsed ? "Mở rộng thanh bên" : "Thu gọn"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const iconColor = item.iconColor;
              const isHighlight = item.highlight;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] font-bold shadow-2xs"
                      : isHighlight
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/40"
                      : "hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? "bg-[#2d6a4f] text-white shadow-2xs"
                        : "bg-white dark:bg-[#17261c] border border-[#dbe7dd]/60 dark:border-[#263d2e]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : iconColor || "text-[#526b5c]"}`} />
                  </div>
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {isHighlight && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                          HOT
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Start Subjects List */}
          {!collapsed && (
            <div className="px-3 pt-3 pb-2 border-t border-[#dbe7dd]/80 dark:border-[#263d2e] mt-1">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#73927d] dark:text-[#8ba393] mb-2 px-1">
                <span>Vào học nhanh</span>
                <Clock className="w-3.5 h-3.5 text-[#52b788]" />
              </div>

              {subjects.length === 0 ? (
                <div className="p-3 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-center">
                  <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">Chưa có môn học</p>
                  <Link
                    href="/subjects"
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#2d6a4f] dark:text-[#52b788] hover:underline mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm môn học</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {subjects.map((sub) => {
                    const isCurrent = activeSubject?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        className={`group flex items-center justify-between p-2 rounded-2xl text-xs transition-all ${
                          isCurrent
                            ? "bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] border border-[#b7d8c3]"
                            : "hover:bg-white dark:hover:bg-[#17261c] text-[#192e22] dark:text-[#f0f7f2] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color || "#2d6a4f" }}
                          />
                          <span className="truncate font-medium text-[11px]">
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
                          title={`Bắt đầu học môn ${sub.name}`}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-2xs transition-all cursor-pointer shrink-0"
                        >
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-3 border-t border-[#dbe7dd]/80 dark:border-[#263d2e]">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e]">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                    {user.name || "Người dùng"}
                  </p>
                  <p className="text-[10px] text-[#526b5c] dark:text-[#a3bda9] truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

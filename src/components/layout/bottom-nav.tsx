"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Flame,
  Menu,
  X,
  BookOpen,
  Target,
  Brain,
  FileText,
  Sparkles,
  History,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Play,
  GraduationCap,
  Briefcase,
  Home,
  LayoutGrid,
  PlaySquare,
  ShoppingBag,
  Award,
  Languages,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { usePipTimer } from "../timer/pip-timer-provider";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { startTimer } = usePipTimer();

  const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Practice", href: "/practice", icon: Brain },
    { label: "Statistics", href: "/progress", icon: TrendingUp },
  ];

  const drawerItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Subjects", href: "/subjects", icon: BookOpen },
    { label: "Practice", href: "/practice", icon: Brain },
    { label: "Statistics", href: "/progress", icon: TrendingUp },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Bottom Bar for Mobile (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#132217]/90 backdrop-blur-md border-t border-[#dbe7dd] dark:border-[#263d2e] pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full min-h-[44px] py-1 transition-colors ${
                  isActive
                    ? "text-[#2d6a4f] dark:text-[#52b788]"
                    : "text-[#73927d] dark:text-[#8ba393] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
                }`}
              >
                <div
                  className={`flex items-center justify-center p-1.5 rounded-2xl transition-all ${
                    isActive ? "bg-[#d8ebe0] dark:bg-[#1d3827] shadow-2xs scale-105" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu Drawer Toggle Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center w-full min-h-[44px] py-1 transition-colors cursor-pointer ${
              drawerOpen
                ? "text-[#2d6a4f] dark:text-[#52b788]"
                : "text-[#73927d] dark:text-[#8ba393] hover:text-[#192e22]"
            }`}
          >
            <div className="flex items-center justify-center p-1.5 rounded-2xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Thêm</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer (Menu) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#132217] h-full shadow-2xl flex flex-col justify-between z-50 p-5 pt-safe pb-safe overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#dbe7dd] dark:border-[#263d2e]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#2d6a4f] text-white flex items-center justify-center font-bold text-xs">
                    CM
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                      ChronoMind Menu
                    </h3>
                    <p className="text-[10px] text-[#73927d]">Tất cả tính năng học tập</p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#73927d]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Study Launcher */}
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  startTimer({
                    id: "general",
                    name: "Phiên học tự do",
                    code: "STUDY",
                    color: "#2d6a4f",
                  });
                }}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-2xl bg-[#2d6a4f] text-white font-bold text-xs shadow-2xs cursor-pointer active:scale-98 transition-transform"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bật Study Timer ngay</span>
              </button>

              {/* Navigation Links */}
              <div className="space-y-1">
                {drawerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] font-bold"
                          : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#f4f8f5] dark:hover:bg-[#17261c]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-[#2d6a4f] dark:text-[#52b788]" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#dbe7dd] dark:border-[#263d2e]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
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

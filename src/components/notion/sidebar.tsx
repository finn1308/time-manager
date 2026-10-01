"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Lock,
  BarChart3,
  Settings,
  Clock,
  Play,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Flame,
} from "lucide-react";
import { usePipTimer, ActiveSubject } from "../timer/pip-timer-provider";

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
    icon: string | null;
  }>;
}

export function Sidebar({ user, subjects }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { startTimer, activeSubject } = usePipTimer();

  const navItems = [
    { label: "Trang chủ", href: "/", icon: LayoutDashboard },
    { label: "Lịch tuần & tháng", href: "/calendar", icon: Calendar },
    { label: "Bộ môn & Mục tiêu", href: "/subjects", icon: BookOpen },
    { label: "Khung giờ bị khóa", href: "/blocked-slots", icon: Lock },
    { label: "Báo cáo Planned vs Actual", href: "/analytics", icon: BarChart3 },
    { label: "Cài đặt & Bảo mật", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-3.5 left-3.5 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-800 dark:text-white cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Top: Header & Workspace Title */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            {!collapsed && (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                  CM
                </div>
                <div className="truncate">
                  <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    ChronoMind
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    Study Operating System
                  </p>
                </div>
              </div>
            )}

            {collapsed && (
              <div className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                CM
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
              title={collapsed ? "Mở rộng thanh bên" : "Thu gọn"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-3.5 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs"
                      : "hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Quick Start Subjects List */}
          {!collapsed && (
            <div className="px-4 pt-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
                <span>Vào học nhanh (Timer)</span>
                <Clock className="w-3.5 h-3.5 text-blue-500" />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isCurrent = activeSubject?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={`group flex items-center justify-between p-2 rounded-2xl text-xs transition-all ${
                        isCurrent
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="truncate font-medium">
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
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all cursor-pointer shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name || "Khách"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
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

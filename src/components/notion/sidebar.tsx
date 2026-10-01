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
  Search,
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
    { label: "Tổng quan", href: "/", icon: LayoutDashboard },
    { label: "Lịch tuần & tháng", href: "/calendar", icon: Calendar },
    { label: "Môn học & Mục tiêu", href: "/subjects", icon: BookOpen },
    { label: "Khung giờ bị khóa", href: "/blocked-slots", icon: Lock },
    { label: "Phân tích Planned vs Actual", href: "/analytics", icon: BarChart3 },
    { label: "Cài đặt AI & Bảo mật", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-sm text-[#37352f] dark:text-[#f0f0f0] cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#f7f6f3] dark:bg-[#1f1f1f] text-[#37352f] dark:text-[#d4d4d4] transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Top: Header & Workspace Title */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
            {!collapsed && (
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-md bg-[#2383e2] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  CM
                </div>
                <div className="truncate">
                  <h2 className="text-sm font-semibold tracking-tight text-[#171717] dark:text-white truncate">
                    ChronoMind
                  </h2>
                  <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate">
                    Study Operating System
                  </p>
                </div>
              </div>
            )}

            {collapsed && (
              <div className="w-7 h-7 mx-auto rounded-md bg-[#2383e2] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                CM
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1 rounded hover:bg-[#e8e8e6] dark:hover:bg-[#2c2c2c] text-[#787774] cursor-pointer"
              title={collapsed ? "Mở rộng thanh bên" : "Thu gọn"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#e8e8e6] dark:bg-[#2c2c2c] text-[#171717] dark:text-white font-semibold"
                      : "hover:bg-[#ebebea] dark:hover:bg-[#262626] text-[#5a5955] dark:text-[#a0a0a0]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Quick Start Subjects List */}
          {!collapsed && (
            <div className="px-3 pt-4 pb-2 border-t border-[#e9e9e7] dark:border-[#2e2e2e] mt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#787774] dark:text-[#9b9a97] mb-2 px-1">
                <span>Vào học nhanh (Timer)</span>
                <Clock className="w-3 h-3" />
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isCurrent = activeSubject?.id === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                        isCurrent
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                          : "hover:bg-[#ebebea] dark:hover:bg-[#262626] text-[#37352f] dark:text-[#d4d4d4]"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
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
                        title={`Bắt đầu đếm giờ học môn ${sub.name}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 transition-opacity cursor-pointer shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-3 border-t border-[#e9e9e7] dark:border-[#2e2e2e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-medium text-[#171717] dark:text-white truncate">
                    {user.name || "Người dùng"}
                  </p>
                  <p className="text-[10px] text-[#787774] dark:text-[#9b9a97] truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-md hover:bg-[#ebebea] dark:hover:bg-[#2c2c2c] text-[#787774] hover:text-rose-600 transition-colors cursor-pointer"
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

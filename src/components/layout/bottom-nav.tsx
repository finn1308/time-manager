"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Target,
  BarChart3,
  Menu
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Lịch", href: "/calendar", icon: Calendar },
    { label: "Môn", href: "/subjects", icon: BookOpen },
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Thống kê", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#132217] border-t border-[#dbe7dd] dark:border-[#263d2e] pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive
                  ? "text-[#2d6a4f] dark:text-[#52b788]"
                  : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
              }`}
            >
              <div
                className={`flex items-center justify-center p-1 rounded-full ${
                  isActive ? "bg-[#eef5f0] dark:bg-[#1d3024]" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

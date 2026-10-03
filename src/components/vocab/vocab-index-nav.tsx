"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  ListOrdered,
  Sliders,
  Gamepad2,
  Sparkles,
  Layers,
} from "lucide-react";

interface VocabIndexNavProps {
  currentStep?: 1 | 2 | 3 | 4 | 5;
}

export function VocabIndexNav({ currentStep }: VocabIndexNavProps) {
  const pathname = usePathname();

  // Determine active step from pathname if not provided
  let activeStep = currentStep;
  if (!activeStep) {
    if (pathname.includes("/index/1") || pathname === "/vocab" || pathname === "/vocab/courses") {
      activeStep = 1;
    } else if (pathname.includes("/index/2") || pathname.includes("/vocab/courses/")) {
      activeStep = 2;
    } else if (pathname.includes("/index/3") || (pathname.includes("/vocab/sets/") && !pathname.includes("/study"))) {
      activeStep = 3;
    } else if (pathname.includes("/index/4") || pathname.includes("/study")) {
      activeStep = 4;
    } else if (pathname.includes("/index/5") || pathname.includes("/special")) {
      activeStep = 5;
    } else {
      activeStep = 1;
    }
  }

  const isDirectIndex = pathname.startsWith("/index");
  const prefix = isDirectIndex ? "/index" : "/vocab/index";

  const steps = [
    {
      step: 1,
      title: "1. Lộ trình học",
      subtitle: "Roadmap Screen",
      href: `${prefix}/1`,
      icon: Compass,
      color: "from-emerald-500 to-teal-600",
      activeBg: "bg-emerald-500 text-white shadow-emerald-500/25",
    },
    {
      step: 2,
      title: "2. Danh sách bài học",
      subtitle: "Topic Set Overview",
      href: `${prefix}/2`,
      icon: ListOrdered,
      color: "from-sky-500 to-blue-600",
      activeBg: "bg-sky-500 text-white shadow-sky-500/25",
    },
    {
      step: 3,
      title: "3. Cài đặt học & Từ vựng",
      subtitle: "Lesson Detail & Modes",
      href: `${prefix}/3`,
      icon: Sliders,
      color: "from-purple-500 to-indigo-600",
      activeBg: "bg-purple-600 text-white shadow-purple-500/25",
    },
    {
      step: 4,
      title: "4. Luyện tập tương tác",
      subtitle: "Game & Study Engine",
      href: `${prefix}/4`,
      icon: Layers,
      color: "from-amber-500 to-orange-600",
      activeBg: "bg-amber-500 text-white shadow-amber-500/25",
    },
    {
      step: 5,
      title: "5. Mini-game đặc biệt",
      subtitle: "Special Arcade & Story",
      href: `${prefix}/5`,
      icon: Gamepad2,
      color: "from-rose-500 to-pink-600",
      activeBg: "bg-rose-500 text-white shadow-rose-500/25",
    },
  ];

  return (
    <div className="mb-6 rounded-2xl bg-white dark:bg-[#16241b] border border-gray-200 dark:border-[#263d2e] p-2 sm:p-2.5 shadow-sm">
      <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider">Hệ thống Màn hình Luyện Từ (Web Index Switcher)</span>
        </div>
        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
          Chế độ xem độc lập: index/1 - index/5
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.step;
          return (
            <Link
              key={s.step}
              href={s.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? `${s.activeBg} shadow-md scale-[1.02]`
                  : "bg-gray-50 dark:bg-[#1f3325] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27402f] hover:text-gray-900"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-white dark:bg-[#16241b] text-gray-500"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-left">
                <p className="truncate font-extrabold leading-tight">{s.title}</p>
                <p
                  className={`text-[9px] truncate font-medium ${
                    isActive ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {s.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

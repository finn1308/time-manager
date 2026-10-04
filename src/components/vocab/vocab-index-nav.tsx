"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  ListOrdered,
  Sliders,
  Gamepad2,
  Sparkles,
  Layers,
  Zap,
} from "lucide-react";

export interface VocabIndexNavProps {
  currentStep?: 1 | 2 | 3 | 4 | 5;
  onStepChange?: (step: 1 | 2 | 3 | 4 | 5) => void;
  compact?: boolean;
  className?: string;
}

export function VocabIndexNav({
  currentStep,
  onStepChange,
  compact = false,
  className = "",
}: VocabIndexNavProps) {
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

  // Keyboard shortcut listener: Press keys 1, 2, 3, 4, 5 for instant 1-touch switching
  useEffect(() => {
    if (!onStepChange) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (e.key === "1") onStepChange(1);
      else if (e.key === "2") onStepChange(2);
      else if (e.key === "3") onStepChange(3);
      else if (e.key === "4") onStepChange(4);
      else if (e.key === "5") onStepChange(5);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStepChange]);

  const isDirectIndex = pathname?.startsWith("/index");
  const prefix = isDirectIndex ? "/index" : "/vocab/index";

  const steps = [
    {
      step: 1 as const,
      hotkey: "1",
      title: "1. Lộ trình học",
      shortTitle: "Lộ trình",
      subtitle: "Roadmap Screen",
      href: `${prefix}/1`,
      icon: Compass,
      color: "from-emerald-500 to-teal-600",
      activeBg: "bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40",
      activeBadge: "bg-emerald-400/30 text-white",
    },
    {
      step: 2 as const,
      hotkey: "2",
      title: "2. Danh sách bài",
      shortTitle: "Bài học",
      subtitle: "Topic Set Overview",
      href: `${prefix}/2`,
      icon: ListOrdered,
      color: "from-sky-500 to-blue-600",
      activeBg: "bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/40",
      activeBadge: "bg-sky-400/30 text-white",
    },
    {
      step: 3 as const,
      hotkey: "3",
      title: "3. Cài đặt & Từ",
      shortTitle: "Cài đặt & Từ",
      subtitle: "Lesson Detail & Modes",
      href: `${prefix}/3`,
      icon: Sliders,
      color: "from-purple-500 to-indigo-600",
      activeBg: "bg-purple-600 text-white shadow-purple-500/25 ring-2 ring-purple-400/40",
      activeBadge: "bg-purple-400/30 text-white",
    },
    {
      step: 4 as const,
      hotkey: "4",
      title: "4. Luyện tập",
      shortTitle: "Luyện tập",
      subtitle: "Game & Study Engine",
      href: `${prefix}/4`,
      icon: Layers,
      color: "from-amber-500 to-orange-600",
      activeBg: "bg-amber-500 text-white shadow-amber-500/25 ring-2 ring-amber-400/40",
      activeBadge: "bg-amber-400/30 text-white",
    },
    {
      step: 5 as const,
      hotkey: "5",
      title: "5. Mini-games",
      shortTitle: "Arcade Games",
      subtitle: "Special Arcade & Story",
      href: `${prefix}/5`,
      icon: Gamepad2,
      color: "from-rose-500 to-pink-600",
      activeBg: "bg-rose-500 text-white shadow-rose-500/25 ring-2 ring-rose-400/40",
      activeBadge: "bg-rose-400/30 text-white",
    },
  ];

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#16241b] border border-gray-200/90 dark:border-[#263d2e] p-2 sm:p-2.5 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 pb-2 mb-1.5 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="uppercase tracking-wider font-extrabold text-[10.5px]">
            Hệ thống Luyện Từ • 1-Click Fast Switcher
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
            Phím tắt: <kbd className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">[1]</kbd>-<kbd className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">[5]</kbd>
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full font-black shadow-2xs">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span>⚡ Chế độ xem gộp nhanh • 1 Bấm chuyển tức thì</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.step;

          const buttonContent = (
            <>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                  isActive
                    ? "bg-white/20 text-white scale-105"
                    : "bg-white dark:bg-[#16241b] text-gray-500 group-hover:text-emerald-600 group-hover:scale-105"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-left flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate font-black text-xs leading-tight">{s.title}</p>
                  <span
                    className={`text-[8.5px] font-mono px-1 py-0.2 rounded font-black shrink-0 ${
                      isActive
                        ? s.activeBadge
                        : "bg-gray-200/70 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    [{s.hotkey}]
                  </span>
                </div>
                {!compact && (
                  <p
                    className={`text-[9px] truncate font-medium mt-0.5 ${
                      isActive ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {s.subtitle}
                  </p>
                )}
              </div>
            </>
          );

          if (onStepChange) {
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => onStepChange(s.step)}
                className={`group flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                  isActive
                    ? `${s.activeBg} shadow-md scale-[1.02]`
                    : "bg-gray-50 dark:bg-[#1f3325] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27402f] hover:text-gray-900 active:scale-98"
                }`}
                title={`Chuyển sang ${s.title} (Phím [${s.hotkey}])`}
              >
                {buttonContent}
              </button>
            );
          }

          return (
            <Link
              key={s.step}
              href={s.href}
              className={`group flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? `${s.activeBg} shadow-md scale-[1.02]`
                  : "bg-gray-50 dark:bg-[#1f3325] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27402f] hover:text-gray-900 active:scale-98"
              }`}
            >
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

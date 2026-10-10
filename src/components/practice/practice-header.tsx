"use client";

import React from "react";
import Link from "next/link";
import { Brain, Flame, Coins, Sparkles, Play, Pause } from "lucide-react";
import { PracticeSubject } from "./types";
import { usePipTimer } from "@/components/timer/pip-timer-provider";

interface PracticeHeaderProps {
  user: {
    name: string | null;
    email: string;
    xp?: number;
    coins?: number;
  };
  streakDays: number;
  activeSubject: PracticeSubject | null;
}

export function PracticeHeader({
  user,
  streakDays,
  activeSubject,
}: PracticeHeaderProps) {
  const { startTimer, pauseTimer, isRunning, activeSubject: currentActive } = usePipTimer();

  const isCurrentRunning = isRunning && currentActive?.id === activeSubject?.id;

  const handleToggleTimer = () => {
    if (!activeSubject) return;
    if (isCurrentRunning) {
      pauseTimer();
    } else {
      startTimer({
        id: activeSubject.id,
        name: activeSubject.name,
        code: activeSubject.code,
        color: activeSubject.color || "#2d6a4f",
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
      {/* Title & Brand */}
      <div className="flex items-center space-x-3.5">
        <div className="p-3 bg-gradient-to-tr from-[#1b4332] via-[#2d6a4f] to-[#52b788] text-white rounded-2xl shadow-sm">
          <Brain className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-ink)]">
              Luyện tập (Practice)
            </h1>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ChronoMind
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-subtle)] mt-0.5">
            Học tập chủ động, ôn tập ngắt quãng và mini-games tương tác
          </p>
        </div>
      </div>

      {/* Gamification & Timer Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Streak Badge */}
        <div
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/50 text-xs font-extrabold shadow-2xs cursor-default"
          title={`Chuỗi học tập: ${streakDays} ngày`}
        >
          <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
          <span>{streakDays} ngày</span>
        </div>

        {/* Coins Badge */}
        <div
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50 text-xs font-extrabold shadow-2xs"
          title="Xu thưởng tích lũy từ luyện tập"
        >
          <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>{user.coins ?? 100} Xu</span>
        </div>

        {/* Quick PIP Timer Button */}
        {activeSubject && (
          <button
            onClick={handleToggleTimer}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer active:scale-95 ${
              isCurrentRunning
                ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                : "bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white"
            }`}
            title={
              isCurrentRunning
                ? "Tạm dừng PIP Study Timer"
                : `Bắt đầu bấm giờ học môn ${activeSubject.name}`
            }
          >
            {isCurrentRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Đang học ({activeSubject.code || activeSubject.name})</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Bấm giờ luyện {activeSubject.code || activeSubject.name}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

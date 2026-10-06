"use client";

import React from "react";
import { Sparkles, Flame, CheckCircle2, Clock, Target, AlertCircle } from "lucide-react";
import { PracticeStats, PracticeSubject } from "./types";

interface PracticeHeroStatsProps {
  stats: PracticeStats;
  activeSubject: PracticeSubject | null;
  onSelectSubject?: (subjectId: string) => void;
  allSubjects?: PracticeSubject[];
}

export function PracticeHeroStats({
  stats,
  activeSubject,
  allSubjects = [],
}: PracticeHeroStatsProps) {
  // Vietnamese weekdays matching LuyenTu reference screenshot: T2, T3, T4, T5, T6, T7, CN
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  const practiceHours = Math.round((stats.totalPracticeSeconds / 3600) * 10) / 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      {/* Left: Main Progress Banner (6 cols) */}
      <div className="lg:col-span-6 p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white shadow-lg shadow-[#2d6a4f]/15 relative overflow-hidden flex flex-col justify-between">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>
              Môn trọng tâm: {activeSubject?.name || "Tất cả môn học"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Tiến Độ Luyện Tập Hôm Nay
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-md">
            Mỗi phiên làm bài tập, flashcard và ôn lỗi sai được tự động ghi nhận vào{" "}
            <span className="font-bold underline decoration-white/30">StudyRecord</span> và tính vào giờ học thực tế.
          </p>
        </div>

        {/* Bottom Banner Metrics */}
        <div className="relative z-10 pt-5 mt-4 border-t border-white/15 flex items-center justify-between text-xs font-medium text-emerald-100">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-200" />
            <span>Thời gian luyện: <strong className="text-white font-bold">{practiceHours} giờ</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-emerald-200" />
            <span>Cần ôn ngay: <strong className="text-amber-200 font-bold">{stats.dueCount} mục</strong></span>
          </div>
        </div>
      </div>

      {/* Middle: 2 Metric Cards (3 cols) */}
      <div className="lg:col-span-3 grid grid-cols-2 gap-3 sm:gap-4">
        {/* Completion % Box */}
        <div className="p-5 rounded-[28px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-3xl sm:text-4xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {stats.completionRate}%
          </span>
          <span className="text-xs font-bold text-[#526b5c] dark:text-[#a3bda9] mt-2">
            Tiến độ
          </span>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Mastered / Resolved Box */}
        <div className="p-5 rounded-[28px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.resolvedCount}
          </span>
          <span className="text-xs font-bold text-[#526b5c] dark:text-[#a3bda9] mt-2">
            Đã thuộc
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            trên {stats.totalItems} mục
          </span>
        </div>
      </div>

      {/* Right: Streak Card with 7-day indicators (3 cols) */}
      <div className="lg:col-span-3 p-5 rounded-[28px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-xs flex flex-col justify-between">
        {/* Streak Header Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 fill-white text-white animate-pulse" />
            <span className="text-sm font-extrabold">{stats.streakDays} ngày</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
            Chuỗi học
          </span>
        </div>

        {/* 7 Weekday dots matching LuyenTu screenshot */}
        <div className="pt-4">
          <div className="flex items-center justify-between gap-1">
            {dayNames.map((dayName, idx) => {
              const isToday = idx === todayDayIndex;
              const isCompleted = stats.streakWeekDays?.[idx] ?? (isToday && stats.streakDays > 0);

              return (
                <div key={dayName} className="flex flex-col items-center space-y-1.5 flex-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xs scale-105"
                        : isToday
                        ? "border-2 border-orange-400 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 font-bold"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Flame className="w-4 h-4 fill-white text-white" />
                    ) : (
                      <span className="text-[11px] font-semibold">{dayName}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

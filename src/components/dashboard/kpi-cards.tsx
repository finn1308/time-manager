import React from "react";
import { Clock, Target, Flame, TrendingUp } from "lucide-react";

interface KpiCardsProps {
  actualHours: number;
  plannedHours: number;
  completionRate: number;
  streakDays: number;
}

export function KpiCards({
  actualHours,
  plannedHours,
  completionRate,
  streakDays,
}: KpiCardsProps) {
  // Day badges for the week streak indicator (like in Reference Image 2!)
  const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 4 Clean Metric Cards (Left 7 Cols) */}
      <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {actualHours.toFixed(1)}h
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Thực tế đã học
          </span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {plannedHours.toFixed(1)}h
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Kế hoạch đã lập
          </span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {completionRate}%
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Tỷ lệ hoàn thành
          </span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {streakDays}
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Chuỗi ngày học
          </span>
        </div>
      </div>

      {/* Hero Warm Orange Streak Banner (Right 5 Cols - Exactly like Reference Image 2!) */}
      <div className="lg:col-span-5 rounded-[26px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-5 soft-card-shadow flex flex-col justify-between relative overflow-hidden soft-card-hover">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
        <div className="absolute top-2 right-12 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-orange-100">
            <Flame className="w-4 h-4 text-white fill-current animate-bounce" />
            <span>CHUỖI NGÀY HỌC TẬP</span>
          </div>

          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-black tracking-tight">{streakDays}</span>
            <span className="text-base font-semibold text-orange-100">ngày liên tục</span>
          </div>
        </div>

        {/* 7 Circular Day Bubbles */}
        <div className="relative z-10 grid grid-cols-7 gap-1.5 mt-4 pt-3 border-t border-white/20">
          {daysOfWeek.map((day, idx) => {
            const isCompleted = idx <= currentDayIndex && streakDays > 0;
            const isToday = idx === currentDayIndex;

            return (
              <div key={day} className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isToday
                      ? "bg-white text-orange-600 ring-2 ring-white/60 scale-105"
                      : isCompleted
                      ? "bg-orange-400/90 text-white"
                      : "bg-white/20 text-orange-200"
                  }`}
                >
                  {isCompleted ? <Flame className="w-4 h-4 fill-current" /> : day}
                </div>
                <span className="text-[10px] font-medium text-orange-100">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Clock, Target, Flame, TrendingUp } from "lucide-react";

interface KpiCardsProps {
  actualHours: number;
  plannedHours: number;
  completionRate: number;
  streakDays: number;
  schoolHours?: number;
  personalHours?: number;
  scheduledHours?: number;
}

export function KpiCards({
  actualHours,
  plannedHours,
  completionRate,
  streakDays,
  schoolHours,
  personalHours,
  scheduledHours,
}: KpiCardsProps) {
  const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 4 Clean Metric Cards (Left 7 Cols) */}
      <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Actual */}
        <div className="rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-[#d8ebe0] dark:bg-[#1d3827] text-[#2d6a4f] dark:text-[#9cd1b1] flex items-center justify-center mb-2 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            {actualHours.toFixed(1)}h
          </div>
          <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
            Thực tế (Actual)
          </span>
        </div>

        {/* Metric 2: Planned */}
        <div className="rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#40916c] dark:text-[#74c69d] flex items-center justify-center mb-2 shadow-2xs">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            {plannedHours.toFixed(1)}h
          </div>
          <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
            Kế hoạch (Planned)
          </span>
        </div>

        {/* Metric 3: Completion */}
        <div className="rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-[#e2ede7] dark:bg-[#203328] text-[#2c473a] dark:text-[#a3c9b4] flex items-center justify-center mb-2 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            {completionRate}%
          </div>
          <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
            Tỷ lệ hoàn thành
          </span>
        </div>

        {/* Metric 4: Streak */}
        <div className="rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 soft-card-shadow flex flex-col items-center justify-center text-center soft-card-hover">
          <div className="w-10 h-10 rounded-2xl bg-[#edf0dc] dark:bg-[#2b301c] text-[#595e2b] dark:text-[#d3d89e] flex items-center justify-center mb-2 shadow-2xs">
            <Flame className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#2d6a4f] dark:text-[#52b788]">
            {streakDays}
          </div>
          <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
            Chuỗi ngày học
          </span>
        </div>
      </div>

      {/* Botanical Sage Streak Banner (Right 5 Cols) */}
      <div className="lg:col-span-5 rounded-[26px] bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#3a7d5e] text-white p-5 soft-card-shadow flex flex-col justify-between relative overflow-hidden soft-card-hover">
        <div className="relative z-10">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b7d8c3]">
            <Flame className="w-4 h-4 text-[#74c69d] fill-current" />
            <span>CHUỖI NGÀY HỌC TẬP (STREAK)</span>
          </div>

          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight">{streakDays}</span>
            <span className="text-sm font-semibold text-[#d8ebe0]">ngày liên tục</span>
          </div>
        </div>

        {/* 7 Circular Day Bubbles */}
        <div className="relative z-10 grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-white/15">
          {daysOfWeek.map((day, idx) => {
            const isCompleted = idx <= currentDayIndex && streakDays > 0;
            const isToday = idx === currentDayIndex;

            return (
              <div key={day} className="flex flex-col items-center space-y-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all shadow-2xs ${
                    isToday
                      ? "bg-white text-[#1b4332] ring-2 ring-[#74c69d] scale-105"
                      : isCompleted
                      ? "bg-[#52b788] text-white"
                      : "bg-white/15 text-[#b7d8c3]"
                  }`}
                >
                  {isCompleted ? <Flame className="w-3.5 h-3.5 fill-current" /> : day}
                </div>
                <span className="text-[10px] font-medium text-[#d8ebe0]">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

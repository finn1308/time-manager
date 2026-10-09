import React from "react";
import { Clock, Target, Flame, TrendingUp, Zap } from "lucide-react";

interface KpiCardsProps {
  actualHours: number;
  plannedHours: number;
  completionRate: number;
  streakDays: number;
  schoolHours?: number;
  personalHours?: number;
  scheduledHours?: number;
}

const metrics = [
  {
    key: "actual",
    icon: Clock,
    label: "Thực tế học",
    sublabel: "Actual",
    iconBg: "var(--mint-bg)",
    iconColor: "var(--mint)",
    valueColor: "var(--mint-dark)",
    borderColor: "var(--mint-soft)",
  },
  {
    key: "planned",
    icon: Target,
    label: "Kế hoạch",
    sublabel: "Planned",
    iconBg: "var(--lavender-bg)",
    iconColor: "var(--lavender)",
    valueColor: "var(--lavender-dark)",
    borderColor: "var(--lavender-soft)",
  },
  {
    key: "completion",
    icon: TrendingUp,
    label: "Hoàn thành",
    sublabel: "Completion",
    iconBg: "var(--sky-bg)",
    iconColor: "var(--sky)",
    valueColor: "var(--sky-dark)",
    borderColor: "var(--sky-soft)",
  },
  {
    key: "streak",
    icon: Flame,
    label: "Chuỗi ngày",
    sublabel: "Streak",
    iconBg: "var(--peach-bg)",
    iconColor: "var(--peach)",
    valueColor: "var(--peach-dark)",
    borderColor: "var(--peach-soft)",
  },
];

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
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  const values = [
    `${actualHours.toFixed(1)}h`,
    `${plannedHours.toFixed(1)}h`,
    `${completionRate}%`,
    `${streakDays}`,
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* ── Four Pastel KPI Cards ───────────────────────────── */}
      <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={m.key}
              className="rounded-2xl p-4 flex flex-col items-center justify-center text-center card-shadow card-hover relative overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: `1px solid ${m.borderColor}`,
              }}
            >
              {/* Soft color wash in top-right corner */}
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-30 -translate-y-6 translate-x-6"
                style={{ background: m.iconBg }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 relative z-10"
                style={{ background: m.iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: m.iconColor }} />
              </div>

              <div
                className="text-2xl font-black tracking-tight relative z-10"
                style={{ color: m.valueColor, fontFamily: "var(--font-nunito, Nunito)" }}
              >
                {values[i]}
              </div>
              <span
                className="text-[10px] font-semibold mt-1 relative z-10"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Streak Banner Card ──────────────────────────────── */}
      <div
        className="lg:col-span-5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden card-shadow card-hover"
        style={{
          background: "linear-gradient(135deg, var(--lavender-dark) 0%, var(--blush-dark, #BE185D) 100%)",
          color: "#fff",
        }}
      >
        {/* Background blobs */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-10 translate-x-10"
          style={{ background: "#fff" }}
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-15 translate-y-8 -translate-x-8"
          style={{ background: "#fff" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="w-4 h-4 fill-current opacity-80" />
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">
              Chuỗi ngày học tập
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-nunito, Nunito)" }}
            >
              {streakDays}
            </span>
            <span className="text-sm font-semibold opacity-80">ngày liên tục</span>
          </div>
        </div>

        {/* 7-day bubbles */}
        <div className="relative z-10 grid grid-cols-7 gap-1 mt-3 pt-3 border-t border-white/20">
          {daysOfWeek.map((day, idx) => {
            const isCompleted = idx <= currentDayIndex && streakDays > 0;
            const isToday = idx === currentDayIndex;

            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isToday
                      ? "bg-white scale-110 shadow-md"
                      : isCompleted
                      ? "bg-white/30"
                      : "bg-white/10"
                  }`}
                  style={{
                    color: isToday
                      ? "var(--lavender-dark)"
                      : "rgba(255,255,255,0.9)",
                  }}
                >
                  {isCompleted ? (
                    <Flame className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    day
                  )}
                </div>
                <span className="text-[9px] font-medium opacity-70">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Time Categories Breakdown Strip ─────────────────── */}
      {(schoolHours !== undefined ||
        personalHours !== undefined ||
        scheduledHours !== undefined) && (
        <div
          className="lg:col-span-12 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-soft)",
          }}
        >
          <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--text-subtle)" }}>
            <span
              className="w-2 h-2 rounded-full animate-pulse-soft"
              style={{ background: "var(--mint)" }}
            />
            <span>Phân loại thời gian hôm nay</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            {[
              { label: "🏫 Đi học", value: schoolHours ?? 0, color: "var(--sky)", bg: "var(--sky-bg)", border: "var(--sky-soft)" },
              { label: "🏠 Tự học", value: actualHours, color: "var(--mint)", bg: "var(--mint-bg)", border: "var(--mint-soft)" },
              { label: "🎮 Cá nhân", value: personalHours ?? 0, color: "var(--lilac)", bg: "var(--lilac-bg)", border: "var(--lilac-soft)" },
              { label: "📅 Lịch xếp", value: scheduledHours ?? 0, color: "var(--peach)", bg: "var(--peach-bg)", border: "var(--peach-soft)" },
            ].map((cat) => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                style={{
                  background: cat.bg,
                  border: `1px solid ${cat.border}`,
                  color: cat.color,
                }}
              >
                <span style={{ color: "var(--text-body)" }}>{cat.label}:</span>
                <strong>{cat.value.toFixed(1)}h</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

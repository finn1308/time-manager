import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PlannedVsActualChart } from "@/components/dashboard/planned-vs-actual-chart";
import { StudyHeatmap } from "@/components/dashboard/study-heatmap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatVN, getNowInVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { subDays, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const nowVN = getNowInVN();

  // 1. Fetch all study sessions
  const allSessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { actualStart: "asc" },
  });

  // 2. Fetch all calendar events
  const allEvents = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { startTime: "asc" },
  });

  // 3. Build Planned vs Actual data for the past 7 days
  const chartData = [];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  for (let i = 6; i >= 0; i--) {
    const targetDay = subDays(nowVN, i);
    const dayLabel = `${dayNames[targetDay.getDay()]} (${formatVN(targetDay, "dd/MM")})`;

    const eventsOnDay = allEvents.filter((ev) =>
      isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), targetDay)
    );
    const plannedMinutes = eventsOnDay.reduce((acc, ev) => {
      const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 60);
      return acc + Math.max(0, diff);
    }, 0);

    const sessionsOnDay = allSessions.filter((s) =>
      isSameDay(toZonedTime(new Date(s.actualStart), VIETNAM_TIMEZONE), targetDay)
    );
    const actualSeconds = sessionsOnDay.reduce((acc, s) => acc + s.actualDurationSeconds, 0);

    chartData.push({
      day: dayLabel,
      planned: Math.round((plannedMinutes / 60) * 10) / 10,
      actual: Math.round((actualSeconds / 3600) * 10) / 10,
    });
  }

  // 4. Build Heatmap data for the past 28 days
  const heatmapDays = [];
  for (let i = 27; i >= 0; i--) {
    const d = subDays(nowVN, i);
    const dateStr = formatVN(d, "yyyy-MM-dd");

    const sessions = allSessions.filter((s) =>
      isSameDay(toZonedTime(new Date(s.actualStart), VIETNAM_TIMEZONE), d)
    );
    const totalSecs = sessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);

    heatmapDays.push({
      date: dateStr,
      minutes: Math.round(totalSecs / 60),
    });
  }

  // KPI Calculations
  const totalActualSeconds = allSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const actualHours = Math.round((totalActualSeconds / 3600) * 10) / 10;

  const totalPlannedHours = allEvents.reduce((acc, ev) => {
    const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 3600);
    return acc + Math.max(0, diff);
  }, 0);
  const plannedHours = Math.round(totalPlannedHours * 10) / 10;

  const completionRate =
    plannedHours > 0 ? Math.min(100, Math.round((actualHours / plannedHours) * 100)) : (actualHours > 0 ? 100 : 0);

  const uniqueSessionDates = new Set(
    allSessions
      .filter((s) => s.actualDurationSeconds > 60)
      .map((s) => formatVN(s.actualStart, "yyyy-MM-dd"))
  );
  let streak = 0;
  let checkDate = new Date();
  while (uniqueSessionDates.has(formatVN(checkDate, "yyyy-MM-dd"))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  // Subject Breakdown
  const subjectMap = new Map<string, { name: string; color: string; seconds: number }>();
  allSessions.forEach((s) => {
    const existing = subjectMap.get(s.subjectId) || {
      name: s.subject?.name || "Môn học",
      color: s.subject?.color || "#2d6a4f",
      seconds: 0,
    };
    existing.seconds += s.actualDurationSeconds;
    subjectMap.set(s.subjectId, existing);
  });
  const subjectBreakdown = Array.from(subjectMap.values()).sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
          <BarChart3 className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Báo cáo phân tích Planned vs Actual</span>
        </h1>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
          So sánh kỷ luật thời gian giữa kế hoạch đặt ra và thời gian thực tế ghi nhận qua Timer.
        </p>
      </div>

      <KpiCards
        actualHours={actualHours}
        plannedHours={plannedHours}
        completionRate={completionRate}
        streakDays={streak}
      />

      {/* Main Chart */}
      <PlannedVsActualChart data={chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <StudyHeatmap days={heatmapDays} />

        {/* Subject Breakdown Card */}
        <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
          <CardHeader>
            <CardTitle className="text-base text-[#192e22] dark:text-[#f0f7f2]">
              Phân bổ thời gian theo môn học
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {subjectBreakdown.map((sb, i) => {
              const hours = (sb.seconds / 3600).toFixed(1);
              const percent = totalActualSeconds > 0 ? Math.round((sb.seconds / totalActualSeconds) * 100) : 0;

              return (
                <div key={i} className="space-y-1.5 p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sb.color }} />
                      <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                        {sb.name}
                      </span>
                    </div>
                    <span className="font-mono text-[#526b5c] dark:text-[#a3bda9] font-semibold">
                      {hours} giờ ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#dbe7dd] dark:bg-[#263d2e] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%`, backgroundColor: sb.color }}
                    />
                  </div>
                </div>
              );
            })}

            {subjectBreakdown.length === 0 && (
              <p className="text-center py-8 text-xs text-[#8ba393]">
                Chưa có dữ liệu học tập nào để tổng hợp.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

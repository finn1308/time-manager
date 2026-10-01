import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/notion/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PlannedVsActualChart } from "@/components/dashboard/planned-vs-actual-chart";
import { StudyHeatmap } from "@/components/dashboard/study-heatmap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatVN, getNowInVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { subDays, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const nowVN = getNowInVN();

  // 1. Fetch all study logs
  const allLogs = await prisma.studyLog.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { startTime: "asc" },
  });

  // 2. Fetch all schedule events
  const allEvents = await prisma.scheduleEvent.findMany({
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

    // Filter events on targetDay
    const eventsOnDay = allEvents.filter((ev) =>
      isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), targetDay)
    );
    const plannedMinutes = eventsOnDay.reduce((acc, ev) => {
      const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 60);
      return acc + Math.max(0, diff);
    }, 0);

    // Filter logs on targetDay
    const logsOnDay = allLogs.filter((log) =>
      isSameDay(toZonedTime(new Date(log.startTime), VIETNAM_TIMEZONE), targetDay)
    );
    const actualMinutes = logsOnDay.reduce((acc, log) => acc + log.durationMinutes, 0);

    chartData.push({
      day: dayLabel,
      planned: Math.round((plannedMinutes / 60) * 10) / 10,
      actual: Math.round((actualMinutes / 60) * 10) / 10,
    });
  }

  // 4. Build Heatmap data for the past 28 days
  const heatmapDays = [];
  for (let i = 27; i >= 0; i--) {
    const d = subDays(nowVN, i);
    const dateStr = formatVN(d, "yyyy-MM-dd");

    const logs = allLogs.filter((l) =>
      isSameDay(toZonedTime(new Date(l.startTime), VIETNAM_TIMEZONE), d)
    );
    const totalMins = logs.reduce((acc, l) => acc + l.durationMinutes, 0);

    heatmapDays.push({
      date: dateStr,
      minutes: totalMins,
    });
  }

  // KPI Calculations
  const totalActualMinutes = allLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const actualHours = Math.round((totalActualMinutes / 60) * 10) / 10;

  const totalPlannedMinutes = allEvents.reduce((acc, ev) => {
    const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 60);
    return acc + Math.max(0, diff);
  }, 0);
  const plannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;

  const completionRate =
    plannedHours > 0 ? Math.min(100, Math.round((actualHours / plannedHours) * 100)) : 100;

  const uniqueLogDates = new Set(
    allLogs.map((l) => formatVN(l.startTime, "yyyy-MM-dd"))
  );
  let streak = 0;
  let checkDate = new Date();
  while (uniqueLogDates.has(formatVN(checkDate, "yyyy-MM-dd"))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  // Subject Breakdown
  const subjectMap = new Map<string, { name: string; color: string; minutes: number }>();
  allLogs.forEach((log) => {
    const existing = subjectMap.get(log.subjectId) || {
      name: log.subject.name,
      color: log.subject.color,
      minutes: 0,
    };
    existing.minutes += log.durationMinutes;
    subjectMap.set(log.subjectId, existing);
  });
  const subjectBreakdown = Array.from(subjectMap.values()).sort((a, b) => b.minutes - a.minutes);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📈"
        title="Báo cáo phân tích Planned vs Actual"
        description="Đo lường kỷ luật học tập, so sánh số giờ bạn dự định học trên lịch so với số giờ thực tế đã tập trung ghi nhận qua Timer."
      />

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
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ thời gian theo môn học</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {subjectBreakdown.map((sb, i) => {
              const hours = (sb.minutes / 60).toFixed(1);
              const percent = totalActualMinutes > 0 ? Math.round((sb.minutes / totalActualMinutes) * 100) : 0;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sb.color }} />
                      <span className="font-semibold text-[#171717] dark:text-white truncate">
                        {sb.name}
                      </span>
                    </div>
                    <span className="font-mono text-[#787774]">
                      {hours} giờ ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%`, backgroundColor: sb.color }}
                    />
                  </div>
                </div>
              );
            })}

            {subjectBreakdown.length === 0 && (
              <p className="text-center py-8 text-xs text-[#9b9a97]">
                Chưa có dữ liệu học tập nào để tổng hợp.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

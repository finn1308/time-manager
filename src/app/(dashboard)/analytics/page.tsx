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
import {
  BarChart3,
  Calendar,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  TrendingUp,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnalyticsPageProps {
  searchParams?: Promise<{
    range?: string;
  }>;
}

export default async function AnalyticsPage(props: AnalyticsPageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const searchParams = props.searchParams ? await props.searchParams : {};
  const range = searchParams?.range || "7"; // "7", "30", "90", "all"
  const rangeDays = range === "30" ? 30 : range === "90" ? 90 : range === "all" ? 180 : 7;

  const nowVN = getNowInVN();
  const rangeStartDate = subDays(nowVN, rangeDays);

  // 1. Fetch study sessions & calendar events within or outside range
  const [allSessions, allEvents, subjects, userRecord] = await Promise.all([
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        ...(range !== "all" ? { actualStart: { gte: rangeStartDate } } : {}),
      },
      include: { subject: true },
      orderBy: { actualStart: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        ...(range !== "all" ? { startTime: { gte: rangeStartDate } } : {}),
      },
      include: { subject: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, color: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { streakDays: true },
    }),
  ]);

  // 2. Build Planned vs Actual chart data according to selected range
  const chartData = [];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  if (rangeDays === 7) {
    for (let i = 6; i >= 0; i--) {
      const targetDay = subDays(nowVN, i);
      const dayLabel = `${dayNames[targetDay.getDay()]} (${formatVN(targetDay, "dd/MM")})`;

      const eventsOnDay = allEvents.filter((ev) =>
        isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), targetDay) &&
        (ev.type === "SELF_STUDY" || ev.type === "STUDY")
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
  } else if (rangeDays === 30) {
    // 30 days: 6 buckets of 5 days each
    for (let i = 5; i >= 0; i--) {
      const bucketEnd = subDays(nowVN, i * 5);
      const bucketStart = subDays(nowVN, (i + 1) * 5 - 1);
      const label = `${formatVN(bucketStart, "dd/MM")} - ${formatVN(bucketEnd, "dd/MM")}`;

      const eventsInBucket = allEvents.filter((ev) => {
        const d = toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE);
        return d >= bucketStart && d <= bucketEnd && (ev.type === "SELF_STUDY" || ev.type === "STUDY");
      });
      const plannedMinutes = eventsInBucket.reduce((acc, ev) => {
        const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 60);
        return acc + Math.max(0, diff);
      }, 0);

      const sessionsInBucket = allSessions.filter((s) => {
        const d = toZonedTime(new Date(s.actualStart), VIETNAM_TIMEZONE);
        return d >= bucketStart && d <= bucketEnd;
      });
      const actualSeconds = sessionsInBucket.reduce((acc, s) => acc + s.actualDurationSeconds, 0);

      chartData.push({
        day: label,
        planned: Math.round((plannedMinutes / 60) * 10) / 10,
        actual: Math.round((actualSeconds / 3600) * 10) / 10,
      });
    }
  } else {
    // 90 or all days: weekly buckets
    const numWeeks = rangeDays === 90 ? 12 : 20;
    for (let i = numWeeks - 1; i >= 0; i--) {
      const bucketEnd = subDays(nowVN, i * 7);
      const bucketStart = subDays(nowVN, (i + 1) * 7 - 1);
      const label = `Tuần ${formatVN(bucketStart, "dd/MM")}`;

      const eventsInBucket = allEvents.filter((ev) => {
        const d = toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE);
        return d >= bucketStart && d <= bucketEnd && (ev.type === "SELF_STUDY" || ev.type === "STUDY");
      });
      const plannedMinutes = eventsInBucket.reduce((acc, ev) => {
        const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 60);
        return acc + Math.max(0, diff);
      }, 0);

      const sessionsInBucket = allSessions.filter((s) => {
        const d = toZonedTime(new Date(s.actualStart), VIETNAM_TIMEZONE);
        return d >= bucketStart && d <= bucketEnd;
      });
      const actualSeconds = sessionsInBucket.reduce((acc, s) => acc + s.actualDurationSeconds, 0);

      chartData.push({
        day: label,
        planned: Math.round((plannedMinutes / 60) * 10) / 10,
        actual: Math.round((actualSeconds / 3600) * 10) / 10,
      });
    }
  }

  // 3. Build Heatmap data for the past 28 days
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

  // 4. KPI Calculations
  const totalActualSeconds = allSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const actualHours = Math.round((totalActualSeconds / 3600) * 10) / 10;

  const selfStudyEvents = allEvents.filter(
    (ev) => (ev.type === "SELF_STUDY" || ev.type === "STUDY") && (ev as any).trackStudyTime !== false
  );
  const schoolEvents = allEvents.filter((ev) => ev.type === "SCHOOL");
  const personalEvents = allEvents.filter((ev) => ev.type === "PERSONAL");

  const totalPlannedHours = selfStudyEvents.reduce((acc, ev) => {
    const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 3600);
    return acc + Math.max(0, diff);
  }, 0);
  const plannedHours = Math.round(totalPlannedHours * 10) / 10;

  const schoolHours = Math.round(
    schoolEvents.reduce((acc, ev) => acc + (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 3600), 0) * 10
  ) / 10;

  const personalHours = Math.round(
    personalEvents.reduce((acc, ev) => acc + (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 3600), 0) * 10
  ) / 10;

  const scheduledHours = Math.round(
    allEvents.reduce((acc, ev) => acc + (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 3600), 0) * 10
  ) / 10;

  const completionRate =
    plannedHours > 0 ? Math.min(100, Math.round((actualHours / plannedHours) * 100)) : (actualHours > 0 ? 100 : 0);

  // 5. Deep Focus Statistics (Section 36)
  const completedSessions = allSessions.filter((s) => s.status === "COMPLETED");
  const avgSessionMinutes = completedSessions.length > 0
    ? Math.round(totalActualSeconds / completedSessions.length / 60)
    : 0;

  // Sessions >= 25 mins with 0 interruptions
  const deepFocusSessions = completedSessions.filter(
    (s) => s.actualDurationSeconds >= 25 * 60 && (s.interruptionsCount === 0 || !s.interruptionsCount)
  );
  const deepFocusRate = completedSessions.length > 0
    ? Math.round((deepFocusSessions.length / completedSessions.length) * 100)
    : 0;

  // Best period of day (Morning 5-12, Noon 12-14, Afternoon 14-18, Evening 18-24)
  const periodHours: Record<string, number> = { morning: 0, noon: 0, afternoon: 0, evening: 0 };
  for (const s of completedSessions) {
    const zoned = toZonedTime(new Date(s.actualStart), VIETNAM_TIMEZONE);
    const hour = zoned.getHours();
    const durH = s.actualDurationSeconds / 3600;
    if (hour >= 5 && hour < 12) periodHours.morning += durH;
    else if (hour >= 12 && hour < 14) periodHours.noon += durH;
    else if (hour >= 14 && hour < 18) periodHours.afternoon += durH;
    else periodHours.evening += durH;
  }

  let goldenPeriod = "Tối (18:00 - 23:59)";
  let maxPeriodH = periodHours.evening;
  if (periodHours.morning > maxPeriodH) {
    goldenPeriod = "Sáng (05:00 - 11:59)";
    maxPeriodH = periodHours.morning;
  }
  if (periodHours.afternoon > maxPeriodH) {
    goldenPeriod = "Chiều (14:00 - 17:59)";
    maxPeriodH = periodHours.afternoon;
  }

  // Average productivity score (1-5)
  const scoredSessions = completedSessions.filter((s) => s.productivityScore && s.productivityScore > 0);
  const avgProductivityScore = scoredSessions.length > 0
    ? (scoredSessions.reduce((acc, s) => acc + s.productivityScore!, 0) / scoredSessions.length).toFixed(1)
    : "5.0";

  // 6. Subject Breakdown
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
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Phân tích hiệu suất học tập (Analytics)</span>
          </h1>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
            Đo lường kỷ luật học tập, chất lượng phiên Deep Focus và so sánh kế hoạch với thực tế.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl shadow-2xs">
          {[
            { id: "7", label: "7 ngày" },
            { id: "30", label: "30 ngày" },
            { id: "90", label: "90 ngày" },
            { id: "all", label: "Tất cả" },
          ].map((pill) => (
            <Link key={pill.id} href={`/analytics?range=${pill.id}`}>
              <button
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  range === pill.id
                    ? "bg-[#2d6a4f] text-white shadow-2xs"
                    : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#f4f8f5]"
                }`}
              >
                {pill.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards
        actualHours={actualHours}
        plannedHours={plannedHours}
        completionRate={completionRate}
        streakDays={userRecord?.streakDays || 1}
        schoolHours={schoolHours}
        personalHours={personalHours}
        scheduledHours={scheduledHours}
      />

      {/* Deep Focus Quality Metrics (Section 36) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#73927d] uppercase">
            <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>Thời lượng phiên TB</span>
          </div>
          <div className="mt-1 text-xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {avgSessionMinutes} <span className="text-xs font-normal opacity-80">phút/phiên</span>
          </div>
          <p className="text-[10px] text-[#73927d] mt-1">Chuẩn Pomodoro tối ưu</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#73927d] uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>Tỷ lệ Deep Focus</span>
          </div>
          <div className="mt-1 text-xl font-black text-amber-600 dark:text-amber-400">
            {deepFocusRate}%
          </div>
          <p className="text-[10px] text-[#73927d] mt-1">Phiên {'>='} 25p không gián đoạn</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#73927d] uppercase">
            <Sun className="w-3.5 h-3.5 text-orange-500" />
            <span>Khung giờ vàng</span>
          </div>
          <div className="mt-1 text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
            {goldenPeriod}
          </div>
          <p className="text-[10px] text-[#73927d] mt-1">Năng lượng tập trung cao nhất</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#73927d] uppercase">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span>Đánh giá năng suất TB</span>
          </div>
          <div className="mt-1 text-xl font-black text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1">
            <span>{avgProductivityScore}</span>
            <span className="text-xs text-yellow-500">★</span>
          </div>
          <p className="text-[10px] text-[#73927d] mt-1">Thang điểm 5 sao tự đánh giá</p>
        </div>
      </div>

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
                Chưa có dữ liệu học tập nào để tổng hợp trong khoảng thời gian này.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Launchers: What-If Simulator & Weekly Review Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Review Banner */}
        <div className="p-5 rounded-[26px] bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#52b788]">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>AI WEEKLY REFLECTION</span>
            </div>
            <h3 className="text-sm font-bold">Xem báo cáo phản tỉnh tuần & Dự báo mục tiêu</h3>
            <p className="text-[11px] text-white/80">AI phân tích điểm mạnh, điểm yếu và gợi ý lịch tuần tới.</p>
          </div>
          <Link href="/weekly-review">
            <Button className="rounded-2xl bg-white text-[#1b4332] hover:bg-[#d8ebe0] text-xs font-bold space-x-1 shrink-0">
              <span>Mở Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* What-If Simulator Banner */}
        <div className="p-5 rounded-[26px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
              <Target className="w-4 h-4" />
              <span>WHAT-IF SCENARIOS</span>
            </div>
            <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Mô phỏng kịch bản What-If
            </h3>
            <p className="text-[11px] text-[#73927d]">
              Thử nghiệm dời ngày thi, thêm môn học hoặc nghỉ đột xuất trước khi lưu lịch.
            </p>
          </div>
          <Link href="/calendar">
            <Button variant="outline" className="rounded-2xl text-xs font-semibold space-x-1 shrink-0">
              <span>Mô phỏng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

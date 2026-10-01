import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PlannedVsActualChart } from "@/components/dashboard/planned-vs-actual-chart";
import { StudyHeatmap } from "@/components/dashboard/study-heatmap";
import { StudyBudgetCard } from "@/components/dashboard/study-budget-card";
import { SchedulingDna } from "@/components/dashboard/scheduling-dna";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Sparkles,
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  Play,
  ArrowRight,
  Plus,
  Lock,
  Target,
  History,
  TrendingUp,
} from "lucide-react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format } from "date-fns";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // 1. Fetch User Settings for Budget
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });
  const weeklyBudgetHours = userSettings?.weeklyStudyBudgetHours || 20.0;

  // 2. Fetch Subjects with Goals & Study Sessions
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      goals: true,
      studySessions: true,
    },
    orderBy: { priority: "desc" },
  });

  // 3. Fetch all Study Sessions
  const allSessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { actualStart: "desc" },
  });

  // 4. Fetch all Calendar Events
  const allEvents = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { startTime: "asc" },
  });

  // Calculate Real Overall KPIs
  const totalActualSeconds = allSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const actualHours = Math.round((totalActualSeconds / 3600) * 10) / 10;

  const totalPlannedHours = allEvents.reduce((acc, ev) => {
    const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 3600);
    return acc + Math.max(0, diff);
  }, 0);
  const plannedHours = Math.round(totalPlannedHours * 10) / 10;

  const completionRate =
    plannedHours > 0
      ? Math.min(100, Math.round((actualHours / plannedHours) * 100))
      : actualHours > 0
      ? 100
      : 0;

  // This Week Budget & Actual
  const thisWeekSessions = allSessions.filter(
    (s) => s.actualStart >= weekStart && s.actualStart <= weekEnd
  );
  const weeklyActualSeconds = thisWeekSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const weeklyActualHours = Math.round((weeklyActualSeconds / 3600) * 10) / 10;

  // Subject breakdown for this week
  const subjectWeekMap: Record<string, { id: string; name: string; color: string; actualHours: number }> = {};
  for (const s of thisWeekSessions) {
    if (!subjectWeekMap[s.subjectId]) {
      subjectWeekMap[s.subjectId] = {
        id: s.subject.id,
        name: s.subject.name,
        color: s.subject.color,
        actualHours: 0,
      };
    }
    subjectWeekMap[s.subjectId].actualHours += s.actualDurationSeconds / 3600;
  }
  const weeklySubjectsBreakdown = Object.values(subjectWeekMap);

  // Real Consecutive Streak
  const uniqueStudyDays = new Set(
    allSessions
      .filter((s) => s.actualDurationSeconds > 60)
      .map((s) => format(s.actualStart, "yyyy-MM-dd"))
  );

  let streak = 0;
  let checkDate = new Date();
  const todayKey = format(checkDate, "yyyy-MM-dd");
  const yesterdayKey = format(subDays(checkDate, 1), "yyyy-MM-dd");

  if (uniqueStudyDays.has(todayKey)) {
    streak = 1;
    let d = subDays(checkDate, 1);
    while (uniqueStudyDays.has(format(d, "yyyy-MM-dd"))) {
      streak++;
      d = subDays(d, 1);
    }
  } else if (uniqueStudyDays.has(yesterdayKey)) {
    streak = 1;
    let d = subDays(checkDate, 2);
    while (uniqueStudyDays.has(format(d, "yyyy-MM-dd"))) {
      streak++;
      d = subDays(d, 1);
    }
  }

  // Today's events
  const todayEvents = allEvents.filter(
    (ev) => ev.startTime >= todayStart && ev.startTime <= todayEnd
  );

  // Recent 5 Sessions
  const recentSessions = allSessions.slice(0, 5);

  // Chart data for last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const dStart = startOfDay(d);
    const dEnd = endOfDay(d);
    const dayLabel = format(d, "EEE (dd/MM)");

    const p = allEvents
      .filter((e) => e.startTime >= dStart && e.startTime <= dEnd)
      .reduce((acc, e) => acc + (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 3600), 0);

    const a = allSessions
      .filter((s) => s.actualStart >= dStart && s.actualStart <= dEnd)
      .reduce((acc, s) => acc + s.actualDurationSeconds / 3600, 0);

    chartData.push({
      day: dayLabel,
      planned: Math.round(p * 10) / 10,
      actual: Math.round(a * 10) / 10,
    });
  }

  // Personal Scheduling DNA Analysis (Section 37)
  let bestFocusTimeSlot = "Buổi tối (19:00 - 22:30)";
  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;

  for (const s of allSessions) {
    const h = s.actualStart.getHours();
    if (h >= 5 && h < 12) morningCount++;
    else if (h >= 12 && h < 18) afternoonCount++;
    else eveningCount++;
  }

  if (morningCount > afternoonCount && morningCount > eveningCount) {
    bestFocusTimeSlot = "Buổi sáng (07:00 - 11:30)";
  } else if (afternoonCount > morningCount && afternoonCount > eveningCount) {
    bestFocusTimeSlot = "Buổi chiều (13:30 - 17:30)";
  }

  const averageSessionMinutes =
    allSessions.length > 0 ? Math.round(totalActualSeconds / allSessions.length / 60) : 0;

  const estimationVariancePercent =
    plannedHours > 0
      ? Math.round(((actualHours - plannedHours) / plannedHours) * 100)
      : 0;

  const topSubjectName = subjects[0]?.name || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Friendly Hero Banner in Pastel Green */}
      <div className="rounded-[30px] bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-6 sm:p-7 soft-card-shadow relative overflow-hidden">
        <div className="absolute inset-0 bg-pastel-grid opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-[#d8ebe0] text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-[#74c69d] animate-pulse" />
              <span>ChronoMind Operating System • Múi giờ Asia/Ho_Chi_Minh</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Xin chào {user.name || "bạn"}, bắt đầu ngày học hiệu quả!
            </h1>

            <p className="text-[#d8ebe0] text-xs sm:text-sm leading-relaxed">
              Quản lý mục tiêu môn học, xếp lịch tự động không xung đột và ghi nhận thời gian thực tế với Picture-in-Picture Timer.
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <Link href="/calendar">
                <Button variant="pill" size="default" className="font-bold text-[#1b4332] shadow-sm space-x-2 hover:bg-[#eef5f0]">
                  <Sparkles className="w-4 h-4 text-[#2d6a4f]" />
                  <span>AI Tự động lập lịch tuần →</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end shrink-0">
            <div className="p-4 rounded-2xl bg-white/95 text-[#192e22] max-w-[240px] shadow-lg mb-2">
              <p className="text-xs font-semibold leading-relaxed">
                Tập trung học thật, lưu database thật, không dùng số liệu ảo! 🌿
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#52b788] border-2 border-white shadow-md flex items-center justify-center text-xl select-none mr-4 text-white font-bold">
              CM
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Planned vs Actual, Streak) */}
      <KpiCards
        actualHours={actualHours}
        plannedHours={plannedHours}
        completionRate={completionRate}
        streakDays={streak}
      />

      {/* Study Budget & Debt Card (Section 30 & 31) */}
      <StudyBudgetCard
        weeklyBudgetHours={weeklyBudgetHours}
        weeklyActualHours={weeklyActualHours}
        subjectsBreakdown={weeklySubjectsBreakdown}
      />

      {/* Quick Action Navigation Cards */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9] px-1">
          Truy cập nhanh
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/calendar" className="group">
            <div className="p-3.5 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#d8ebe0] dark:bg-[#1d3827] text-[#2d6a4f] dark:text-[#9cd1b1] flex items-center justify-center shadow-2xs">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-[#2d6a4f] transition-colors">
                    Lịch học tuần
                  </h3>
                  <p className="text-[10px] text-[#73927d]">Xem & xếp lịch AI</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#73927d] group-hover:translate-x-1 group-hover:text-[#2d6a4f] transition-all" />
            </div>
          </Link>

          <Link href="/subjects" className="group">
            <div className="p-3.5 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#40916c] dark:text-[#74c69d] flex items-center justify-center shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-[#2d6a4f] transition-colors">
                    Môn học & Chỉ tiêu
                  </h3>
                  <p className="text-[10px] text-[#73927d]">Số giờ cần đạt</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#73927d] group-hover:translate-x-1 group-hover:text-[#2d6a4f] transition-all" />
            </div>
          </Link>

          <Link href="/goals" className="group">
            <div className="p-3.5 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e2ede7] dark:bg-[#203328] text-[#2c473a] dark:text-[#a3c9b4] flex items-center justify-center shadow-2xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-[#2d6a4f] transition-colors">
                    Mục tiêu & Deadline
                  </h3>
                  <p className="text-[10px] text-[#73927d]">Thời hạn hoàn thành</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#73927d] group-hover:translate-x-1 group-hover:text-[#2d6a4f] transition-all" />
            </div>
          </Link>

          <Link href="/study-sessions" className="group">
            <div className="p-3.5 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#edf0dc] dark:bg-[#2b301c] text-[#595e2b] dark:text-[#d3d89e] flex items-center justify-center shadow-2xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-[#2d6a4f] transition-colors">
                    Nhật ký học tập
                  </h3>
                  <p className="text-[10px] text-[#73927d]">Thời gian thực tế</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#73927d] group-hover:translate-x-1 group-hover:text-[#2d6a4f] transition-all" />
            </div>
          </Link>
        </div>
      </div>

      {/* Planned vs Actual Recharts Chart */}
      <PlannedVsActualChart data={chartData} />

      {/* Study Activity Heatmap with Day Intelligence (Sections 20-27) */}
      <StudyHeatmap
        subjects={subjects.map((s) => ({ id: s.id, name: s.name, color: s.color }))}
      />

      {/* Personal Scheduling DNA (Section 37) */}
      <SchedulingDna
        totalSessionsCount={allSessions.length}
        averageSessionMinutes={averageSessionMinutes}
        bestFocusTimeSlot={bestFocusTimeSlot}
        estimationVariancePercent={estimationVariancePercent}
        topSubjectName={topSubjectName}
      />

      {/* Main Grid: Today's Schedule & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Schedule + Subject Progress (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Schedule */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                  <div className="w-8 h-8 rounded-xl bg-[#d8ebe0] dark:bg-[#1d3827] text-[#2d6a4f] flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <span>Lịch học hôm nay</span>
                </CardTitle>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
                  {todayEvents.length > 0
                    ? `Có ${todayEvents.length} buổi học đã được lên kế hoạch hôm nay`
                    : "Chưa có lịch học"}
                </p>
              </div>

              <Link href="/calendar">
                <Button variant="outline" size="sm" className="text-xs space-x-1 font-semibold rounded-2xl">
                  <span>Mở lịch tuần</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-3">
              {todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs hover:border-[#74a882] transition-all"
                  style={{ borderLeftColor: ev.subject?.color || "#2d6a4f", borderLeftWidth: "4px" }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                        {ev.title}
                      </span>
                      {ev.isLocked && (
                        <Badge variant="yellow" className="text-[10px]">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Đã khóa
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[#526b5c] dark:text-[#a3bda9]">
                      {ev.subject && (
                        <span className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                          {ev.subject.name}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-mono font-medium">
                        {format(ev.startTime, "HH:mm")} - {format(ev.endTime, "HH:mm")}
                      </span>
                    </div>
                  </div>

                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="font-semibold space-x-1 rounded-xl">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Xem</span>
                    </Button>
                  </Link>
                </div>
              ))}

              {todayEvents.length === 0 && (
                <div className="text-center py-8 text-xs text-[#526b5c] dark:text-[#a3bda9] space-y-2 bg-[#f8fbf8] dark:bg-[#142318] rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e]">
                  <p className="font-medium">Chưa có lịch học hôm nay.</p>
                  <Link href="/calendar">
                    <Button variant="default" size="sm" className="font-semibold bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl">
                      Xếp lịch tự động bằng AI
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <div className="w-8 h-8 rounded-xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#40916c] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Tiến độ các môn học</span>
              </CardTitle>
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="text-xs text-[#2d6a4f] dark:text-[#52b788] font-semibold space-x-1">
                  <span>Quản lý môn học</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-3">
              {subjects.map((sub) => {
                const totalSecs = sub.studySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
                const actualH = Math.round((totalSecs / 3600) * 10) / 10;
                const targetH = sub.targetHours || 10;
                const percent = Math.min(100, Math.round((actualH / targetH) * 100));

                return (
                  <div
                    key={sub.id}
                    className="space-y-1.5 p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: sub.color || "#2d6a4f" }}
                        />
                        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span className="font-mono text-[#526b5c] dark:text-[#a3bda9] font-semibold shrink-0">
                        {actualH} / {targetH}h ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#dbe7dd] dark:bg-[#263d2e] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: sub.color || "#2d6a4f" }}
                      />
                    </div>
                  </div>
                );
              })}

              {subjects.length === 0 && (
                <div className="text-center py-8 text-xs text-[#526b5c] dark:text-[#a3bda9] space-y-2 bg-[#f8fbf8] dark:bg-[#142318] rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e]">
                  <p className="font-medium">Thêm môn học đầu tiên để bắt đầu lập kế hoạch.</p>
                  <Link href="/subjects">
                    <Button variant="default" size="sm" className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl font-semibold">
                      Thêm môn học ngay
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Study Sessions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2 text-[#192e22] dark:text-[#f0f7f2]">
                <div className="w-8 h-8 rounded-xl bg-[#d8ebe0] dark:bg-[#1d3827] text-[#2d6a4f] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span>Phiên học gần đây</span>
              </CardTitle>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Ghi nhận thực tế từng giây qua Timer
              </p>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-3">
              {recentSessions.map((session) => {
                const mins = Math.round(session.actualDurationSeconds / 60);
                return (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs space-y-1.5 hover:border-[#74a882] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: session.subject.color || "#2d6a4f" }}
                        />
                        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                          {session.subject.name}
                        </span>
                      </div>
                      <Badge variant="green" className="font-mono font-bold text-[10px]">
                        {mins > 0 ? `${mins} phút` : `${session.actualDurationSeconds}s`}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#73927d]">
                      <span>{format(session.actualStart, "dd/MM HH:mm")}</span>
                      {session.productivityScore && (
                        <span className="text-amber-500 font-bold">
                          ★ {session.productivityScore}/5
                        </span>
                      )}
                    </div>

                    {session.notes && (
                      <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] italic border-t border-[#dbe7dd]/70 dark:border-[#263d2e] pt-1.5 mt-1 line-clamp-2">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                );
              })}

              {recentSessions.length === 0 && (
                <div className="text-center py-8 text-xs text-[#526b5c] dark:text-[#a3bda9] bg-[#f8fbf8] dark:bg-[#142318] rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e]">
                  Chưa có dữ liệu thống kê
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

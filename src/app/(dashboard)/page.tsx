import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVN, getNowInVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { KpiCards } from "@/components/dashboard/kpi-cards";
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
  CheckCircle,
  ArrowRight,
  Plus,
  Lock,
  Target,
  Flame,
} from "lucide-react";
import { isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const nowVN = getNowInVN();

  // 1. Fetch all subjects with goals and logs
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      studyGoals: true,
      studyLogs: true,
    },
  });

  // 2. Fetch all study logs
  const allLogs = await prisma.studyLog.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { startTime: "desc" },
  });

  // 3. Fetch all schedule events
  const allEvents = await prisma.scheduleEvent.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { startTime: "asc" },
  });

  // Calculate KPIs
  const totalActualMinutes = allLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const actualHours = Math.round((totalActualMinutes / 60) * 10) / 10;

  const totalPlannedMinutes = allEvents.reduce((acc, ev) => {
    const diff = (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / (1000 * 60);
    return acc + Math.max(0, diff);
  }, 0);
  const plannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;

  const completionRate =
    plannedHours > 0 ? Math.min(100, Math.round((actualHours / plannedHours) * 100)) : 100;

  // Calculate Streak
  const uniqueLogDates = new Set(
    allLogs.map((l) => formatVN(l.startTime, "yyyy-MM-dd"))
  );
  let streak = 0;
  let checkDate = new Date();
  while (uniqueLogDates.has(formatVN(checkDate, "yyyy-MM-dd"))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Today's events
  const todayEvents = allEvents.filter((ev) =>
    isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), nowVN)
  );

  // Recent 5 logs
  const recentLogs = allLogs.slice(0, 5);

  return (
    <div className="space-y-7">
      {/* Friendly Hero Banner inspired by Reference Image 1 & 4 */}
      <div className="rounded-[30px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 soft-card-shadow relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-reference-grid opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              <span>ChronoMind v2.0 • Giờ chuẩn Việt Nam (UTC+7)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Chào {user.name || "bạn"}, hôm nay tiếp tục bứt phá mục tiêu!
            </h1>

            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Hệ điều hành quản lý thời gian và lịch học thông minh: tự động né 100% lịch bận, theo dõi với PIP Floating Timer và đo lường Planned vs Actual.
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <Link href="/calendar">
                <Button variant="pill" size="default" className="font-bold text-emerald-800 shadow-sm space-x-2 hover:bg-emerald-50">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI Tự động lập lịch tuần này →</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Speech Bubble Mascot Callout (Reference Image 1) */}
          <div className="hidden lg:flex flex-col items-end shrink-0">
            <div className="speech-bubble p-4 text-slate-800 max-w-[240px] shadow-lg mb-3">
              <p className="text-xs font-semibold leading-relaxed">
                Hôm nay bạn muốn bứt phá giới hạn không? ChronoMind đồng hành cùng bạn! ☀️
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-400 border-3 border-white shadow-md flex items-center justify-center text-2xl select-none mr-4">
              😊
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (4 Rounded Metrics + Orange Streak Banner) */}
      <KpiCards
        actualHours={actualHours}
        plannedHours={plannedHours}
        completionRate={completionRate}
        streakDays={streak}
      />

      {/* Quick Action Navigation Cards (Exactly like Reference Image 2: "Truy cập nhanh") */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white px-1">
          Truy cập nhanh
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Quick 1: Lịch tuần */}
          <Link href="/calendar" className="group">
            <div className="p-4 rounded-[22px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shadow-xs">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Lịch học tuần
                  </h3>
                  <p className="text-[11px] text-slate-400">Xem & xếp lịch AI</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
            </div>
          </Link>

          {/* Quick 2: Bộ môn & Mục tiêu */}
          <Link href="/subjects" className="group">
            <div className="p-4 rounded-[22px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Môn học & Mục tiêu
                  </h3>
                  <p className="text-[11px] text-slate-400">Chỉ tiêu số giờ cần học</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
            </div>
          </Link>

          {/* Quick 3: Khung giờ bận */}
          <Link href="/blocked-slots" className="group">
            <div className="p-4 rounded-[22px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    Khung giờ bận
                  </h3>
                  <p className="text-[11px] text-slate-400">Khóa giờ ngủ & lịch trường</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
            </div>
          </Link>

          {/* Quick 4: Báo cáo */}
          <Link href="/analytics" className="group">
            <div className="p-4 rounded-[22px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 soft-card-shadow soft-card-hover flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    Báo cáo Planned vs Actual
                  </h3>
                  <p className="text-[11px] text-slate-400">Heatmap & năng suất</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Schedule + Subject Progress (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Schedule Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <span>Lịch học hôm nay</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Có {todayEvents.length} buổi học đã được lên kế hoạch cho ngày hôm nay
                </p>
              </div>

              <Link href="/calendar">
                <Button variant="outline" size="sm" className="text-xs space-x-1 font-semibold">
                  <span>Mở lịch tuần</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-3">
              {todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  style={{ borderLeftColor: ev.subject?.color || "#3b82f6", borderLeftWidth: "4px" }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {ev.title}
                      </span>
                      {ev.isCompleted && (
                        <Badge variant="green" className="text-[10px]">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Đã hoàn thành
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      {ev.subject && (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ev.subject.name}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-mono font-medium">
                        {formatVN(ev.startTime, "HH:mm")} - {formatVN(ev.endTime, "HH:mm")}
                      </span>
                    </div>
                  </div>

                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="font-semibold space-x-1">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Xem lịch</span>
                    </Button>
                  </Link>
                </div>
              ))}

              {todayEvents.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="font-medium">Hôm nay chưa có lịch học nào được xếp.</p>
                  <Link href="/calendar">
                    <Button variant="default" size="sm" className="font-semibold">
                      Bấm vào đây để AI tự động xếp lịch hôm nay
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal Progress Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Tiến độ các môn trọng tâm</span>
              </CardTitle>
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 font-semibold space-x-1">
                  <span>Quản lý chỉ tiêu</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-4">
              {subjects.slice(0, 4).map((sub) => {
                const activeGoal = sub.studyGoals[0];
                const target = activeGoal ? activeGoal.targetHours : 10;
                const totalMins = sub.studyLogs.reduce((a, b) => a + b.durationMinutes, 0);
                const logged = Math.round((totalMins / 60) * 10) / 10;
                const percent = Math.min(100, Math.round((logged / target) * 100));

                return (
                  <div key={sub.id} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="font-bold text-slate-800 dark:text-white truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 font-semibold shrink-0">
                        {logged} / {target}h ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Study Logs (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span>Nhật ký học gần đây</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Ghi nhận thực tế qua PIP Mini-Player
              </p>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: log.subject.color }}
                      />
                      <span className="font-bold text-slate-800 dark:text-white truncate">
                        {log.subject.name}
                      </span>
                    </div>
                    <Badge variant="green" className="font-mono font-bold">
                      {log.durationMinutes} phút
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatVN(log.startTime, "dd/MM HH:mm")}</span>
                    {log.productivityScore && (
                      <span className="text-amber-500 font-bold">
                        ★ {log.productivityScore}/5
                      </span>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1 line-clamp-2">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              ))}

              {recentLogs.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  Chưa có phiên học nào được ghi lại.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

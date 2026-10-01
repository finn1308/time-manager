import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVN, getNowInVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { PageHeader } from "@/components/notion/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Calendar, BookOpen, Clock, Play, CheckCircle, ArrowRight } from "lucide-react";
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

  // Calculate Streak: count consecutive days backwards from today having >= 1 study log
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
    <div className="space-y-6">
      {/* Notion Page Header */}
      <PageHeader
        icon="⏳"
        title={`Chào ${user.name || "bạn"}, hôm nay tiếp tục bứt phá!`}
        description={`${formatVN(nowVN, "EEEE, 'ngày' dd 'tháng' MM, yyyy")} (Giờ chuẩn Việt Nam)`}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/calendar">
              <Button variant="default" size="sm" className="space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mở Lịch & AI</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <KpiCards
        actualHours={actualHours}
        plannedHours={plannedHours}
        completionRate={completionRate}
        streakDays={streak}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Lịch học hôm nay</span>
                </CardTitle>
                <p className="text-xs text-[#787774] mt-0.5">
                  Có {todayEvents.length} buổi học đã được lên lịch cho ngày hôm nay
                </p>
              </div>

              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 space-x-1">
                  <span>Xem tuần</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-2.5">
              {todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#1f1f1f] text-xs hover:border-blue-400 transition-colors"
                  style={{ borderLeftColor: ev.subject?.color || "#3b82f6", borderLeftWidth: "4px" }}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-[#171717] dark:text-white">
                        {ev.title}
                      </span>
                      {ev.isCompleted && (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 text-[10px] font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>Đã hoàn thành</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[#787774]">
                      {ev.subject && (
                        <span className="font-medium text-[#37352f] dark:text-[#d4d4d4]">
                          {ev.subject.name}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-mono">
                        {formatVN(ev.startTime, "HH:mm")} - {formatVN(ev.endTime, "HH:mm")}
                      </span>
                    </div>
                  </div>

                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="text-xs space-x-1">
                      <Play className="w-3 h-3" />
                      <span>Chi tiết</span>
                    </Button>
                  </Link>
                </div>
              ))}

              {todayEvents.length === 0 && (
                <div className="text-center py-8 text-xs text-[#9b9a97] space-y-2">
                  <p>Hôm nay chưa có lịch học nào được xếp.</p>
                  <Link href="/calendar">
                    <Button variant="default" size="sm" className="bg-blue-600 text-white">
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
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Tiến độ các môn trọng tâm</span>
              </CardTitle>
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 space-x-1">
                  <span>Quản lý</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              {subjects.slice(0, 4).map((sub) => {
                const activeGoal = sub.studyGoals[0];
                const target = activeGoal ? activeGoal.targetHours : 10;
                const totalMins = sub.studyLogs.reduce((a, b) => a + b.durationMinutes, 0);
                const logged = Math.round((totalMins / 60) * 10) / 10;
                const percent = Math.min(100, Math.round((logged / target) * 100));

                return (
                  <div key={sub.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="font-semibold text-[#171717] dark:text-white truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span className="font-mono text-[#787774] shrink-0">
                        {logged} / {target} giờ ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
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

        {/* Right Column: Recent Study Logs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Nhật ký học gần đây</span>
              </CardTitle>
              <p className="text-xs text-[#787774]">
                Các phiên học được ghi lại thực tế qua PIP Mini-Player
              </p>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#1f1f1f] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: log.subject.color }}
                      />
                      <span className="font-semibold text-[#171717] dark:text-white truncate">
                        {log.subject.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {log.durationMinutes} phút
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#787774]">
                    <span>{formatVN(log.startTime, "dd/MM HH:mm")}</span>
                    {log.productivityScore && (
                      <span className="text-amber-500 font-medium">
                        ★ {log.productivityScore}/5
                      </span>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-[11px] text-[#5a5955] dark:text-[#a0a0a0] italic border-t border-[#e9e9e7]/50 pt-1 mt-1 line-clamp-2">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              ))}

              {recentLogs.length === 0 && (
                <p className="text-center py-8 text-xs text-[#9b9a97]">
                  Chưa có phiên học nào được ghi lại. Hãy bấm nút Play trên thanh bên để bắt đầu!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

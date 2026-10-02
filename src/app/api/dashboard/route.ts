import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format, addDays } from "date-fns";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekAgo = subDays(now, 7);
  const weekAhead = addDays(now, 7);

  // Fetch all calendar events around this window to expand accurately
  const allEventsAroundNow = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: { subject: true },
  });

  const expandedEvents = expandRecurringEvents(allEventsAroundNow, weekAgo, weekAhead);

  // 1. Today's Events (Planned)
  const todayEvents = expandedEvents.filter(e => e.startTime >= todayStart && e.startTime <= todayEnd);
  const todayPlannedHours = todayEvents.reduce((acc, ev) => {
    const diff = (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600);
    return acc + Math.max(0, diff);
  }, 0);

  // 2. Fetch Today's Study Sessions (Actual)
  const todaySessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      actualStart: { gte: todayStart, lte: todayEnd },
    },
    include: { subject: true },
  });

  const todayActualSeconds = todaySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const todayActualHours = todayActualSeconds / 3600;

  // 3. This Week's Events (Planned)
  const weekEvents = expandedEvents.filter(e => e.startTime >= weekStart && e.startTime <= weekEnd);
  const weekPlannedHours = weekEvents.reduce((acc, ev) => {
    const diff = (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600);
    return acc + Math.max(0, diff);
  }, 0);

  // 4. Fetch This Week's Study Sessions (Actual)
  const weekSessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      actualStart: { gte: weekStart, lte: weekEnd },
    },
  });

  const weekActualSeconds = weekSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const weekActualHours = weekActualSeconds / 3600;

  const completionPercentage = weekPlannedHours > 0
    ? Math.min(100, Math.round((weekActualHours / weekPlannedHours) * 100))
    : (weekActualHours > 0 ? 100 : 0);

  // 5. Calculate Real Consecutive Study Streak
  const allSessions = await prisma.studySession.findMany({
    where: { userId: user.id, actualDurationSeconds: { gt: 60 } },
    select: { actualStart: true },
    orderBy: { actualStart: "desc" },
  });

  const studyDaysSet = new Set(
    allSessions.map((s) => format(s.actualStart, "yyyy-MM-dd"))
  );

  let currentStreak = 0;
  let checkDate = new Date();
  const todayKey = format(checkDate, "yyyy-MM-dd");
  const yesterdayKey = format(subDays(checkDate, 1), "yyyy-MM-dd");

  if (studyDaysSet.has(todayKey)) {
    currentStreak = 1;
    let d = subDays(checkDate, 1);
    while (studyDaysSet.has(format(d, "yyyy-MM-dd"))) {
      currentStreak++;
      d = subDays(d, 1);
    }
  } else if (studyDaysSet.has(yesterdayKey)) {
    currentStreak = 1;
    let d = subDays(checkDate, 2);
    while (studyDaysSet.has(format(d, "yyyy-MM-dd"))) {
      currentStreak++;
      d = subDays(d, 1);
    }
  }

  // 6. Upcoming Study Sessions / Events (Next 7 days)
  const upcomingEvents = expandedEvents
    .filter(e => e.startTime >= now && e.startTime <= weekAhead)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  // 7. Overdue Goals
  const overdueGoals = await prisma.goal.findMany({
    where: {
      userId: user.id,
      deadline: { lt: now },
      status: { not: "COMPLETED" },
    },
    include: { subject: true },
    orderBy: { deadline: "asc" },
  });

  // 8. Subject Progress
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      goals: true,
      studySessions: {
        select: { actualDurationSeconds: true },
      },
    },
    orderBy: { priority: "desc" },
  });

  const subjectProgress = subjects.map((sub) => {
    const totalActualSeconds = sub.studySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
    const actualHours = Math.round((totalActualSeconds / 3600) * 10) / 10;
    const targetHours = sub.targetHours;
    const progressPercent = targetHours ? Math.min(100, Math.round((actualHours / targetHours) * 100)) : null;

    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      color: sub.color,
      targetHours,
      actualHours,
      progressPercent,
      activeGoalsCount: sub.goals.filter((g) => g.status === "ACTIVE").length,
    };
  });

  // 9. Day-by-day Planned vs Actual for Chart (Last 7 days)
  const chartData = [];
  
  // Need to fetch sessions for last 7 days to get actual data
  const last7DaysSessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      actualStart: { gte: startOfDay(weekAgo), lte: todayEnd },
    },
  });

  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i);
    const dayS = startOfDay(day);
    const dayE = endOfDay(day);
    const dayLabel = format(day, "EEE (dd/MM)");

    const dayPlanned = expandedEvents
      .filter((e) => e.startTime >= dayS && e.startTime <= dayE)
      .reduce((acc, e) => acc + (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 3600), 0);

    const dayActual = last7DaysSessions
      .filter((s) => s.actualStart >= dayS && s.actualStart <= dayE)
      .reduce((acc, s) => acc + s.actualDurationSeconds / 3600, 0);

    chartData.push({
      day: dayLabel,
      planned: Math.round(dayPlanned * 10) / 10,
      actual: Math.round(dayActual * 10) / 10,
    });
  }

  return NextResponse.json({
    metrics: {
      todayPlannedHours: Math.round(todayPlannedHours * 10) / 10,
      todayActualHours: Math.round(todayActualHours * 10) / 10,
      weekPlannedHours: Math.round(weekPlannedHours * 10) / 10,
      weekActualHours: Math.round(weekActualHours * 10) / 10,
      completionPercentage,
      currentStreak,
      totalSessionsCount: allSessions.length,
      activeSubjectsCount: subjects.length,
    },
    upcomingEvents,
    overdueGoals,
    subjectProgress,
    chartData,
  });
}

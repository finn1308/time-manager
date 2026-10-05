import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format, addDays, startOfMonth, startOfYear } from "date-fns";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";
import { isSelfStudyEvent, isSchoolEvent, isPersonalEvent } from "@/lib/calendar/event-types";

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
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  // Execute all independent database queries in parallel
  const [
    allEventsAroundNow,
    todaySessions,
    weekSessions,
    yesterdaySessions,
    monthSessions,
    yearSessions,
    allSessionsMinimal, // For streak and totals
    overdueGoals,
    subjects,
    last7DaysSessions
  ] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId: user.id },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: todayStart, lte: todayEnd },
      },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: weekStart, lte: weekEnd },
      },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: yesterdayStart, lte: yesterdayEnd },
      },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: monthStart, lte: todayEnd },
      },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: yearStart, lte: todayEnd },
      },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id, actualDurationSeconds: { gt: 60 } },
      select: { actualStart: true },
      orderBy: { actualStart: "desc" },
      take: 365, // Limit for streak calculation
    }),
    prisma.goal.findMany({
      where: {
        userId: user.id,
        deadline: { lt: now },
        status: { not: "COMPLETED" },
      },
      include: { subject: true },
      orderBy: { deadline: "asc" },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      include: {
        goals: true,
        studySessions: {
          select: { actualDurationSeconds: true },
        },
        vocabWords: {
          select: {
            id: true,
            userProgress: {
              where: { userId: user.id },
              select: { status: true, nextReviewDate: true },
            },
          },
        },
        vocabStudySessions: {
          where: { userId: user.id },
          select: { id: true, durationSeconds: true },
        },
      },
      orderBy: { priority: "desc" },
    }),
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: startOfDay(weekAgo), lte: todayEnd },
      },
    })
  ]);

  const expandedEvents = expandRecurringEvents(allEventsAroundNow, weekAgo, weekAhead);

  // 1. Today's Events (Categorized by type - Requirements 13 & 14)
  const todayEvents = expandedEvents.filter(
    (e) => e.startTime >= todayStart && e.startTime <= todayEnd && !e.isCancelled
  );

  const todaySelfStudyPlannedHours = todayEvents
    .filter((ev) => isSelfStudyEvent(ev.type) && (ev as any).trackStudyTime !== false)
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  const todaySchoolHours = todayEvents
    .filter((ev) => isSchoolEvent(ev.type))
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  const todayPersonalHours = todayEvents
    .filter((ev) => isPersonalEvent(ev.type))
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  const todayScheduledHours = todayEvents
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  // 2. Today's Study Sessions (Actual recorded by timer)

  const todayActualSeconds = todaySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const todayActualHours = todayActualSeconds / 3600;

  // 3. This Week's Events (Categorized)
  const weekEvents = expandedEvents.filter(
    (e) => e.startTime >= weekStart && e.startTime <= weekEnd && !e.isCancelled
  );

  const weekSelfStudyPlannedHours = weekEvents
    .filter((ev) => isSelfStudyEvent(ev.type) && (ev as any).trackStudyTime !== false)
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  const weekSchoolHours = weekEvents
    .filter((ev) => isSchoolEvent(ev.type))
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  const weekPersonalHours = weekEvents
    .filter((ev) => isPersonalEvent(ev.type))
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  const weekScheduledHours = weekEvents
    .reduce((acc, ev) => acc + (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600), 0);

  // 4. This Week's Study Sessions (Actual)

  const weekActualSeconds = weekSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const weekActualHours = weekActualSeconds / 3600;

  const completionPercentage = weekSelfStudyPlannedHours > 0
    ? Math.min(100, Math.round((weekActualHours / weekSelfStudyPlannedHours) * 100))
    : (weekActualHours > 0 ? 100 : 0);

  // 5. Calculate Real Consecutive Study Streak
  const studyDaysSet = new Set(
    allSessionsMinimal.map((s) => format(s.actualStart, "yyyy-MM-dd"))
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
    .filter((e) => e.startTime >= now && e.startTime <= weekAhead && !e.isCancelled)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  // 7. Overdue Goals (Fetched in parallel)
  const subjectProgress = subjects.map((sub) => {
    const totalActualSeconds = sub.studySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
    const actualHours = Math.round((totalActualSeconds / 3600) * 10) / 10;
    const targetHours = sub.targetHours;
    const remainingHours = targetHours ? Math.max(0, Math.round((targetHours - actualHours) * 10) / 10) : null;
    const progressPercent = targetHours ? Math.min(100, Math.round((actualHours / targetHours) * 100)) : null;

    const totalVocabWords = (sub as any).vocabWords?.length || 0;
    let vocabMastered = 0;
    let vocabLearning = 0;
    let vocabReviewDue = 0;
    for (const vw of ((sub as any).vocabWords || [])) {
      const p = vw.userProgress?.[0];
      if (p?.status === "MASTERED") vocabMastered++;
      else if (p?.status === "LEARNING") vocabLearning++;
      if (p && ((p.nextReviewDate && p.nextReviewDate <= now) || (!p.nextReviewDate && p.status === "LEARNING"))) {
        vocabReviewDue++;
      }
    }

    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      color: sub.color,
      targetHours,
      actualHours,
      remainingHours,
      progressPercent,
      activeGoalsCount: sub.goals.filter((g) => g.status === "ACTIVE").length,
      vocabulary: {
        totalWords: totalVocabWords,
        mastered: vocabMastered,
        learning: vocabLearning,
        reviewDue: vocabReviewDue,
        practiceSessions: (sub as any).vocabStudySessions?.length || 0,
      },
    };
  });

  // Multi-Period Actual Study Stats Helper
  const groupSessionsBySubject = (sessionList: any[]) => {
    const map: Record<string, { id: string; name: string; color: string; hours: number }> = {};
    let totalSecs = 0;

    for (const s of sessionList) {
      totalSecs += s.actualDurationSeconds;
      if (!map[s.subjectId]) {
        map[s.subjectId] = {
          id: s.subject?.id || s.subjectId,
          name: s.subject?.name || "Môn học",
          color: s.subject?.color || "#2d6a4f",
          hours: 0,
        };
      }
      map[s.subjectId].hours += s.actualDurationSeconds / 3600;
    }

    return {
      totalHours: Math.round((totalSecs / 3600) * 10) / 10,
      bySubject: Object.values(map).map((item) => ({
        ...item,
        hours: Math.round(item.hours * 10) / 10,
      })),
    };
  };

  const multiPeriodStats = {
    today: groupSessionsBySubject(todaySessions),
    yesterday: groupSessionsBySubject(yesterdaySessions),
    thisWeek: groupSessionsBySubject(weekSessions),
    last7Days: groupSessionsBySubject(last7DaysSessions),
    thisMonth: groupSessionsBySubject(monthSessions),
    thisYear: groupSessionsBySubject(yearSessions),
    allTime: {
      totalHours: Math.round(
        (subjects.reduce((sum, sub) => sum + sub.studySessions.reduce((sSum, s) => sSum + s.actualDurationSeconds, 0), 0) / 3600) * 10
      ) / 10,
      bySubject: subjects.map((sub) => ({
        id: sub.id,
        name: sub.name,
        color: sub.color,
        hours: Math.round((sub.studySessions.reduce((sSum, s) => sSum + s.actualDurationSeconds, 0) / 3600) * 10) / 10,
      })),
    },
  };

  // 9. Day-by-day Planned vs Actual for Chart (Last 7 days)
  // Self-study planned is compared with actual study sessions
  const chartData = [];

  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i);
    const dayS = startOfDay(day);
    const dayE = endOfDay(day);
    const dayLabel = format(day, "EEE (dd/MM)");

    const dayPlanned = expandedEvents
      .filter((e) => e.startTime >= dayS && e.startTime <= dayE && isSelfStudyEvent(e.type) && (e as any).trackStudyTime !== false && !e.isCancelled)
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
      todayPlannedHours: Math.round(todaySelfStudyPlannedHours * 10) / 10,
      todayActualHours: Math.round(todayActualHours * 10) / 10,
      todaySchoolHours: Math.round(todaySchoolHours * 10) / 10,
      todayPersonalHours: Math.round(todayPersonalHours * 10) / 10,
      todayScheduledHours: Math.round(todayScheduledHours * 10) / 10,
      weekPlannedHours: Math.round(weekSelfStudyPlannedHours * 10) / 10,
      weekActualHours: Math.round(weekActualHours * 10) / 10,
      weekSchoolHours: Math.round(weekSchoolHours * 10) / 10,
      weekPersonalHours: Math.round(weekPersonalHours * 10) / 10,
      weekScheduledHours: Math.round(weekScheduledHours * 10) / 10,
      completionPercentage,
      currentStreak,
      totalSessionsCount: allSessionsMinimal.length,
      activeSubjectsCount: subjects.length,
    },
    upcomingEvents,
    overdueGoals,
    subjectProgress,
    multiPeriodStats,
    chartData,
  });
}

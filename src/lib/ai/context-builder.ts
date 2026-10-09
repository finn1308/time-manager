import { prisma } from "../prisma";
import { makeVNDate, VIETNAM_TIMEZONE } from "../date-utils";
import { expandRecurringEvents } from "../scheduling/recurrence";
import { subDays, differenceInDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export interface ComprehensiveStudyContext {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  preferences: {
    maxSessionDurationMins: number;
    breakDurationMins: number;
    pomodoroDurationMins: number;
    preferredStudyHours: string;
    unwantedStudyHours: string;
    maxDailyStudyHours: number;
    maxDailySessions: number;
    restDays: number[]; // e.g. [0] for Sunday
    timePreference: string; // MORNING, AFTERNOON, EVENING, BALANCED
    minBreakBetweenSessions: number;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    targetHours: number;
    loggedHours: number;
    remainingHours: number;
    priority: number;
    targetScore: string | null;
    deadline: string | null;
    difficulty: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    subjectId: string | null;
    subjectName?: string;
    targetHours: number;
    deadline: string | null;
    daysUntilDeadline: number | null;
    uncompletedMilestones: Array<{ id: string; title: string }>;
  }>;
  activeTasks: Array<{
    id: string;
    title: string;
    subjectId: string | null;
    subjectName?: string;
    priority: string;
    deadline: string | null;
    estimatedMinutes: number;
    daysUntilDeadline: number | null;
  }>;
  historySummary: {
    past14DaysActualHours: number;
    totalSessionsCount: number;
    completedCount: number;
    missedCount: number;
    partialCount: number;
    completionRatePercent: number;
    avgDailyHours: number;
  };
  availabilityRules: Array<{
    dayOfWeek: number | null;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    title: string | null;
  }>;
  existingEvents: Array<{
    id: string;
    title: string;
    startTime: string; // ISO
    endTime: string;   // ISO
    isLocked: boolean;
    type: string;
  }>;
  flexibleGoals: Array<{
    id: string;
    title: string;
    subjectId: string | null;
    subjectName?: string;
    skillId: string | null;
    skillName?: string;
    targetMinutes: number;
    startDate: string;
    endDate: string | null;
    activeDays: number[];
    preferredPeriod: string;
    deadline: string | null;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    totalPlannedHours: number | null;
  }>;
}

/**
 * Builds the 360-degree context engine payload for AI Auto Scheduling
 * Ingests User, Preferences, Subjects, Goals, Milestones, Tasks, Deadlines, History, and Calendar
 */
export async function buildComprehensiveStudyContext(params: {
  userId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  subjectIds?: string[];
}): Promise<ComprehensiveStudyContext> {
  const { userId, startDate, endDate, subjectIds } = params;

  // 1. Fetch user & study preferences
  const [userRecord, studyPrefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.userStudyPreferences.findUnique({
      where: { userId },
    }),
  ]);

  if (!userRecord) {
    throw new Error("Không tìm thấy thông tin người dùng");
  }

  // Parse rest days (e.g. "0" -> [0], "0,6" -> [0, 6])
  const parsedRestDays = (studyPrefs?.restDays || "0")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  const preferences = {
    maxSessionDurationMins: studyPrefs?.maxSessionDurationMins ?? 90,
    breakDurationMins: studyPrefs?.breakDurationMins ?? 15,
    pomodoroDurationMins: studyPrefs?.pomodoroDurationMins ?? 25,
    preferredStudyHours: studyPrefs?.preferredStudyHours ?? "08:00-11:30,14:00-17:30,19:30-22:30",
    unwantedStudyHours: studyPrefs?.unwantedStudyHours ?? "23:00-06:00,12:00-13:30",
    maxDailyStudyHours: studyPrefs?.maxDailyStudyHours ?? 6.0,
    maxDailySessions: studyPrefs?.maxDailySessions ?? 4,
    restDays: parsedRestDays,
    timePreference: studyPrefs?.timePreference ?? "BALANCED",
    minBreakBetweenSessions: studyPrefs?.minBreakBetweenSessions ?? 15,
  };

  // 2. Fetch subjects with active goals & sessions
  const subjects = await prisma.subject.findMany({
    where: {
      userId,
      isArchived: false,
      ...(subjectIds && subjectIds.length > 0 ? { id: { in: subjectIds } } : {}),
    },
    include: {
      goals: {
        where: { status: "ACTIVE" },
        include: {
          milestoneRecords: {
            where: { isCompleted: false },
          },
        },
      },
      studySessions: {
        where: { status: "COMPLETED" },
      },
    },
    orderBy: { priority: "desc" },
  });

  const subjectMap = new Map<string, string>();
  subjects.forEach((s) => subjectMap.set(s.id, s.name));

  const subjectsPayload = subjects.map((sub) => {
    const activeGoal = sub.goals[0];
    const targetHours = activeGoal ? activeGoal.targetHours : sub.targetHours || 10.0;
    const totalActualSeconds = sub.studySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
    const loggedHours = Math.round((totalActualSeconds / 3600) * 10) / 10;
    const remainingHours = Math.max(0, targetHours - loggedHours);

    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      targetHours,
      loggedHours,
      remainingHours,
      priority: sub.priority || 3,
      targetScore: sub.targetScore,
      deadline: sub.deadline ? formatInTimeZone(sub.deadline, VIETNAM_TIMEZONE, "yyyy-MM-dd") : null,
      difficulty: sub.difficulty || "MEDIUM",
    };
  });

  // 3. Goals & Milestones
  const now = new Date();
  const goalsPayload: ComprehensiveStudyContext["goals"] = [];

  subjects.forEach((sub) => {
    sub.goals.forEach((g) => {
      const daysUntilDeadline = g.deadline ? differenceInDays(new Date(g.deadline), now) : null;
      goalsPayload.push({
        id: g.id,
        title: g.title,
        subjectId: sub.id,
        subjectName: sub.name,
        targetHours: g.targetHours,
        deadline: g.deadline ? formatInTimeZone(g.deadline, VIETNAM_TIMEZONE, "yyyy-MM-dd") : null,
        daysUntilDeadline,
        uncompletedMilestones: g.milestoneRecords.map((m) => ({ id: m.id, title: m.title })),
      });
    });
  });

  // 4. Active Tasks with Deadlines
  const activeTasks = await prisma.task.findMany({
    where: {
      userId,
      status: { notIn: ["DONE", "CANCELLED"] },
    },
    include: {
      subject: true,
    },
    orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    take: 20,
  });

  const tasksPayload = activeTasks.map((t) => {
    const daysUntilDeadline = t.deadline ? differenceInDays(new Date(t.deadline), now) : null;
    return {
      id: t.id,
      title: t.title,
      subjectId: t.subjectId,
      subjectName: t.subject?.name,
      priority: t.priority,
      deadline: t.deadline ? formatInTimeZone(t.deadline, VIETNAM_TIMEZONE, "yyyy-MM-dd") : null,
      estimatedMinutes: t.estimatedMinutes || 60,
      daysUntilDeadline,
    };
  });

  // 5. Study History (Past 14 Days)
  const fourteenDaysAgo = subDays(now, 14);
  const recentSessions = await prisma.studySession.findMany({
    where: {
      userId,
      actualStart: { gte: fourteenDaysAgo },
    },
    select: {
      status: true,
      actualDurationSeconds: true,
    },
  });

  const totalSessionsCount = recentSessions.length;
  const completedCount = recentSessions.filter((s) => s.status === "COMPLETED").length;
  const missedCount = recentSessions.filter((s) => s.status === "MISSED").length;
  const partialCount = recentSessions.filter((s) => s.status === "PARTIAL").length;
  const totalActualSeconds = recentSessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0);
  const past14DaysActualHours = Math.round((totalActualSeconds / 3600) * 10) / 10;
  const avgDailyHours = Math.round((past14DaysActualHours / 14) * 10) / 10;
  const completionRatePercent =
    totalSessionsCount > 0 ? Math.round((completedCount / totalSessionsCount) * 100) : 100;

  const historySummary = {
    past14DaysActualHours,
    totalSessionsCount,
    completedCount,
    missedCount,
    partialCount,
    completionRatePercent,
    avgDailyHours,
  };

  // 6. Availability Rules
  const availabilityRules = await prisma.availabilityRule.findMany({
    where: { userId },
    select: {
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isAvailable: true,
      title: true,
    },
  });

  // 7. Existing Calendar Events in target window
  const startWindow = makeVNDate(startDate, "00:00");
  const endWindow = makeVNDate(endDate, "23:59");

  const rawCalendarEvents = await prisma.calendarEvent.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      isLocked: true,
      type: true,
      recurrence: true,
      recurrenceRule: true,
      parentId: true,
      isException: true,
      isCancelled: true,
    },
  });

  const expanded = expandRecurringEvents(rawCalendarEvents as any, startWindow, endWindow);
  const eventsInWindow = expanded.filter(
    (e: any) => e.startTime <= endWindow && e.endTime >= startWindow && !e.isCancelled
  );

  const existingEventsPayload = eventsInWindow.map((e: any) => ({
    id: e.id,
    title: e.title,
    startTime: typeof e.startTime === "string" ? e.startTime : e.startTime.toISOString(),
    endTime: typeof e.endTime === "string" ? e.endTime : e.endTime.toISOString(),
    isLocked: Boolean(e.isLocked),
    type: e.type || "STUDY",
  }));

  // 8. Fetch active flexible goals & skills
  const [rawFlexibleGoals, rawSkills] = await Promise.all([
    prisma.flexibleStudyGoal.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        skill: { select: { id: true, name: true, category: true } },
      },
    }),
    prisma.skill.findMany({
      where: { userId, status: { not: "COMPLETED" } },
      select: { id: true, name: true, category: true, totalPlannedHours: true },
    }),
  ]);

  const flexibleGoalsPayload = rawFlexibleGoals.map((g) => {
    let activeDays: number[] = [1, 2, 3, 4, 5];
    try {
      if (Array.isArray(g.activeDays)) {
        activeDays = g.activeDays as number[];
      } else if (typeof g.activeDays === "string") {
        activeDays = JSON.parse(g.activeDays);
      }
    } catch {
      activeDays = [1, 2, 3, 4, 5];
    }

    return {
      id: g.id,
      title: g.title,
      subjectId: g.subjectId,
      subjectName: g.subject?.name,
      skillId: g.skillId,
      skillName: g.skill?.name,
      targetMinutes: g.targetMinutes,
      startDate: g.startDate ? formatInTimeZone(g.startDate, VIETNAM_TIMEZONE, "yyyy-MM-dd") : startDate,
      endDate: g.endDate ? formatInTimeZone(g.endDate, VIETNAM_TIMEZONE, "yyyy-MM-dd") : null,
      activeDays,
      preferredPeriod: g.preferredPeriod,
      deadline: g.deadline ? formatInTimeZone(g.deadline, VIETNAM_TIMEZONE, "yyyy-MM-dd") : null,
    };
  });

  return {
    user: userRecord,
    preferences,
    subjects: subjectsPayload,
    goals: goalsPayload,
    activeTasks: tasksPayload,
    historySummary,
    availabilityRules,
    existingEvents: existingEventsPayload,
    flexibleGoals: flexibleGoalsPayload,
    skills: rawSkills,
  };
}

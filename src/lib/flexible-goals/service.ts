import { prisma } from "../prisma";
import { getDateKeyVN, getDayRangeVN } from "../date-utils";

export interface ComputedFlexibleGoal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  skillId: string | null;
  targetMinutes: number;
  startDate: string;
  endDate: string | null;
  activeDays: number[]; // e.g. [1, 2, 3, 4, 5]
  preferredPeriod: string;
  deadline: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  // Computed for specific date
  targetDateKey: string;
  isActiveOnDate: boolean;
  actualMinutes: number;
  remainingMinutes: number;
  isCompleted: boolean;
  completedAt: string | null;

  // Linked entity info
  subject?: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
  skill?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

/**
 * Parses comma-separated active days string into array of numbers (0 = Sun .. 6 = Sat)
 */
export function parseActiveDays(activeDaysStr?: string | null): number[] {
  if (!activeDaysStr) return [1, 2, 3, 4, 5]; // Default weekdays Mon-Fri
  return activeDaysStr
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
}

/**
 * Checks if a dateKey is an active day for a flexible goal
 */
export function isGoalActiveOnDate(
  goal: {
    startDate: Date;
    endDate?: Date | null;
    activeDays: string;
    status: string;
  },
  dateKey: string
): boolean {
  if (goal.status !== "ACTIVE") return false;

  const targetDate = new Date(`${dateKey}T12:00:00+07:00`);
  const dayOfWeek = targetDate.getDay();

  const startKey = getDateKeyVN(goal.startDate);
  if (dateKey < startKey) return false;

  if (goal.endDate) {
    const endKey = getDateKeyVN(goal.endDate);
    if (dateKey > endKey) return false;
  }

  const activeDaysList = parseActiveDays(goal.activeDays);
  return activeDaysList.includes(dayOfWeek);
}

/**
 * Fetches and computes flexible daily goals for a given dateKey
 */
export async function getDailyFlexibleGoals(
  userId: string,
  targetDateKey: string = getDateKeyVN(new Date())
): Promise<ComputedFlexibleGoal[]> {
  const { startUTC, endUTC } = getDayRangeVN(targetDateKey);

  // 1. Fetch user's active/paused flexible goals
  const goals = await prisma.flexibleStudyGoal.findMany({
    where: {
      userId,
      status: { notIn: ["ARCHIVED"] },
    },
    include: {
      subject: {
        select: { id: true, name: true, code: true, color: true },
      },
      skill: {
        select: { id: true, name: true, category: true },
      },
      dailyRecords: {
        where: { dateKey: targetDateKey },
      },
      studySessions: {
        where: {
          actualStart: { gte: startUTC, lte: endUTC },
          status: "COMPLETED",
        },
        select: {
          id: true,
          actualDurationSeconds: true,
          actualStart: true,
        },
      },
      calendarEvents: {
        where: {
          startTime: { gte: startUTC, lte: endUTC },
          completed: true,
        },
        select: {
          id: true,
          actualDurationMinutes: true,
          plannedDurationMinutes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return goals.map((goal) => {
    const isActive = isGoalActiveOnDate(goal, targetDateKey);

    // Sum actual study time from studySessions linked to this goal on this date
    const sessionSeconds = goal.studySessions.reduce(
      (acc, s) => acc + (s.actualDurationSeconds || 0),
      0
    );
    const sessionMinutes = Math.round(sessionSeconds / 60);

    // Daily progress record if existing
    const dailyRecord = goal.dailyRecords[0];

    // Total actual minutes for this date (priority to actual studySessions, fallback to dailyRecord)
    const actualMinutes = Math.max(sessionMinutes, dailyRecord?.actualMinutes || 0);

    const targetMinutes = goal.targetMinutes;
    const remainingMinutes = Math.max(0, targetMinutes - actualMinutes);
    const isCompleted = actualMinutes >= targetMinutes || Boolean(dailyRecord?.completed);

    return {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      subjectId: goal.subjectId,
      skillId: goal.skillId,
      targetMinutes: goal.targetMinutes,
      startDate: goal.startDate.toISOString(),
      endDate: goal.endDate ? goal.endDate.toISOString() : null,
      activeDays: parseActiveDays(goal.activeDays),
      preferredPeriod: goal.preferredPeriod,
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),

      targetDateKey,
      isActiveOnDate: isActive,
      actualMinutes,
      remainingMinutes,
      isCompleted,
      completedAt: dailyRecord?.completedAt ? dailyRecord.completedAt.toISOString() : null,

      subject: goal.subject,
      skill: goal.skill,
    };
  });
}

/**
 * Records or updates actual study duration on a FlexibleStudyGoal for a given date
 */
export async function recordFlexibleGoalProgress(params: {
  userId: string;
  goalId?: string;
  flexibleGoalId?: string;
  dateKey?: string;
  targetDateKey?: string;
  additionalDurationSeconds?: number;
  studyDurationSeconds?: number;
}) {
  const userId = params.userId;
  const goalId = params.goalId || params.flexibleGoalId;
  if (!goalId) return null;
  const dateKey = params.dateKey || params.targetDateKey || getDateKeyVN(new Date());
  const additionalDurationSeconds = params.additionalDurationSeconds ?? params.studyDurationSeconds ?? 0;
  const addedMinutes = Math.round(additionalDurationSeconds / 60);

  const goal = await prisma.flexibleStudyGoal.findUnique({
    where: { id: goalId, userId },
  });
  if (!goal) return null;

  // Check if daily record already exists
  const existingRecord = await prisma.dailyGoalProgress.findUnique({
    where: {
      goalId_dateKey: {
        goalId,
        dateKey,
      },
    },
  });

  const currentMinutes = existingRecord ? existingRecord.actualMinutes : 0;
  const newActualMinutes = currentMinutes + addedMinutes;
  const isCompleted = newActualMinutes >= goal.targetMinutes;

  return await prisma.dailyGoalProgress.upsert({
    where: {
      goalId_dateKey: {
        goalId,
        dateKey,
      },
    },
    update: {
      actualMinutes: newActualMinutes,
      completed: isCompleted,
      completedAt: isCompleted ? (existingRecord?.completedAt || new Date()) : null,
    },
    create: {
      userId,
      goalId,
      dateKey,
      targetMinutes: goal.targetMinutes,
      actualMinutes: newActualMinutes,
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });
}

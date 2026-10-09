import { prisma } from "@/lib/prisma";
import { format, addDays, subDays, parseISO, isBefore, startOfDay } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { VIETNAM_TIMEZONE, getDateKeyVN, getDayNameVN } from "@/lib/date-utils";

/**
 * Returns date key "YYYY-MM-DD" for given date and timezone
 */
export function getDateKey(
  date: Date | string | number = new Date(),
  timezone: string = VIETNAM_TIMEZONE
): string {
  const d = typeof date === "string" ? (date.length === 10 ? parseISO(date) : new Date(date)) : new Date(date);
  if (isNaN(d.getTime())) return getDateKeyVN(new Date());
  return formatInTimeZone(d, timezone || VIETNAM_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Returns today's date key "YYYY-MM-DD" in user timezone
 */
export function getTodayKey(timezone: string = VIETNAM_TIMEZONE): string {
  return getDateKey(new Date(), timezone);
}

/**
 * Get next day's date key
 */
export function getNextDayKey(dateKey: string): string {
  const parsed = parseISO(dateKey);
  const next = addDays(parsed, 1);
  return format(next, "yyyy-MM-dd");
}

/**
 * Get previous day's date key
 */
export function getPrevDayKey(dateKey: string): string {
  const parsed = parseISO(dateKey);
  const prev = subDays(parsed, 1);
  return format(prev, "yyyy-MM-dd");
}

/**
 * Formats a dateKey "YYYY-MM-DD" into a friendly display string in Vietnamese
 * e.g. "Hôm nay, Thứ Sáu 09/10/2026" or "Thứ Bảy, 10/10/2026"
 */
export function formatDateDisplay(
  dateKey: string,
  todayKey: string = getTodayKey()
): string {
  try {
    const parsed = parseISO(dateKey);
    const dayName = getDayNameVN(parsed);
    const formatted = format(parsed, "dd/MM/yyyy");

    if (dateKey === todayKey) {
      return `Hôm nay, ${dayName} ${formatted}`;
    }
    if (dateKey === getNextDayKey(todayKey)) {
      return `Ngày mai, ${dayName} ${formatted}`;
    }
    if (dateKey === getPrevDayKey(todayKey)) {
      return `Hôm qua, ${dayName} ${formatted}`;
    }
    return `${dayName}, ${formatted}`;
  } catch {
    return dateKey;
  }
}

/**
 * Calculate completion metrics from a task collection
 */
export function calculateCompletionStats(tasks: Array<{ isCompleted: boolean }>): {
  totalTasks: number;
  completedTasks: number;
  uncompletedTasks: number;
  completionRate: number;
} {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const uncompletedTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

  return {
    totalTasks,
    completedTasks,
    uncompletedTasks,
    completionRate,
  };
}

/**
 * Recalculate and update the DailyTaskSummary for an OPEN day.
 * If the day is already CLOSED, its snapshot is kept frozen unless explicitly recalculated.
 */
export async function syncDailyTaskSummary(
  userId: string,
  dateKey: string,
  forceUpdateClosed: boolean = false
) {
  const existingSummary = await prisma.dailyTaskSummary.findUnique({
    where: {
      userId_dateKey: {
        userId,
        dateKey,
      },
    },
  });

  // If already closed and not forcing update, preserve frozen summary
  if (existingSummary && existingSummary.isClosed && !forceUpdateClosed) {
    return existingSummary;
  }

  // Find all tasks assigned to this dateKey
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      scheduledDate: dateKey,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      subjectId: true,
      isRollover: true,
      rolloverCount: true,
    },
  });

  const stats = calculateCompletionStats(tasks);

  return await prisma.dailyTaskSummary.upsert({
    where: {
      userId_dateKey: {
        userId,
        dateKey,
      },
    },
    create: {
      userId,
      dateKey,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      uncompletedTasks: stats.uncompletedTasks,
      completionRate: stats.completionRate,
      rolledOverTasks: existingSummary?.rolledOverTasks || 0,
      isClosed: false,
    },
    update: {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      uncompletedTasks: stats.uncompletedTasks,
      completionRate: stats.completionRate,
    },
  });
}

/**
 * Execute Day Closure (Chốt ngày) with atomic transaction.
 * Freezes the current day's snapshot and optionally rolls over unfinished tasks to tomorrow.
 */
export async function executeDayClosure(params: {
  userId: string;
  dateKey: string;
  rolloverToNextDay: boolean;
  targetDateKey?: string;
  notes?: string;
}) {
  const { userId, dateKey, rolloverToNextDay, notes } = params;
  const targetDateKey = params.targetDateKey || getNextDayKey(dateKey);

  // 1. Fetch all tasks assigned to dateKey
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      scheduledDate: dateKey,
    },
    include: {
      subject: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "asc" }],
  });

  const stats = calculateCompletionStats(tasks);
  const uncompletedTasks = tasks.filter((t) => !t.isCompleted);

  // 2. Prepare freeze snapshot of all tasks for this day
  const snapshotData = JSON.stringify(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      isCompleted: t.isCompleted,
      completedAt: t.completedAt,
      status: t.status,
      subjectId: t.subjectId,
      subjectName: t.subject?.name || null,
      subjectColor: t.subject?.color || null,
      isRollover: t.isRollover,
      rolloverCount: t.rolloverCount,
      originalDate: t.originalDate || dateKey,
    }))
  );

  let rolledOverCount = 0;

  // 3. If user chose YES: Roll over uncompleted tasks to targetDateKey
  if (rolloverToNextDay && uncompletedTasks.length > 0) {
    rolledOverCount = uncompletedTasks.length;
    const uncompletedIds = uncompletedTasks.map((t) => t.id);

    for (const task of uncompletedTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          scheduledDate: targetDateKey,
          originalDate: task.originalDate || dateKey,
          isRollover: true,
          rolloverCount: { increment: 1 },
          lastRolloverAt: new Date(),
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        entityType: "TASK",
        entityId: dateKey,
        action: "ROLLOVER",
        detailsJson: JSON.stringify({
          fromDay: dateKey,
          toDay: targetDateKey,
          count: rolledOverCount,
          taskIds: uncompletedIds,
        }),
      },
    });
  }

  // 4. Save/Update DailyTaskSummary as CLOSED with snapshot frozen
  const summary = await prisma.dailyTaskSummary.upsert({
    where: {
      userId_dateKey: {
        userId,
        dateKey,
      },
    },
    create: {
      userId,
      dateKey,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      uncompletedTasks: stats.uncompletedTasks,
      completionRate: stats.completionRate,
      rolledOverTasks: rolledOverCount,
      isClosed: true,
      closedAt: new Date(),
      snapshotData,
      notes: notes || null,
    },
    update: {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      uncompletedTasks: stats.uncompletedTasks,
      completionRate: stats.completionRate,
      rolledOverTasks: rolledOverCount,
      isClosed: true,
      closedAt: new Date(),
      snapshotData,
      notes: notes || undefined,
    },
  });

  // 5. If rolled over, also update target day's live summary
  if (rolloverToNextDay && rolledOverCount > 0) {
    const targetTasks = await prisma.task.findMany({
      where: {
        userId,
        scheduledDate: targetDateKey,
      },
    });
    const targetStats = calculateCompletionStats(targetTasks);

    await prisma.dailyTaskSummary.upsert({
      where: {
        userId_dateKey: {
          userId,
          dateKey: targetDateKey,
        },
      },
      create: {
        userId,
        dateKey: targetDateKey,
        totalTasks: targetStats.totalTasks,
        completedTasks: targetStats.completedTasks,
        uncompletedTasks: targetStats.uncompletedTasks,
        completionRate: targetStats.completionRate,
        isClosed: false,
      },
      update: {
        totalTasks: targetStats.totalTasks,
        completedTasks: targetStats.completedTasks,
        uncompletedTasks: targetStats.uncompletedTasks,
        completionRate: targetStats.completionRate,
      },
    });
  }

  return {
    summary,
    stats,
    rolledOverCount,
    targetDateKey: rolloverToNextDay ? targetDateKey : null,
    closedTasksCount: tasks.length,
  };
}

/**
 * Check for unclosed previous days that have tasks needing checkout/review.
 * Used when user reopens the app or triggers review.
 */
export async function getUnclosedPastDays(userId: string, todayKey: string) {
  // Find all distinct scheduledDates in tasks that are strictly before todayKey
  const pastTasks = await prisma.task.findMany({
    where: {
      userId,
      scheduledDate: {
        lt: todayKey,
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      scheduledDate: true,
      isCompleted: true,
    },
  });

  if (pastTasks.length === 0) return [];

  // Group by scheduledDate
  const dateMap = new Map<string, typeof pastTasks>();
  for (const t of pastTasks) {
    if (!t.scheduledDate) continue;
    const existing = dateMap.get(t.scheduledDate) || [];
    existing.push(t);
    dateMap.set(t.scheduledDate, existing);
  }

  const dateKeys = Array.from(dateMap.keys());

  // Check which dates have DailyTaskSummary with isClosed = true
  const closedSummaries = await prisma.dailyTaskSummary.findMany({
    where: {
      userId,
      dateKey: { in: dateKeys },
      isClosed: true,
    },
    select: { dateKey: true },
  });

  const closedSet = new Set(closedSummaries.map((s) => s.dateKey));

  // Filter for unclosed past days
  const unclosedDays: Array<{
    dateKey: string;
    totalTasks: number;
    completedTasks: number;
    uncompletedTasks: number;
    completionRate: number;
    tasks: typeof pastTasks;
  }> = [];

  for (const [dKey, tList] of dateMap.entries()) {
    if (!closedSet.has(dKey)) {
      const stats = calculateCompletionStats(tList);
      unclosedDays.push({
        dateKey: dKey,
        ...stats,
        tasks: tList,
      });
    }
  }

  // Sort descending (most recent past day first)
  unclosedDays.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  return unclosedDays;
}

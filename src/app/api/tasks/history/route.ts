import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getTodayKey, getPrevDayKey } from "@/lib/tasks/smart-todo";
import { parseISO, subDays } from "date-fns";
import { VIETNAM_TIMEZONE } from "@/lib/date-utils";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month"; // "week", "month", "all"
    const userTimezone = user.timezone || VIETNAM_TIMEZONE;
    const todayKey = getTodayKey(userTimezone);

    let fromDateKey: string | null = null;
    const todayDate = parseISO(todayKey);

    if (range === "week") {
      fromDateKey = getTodayKey(userTimezone);
      const past7 = subDays(todayDate, 7);
      fromDateKey = past7.toISOString().slice(0, 10);
    } else if (range === "month") {
      const past30 = subDays(todayDate, 30);
      fromDateKey = past30.toISOString().slice(0, 10);
    }

    const where: any = { userId: user.id };
    if (fromDateKey) {
      where.dateKey = { gte: fromDateKey };
    }

    // 1. Fetch DailyTaskSummaries
    const summaries = await prisma.dailyTaskSummary.findMany({
      where,
      orderBy: { dateKey: "desc" },
    });

    // 2. Fetch tasks corresponding to these dates for interactive day inspection
    const dateKeys = summaries.map((s) => s.dateKey);
    // Also include today's tasks even if summary wasn't generated yet
    if (!dateKeys.includes(todayKey)) {
      dateKeys.push(todayKey);
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledDate: { in: dateKeys },
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });

    // Group tasks by scheduledDate
    const tasksByDate: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      if (t.scheduledDate) {
        if (!tasksByDate[t.scheduledDate]) tasksByDate[t.scheduledDate] = [];
        tasksByDate[t.scheduledDate].push(t);
      }
    }

    // 3. Compute aggregate metrics
    let totalTasksRecorded = 0;
    let totalTasksCompleted = 0;
    let totalRollovers = 0;
    let daysClosedCount = 0;

    const formattedSummaries = summaries.map((s) => {
      totalTasksRecorded += s.totalTasks;
      totalTasksCompleted += s.completedTasks;
      totalRollovers += s.rolledOverTasks;
      if (s.isClosed) daysClosedCount++;

      let parsedSnapshot: any[] | null = null;
      if (s.snapshotData) {
        try {
          parsedSnapshot = JSON.parse(s.snapshotData);
        } catch {
          parsedSnapshot = null;
        }
      }

      return {
        ...s,
        tasks: parsedSnapshot || tasksByDate[s.dateKey] || [],
      };
    });

    const averageCompletionRate =
      totalTasksRecorded > 0
        ? Math.round((totalTasksCompleted / totalTasksRecorded) * 1000) / 10
        : 0;

    return NextResponse.json({
      summaries: formattedSummaries,
      metrics: {
        totalTasksRecorded,
        totalTasksCompleted,
        totalRollovers,
        daysRecordedCount: summaries.length,
        daysClosedCount,
        averageCompletionRate,
      },
      range,
      todayKey,
    });
  } catch (err: any) {
    console.error("GET /api/tasks/history error:", err);
    return NextResponse.json({ error: "Lỗi tải lịch sử nhiệm vụ" }, { status: 500 });
  }
}

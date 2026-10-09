import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getTodayKey,
  getNextDayKey,
  calculateCompletionStats,
  executeDayClosure,
  getUnclosedPastDays,
  syncDailyTaskSummary,
} from "@/lib/tasks/smart-todo";
import { VIETNAM_TIMEZONE } from "@/lib/date-utils";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const userTimezone = user.timezone || VIETNAM_TIMEZONE;
    const todayKey = getTodayKey(userTimezone);
    const dateKey = searchParams.get("dateKey") || todayKey;

    // 1. Fetch current day's tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledDate: dateKey,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });

    const stats = calculateCompletionStats(tasks);

    // 2. Fetch or sync day summary
    let daySummary = await prisma.dailyTaskSummary.findUnique({
      where: {
        userId_dateKey: {
          userId: user.id,
          dateKey,
        },
      },
    });

    if (!daySummary) {
      daySummary = await syncDailyTaskSummary(user.id, dateKey);
    }

    // 3. Check for any unclosed past days
    const unclosedPastDays = await getUnclosedPastDays(user.id, todayKey);

    return NextResponse.json({
      dateKey,
      todayKey,
      isClosed: daySummary?.isClosed || false,
      closedAt: daySummary?.closedAt || null,
      daySummary,
      stats,
      tasks,
      unclosedPastDays,
    });
  } catch (err: any) {
    console.error("GET /api/tasks/day-closure error:", err);
    return NextResponse.json({ error: "Lỗi tải thông tin chốt ngày" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      dateKey,
      rolloverToNextDay = false,
      targetDateKey,
      notes,
    } = body;

    const userTimezone = user.timezone || VIETNAM_TIMEZONE;
    const effectiveDateKey = dateKey || getTodayKey(userTimezone);

    const result = await executeDayClosure({
      userId: user.id,
      dateKey: effectiveDateKey,
      rolloverToNextDay: Boolean(rolloverToNextDay),
      targetDateKey,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: rolloverToNextDay
        ? `Đã chốt ngày ${effectiveDateKey} và chuyển ${result.rolledOverCount} nhiệm vụ sang ${result.targetDateKey}`
        : `Đã chốt ngày ${effectiveDateKey} thành công. Toàn bộ nhiệm vụ được lưu giữ ở ngày cũ.`,
      result,
    });
  } catch (err: any) {
    console.error("POST /api/tasks/day-closure error:", err);
    return NextResponse.json({ error: "Lỗi thực hiện chốt ngày" }, { status: 500 });
  }
}

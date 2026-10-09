import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncDailyTaskSummary, getTodayKey, getNextDayKey } from "@/lib/tasks/smart-todo";
import { VIETNAM_TIMEZONE } from "@/lib/date-utils";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { taskIds, targetDateKey } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất 1 nhiệm vụ để chuyển ngày" }, { status: 400 });
    }

    const userTimezone = user.timezone || VIETNAM_TIMEZONE;
    const destinationDate = targetDateKey || getNextDayKey(getTodayKey(userTimezone));

    // Fetch the tasks to ensure they belong to this user
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        scheduledDate: true,
        originalDate: true,
        isCompleted: true,
      },
    });

    if (tasks.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy nhiệm vụ hợp lệ" }, { status: 404 });
    }

    const sourceDates = new Set<string>();

    await prisma.$transaction(async (tx) => {
      for (const t of tasks) {
        if (t.scheduledDate) sourceDates.add(t.scheduledDate);

        await tx.task.update({
          where: { id: t.id },
          data: {
            scheduledDate: destinationDate,
            originalDate: t.originalDate || t.scheduledDate || destinationDate,
            isRollover: true,
            rolloverCount: { increment: 1 },
            lastRolloverAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: "TASK",
          entityId: destinationDate,
          action: "ROLLOVER_MANUAL",
          detailsJson: JSON.stringify({
            count: tasks.length,
            targetDate: destinationDate,
            taskIds: tasks.map((t) => t.id),
          }),
        },
      });
    });

    // Sync all affected dates' summaries
    for (const sDate of sourceDates) {
      await syncDailyTaskSummary(user.id, sDate);
    }
    await syncDailyTaskSummary(user.id, destinationDate);

    return NextResponse.json({
      success: true,
      message: `Đã chuyển ${tasks.length} nhiệm vụ sang ngày ${destinationDate}`,
      count: tasks.length,
      destinationDate,
    });
  } catch (err: any) {
    console.error("POST /api/tasks/rollover error:", err);
    return NextResponse.json({ error: "Lỗi chuyển tiếp nhiệm vụ" }, { status: 500 });
  }
}

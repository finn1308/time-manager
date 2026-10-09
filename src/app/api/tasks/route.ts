import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getDateKey,
  getTodayKey,
  calculateCompletionStats,
  syncDailyTaskSummary,
} from "@/lib/tasks/smart-todo";
import { VIETNAM_TIMEZONE } from "@/lib/date-utils";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const list = searchParams.get("list") || "all"; // today, important, planned, pending, completed, all
    const dateKey = searchParams.get("dateKey") || searchParams.get("date");
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const userTimezone = user.timezone || VIETNAM_TIMEZONE;
    const todayKey = getTodayKey(userTimezone);

    const where: any = { userId: user.id };

    // 1. List / View Filtering (Microsoft To Do System)
    if (list === "today") {
      where.scheduledDate = dateKey || todayKey;
    } else if (list === "important") {
      where.isImportant = true;
    } else if (list === "planned") {
      where.OR = [
        { scheduledDate: { not: null } },
        { deadline: { not: null } },
      ];
    } else if (list === "pending") {
      where.isCompleted = false;
    } else if (list === "completed") {
      where.isCompleted = true;
    } else if (dateKey) {
      // Explicit dateKey filter without "today" list
      where.scheduledDate = dateKey;
    }

    // 2. Extra Filters
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (subjectId && subjectId !== "ALL") {
      where.subjectId = subjectId;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        goal: {
          select: { id: true, title: true },
        },
        milestone: {
          select: { id: true, title: true },
        },
        subTasks: {
          select: { id: true, title: true, isCompleted: true, status: true },
        },
        dependencies: {
          include: {
            prerequisite: {
              select: { id: true, title: true, status: true, isCompleted: true },
            },
          },
        },
        prerequisitesFor: {
          include: {
            task: {
              select: { id: true, title: true, status: true, isCompleted: true },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [
        { isCompleted: "asc" },
        { isImportant: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Compute stats for current view
    const stats = calculateCompletionStats(tasks);

    // Also get daily closure info for the selected dateKey if viewing a specific date
    let daySummary = null;
    const targetDate = dateKey || (list === "today" ? todayKey : null);
    if (targetDate) {
      daySummary = await prisma.dailyTaskSummary.findUnique({
        where: {
          userId_dateKey: {
            userId: user.id,
            dateKey: targetDate,
          },
        },
      });
    }

    return NextResponse.json({
      tasks,
      stats,
      todayKey,
      selectedDateKey: targetDate || todayKey,
      daySummary,
    });
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách task" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      priority = "MEDIUM",
      estimatedMinutes = 60,
      deadline,
      status = "TODO",
      scheduledDate,
      isImportant = false,
      subjectId,
      goalId,
      milestoneId,
      parentTaskId,
      prerequisiteTaskIds = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Tiêu đề nhiệm vụ không được để trống" }, { status: 400 });
    }

    const userTimezone = user.timezone || VIETNAM_TIMEZONE;
    const todayKey = getTodayKey(userTimezone);
    const assignedDate = scheduledDate || todayKey;

    const isDone = status === "DONE";

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
        estimatedMinutes: Math.max(5, parseInt(estimatedMinutes, 10) || 60),
        deadline: deadline ? new Date(deadline) : null,
        scheduledDate: assignedDate,
        originalDate: assignedDate,
        isImportant: Boolean(isImportant),
        status: ["INBOX", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"].includes(status) ? status : "TODO",
        isCompleted: isDone,
        completedAt: isDone ? new Date() : null,
        subjectId: subjectId || null,
        goalId: goalId || null,
        milestoneId: milestoneId || null,
        parentTaskId: parentTaskId || null,
        dependencies:
          Array.isArray(prerequisiteTaskIds) && prerequisiteTaskIds.length > 0
            ? {
                create: prerequisiteTaskIds
                  .filter((pId: string) => typeof pId === "string" && pId.trim().length > 0)
                  .map((pId: string) => ({
                    prerequisiteId: pId,
                  })),
              }
            : undefined,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        dependencies: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    // Sync live daily task summary for the assigned date
    if (assignedDate) {
      await syncDailyTaskSummary(user.id, assignedDate);
    }

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Lỗi tạo nhiệm vụ mới" }, { status: 500 });
  }
}

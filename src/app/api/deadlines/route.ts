import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDeadlineUrgency } from "@/lib/deadline-engine";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Fetch active tasks with deadlines
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        deadline: { not: null },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: {
        subject: true,
        goal: true,
        calendarEvents: {
          select: { id: true, startTime: true, endTime: true, type: true },
        },
        studySessions: {
          select: { id: true, status: true, plannedDurationSeconds: true },
        },
      },
      orderBy: { deadline: "asc" },
    });

    // 2. Fetch goals with deadlines
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        deadline: { not: null },
        status: { not: "COMPLETED" },
      },
      include: {
        subject: true,
        milestoneRecords: true,
        tasks: true,
        studySessions: {
          select: { id: true, status: true },
        },
      },
      orderBy: { deadline: "asc" },
    });

    // 3. Fetch subjects with exam dates / deadlines
    const subjects = await prisma.subject.findMany({
      where: {
        userId: user.id,
        deadline: { not: null },
        isArchived: false,
      },
      include: {
        tasks: {
          where: { isCompleted: false },
        },
        studySessions: {
          select: { id: true, status: true },
        },
      },
      orderBy: { deadline: "asc" },
    });

    // Transform and map to uniform deadline items
    const deadlineItems: any[] = [];

    // Map tasks
    for (const t of tasks) {
      if (!t.deadline) continue;
      const urgency = getDeadlineUrgency(t.deadline);
      const scheduledSessionsCount = t.calendarEvents.length + t.studySessions.length;

      deadlineItems.push({
        id: t.id,
        sourceType: "TASK",
        title: t.title,
        description: t.description,
        deadline: t.deadline,
        estimatedMinutes: t.estimatedMinutes || 60,
        priority: t.priority,
        status: t.status,
        subject: t.subject ? { id: t.subject.id, name: t.subject.name, color: t.subject.color } : null,
        goal: t.goal ? { id: t.goal.id, title: t.goal.title } : null,
        scheduledSessionsCount,
        hasScheduledPlan: scheduledSessionsCount > 0,
        urgency,
      });
    }

    // Map goals (if not already represented by a single task)
    for (const g of goals) {
      if (!g.deadline) continue;
      const urgency = getDeadlineUrgency(g.deadline);
      const estimatedMinutes = Math.round((g.targetHours || 10) * 60);
      const scheduledSessionsCount = g.studySessions.length;

      deadlineItems.push({
        id: g.id,
        sourceType: "GOAL",
        title: `Mục tiêu: ${g.title}`,
        description: g.description,
        deadline: g.deadline,
        estimatedMinutes,
        priority: "HIGH",
        status: g.status,
        subject: g.subject ? { id: g.subject.id, name: g.subject.name, color: g.subject.color } : null,
        goal: null,
        scheduledSessionsCount,
        hasScheduledPlan: scheduledSessionsCount > 0,
        urgency,
      });
    }

    // Map subjects with exam/course deadlines
    for (const s of subjects) {
      if (!s.deadline) continue;
      const urgency = getDeadlineUrgency(s.deadline);
      const estimatedMinutes = Math.round((s.targetHours || s.estimatedWorkload || 15) * 60);

      deadlineItems.push({
        id: s.id,
        sourceType: "EXAM",
        title: `Kỳ thi / Hạn môn: ${s.name}`,
        description: s.description || (s.targetScore ? `Mục tiêu: ${s.targetScore}` : null),
        deadline: s.deadline,
        estimatedMinutes,
        priority: s.priority >= 4 ? "URGENT" : "HIGH",
        status: "ACTIVE",
        subject: { id: s.id, name: s.name, color: s.color },
        goal: null,
        scheduledSessionsCount: s.studySessions.length,
        hasScheduledPlan: s.studySessions.length > 0,
        urgency,
      });
    }

    // Sort by deadline ascending
    deadlineItems.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    // Stats
    const totalCount = deadlineItems.length;
    const urgentCount = deadlineItems.filter((d) => d.urgency.status === "URGENT" || d.urgency.status === "OVERDUE").length;
    const unscheduledCount = deadlineItems.filter((d) => !d.hasScheduledPlan).length;

    return NextResponse.json({
      deadlines: deadlineItems,
      stats: {
        totalCount,
        urgentCount,
        unscheduledCount,
      },
    });
  } catch (err: any) {
    console.error("Error fetching deadlines:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách deadline" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, deadline, estimatedMinutes, priority, subjectId, goalId } = await req.json();

    if (!title?.trim() || !deadline) {
      return NextResponse.json({ error: "Vui lòng nhập tiêu đề và ngày hạn deadline" }, { status: 400 });
    }

    // Create as a high-priority Task
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        deadline: new Date(deadline),
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : 60,
        priority: priority || "HIGH",
        status: "TODO",
        subjectId: subjectId || null,
        goalId: goalId || null,
      },
      include: {
        subject: true,
        goal: true,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error("Error creating deadline assignment:", err);
    return NextResponse.json({ error: "Lỗi tạo bài tập/deadline" }, { status: 500 });
  }
}

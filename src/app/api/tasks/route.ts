import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");
    const search = searchParams.get("search");

    const where: any = { userId: user.id };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (subjectId && subjectId !== "ALL") {
      where.subjectId = subjectId;
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
      orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
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
      status = "INBOX",
      subjectId,
      goalId,
      milestoneId,
      parentTaskId,
      prerequisiteTaskIds = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Tiêu đề task không được để trống" }, { status: 400 });
    }

    const isDone = status === "DONE";

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
        estimatedMinutes: Math.max(5, parseInt(estimatedMinutes, 10) || 60),
        deadline: deadline ? new Date(deadline) : null,
        status: ["INBOX", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"].includes(status) ? status : "INBOX",
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
        subject: true,
        dependencies: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Lỗi tạo task mới" }, { status: 500 });
  }
}

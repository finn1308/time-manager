import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncDailyTaskSummary } from "@/lib/tasks/smart-todo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: { id, userId: user.id },
      include: {
        subject: true,
        goal: true,
        milestone: true,
        subTasks: true,
        dependencies: {
          include: {
            prerequisite: true,
          },
        },
        prerequisitesFor: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Không tìm thấy nhiệm vụ" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error("GET /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi tải thông tin nhiệm vụ" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      title,
      description,
      priority,
      estimatedMinutes,
      deadline,
      status,
      isCompleted,
      isImportant,
      scheduledDate,
      subjectId,
      goalId,
      milestoneId,
      prerequisiteTaskIds,
      force = false,
    } = body;

    const existing = await prisma.task.findUnique({
      where: { id, userId: user.id },
      include: {
        dependencies: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy nhiệm vụ" }, { status: 404 });
    }

    // Dependency check: If attempting to advance to IN_PROGRESS or DONE
    const nextStatus = status !== undefined ? status : existing.status;
    const nextCompleted = isCompleted !== undefined ? isCompleted : (nextStatus === "DONE");

    if ((nextStatus === "IN_PROGRESS" || nextStatus === "DONE" || nextCompleted) && !force) {
      const incompletePrereqs = existing.dependencies.filter(
        (dep) => !dep.prerequisite.isCompleted && dep.prerequisite.status !== "DONE"
      );

      if (incompletePrereqs.length > 0) {
        return NextResponse.json(
          {
            error: "BLOCKED_BY_DEPENDENCIES",
            message: `Nhiệm vụ này bị chặn bởi: ${incompletePrereqs
              .map((d) => `"${d.prerequisite.title}"`)
              .join(", ")}. Vui lòng hoàn thành các nhiệm vụ tiên quyết trước!`,
            blockingTasks: incompletePrereqs.map((d) => ({
              id: d.prerequisite.id,
              title: d.prerequisite.title,
              status: d.prerequisite.status,
            })),
          },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = parseInt(estimatedMinutes, 10);
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (subjectId !== undefined) updateData.subjectId = subjectId || null;
    if (goalId !== undefined) updateData.goalId = goalId || null;
    if (milestoneId !== undefined) updateData.milestoneId = milestoneId || null;
    if (isImportant !== undefined) updateData.isImportant = Boolean(isImportant);

    const oldScheduledDate = existing.scheduledDate;
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate || null;
      if (!existing.originalDate && scheduledDate) {
        updateData.originalDate = scheduledDate;
      }
    }

    // Handling Status & Completion atomically
    if (status !== undefined) {
      updateData.status = status;
      if (status === "DONE") {
        updateData.isCompleted = true;
        updateData.completedAt = existing.completedAt || new Date();
      } else {
        updateData.isCompleted = false;
        updateData.completedAt = null;
      }
    }

    if (isCompleted !== undefined) {
      updateData.isCompleted = Boolean(isCompleted);
      if (isCompleted) {
        updateData.status = "DONE";
        updateData.completedAt = existing.completedAt || new Date();
      } else {
        if (existing.status === "DONE") {
          updateData.status = "TODO";
        }
        updateData.completedAt = null;
      }
    }

    // Update dependencies if provided
    if (Array.isArray(prerequisiteTaskIds)) {
      await prisma.taskDependency.deleteMany({
        where: { taskId: id },
      });

      if (prerequisiteTaskIds.length > 0) {
        await prisma.taskDependency.createMany({
          data: prerequisiteTaskIds
            .filter((pId: string) => pId !== id)
            .map((pId: string) => ({
              taskId: id,
              prerequisiteId: pId,
            })),
        });
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        dependencies: {
          include: {
            prerequisite: true,
          },
        },
        prerequisitesFor: {
          include: {
            task: true,
          },
        },
      },
    });

    // Award XP if task was just marked as DONE
    const wasJustCompleted = updated.isCompleted && !existing.isCompleted;
    if (wasJustCompleted) {
      try {
        const { awardUserXp } = await import("@/lib/gamification/engine");
        await awardUserXp(user.id, 15, `Hoàn thành nhiệm vụ: ${updated.title}`);
      } catch (err) {
        console.warn("Could not award XP for task:", err);
      }
    }

    // Automatically sync live daily summaries
    const newScheduledDate = updated.scheduledDate;
    if (oldScheduledDate && oldScheduledDate !== newScheduledDate) {
      await syncDailyTaskSummary(user.id, oldScheduledDate);
    }
    if (newScheduledDate) {
      await syncDailyTaskSummary(user.id, newScheduledDate);
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật nhiệm vụ" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: { id, userId: user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Không tìm thấy nhiệm vụ" }, { status: 404 });
    }

    const scheduledDate = task.scheduledDate;

    await prisma.task.delete({
      where: { id },
    });

    // Recalculate daily summary after deletion
    if (scheduledDate) {
      await syncDailyTaskSummary(user.id, scheduledDate);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi xóa nhiệm vụ" }, { status: 500 });
  }
}

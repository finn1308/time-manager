import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
      return NextResponse.json({ error: "Không tìm thấy task" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error("GET /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi tải thông tin task" }, { status: 500 });
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
      return NextResponse.json({ error: "Không tìm thấy task" }, { status: 404 });
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
            message: `Task này bị chặn bởi: ${incompletePrereqs
              .map((d) => `"${d.prerequisite.title}"`)
              .join(", ")}. Vui lòng hoàn thành các task tiên quyết trước!`,
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

    if (status !== undefined) {
      updateData.status = status;
      if (status === "DONE") {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      } else {
        updateData.isCompleted = false;
        updateData.completedAt = null;
      }
    }

    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.status = "DONE";
        updateData.completedAt = new Date();
      } else if (existing.status === "DONE") {
        updateData.status = "TODO";
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
            .filter((pId: string) => pId !== id) // Prevent self loop
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
        subject: true,
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
    if (updated.status === "DONE" && existing.status !== "DONE") {
      const { awardUserXp } = await import("@/lib/gamification/engine");
      await awardUserXp(user.id, 15, `Hoàn thành nhiệm vụ: ${updated.title}`);
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật task" }, { status: 500 });
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
      return NextResponse.json({ error: "Không tìm thấy task" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi xóa task" }, { status: 500 });
  }
}

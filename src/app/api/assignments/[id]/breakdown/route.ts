import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, differenceInDays } from "date-fns";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: assignmentId } = await params;

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId: user.id },
    include: { subject: { select: { id: true, name: true } } },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Không tìm thấy bài tập" }, { status: 404 });
  }

  try {
    const totalDays = Math.max(2, differenceInDays(assignment.deadline, new Date()));
    const stepDurationDays = Math.max(1, Math.floor(totalDays / 5));

    // Structured 5-step decomposition pipeline
    const subtaskSteps = [
      {
        title: `1. Thu thập tài liệu & Khảo sát đề tài: ${assignment.title}`,
        offsetDays: 1,
        mins: 60,
      },
      {
        title: `2. Lập dàn ý & Luận điểm chi tiết: ${assignment.title}`,
        offsetDays: 1 + stepDurationDays,
        mins: 90,
      },
      {
        title: `3. Soạn thảo nội dung chính: ${assignment.title}`,
        offsetDays: 1 + stepDurationDays * 2,
        mins: 150,
      },
      {
        title: `4. Kiểm tra trích dẫn, phản biện & Đọc soát: ${assignment.title}`,
        offsetDays: 1 + stepDurationDays * 3,
        mins: 90,
      },
      {
        title: `5. Hoàn thiện định dạng & Nộp bài chính thức: ${assignment.title}`,
        offsetDays: Math.max(1, totalDays - 1),
        mins: 45,
      },
    ];

    const createdTasks = [];
    const now = new Date();

    for (const step of subtaskSteps) {
      const taskDeadline = addDays(now, Math.min(totalDays, step.offsetDays));
      const t = await prisma.task.create({
        data: {
          userId: user.id,
          subjectId: assignment.subjectId,
          title: step.title,
          deadline: taskDeadline,
          priority: assignment.priority,
          estimatedMinutes: step.mins,
          status: "TODO",
        },
      });
      createdTasks.push(t);
    }

    // Update assignment status to PLANNING
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: "PLANNING" },
    });

    return NextResponse.json({
      success: true,
      message: `Đã phân rã bài tập thành ${createdTasks.length} nhiệm vụ cụ thể`,
      tasks: createdTasks,
    });
  } catch (err: any) {
    console.error("Error breaking down assignment:", err);
    return NextResponse.json({ error: err.message || "Lỗi phân rã nhiệm vụ bài tập" }, { status: 500 });
  }
}

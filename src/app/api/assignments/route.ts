import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const semesterId = searchParams.get("semesterId");
  const status = searchParams.get("status");

  const whereClause: any = { userId: user.id };
  if (subjectId && subjectId !== "ALL") whereClause.subjectId = subjectId;
  if (semesterId && semesterId !== "ALL") whereClause.semesterId = semesterId;
  if (status && status !== "ALL") whereClause.status = status;

  try {
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        subject: { select: { id: true, name: true, color: true, code: true } },
        semester: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
    });

    const statusCounts = await prisma.assignment.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      assignments,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
    });
  } catch (err: any) {
    console.error("Error fetching assignments:", err);
    return NextResponse.json({ error: err.message || "Lỗi tải bài tập / đồ án" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      subjectId,
      semesterId,
      deadline,
      priority = "MEDIUM",
      estimatedWorkloadMinutes = 120,
      description,
      notes,
    } = body;

    if (!title || !deadline) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên bài tập và hạn nộp" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        semesterId: semesterId || null,
        title,
        description: description || null,
        deadline: new Date(deadline),
        priority,
        estimatedWorkloadMinutes: Number(estimatedWorkloadMinutes) || 120,
        status: "NOT_STARTED",
        progressPercent: 0,
        notes: notes || null,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    // Also create task for Todo list
    await prisma.task.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: `Nộp bài tập: ${title}`,
        deadline: new Date(deadline),
        priority,
        status: "TODO",
        estimatedMinutes: estimatedWorkloadMinutes,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    console.error("Error creating assignment:", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo bài tập" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, progressPercent, grade, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID bài tập" }, { status: 400 });
    }

    const updated = await prisma.assignment.update({
      where: { id, userId: user.id },
      data: {
        ...(status && { status }),
        ...(progressPercent !== undefined && { progressPercent: Number(progressPercent) }),
        ...(grade !== undefined && { grade: Number(grade) }),
        ...(notes !== undefined && { notes }),
        ...(status === "SUBMITTED" && { submissionDate: new Date(), progressPercent: 100 }),
      },
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: any) {
    console.error("Error updating assignment:", err);
    return NextResponse.json({ error: err.message || "Lỗi cập nhật bài tập" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      goals: {
        include: {
          milestoneRecords: true,
        },
      },
      tasks: {
        where: { isCompleted: false },
        take: 10,
      },
      studySessions: {
        orderBy: { actualStart: "desc" },
        take: 5,
      },
    },
    orderBy: [{ isArchived: "asc" }, { priority: "desc" }],
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      name,
      code,
      color,
      description,
      targetHours,
      priority,
      targetScore,
      deadline,
      difficulty,
      estimatedWorkload,
    } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên môn học không được để trống" }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: name.trim(),
        code: code?.trim() || null,
        color: color || "#2d6a4f",
        description: description?.trim() || null,
        targetHours: targetHours ? parseFloat(targetHours) : null,
        priority: priority ? parseInt(priority, 10) : 3,
        targetScore: targetScore?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        difficulty: difficulty || "MEDIUM",
        estimatedWorkload: estimatedWorkload ? parseFloat(estimatedWorkload) : null,
        isArchived: false,
      },
    });

    return NextResponse.json({ success: true, subject });
  } catch (err: any) {
    console.error("Error creating subject:", err);
    return NextResponse.json({ error: "Lỗi tạo môn học" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      id,
      name,
      code,
      color,
      description,
      targetHours,
      priority,
      targetScore,
      deadline,
      difficulty,
      estimatedWorkload,
      isArchived,
    } = await req.json();

    if (!id) return NextResponse.json({ error: "Thiếu ID môn học" }, { status: 400 });

    const subject = await prisma.subject.update({
      where: { id, userId: user.id },
      data: {
        name: name?.trim(),
        code: code?.trim() || null,
        color: color || undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        targetHours: targetHours !== undefined ? (targetHours ? parseFloat(targetHours) : null) : undefined,
        priority: priority !== undefined ? parseInt(priority, 10) : undefined,
        targetScore: targetScore !== undefined ? (targetScore?.trim() || null) : undefined,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
        difficulty: difficulty !== undefined ? difficulty : undefined,
        estimatedWorkload: estimatedWorkload !== undefined ? (estimatedWorkload ? parseFloat(estimatedWorkload) : null) : undefined,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
      },
    });

    return NextResponse.json({ success: true, subject });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi cập nhật môn học" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID môn học" }, { status: 400 });

  await prisma.subject.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { goalId, title, description, targetDate, order } = await req.json();

    if (!goalId || !title?.trim()) {
      return NextResponse.json({ error: "Thiếu thông tin goalId hoặc tiêu đề milestone" }, { status: 400 });
    }

    // Verify goal ownership
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });
    if (!goal) return NextResponse.json({ error: "Mục tiêu không tồn tại" }, { status: 404 });

    const milestone = await prisma.milestone.create({
      data: {
        goalId,
        title: title.trim(),
        description: description?.trim() || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        order: order || 0,
      },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (err: any) {
    console.error("Create milestone error:", err);
    return NextResponse.json({ error: "Lỗi tạo milestone" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, title, description, targetDate, isCompleted, order } = await req.json();
    if (!id) return NextResponse.json({ error: "Thiếu ID milestone" }, { status: 400 });

    const existing = await prisma.milestone.findUnique({
      where: { id },
      include: { goal: true },
    });
    if (!existing || existing.goal.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy milestone" }, { status: 404 });
    }

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : undefined,
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
        order: order !== undefined ? parseInt(order, 10) : undefined,
      },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (err: any) {
    console.error("Update milestone error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật milestone" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID milestone" }, { status: 400 });

  const existing = await prisma.milestone.findUnique({
    where: { id },
    include: { goal: true },
  });
  if (!existing || existing.goal.userId !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy milestone" }, { status: 404 });
  }

  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

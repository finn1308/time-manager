import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy thói quen" }, { status: 404 });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description?.trim() || null : undefined,
        subjectId: body.subjectId !== undefined ? body.subjectId || null : undefined,
        frequency: body.frequency || undefined,
        targetDays: body.targetDays || undefined,
        targetValue: body.targetValue !== undefined ? Number(body.targetValue) : undefined,
        unit: body.unit || undefined,
        color: body.color || undefined,
        icon: body.icon || undefined,
        isArchived: body.isArchived !== undefined ? Boolean(body.isArchived) : undefined,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
      },
    });

    return NextResponse.json({ habit: updated });
  } catch (error: any) {
    console.error("PUT /api/habits/[id] error:", error);
    return NextResponse.json({ error: error.message || "Lỗi cập nhật thói quen" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy thói quen" }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/habits/[id] error:", error);
    return NextResponse.json({ error: error.message || "Lỗi xóa thói quen" }, { status: 500 });
  }
}

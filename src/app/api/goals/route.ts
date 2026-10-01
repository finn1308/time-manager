import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    include: {
      subject: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, title, description, targetHours, deadline, status } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Tiêu đề mục tiêu không được để trống" }, { status: 400 });
    }

    if (!targetHours || parseFloat(targetHours) <= 0) {
      return NextResponse.json({ error: "Số giờ mục tiêu phải lớn hơn 0" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: title.trim(),
        description: description?.trim() || null,
        targetHours: parseFloat(targetHours),
        deadline: deadline ? new Date(deadline) : null,
        status: status || "ACTIVE",
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (err: any) {
    console.error("Error creating goal:", err);
    return NextResponse.json({ error: "Lỗi tạo mục tiêu học tập" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, subjectId, title, description, targetHours, deadline, status } = await req.json();

    if (!id) return NextResponse.json({ error: "Thiếu ID mục tiêu" }, { status: 400 });

    const goal = await prisma.goal.update({
      where: { id, userId: user.id },
      data: {
        subjectId: subjectId !== undefined ? subjectId : undefined,
        title: title?.trim(),
        description: description?.trim() !== undefined ? description?.trim() : undefined,
        targetHours: targetHours ? parseFloat(targetHours) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        status: status || undefined,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi cập nhật mục tiêu" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID mục tiêu" }, { status: 400 });

  await prisma.goal.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      studyGoals: true,
      studyLogs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, code, color, description, icon } = await req.json();

    if (!name) return NextResponse.json({ error: "Tên môn học không được để trống" }, { status: 400 });

    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name,
        code: code || null,
        color: color || "#3b82f6",
        icon: icon || null,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, subject });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi tạo môn học" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, name, code, color, description, icon } = await req.json();

    const subject = await prisma.subject.update({
      where: { id, userId: user.id },
      data: {
        name,
        code: code || null,
        color,
        icon,
        description,
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
  if (!id) return NextResponse.json({ error: "Missing subject id" }, { status: 400 });

  await prisma.subject.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}

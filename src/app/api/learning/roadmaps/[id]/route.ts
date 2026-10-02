import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { id, userId: user.id },
      include: {
        subject: true,
        document: {
          select: { id: true, filename: true, pageCount: true, fileSize: true },
        },
        stages: {
          include: {
            quizzes: {
              include: {
                attempts: {
                  where: { userId: user.id },
                  orderBy: { startedAt: "desc" },
                  take: 3,
                },
              },
            },
          },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: "Không tìm thấy lộ trình học tập" }, { status: 404 });
    }

    // Refresh user's latest XP
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, streakDays: true },
    });

    return NextResponse.json({
      roadmap,
      userXp: freshUser?.xp || 0,
      streakDays: freshUser?.streakDays || 1,
    });
  } catch (err: any) {
    console.error("Fetch roadmap detail error:", err);
    return NextResponse.json({ error: "Lỗi tải thông tin lộ trình" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.learningRoadmap.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa lộ trình thành công" });
  } catch (err: any) {
    console.error("Delete roadmap error:", err);
    return NextResponse.json({ error: "Lỗi xóa lộ trình" }, { status: 500 });
  }
}

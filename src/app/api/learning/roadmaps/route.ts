import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roadmaps = await prisma.learningRoadmap.findMany({
      where: { userId: user.id },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        document: {
          select: { id: true, filename: true, pageCount: true },
        },
        stages: {
          select: {
            id: true,
            dayNumber: true,
            title: true,
            isUnlocked: true,
            isCompleted: true,
            estimatedMinutes: true,
            xpReward: true,
            quizzes: {
              select: { id: true, questionCount: true, difficulty: true },
            },
          },
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, streakDays: true },
    });

    return NextResponse.json({
      roadmaps,
      userXp: freshUser?.xp || 0,
      streakDays: freshUser?.streakDays || 1,
    });
  } catch (err: any) {
    console.error("Fetch roadmaps error:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách lộ trình" }, { status: 500 });
  }
}

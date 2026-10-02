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
    // 1. Verify existence & strict ownership
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { id, userId: user.id },
      include: {
        stages: {
          select: { id: true },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Unable to delete this roadmap. Roadmap not found or unauthorized." },
        { status: 404 }
      );
    }

    const stageIds = roadmap.stages.map((s) => s.id);

    // 2. Cascade delete dependent Flashcard Decks attached to these stages
    if (stageIds.length > 0) {
      await prisma.flashcardDeck.deleteMany({
        where: { stageId: { in: stageIds }, userId: user.id },
      });
    }

    // 3. Delete roadmap (cascades to stages -> quizzes -> questions & attempts -> answers)
    await prisma.learningRoadmap.delete({
      where: { id: roadmap.id },
    });

    return NextResponse.json({
      success: true,
      message: "Learning roadmap deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete roadmap error:", err);
    return NextResponse.json(
      { error: "Unable to delete this roadmap. Please try again." },
      { status: 500 }
    );
  }
}

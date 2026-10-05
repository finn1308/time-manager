import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  try {
    const course = await prisma.vocabCourse.findUnique({
      where: { slug },
      include: {
        wordSets: {
          where: { isPro: true },
          select: { id: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    // Check user coins balance
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, isPro: true },
    });

    const cost = 100;
    if (!dbUser?.isPro && (dbUser?.coins || 0) < cost) {
      return NextResponse.json(
        {
          error: `Bạn cần ${cost} Xu để mở khóa toàn bộ khóa học này. Hiện bạn có ${dbUser?.coins || 0} Xu.`,
        },
        { status: 400 }
      );
    }

    // Deduct coins if not PRO
    if (!dbUser?.isPro) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          coins: { decrement: cost },
        },
      });
    }

    // Unlock all word sets in this course for this user
    for (const set of course.wordSets) {
      await prisma.userWordSetProgress.upsert({
        where: {
          userId_wordSetId: {
            userId: user.id,
            wordSetId: set.id,
          },
        },
        update: {
          isUnlocked: true,
        },
        create: {
          userId: user.id,
          wordSetId: set.id,
          isUnlocked: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã mở khóa toàn bộ bộ từ vựng thành công!",
      remainingCoins: (dbUser?.coins || 0) - (dbUser?.isPro ? 0 : cost),
    });
  } catch (error: any) {
    console.error("POST /api/vocab/courses/[slug]/unlock error:", error);
    return NextResponse.json(
      { error: "Lỗi mở khóa khóa học: " + error.message },
      { status: 500 }
    );
  }
}

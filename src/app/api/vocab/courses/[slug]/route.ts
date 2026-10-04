import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  const { slug } = await params;

  try {
    const course = await prisma.vocabCourse.findUnique({
      where: { slug },
      include: {
        wordSets: {
          include: {
            _count: {
              select: { words: true },
            },
            userProgresses: user
              ? {
                  where: { userId: user.id },
                }
              : false,
          },
          orderBy: { orderNumber: "asc" },
        },
        enrollments: user
          ? {
              where: { userId: user.id },
            }
          : false,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    const enrollment = user ? course.enrollments?.[0] : null;
    const isPinned = Boolean(enrollment?.isPinned);
    const userIsPro = Boolean(user?.isPro);

    // Compute progress for each word set in a single bulk query if user exists
    let allProgressMap: Record<string, { learned: number; mastered: number }> = {};
    if (user) {
      const setIds = course.wordSets.map(s => s.id);
      const allProgress = await prisma.userWordProgress.findMany({
        where: {
          userId: user.id,
          word: { setId: { in: setIds } },
          status: { in: ["LEARNING", "MASTERED"] },
        },
        select: {
          status: true,
          word: { select: { setId: true } },
        },
      });

      allProgressMap = allProgress.reduce((acc, p) => {
        const setId = p.word.setId;
        if (!acc[setId]) acc[setId] = { learned: 0, mastered: 0 };
        acc[setId].learned++;
        if (p.status === "MASTERED") acc[setId].mastered++;
        return acc;
      }, {} as Record<string, { learned: number; mastered: number }>);
    }

    let totalWordsInCourse = 0;
    let totalLearnedWordsInCourse = 0;

    const wordSetsWithProgress = course.wordSets.map((set) => {
      const totalWords = set._count.words;
      totalWordsInCourse += totalWords;

      let learnedWordsCount = 0;
      let isMastered = false;
      let isUnlocked = !set.isPro || userIsPro;

      if (user) {
        // Check if user specifically unlocked this set
        const setProgress = set.userProgresses?.[0];
        if (setProgress?.isUnlocked) {
          isUnlocked = true;
        }

        const stats = allProgressMap[set.id] || { learned: 0, mastered: 0 };
        learnedWordsCount = stats.learned;
        isMastered = totalWords > 0 && stats.mastered === totalWords;
      }

      totalLearnedWordsInCourse += learnedWordsCount;
      const progressPercent =
        totalWords > 0 ? Math.round((learnedWordsCount / totalWords) * 100) : 0;

      return {
        id: set.id,
        orderNumber: set.orderNumber,
        title: set.title,
        description: set.description,
        isPro: set.isPro,
        isLocked: !isUnlocked,
        totalWords,
        learnedWordsCount,
        progressPercent,
        isMastered,
      };
    });

    const completionPercent =
      totalWordsInCourse > 0
        ? Math.round((totalLearnedWordsInCourse / totalWordsInCourse) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        icon: course.icon,
        coverColor: course.coverColor,
        level: course.level,
        isPro: course.isPro,
        totalWordSets: course.wordSets.length,
        totalWords: totalWordsInCourse,
        learnedWordsCount: totalLearnedWordsInCourse,
        completionPercent,
        isPinned,
        wordSets: wordSetsWithProgress,
      },
    });
  } catch (error: any) {
    console.error("GET /api/vocab/courses/[slug] error:", error);
    return NextResponse.json(
      { error: "Lỗi tải chi tiết khóa học: " + error.message },
      { status: 500 }
    );
  }
}

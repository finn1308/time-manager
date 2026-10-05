import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalCourses, totalSets, totalWords, totalSessions, totalLearners, sets] = await Promise.all([
      prisma.vocabCourse.count(),
      prisma.wordSet.count(),
      prisma.vocabWord.count(),
      prisma.vocabStudySession.count(),
      prisma.user.count(),
      prisma.wordSet.findMany({
        select: {
          id: true,
          title: true,
          orderNumber: true,
          isPro: true,
          course: {
            select: { title: true, slug: true },
          },
          _count: {
            select: { words: true },
          },
        },
        orderBy: [{ courseId: "asc" }, { orderNumber: "asc" }],
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalCourses,
        totalSets,
        totalWords,
        totalSessions,
        totalLearners,
      },
      sets: sets.map((s) => ({
        id: s.id,
        title: s.title,
        orderNumber: s.orderNumber,
        isPro: s.isPro,
        courseTitle: s.course.title,
        courseSlug: s.course.slug,
        wordsCount: s._count.words,
      })),
      currentUser: {
        id: user.id,
        email: user.email,
        isPro: (user as any).isPro || false,
        coins: (user as any).coins || 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

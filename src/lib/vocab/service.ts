import { prisma } from "@/lib/prisma";

export async function getCourses(user: any) {
  const courses = await prisma.vocabCourse.findMany({
    where: { isPublished: true },
    include: {
      wordSets: {
        select: {
          id: true,
          orderNumber: true,
          title: true,
          isPro: true,
          _count: {
            select: { words: true },
          },
        },
        orderBy: { orderNumber: "asc" },
      },
      enrollments: user
        ? {
            where: { userId: user.id },
          }
        : false,
    },
    orderBy: { order: "asc" },
  });

  // Optimize N+1 userWordProgress by fetching all progress in one query if user is logged in
  let allProgressMap: Record<string, { learned: number }> = {};
  if (user && courses.length > 0) {
    const allSetIds = courses.flatMap(c => c.wordSets.map(s => s.id));
    if (allSetIds.length > 0) {
      // Instead of N+1 counts, we just pull the statuses and group them
      const userProgress = await prisma.userWordProgress.findMany({
        where: {
          userId: user.id,
          wordSetId: { in: allSetIds },
          status: { in: ["LEARNING", "MASTERED"] },
        },
        select: { wordSetId: true },
      });

      allProgressMap = userProgress.reduce((acc, p) => {
        const sid = p.wordSetId;
        if (!acc[sid]) acc[sid] = { learned: 0 };
        acc[sid].learned++;
        return acc;
      }, {} as Record<string, { learned: number }>);
    }
  }

  const formattedCourses = courses.map((course) => {
    const totalWordSets = course.wordSets.length;
    const totalWords = course.wordSets.reduce(
      (acc, set) => acc + set._count.words,
      0
    );

    let isPinned = false;
    let learnedWordsCount = 0;

    if (user) {
      const enrollment = course.enrollments?.[0];
      isPinned = Boolean(enrollment?.isPinned);

      course.wordSets.forEach(set => {
        if (allProgressMap[set.id]) {
          learnedWordsCount += allProgressMap[set.id].learned;
        }
      });
    }

    const completionPercent =
      totalWords > 0 ? Math.round((learnedWordsCount / totalWords) * 100) : 0;

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      icon: course.icon,
      coverColor: course.coverColor,
      level: course.level,
      isPro: course.isPro,
      totalWordSets,
      totalWords,
      learnedWordsCount,
      completionPercent,
      isPinned,
      wordSets: course.wordSets,
    };
  });

  return formattedCourses;
}

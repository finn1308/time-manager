import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  try {
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

    // Compute metrics for each course
    const formattedCourses = await Promise.all(
      courses.map(async (course) => {
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

          // Count words mastered or learning by user in this course
          const setIds = course.wordSets.map((s) => s.id);
          learnedWordsCount = await prisma.userWordProgress.count({
            where: {
              userId: user.id,
              wordSetId: { in: setIds },
              status: { in: ["LEARNING", "MASTERED"] },
            },
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
      })
    );

    return NextResponse.json({ success: true, courses: formattedCourses });
  } catch (error: any) {
    console.error("GET /api/vocab/courses error:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách khóa học từ vựng: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, slug, subtitle, description, level, icon, coverColor, isPro } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Tiêu đề khóa học không được để trống" }, { status: 400 });
    }

    const courseSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const course = await prisma.vocabCourse.create({
      data: {
        title: title.trim(),
        slug: courseSlug,
        subtitle: subtitle?.trim() || null,
        description: description?.trim() || null,
        level: level || "BEGINNER",
        icon: icon || "📚",
        coverColor: coverColor || "#10b981",
        isPro: Boolean(isPro),
      },
    });

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("POST /api/vocab/courses error:", error);
    return NextResponse.json(
      { error: "Lỗi tạo khóa học: " + error.message },
      { status: 500 }
    );
  }
}

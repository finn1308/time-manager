import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const courseSlug = searchParams.get("courseSlug");

  try {
    // Ensure default course and "Bộ từ vựng của tôi" exists so user always has a destination
    let defaultCourse = await prisma.vocabCourse.findFirst({
      where: { slug: "my-vocab" },
    });

    if (!defaultCourse) {
      defaultCourse = await prisma.vocabCourse.create({
        data: {
          slug: "my-vocab",
          title: "Bộ từ vựng cá nhân",
          subtitle: "Danh sách các bộ từ vựng do bạn tự tạo và nhập khẩu",
          description: "Quản lý và ôn luyện các bộ từ vựng tự do, nhập từ file Excel, Anki hoặc ChatGPT.",
          icon: "⭐",
          coverColor: "#10b981",
          level: "BEGINNER",
          isPublished: true,
          order: 0,
        },
      });
    }

    // Ensure default set "Bộ từ vựng của tôi" exists in this course
    let defaultSet = await prisma.wordSet.findFirst({
      where: { courseId: defaultCourse.id, title: "Bộ từ vựng của tôi" },
    });

    if (!defaultSet) {
      defaultSet = await prisma.wordSet.create({
        data: {
          courseId: defaultCourse.id,
          orderNumber: 1,
          title: "Bộ từ vựng của tôi",
          description: "Bộ từ vựng chính dùng để lưu các từ vựng tự thêm nhanh hoặc nhập từ file.",
          isPro: false,
        },
      });
    }

    const where: any = {};
    if (courseSlug) {
      where.course = { slug: courseSlug };
    }

    const sets = await prisma.wordSet.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
        _count: {
          select: {
            words: true,
          },
        },
      },
      orderBy: [
        { course: { order: "asc" } },
        { orderNumber: "asc" },
      ],
    });

    const formattedSets = sets.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      orderNumber: s.orderNumber,
      isPro: s.isPro,
      courseId: s.courseId,
      courseTitle: s.course.title,
      courseSlug: s.course.slug,
      totalWords: s._count.words,
    }));

    return NextResponse.json({
      success: true,
      sets: formattedSets,
      defaultSetId: defaultSet.id,
    });
  } catch (error: any) {
    console.error("GET /api/vocab/sets error:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách bộ từ: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, courseId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Tên bộ từ vựng không được để trống" },
        { status: 400 }
      );
    }

    let targetCourseId = courseId;
    if (!targetCourseId) {
      let defaultCourse = await prisma.vocabCourse.findFirst({
        where: { slug: "my-vocab" },
      });
      if (!defaultCourse) {
        defaultCourse = await prisma.vocabCourse.create({
          data: {
            slug: "my-vocab",
            title: "Bộ từ vựng cá nhân",
            subtitle: "Danh sách các bộ từ vựng do bạn tự tạo và nhập khẩu",
            description: "Quản lý và ôn luyện các bộ từ vựng tự do, nhập từ file Excel, Anki hoặc ChatGPT.",
            icon: "⭐",
            coverColor: "#10b981",
            level: "BEGINNER",
            isPublished: true,
            order: 0,
          },
        });
      }
      targetCourseId = defaultCourse.id;
    }

    // Determine next orderNumber in this course
    const lastSet = await prisma.wordSet.findFirst({
      where: { courseId: targetCourseId },
      orderBy: { orderNumber: "desc" },
    });
    const orderNumber = (lastSet?.orderNumber || 0) + 1;

    const newSet = await prisma.wordSet.create({
      data: {
        courseId: targetCourseId,
        orderNumber,
        title: title.trim(),
        description: description?.trim() || null,
        isPro: false,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      set: {
        id: newSet.id,
        title: newSet.title,
        description: newSet.description,
        orderNumber: newSet.orderNumber,
        isPro: newSet.isPro,
        courseId: newSet.courseId,
        courseTitle: newSet.course.title,
        courseSlug: newSet.course.slug,
        totalWords: 0,
      },
    });
  } catch (error: any) {
    console.error("POST /api/vocab/sets error:", error);
    return NextResponse.json(
      { error: "Lỗi tạo bộ từ mới: " + error.message },
      { status: 500 }
    );
  }
}

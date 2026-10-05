import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCourses } from "@/lib/vocab/service";

export async function GET() {
  const user = await getCurrentUser();

  try {
    const formattedCourses = await getCourses(user);
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

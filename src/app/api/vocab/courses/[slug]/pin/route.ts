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
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    const existingEnrollment = await prisma.userCourseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    const isPinned = !existingEnrollment?.isPinned;

    await prisma.userCourseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {
        isPinned,
      },
      create: {
        userId: user.id,
        courseId: course.id,
        isPinned,
      },
    });

    return NextResponse.json({ success: true, isPinned });
  } catch (error: any) {
    console.error("POST /api/vocab/courses/[slug]/pin error:", error);
    return NextResponse.json(
      { error: "Lỗi ghim khóa học: " + error.message },
      { status: 500 }
    );
  }
}

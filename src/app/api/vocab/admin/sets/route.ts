import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, title, description, isPro, orderNumber } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "courseId and title are required" },
        { status: 400 }
      );
    }

    const course = await prisma.vocabCourse.findUnique({
      where: { id: courseId },
      include: { sets: { select: { orderNumber: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const nextOrder = orderNumber || (course.sets.length > 0 ? Math.max(...course.sets.map((s) => s.orderNumber)) + 1 : 1);

    const newSet = await prisma.wordSet.create({
      data: {
        courseId,
        title: title.trim(),
        description: description ? description.trim() : null,
        isPro: Boolean(isPro),
        orderNumber: nextOrder,
      },
    });

    return NextResponse.json({ success: true, set: newSet });
  } catch (error) {
    console.error("Create word set error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isPro, title } = body;

    if (!id) {
      return NextResponse.json({ error: "Set ID required" }, { status: 400 });
    }

    const updated = await prisma.wordSet.update({
      where: { id },
      data: {
        ...(isPro !== undefined && { isPro: Boolean(isPro) }),
        ...(title !== undefined && { title: title.trim() }),
      },
    });

    return NextResponse.json({ success: true, set: updated });
  } catch (error) {
    console.error("Update word set error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

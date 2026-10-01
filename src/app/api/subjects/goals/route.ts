import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, targetHours, priority, isAutoAlloc, notes, startDate, endDate } = await req.json();

    const goal = await prisma.studyGoal.create({
      data: {
        userId: user.id,
        subjectId,
        targetHours,
        priority: priority || 3,
        isAutoAlloc: isAutoAlloc ?? true,
        notes: notes || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi lưu mục tiêu" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, targetHours, priority, isAutoAlloc, notes } = await req.json();

    const goal = await prisma.studyGoal.update({
      where: { id, userId: user.id },
      data: {
        targetHours,
        priority,
        isAutoAlloc,
        notes,
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi cập nhật mục tiêu" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    include: {
      subject: true,
      calendarEvent: true,
    },
    orderBy: { actualStart: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      subjectId,
      calendarEventId,
      plannedStart,
      plannedEnd,
      actualStart,
      actualEnd,
      actualDurationSeconds,
      status,
      notes,
      productivityScore,
      source,
    } = await req.json();

    if (!subjectId) {
      return NextResponse.json({ error: "Thiếu ID môn học" }, { status: 400 });
    }

    const durationSeconds = actualDurationSeconds ? parseInt(actualDurationSeconds, 10) : 0;
    if (durationSeconds < 0) {
      return NextResponse.json({ error: "Thời lượng học không hợp lệ" }, { status: 400 });
    }

    const end = actualEnd ? new Date(actualEnd) : new Date();
    const start = actualStart ? new Date(actualStart) : new Date(end.getTime() - durationSeconds * 1000);

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId,
        calendarEventId: calendarEventId || null,
        plannedStart: plannedStart ? new Date(plannedStart) : null,
        plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
        actualStart: start,
        actualEnd: end,
        actualDurationSeconds: durationSeconds,
        status: status || "COMPLETED",
        notes: notes?.trim() || null,
        productivityScore: productivityScore ? parseInt(productivityScore, 10) : null,
        source: source || "PIP_TIMER",
      },
      include: {
        subject: true,
      },
    });

    // Automatically update accumulated completedHours on Subject
    if (durationSeconds > 0) {
      const addedHours = durationSeconds / 3600;
      await prisma.subject.update({
        where: { id: subjectId, userId: user.id },
        data: {
          completedHours: {
            increment: addedHours,
          },
        },
      }).catch((e) => console.error("Could not increment subject completedHours:", e));
    }

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    console.error("Create study session error:", err);
    return NextResponse.json({ error: "Lỗi ghi nhận phiên học" }, { status: 500 });
  }
}

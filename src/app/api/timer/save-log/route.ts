import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, scheduleEventId, calendarEventId, durationMinutes, actualDurationSeconds, notes, productivityScore, source } = await req.json();

    if (!subjectId) {
      return NextResponse.json({ error: "Thiếu dữ liệu môn học" }, { status: 400 });
    }

    const seconds = actualDurationSeconds
      ? parseInt(actualDurationSeconds, 10)
      : Math.round((durationMinutes || 0) * 60);

    const now = new Date();
    const startTime = new Date(now.getTime() - seconds * 1000);

    const eventId = calendarEventId || scheduleEventId || null;

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId,
        calendarEventId: eventId,
        actualStart: startTime,
        actualEnd: now,
        actualDurationSeconds: seconds,
        status: "COMPLETED",
        notes: notes || null,
        productivityScore: productivityScore || null,
        source: source || "PIP_TIMER",
      },
      include: {
        subject: true,
      },
    });

    // Update subject completedHours
    if (seconds > 0) {
      await prisma.subject.update({
        where: { id: subjectId, userId: user.id },
        data: {
          completedHours: {
            increment: seconds / 3600,
          },
        },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, session, studyLog: session });
  } catch (err: any) {
    console.error("Save study log error:", err);
    return NextResponse.json({ error: "Lỗi ghi nhận phiên học" }, { status: 500 });
  }
}

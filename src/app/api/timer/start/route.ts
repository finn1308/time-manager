import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, calendarEventId, plannedDurationMinutes } = await req.json();

    if (!subjectId) {
      return NextResponse.json({ error: "Vui lòng chọn môn học để bắt đầu" }, { status: 400 });
    }

    const now = new Date();
    const plannedEnd = plannedDurationMinutes
      ? new Date(now.getTime() + plannedDurationMinutes * 60 * 1000)
      : null;

    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId,
        calendarEventId: calendarEventId || null,
        plannedStart: now,
        plannedEnd,
        actualStart: now,
        actualEnd: now,
        actualDurationSeconds: 0,
        status: "IN_PROGRESS",
        source: "PIP_TIMER",
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ success: true, sessionId: session.id, session });
  } catch (err: any) {
    console.error("Timer start error:", err);
    return NextResponse.json({ error: "Lỗi khởi động bộ đếm thời gian" }, { status: 500 });
  }
}

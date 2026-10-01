import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, scheduleEventId, durationMinutes, notes, productivityScore, source } = await req.json();

    if (!subjectId || !durationMinutes) {
      return NextResponse.json({ error: "Thiếu dữ liệu môn học hoặc thời lượng" }, { status: 400 });
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - durationMinutes * 60 * 1000);

    const studyLog = await prisma.studyLog.create({
      data: {
        userId: user.id,
        subjectId,
        scheduleEventId: scheduleEventId || null,
        startTime,
        endTime: now,
        durationMinutes,
        notes: notes || null,
        productivityScore: productivityScore || null,
        source: source || "PIP_TIMER",
      },
    });

    // If linked to an event in the calendar, mark it as completed
    if (scheduleEventId) {
      await prisma.scheduleEvent.update({
        where: { id: scheduleEventId, userId: user.id },
        data: { isCompleted: true },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, studyLog });
  } catch (err: any) {
    console.error("Save study log error:", err);
    return NextResponse.json({ error: "Lỗi ghi nhận phiên học" }, { status: 500 });
  }
}

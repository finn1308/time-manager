import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { proposal, missedSessionIds = [] } = await req.json();

    if (!proposal || !proposal.sessions || proposal.sessions.length === 0) {
      return NextResponse.json({ error: "Thiếu dữ liệu phương án học bù" }, { status: 400 });
    }

    const createdEvents = await prisma.$transaction(async (tx) => {
      // 1. Mark old missed sessions as CANCELLED or MISSED
      if (missedSessionIds.length > 0) {
        await tx.studySession.updateMany({
          where: {
            id: { in: missedSessionIds },
            userId: user.id,
          },
          data: { status: "MISSED" },
        });

        await tx.calendarEvent.updateMany({
          where: {
            id: { in: missedSessionIds },
            userId: user.id,
          },
          data: { isCancelled: true },
        });
      }

      // 2. Insert new recovery sessions
      const events = [];
      for (const s of proposal.sessions) {
        const cal = await tx.calendarEvent.create({
          data: {
            userId: user.id,
            subjectId: s.subjectId || null,
            title: s.title,
            description: s.reason,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            type: "STUDY",
            isAiGenerated: true,
          },
        });

        await tx.studySession.create({
          data: {
            userId: user.id,
            subjectId: s.subjectId,
            calendarEventId: cal.id,
            plannedStart: new Date(s.startTime),
            plannedEnd: new Date(s.endTime),
            actualStart: new Date(s.startTime),
            actualEnd: new Date(s.endTime),
            actualDurationSeconds: 0,
            plannedDurationSeconds: s.durationMinutes * 60,
            status: "PLANNED",
            source: "AI_CATCH_UP",
          },
        });

        events.push(cal);
      }

      return events;
    });

    return NextResponse.json({
      success: true,
      count: createdEvents.length,
      message: `Đã áp dụng thành công ${createdEvents.length} buổi học bù vào Lịch học!`,
    });
  } catch (err: any) {
    console.error("Apply recovery proposal error:", err);
    return NextResponse.json({ error: "Lỗi áp dụng phương án học bù" }, { status: 500 });
  }
}

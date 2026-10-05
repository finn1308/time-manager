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

    let eventId = calendarEventId || scheduleEventId || null;

    if (eventId) {
      try {
        const isRecurringOcc = eventId.includes("_");
        const cleanId = isRecurringOcc ? eventId.split("_")[0] : eventId;
        const targetDateKey = isRecurringOcc ? eventId.split("_")[1] : null;

        let targetEvent = await prisma.calendarEvent.findFirst({
          where: { id: cleanId, userId: user.id },
        });

        if (isRecurringOcc && targetDateKey && targetEvent) {
          let existingEx = await prisma.calendarEvent.findFirst({
            where: { parentId: cleanId, exceptionDate: targetDateKey, userId: user.id },
          });

          if (!existingEx) {
            existingEx = await prisma.calendarEvent.create({
              data: {
                userId: user.id,
                parentId: cleanId,
                exceptionDate: targetDateKey,
                isException: true,
                title: targetEvent.title,
                description: targetEvent.description,
                location: targetEvent.location,
                subjectId: targetEvent.subjectId,
                taskId: targetEvent.taskId,
                goalId: targetEvent.goalId,
                startTime: now,
                endTime: now,
                type: targetEvent.type,
                completed: true,
                completedAt: now,
                actualDurationMinutes: Math.round(seconds / 60),
              },
            });
          } else {
            await prisma.calendarEvent.update({
              where: { id: existingEx.id },
              data: {
                completed: true,
                completedAt: now,
                actualDurationMinutes: Math.round(seconds / 60),
              },
            });
          }
          eventId = existingEx.id;
        } else if (targetEvent) {
          await prisma.calendarEvent.update({
            where: { id: targetEvent.id },
            data: {
              completed: true,
              completedAt: now,
              actualDurationMinutes: Math.round(seconds / 60),
            },
          });
          eventId = targetEvent.id;
        }
      } catch (e) {
        console.warn("Could not mark calendar event completed in save-log:", e);
      }
    }

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

    // Update subject completedHours via aggregate
    if (seconds > 0) {
      const agg = await prisma.studySession.aggregate({
        where: { subjectId, userId: user.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      const totalHours = Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
      await prisma.subject.update({
        where: { id: subjectId, userId: user.id },
        data: { completedHours: totalHours },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, session, studyLog: session });
  } catch (err: any) {
    console.error("Save study log error:", err);
    return NextResponse.json({ error: "Lỗi ghi nhận phiên học" }, { status: 500 });
  }
}

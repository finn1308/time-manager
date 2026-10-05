import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      sessionId,
      subjectId,
      actualDurationSeconds,
      notes,
      productivityScore,
      calendarEventId,
      taskId,
      goalId,
      source,
    } = await req.json();

    const durationSeconds = Math.max(0, parseInt(actualDurationSeconds, 10) || 0);
    const now = new Date();

    let session;

    let resolvedEventId = calendarEventId || null;

    // If linked to a calendar event, resolve recurring exception if needed and mark completed
    if (calendarEventId) {
      try {
        const isRecurringOcc = calendarEventId.includes("_");
        const cleanId = isRecurringOcc ? calendarEventId.split("_")[0] : calendarEventId;
        const targetDateKey = isRecurringOcc ? calendarEventId.split("_")[1] : null;

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
                actualDurationMinutes: Math.round(durationSeconds / 60),
              },
            });
          } else {
            await prisma.calendarEvent.update({
              where: { id: existingEx.id },
              data: {
                completed: true,
                completedAt: now,
                actualDurationMinutes: Math.round(durationSeconds / 60),
              },
            });
          }
          resolvedEventId = existingEx.id;
        } else if (targetEvent) {
          await prisma.calendarEvent.update({
            where: { id: targetEvent.id },
            data: {
              completed: true,
              completedAt: now,
              actualDurationMinutes: Math.round(durationSeconds / 60),
            },
          });
          resolvedEventId = targetEvent.id;
        }
      } catch (e) {
        console.warn("Could not mark calendar event completed from timer:", e);
      }
    }

    if (sessionId) {
      // Update existing in-progress session
      session = await prisma.studySession.update({
        where: { id: sessionId, userId: user.id },
        data: {
          actualEnd: now,
          actualDurationSeconds: durationSeconds,
          status: "COMPLETED",
          calendarEventId: resolvedEventId || undefined,
          notes: notes?.trim() || null,
          productivityScore: productivityScore ? parseInt(productivityScore, 10) : null,
          taskId: taskId || undefined,
          goalId: goalId || undefined,
        },
        include: { subject: true },
      });
    } else if (subjectId) {
      // Create new completed session
      const start = new Date(now.getTime() - durationSeconds * 1000);
      session = await prisma.studySession.create({
        data: {
          userId: user.id,
          subjectId,
          calendarEventId: resolvedEventId || null,
          taskId: taskId || null,
          goalId: goalId || null,
          actualStart: start,
          actualEnd: now,
          actualDurationSeconds: durationSeconds,
          status: "COMPLETED",
          notes: notes?.trim() || null,
          productivityScore: productivityScore ? parseInt(productivityScore, 10) : null,
          source: source || "PIP_TIMER",
        },
        include: { subject: true },
      });
    } else {
      return NextResponse.json({ error: "Thiếu sessionId hoặc subjectId" }, { status: 400 });
    }

    // Accumulate actual study time into Subject.completedHours via aggregate to prevent any drift
    if (session.subjectId) {
      const agg = await prisma.studySession.aggregate({
        where: { subjectId: session.subjectId, userId: user.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      const totalHours = Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
      await prisma.subject.update({
        where: { id: session.subjectId, userId: user.id },
        data: { completedHours: totalHours },
      }).catch((e) => console.error("Error updating subject completedHours:", e));
    }

    // Award XP based on study duration (min 10 XP, +1 XP per minute)
    const xpEarned = Math.max(10, Math.round(durationSeconds / 60));
    const { awardUserXp } = await import("@/lib/gamification/engine");
    await awardUserXp(user.id, xpEarned, `Hoàn thành phiên học ${Math.round(durationSeconds / 60)} phút`);

    return NextResponse.json({
      success: true,
      session,
      actualDurationSeconds: durationSeconds,
      actualDurationMinutes: Math.round(durationSeconds / 60),
      xpEarned,
    });
  } catch (err: any) {
    console.error("Timer stop error:", err);
    return NextResponse.json({ error: "Lỗi kết thúc và ghi nhận phiên học" }, { status: 500 });
  }
}

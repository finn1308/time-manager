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

    if (sessionId) {
      // Update existing in-progress session
      session = await prisma.studySession.update({
        where: { id: sessionId, userId: user.id },
        data: {
          actualEnd: now,
          actualDurationSeconds: durationSeconds,
          status: "COMPLETED",
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
          calendarEventId: calendarEventId || null,
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

    // Accumulate actual study time into Subject.completedHours
    if (durationSeconds > 0 && session.subjectId) {
      const addedHours = durationSeconds / 3600;
      await prisma.subject.update({
        where: { id: session.subjectId, userId: user.id },
        data: {
          completedHours: {
            increment: addedHours,
          },
        },
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

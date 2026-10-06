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
    const { subjectId, skillId, score = 0, total = 1, durationSeconds = 60 } = body;

    let targetSubjectId = subjectId;
    if (!targetSubjectId) {
      const firstSubject = await prisma.subject.findFirst({
        where: { userId: user.id },
        orderBy: { priority: "desc" },
      });
      targetSubjectId = firstSubject?.id || null;
    }

    const accuracy = total > 0 ? Math.round((score / total) * 100) : 100;
    const durSec = Math.max(10, Number(durationSeconds) || 60);

    // Save study session
    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId: targetSubjectId,
        actualStart: new Date(Date.now() - durSec * 1000),
        actualEnd: new Date(),
        actualDurationSeconds: durSec,
        productivityScore: accuracy,
        source: "PRACTICE_SESSION",
        notes: `Practice: ${skillId || "Session"} (${score}/${total})`,
      },
    });

    // Reward XP and coins
    const earnedXp = Math.max(10, Math.round(accuracy / 10));
    const earnedCoins = Math.max(1, Math.round(earnedXp / 5));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: earnedXp },
        coins: { increment: earnedCoins },
      },
    });

    return NextResponse.json({ success: true, session, earnedXp, earnedCoins });
  } catch (error) {
    console.error("[PRACTICE_SUBMIT_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      wordSetId,
      mode, // FLASHCARD, QUIZ, LISTENING, TYPING, MATCHING, SPECIAL
      totalItems = 0,
      correctItems = 0,
      durationSeconds = 0,
      coinsDelta,
      specialGameMode,
      gameScore = 0,
      isTimerRunning = false,
      subjectId,
    } = body;

    if (!wordSetId) {
      return NextResponse.json({ error: "Thiếu ID bộ từ vựng" }, { status: 400 });
    }

    // Standard coin rewards according to UI reference
    const COIN_REWARDS: Record<string, number> = {
      FLASHCARD: 5,
      QUIZ: 10,
      LISTENING: 15,
      TYPING: 10,
      MATCHING: 10,
      SPECIAL: 20,
    };

    const baseCoins = COIN_REWARDS[mode] || 10;
    const accuracy = totalItems > 0 ? (correctItems / totalItems) * 100 : 100;

    // Use coinsDelta if provided explicitly (e.g. from Quán Cơm Tấm or custom games), otherwise calculate standard reward
    let coinsEarned = typeof coinsDelta === "number" ? coinsDelta : (accuracy === 100 ? baseCoins + 5 : baseCoins);
    const xpEarned = Math.max(5, Math.round(15 + correctItems * 5));

    // Lookup WordSet and Course to resolve subjectId if not provided
    const wordSet = await prisma.wordSet.findUnique({
      where: { id: wordSetId },
      include: { course: true },
    });

    const effectiveSubjectId = subjectId || wordSet?.subjectId || wordSet?.course?.subjectId || null;

    // Save study session
    const session = await prisma.vocabStudySession.create({
      data: {
        userId: user.id,
        wordSetId,
        subjectId: effectiveSubjectId,
        mode: specialGameMode ? `SPECIAL_${specialGameMode}` : mode,
        totalItems,
        correctItems,
        accuracy: Math.round(accuracy * 10) / 10,
        durationSeconds,
        coinsEarned,
        xpEarned,
      },
    });

    // Create StudySession for Dashboard/Statistics if the user was NOT using the PIP timer
    if (!isTimerRunning && effectiveSubjectId && durationSeconds > 0) {
      await prisma.studySession.create({
        data: {
          userId: user.id,
          subjectId: effectiveSubjectId,
          actualStart: new Date(Date.now() - durationSeconds * 1000),
          actualEnd: new Date(),
          actualDurationSeconds: durationSeconds,
          status: "COMPLETED",
          notes: `Luyện từ vựng: ${wordSet?.title || "Từ vựng"} (${mode})`,
          source: "PRACTICE_VOCAB",
        },
      });

      // Synchronize Subject.completedHours
      const totalAgg = await prisma.studySession.aggregate({
        where: {
          subjectId: effectiveSubjectId,
          userId: user.id,
          status: "COMPLETED",
        },
        _sum: { actualDurationSeconds: true },
      });
      const totalHours = Math.round(((totalAgg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
      await prisma.subject.update({
        where: { id: effectiveSubjectId },
        data: { completedHours: totalHours },
      });
    }

    // Compute new coins safely (never below 0)
    const currentCoins = user.coins ?? 100;
    const nextCoins = Math.max(0, currentCoins + coinsEarned);
    const actualCoinsDelta = nextCoins - currentCoins;

    // Update user balance and XP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        coins: nextCoins,
        xp: { increment: xpEarned },
      },
      select: {
        id: true,
        name: true,
        coins: true,
        xp: true,
        streakDays: true,
      },
    });

    return NextResponse.json({
      success: true,
      session,
      rewards: {
        coinsEarned,
        xpEarned,
        accuracy: session.accuracy,
      },
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("POST /api/vocab/sessions error:", error);
    return NextResponse.json(
      { error: "Lỗi lưu phiên học từ vựng: " + error.message },
      { status: 500 }
    );
  }
}

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

    // Bonus coin if accuracy is 100%
    const coinsEarned = accuracy === 100 ? baseCoins + 5 : baseCoins;
    const xpEarned = Math.round(15 + correctItems * 5);

    // Save study session
    const session = await prisma.vocabStudySession.create({
      data: {
        userId: user.id,
        wordSetId,
        mode,
        totalItems,
        correctItems,
        accuracy: Math.round(accuracy * 10) / 10,
        durationSeconds,
        coinsEarned,
        xpEarned,
      },
    });

    // Update user balance and XP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        coins: { increment: coinsEarned },
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

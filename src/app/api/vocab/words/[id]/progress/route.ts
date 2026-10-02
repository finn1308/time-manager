import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateSm2 } from "@/lib/vocab/sm2";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: wordId } = await params;

  try {
    const body = await req.json();
    const { status, isFavorite, quality, isCorrect } = body;

    const word = await prisma.vocabWord.findUnique({
      where: { id: wordId },
      select: { id: true, wordSetId: true },
    });

    if (!word) {
      return NextResponse.json({ error: "Không tìm thấy từ vựng" }, { status: 404 });
    }

    const currentProgress = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId: user.id,
          wordId,
        },
      },
    });

    let newRepetition = currentProgress?.repetition || 0;
    let newInterval = currentProgress?.intervalDays || 1;
    let newEaseFactor = currentProgress?.easeFactor || 2.5;
    let nextReviewDate = currentProgress?.nextReviewDate || new Date();

    // If SM-2 quality rating is provided (0 to 5)
    if (quality !== undefined && quality !== null && !isNaN(quality)) {
      const sm2Result = calculateSm2({
        quality: Number(quality),
        repetition: newRepetition,
        intervalDays: newInterval,
        easeFactor: newEaseFactor,
      });

      newRepetition = sm2Result.repetition;
      newInterval = sm2Result.intervalDays;
      newEaseFactor = sm2Result.easeFactor;
      nextReviewDate = sm2Result.nextReviewDate;
    }

    // Determine status
    let finalStatus = status || currentProgress?.status || "LEARNING";
    if (quality !== undefined && Number(quality) >= 4) {
      finalStatus = "MASTERED";
    } else if (quality !== undefined && Number(quality) < 3) {
      finalStatus = "LEARNING";
    }

    const updatedProgress = await prisma.userWordProgress.upsert({
      where: {
        userId_wordId: {
          userId: user.id,
          wordId,
        },
      },
      update: {
        status: finalStatus,
        ...(isFavorite !== undefined && { isFavorite: Boolean(isFavorite) }),
        timesStudied: { increment: 1 },
        ...(isCorrect === true && { correctCount: { increment: 1 } }),
        ...(isCorrect === false && { incorrectCount: { increment: 1 } }),
        repetition: newRepetition,
        intervalDays: newInterval,
        easeFactor: newEaseFactor,
        nextReviewDate,
        lastReviewedAt: new Date(),
      },
      create: {
        userId: user.id,
        wordId,
        wordSetId: word.wordSetId,
        status: finalStatus,
        isFavorite: isFavorite !== undefined ? Boolean(isFavorite) : false,
        timesStudied: 1,
        correctCount: isCorrect === true ? 1 : 0,
        incorrectCount: isCorrect === false ? 1 : 0,
        repetition: newRepetition,
        intervalDays: newInterval,
        easeFactor: newEaseFactor,
        nextReviewDate,
        lastReviewedAt: new Date(),
      },
    });

    // Update Set Progress count
    const totalSetWords = await prisma.vocabWord.count({
      where: { wordSetId: word.wordSetId },
    });
    const completedSetWords = await prisma.userWordProgress.count({
      where: {
        userId: user.id,
        wordSetId: word.wordSetId,
        status: { in: ["LEARNING", "MASTERED"] },
      },
    });

    await prisma.userWordSetProgress.upsert({
      where: {
        userId_wordSetId: {
          userId: user.id,
          wordSetId: word.wordSetId,
        },
      },
      update: {
        completedWords: completedSetWords,
        totalWords: totalSetWords,
        isMastered: completedSetWords === totalSetWords,
      },
      create: {
        userId: user.id,
        wordSetId: word.wordSetId,
        completedWords: completedSetWords,
        totalWords: totalSetWords,
        isMastered: completedSetWords === totalSetWords,
      },
    });

    return NextResponse.json({ success: true, progress: updatedProgress });
  } catch (error: any) {
    console.error("POST /api/vocab/words/[id]/progress error:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật tiến độ học: " + error.message },
      { status: 500 }
    );
  }
}

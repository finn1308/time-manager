import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSM2, FlashcardRating } from "@/lib/anki/sm2";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      deckId,
      mode = "ALL",
      durationSeconds = 60,
      totalQuestions = 0,
      correctAnswers = 0,
      wrongAnswers = 0,
      questions = [],
    } = body;

    if (!deckId) {
      return NextResponse.json({ error: "Thiếu deckId" }, { status: 400 });
    }

    // Verify deck ownership
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { subject: true, flashcards: true },
    });

    if (!deck || deck.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    }

    const accuracy =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const durSec = Math.max(10, Number(durationSeconds) || 60);

    // 1. Create FlashcardStudySession
    const studySession = await prisma.flashcardStudySession.create({
      data: {
        userId: user.id,
        deckId: deck.id,
        mode,
        startedAt: new Date(Date.now() - durSec * 1000),
        completedAt: new Date(),
        totalQuestions: Number(totalQuestions) || questions.length,
        correctAnswers: Number(correctAnswers),
        wrongAnswers: Number(wrongAnswers),
        accuracy,
        durationSeconds: durSec,
      },
    });

    // 2. Insert FlashcardStudyQuestions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      const questionData = questions
        .filter((q) => q.cardId)
        .map((q) => ({
          sessionId: studySession.id,
          cardId: q.cardId,
          questionType: q.questionType || "FLASHCARD",
          question: String(q.question || "").slice(0, 500),
          userAnswer: q.userAnswer ? String(q.userAnswer).slice(0, 500) : null,
          correctAnswer: String(q.correctAnswer || "").slice(0, 500),
          isCorrect: Boolean(q.isCorrect),
          responseTimeMs: Number(q.responseTimeMs) || 0,
        }));

      if (questionData.length > 0) {
        await prisma.flashcardStudyQuestion.createMany({
          data: questionData,
        });
      }
    }

    // 3. Update individual cards' progress & SM-2
    // Group correct / wrong stats per card
    const cardStats: Record<string, { correct: number; wrong: number; isFinalCorrect: boolean }> = {};
    for (const q of questions) {
      if (!q.cardId) continue;
      if (!cardStats[q.cardId]) {
        cardStats[q.cardId] = { correct: 0, wrong: 0, isFinalCorrect: true };
      }
      if (q.isCorrect) {
        cardStats[q.cardId].correct += 1;
      } else {
        cardStats[q.cardId].wrong += 1;
        cardStats[q.cardId].isFinalCorrect = false;
      }
    }

    const now = new Date();
    for (const [cardId, stats] of Object.entries(cardStats)) {
      const card = deck.flashcards.find((c) => c.id === cardId);
      if (!card) continue;

      // Determine SM-2 rating:
      // If card was correct with 0 errors: Good (3) or Easy (4)
      // If card had errors: Hard (2) or Again (1)
      const rating: FlashcardRating = stats.wrong === 0 ? 3 : 1;

      const sm2 = calculateSM2({
        rating,
        repetitionCount: card.repetitionCount,
        intervalDays: card.intervalDays,
        easeFactor: card.easeFactor,
      });

      await prisma.flashcard.update({
        where: { id: cardId },
        data: {
          correctCount: { increment: stats.correct },
          incorrectCount: { increment: stats.wrong },
          lastReviewed: now,
          repetitionCount: sm2.repetitionCount,
          intervalDays: sm2.intervalDays,
          easeFactor: sm2.easeFactor,
          nextReview: sm2.nextReview,
          status: sm2.status,
          masteryLevel: sm2.masteryLevel,
        },
      });

      // Record flashcard review
      await prisma.flashcardReview.create({
        data: {
          userId: user.id,
          flashcardId: card.id,
          rating,
          intervalDays: sm2.intervalDays,
          easeFactor: sm2.easeFactor,
          reviewedAt: now,
        },
      });
    }

    // 4. Create master StudySession for Dashboard & Statistics
    let targetSubjectId = deck.subjectId;
    if (!targetSubjectId) {
      const firstSubject = await prisma.subject.findFirst({
        where: { userId: user.id },
        orderBy: { priority: "desc" },
      });
      targetSubjectId = firstSubject?.id || null;
    }

    if (targetSubjectId) {
      await prisma.studySession.create({
        data: {
          userId: user.id,
          subjectId: targetSubjectId,
          actualStart: new Date(Date.now() - durSec * 1000),
          actualEnd: now,
          actualDurationSeconds: durSec,
          productivityScore: accuracy,
          source: "FLASHCARD_STUDY",
          notes: `Deck: ${deck.title} | Chế độ: ${mode} (${correctAnswers}/${totalQuestions} câu đúng - ${accuracy}%)`,
        },
      });
    }

    // 5. XP and Coin rewards
    const earnedXp = Math.max(10, Math.round(accuracy * 0.25) + correctAnswers * 5);
    const earnedCoins = Math.max(2, Math.round(earnedXp / 10));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: earnedXp },
        coins: { increment: earnedCoins },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: studySession.id,
      accuracy,
      durationSeconds: durSec,
      earnedXp,
      earnedCoins,
    });
  } catch (error) {
    console.error("[FLASHCARD_STUDY_SUBMIT_ERROR]", error);
    return NextResponse.json({ error: "Lỗi lưu phiên học" }, { status: 500 });
  }
}

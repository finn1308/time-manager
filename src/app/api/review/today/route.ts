import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { resolveOrUpdateMistake } from "@/lib/mistakes/mistake-engine";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    const [vocabDue, flashcardsDue, mistakesDue, weakConcepts, activeNotes] = await Promise.all([
      // 1. Vocabulary due for SM-2 review
      prisma.userWordProgress.findMany({
        where: {
          userId: user.id,
          OR: [
            { nextReviewDate: { lte: now } },
            { nextReviewDate: null, status: "LEARNING" },
          ],
        },
        include: {
          word: {
            select: {
              id: true,
              term: true,
              phonetic: true,
              partOfSpeech: true,
              meaning: true,
              exampleSentence: true,
              exampleMeaning: true,
            },
          },
        },
        take: 15,
      }),

      // 2. Flashcards due for review
      prisma.flashcard.findMany({
        where: {
          deck: { userId: user.id },
          OR: [
            { nextReview: { lte: now } },
            { nextReview: null, status: "LEARNING" },
          ],
        },
        include: {
          deck: { select: { id: true, title: true } },
        },
        take: 15,
      }),

      // 3. Unresolved mistakes due for active recall
      prisma.mistakeRecord.findMany({
        where: {
          userId: user.id,
          isResolved: false,
          OR: [
            { nextReviewDate: { lte: now } },
            { nextReviewDate: null },
          ],
        },
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
        take: 10,
      }),

      // 4. Weak knowledge concepts (< 60% mastery)
      prisma.knowledgeNode.findMany({
        where: {
          userId: user.id,
          masteryScore: { lt: 0.6 },
        },
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
        take: 5,
      }),

      // 5. Active recall notes
      prisma.note.findMany({
        where: {
          userId: user.id,
          isPinned: true,
          isArchived: false,
        },
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
          subject: { select: { name: true, color: true } },
        },
        take: 3,
      }),
    ]);

    const formattedVocab = vocabDue.map((v) => ({
      reviewType: "VOCABULARY",
      id: v.word.id,
      progressId: v.id,
      title: v.word.term,
      subtitle: v.word.phonetic,
      front: v.word.term,
      back: v.word.meaning,
      partOfSpeech: v.word.partOfSpeech,
      example: v.word.exampleSentence,
      repetition: v.repetition,
      intervalDays: v.intervalDays,
    }));

    const formattedCards = flashcardsDue.map((f) => ({
      reviewType: "FLASHCARD",
      id: f.id,
      deckTitle: f.deck.title,
      front: f.front,
      back: f.back,
      hint: f.hint,
      topic: f.topic,
      repetition: f.repetitionCount,
      intervalDays: f.intervalDays,
    }));

    const formattedMistakes = mistakesDue.map((m) => ({
      reviewType: "MISTAKE",
      id: m.id,
      subjectName: m.subject?.name || "Chung",
      subjectColor: m.subject?.color || "#408257",
      front: m.question,
      back: m.correctAnswer,
      userAnswer: m.userAnswer,
      errorType: m.errorType,
      explanation: m.explanation,
      concept: m.concept,
      masteryLevel: m.masteryLevel,
    }));

    const totalItems = formattedVocab.length + formattedCards.length + formattedMistakes.length;
    const estimatedMinutes = Math.max(5, Math.ceil((totalItems * 40) / 60));

    return NextResponse.json({
      success: true,
      summary: {
        totalItems,
        estimatedMinutes,
        vocabCount: formattedVocab.length,
        flashcardCount: formattedCards.length,
        mistakeCount: formattedMistakes.length,
        weakConceptCount: weakConcepts.length,
        noteCount: activeNotes.length,
      },
      items: {
        vocabulary: formattedVocab,
        flashcards: formattedCards,
        mistakes: formattedMistakes,
        weakConcepts,
        activeNotes,
      },
    });
  } catch (err: any) {
    console.error("Error generating today's review:", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo bài ôn tập hôm nay" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemType, itemId, rating, isCorrect } = body;
    // rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)

    if (itemType === "FLASHCARD") {
      const card = await prisma.flashcard.findUnique({ where: { id: itemId } });
      if (card) {
        let ease = card.easeFactor || 2.5;
        let rep = card.repetitionCount || 0;
        let interval = card.intervalDays || 1;

        if (rating === 1) {
          rep = 0;
          interval = 1;
          ease = Math.max(1.3, ease - 0.2);
        } else if (rating === 2) {
          interval = Math.max(1, Math.round(interval * 1.2));
          ease = Math.max(1.3, ease - 0.15);
        } else if (rating === 3) {
          rep += 1;
          interval = rep === 1 ? 1 : rep === 2 ? 6 : Math.round(interval * ease);
        } else if (rating === 4) {
          rep += 1;
          interval = rep === 1 ? 4 : Math.round(interval * ease * 1.3);
          ease += 0.15;
        }

        await prisma.flashcard.update({
          where: { id: itemId },
          data: {
            easeFactor: ease,
            repetitionCount: rep,
            intervalDays: interval,
            status: rep >= 3 ? "REVIEW" : "LEARNING",
            lastReviewed: new Date(),
            nextReview: addDays(new Date(), interval),
          },
        });

        await prisma.flashcardReview.create({
          data: {
            userId: user.id,
            flashcardId: itemId,
            rating: Number(rating) || 3,
            intervalDays: interval,
            easeFactor: ease,
          },
        });
      }
    } else if (itemType === "VOCABULARY") {
      const prog = await prisma.userWordProgress.findFirst({
        where: { userId: user.id, wordId: itemId },
      });
      if (prog) {
        const correct = isCorrect ?? (rating >= 3);
        const newInterval = correct ? (prog.intervalDays || 1) * 2 : 1;
        await prisma.userWordProgress.update({
          where: { id: prog.id },
          data: {
            timesStudied: { increment: 1 },
            correctCount: correct ? { increment: 1 } : undefined,
            incorrectCount: !correct ? { increment: 1 } : undefined,
            status: correct && (prog.correctCount || 0) >= 2 ? "MASTERED" : "LEARNING",
            intervalDays: newInterval,
            lastReviewedAt: new Date(),
            nextReviewDate: addDays(new Date(), newInterval),
          },
        });
      }
    } else if (itemType === "MISTAKE") {
      await resolveOrUpdateMistake(itemId, user.id, Boolean(isCorrect ?? (rating >= 3)), rating);
    }

    // Reward user XP and Coin
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: 10 },
        coins: { increment: 2 },
      },
    });

    return NextResponse.json({ success: true, message: "Đã cập nhật kết quả ôn tập", xpEarned: 10 });
  } catch (err: any) {
    console.error("Error submitting review item:", err);
    return NextResponse.json({ error: err.message || "Lỗi ghi nhận kết quả ôn tập" }, { status: 500 });
  }
}

import { prisma } from "../prisma";
import { addDays } from "date-fns";

export interface RecordMistakeParams {
  userId: string;
  subjectId?: string | null;
  sourceType: "QUIZ" | "EXAM" | "FLASHCARD" | "TYPING" | "PRACTICE" | "AI_SESSION" | "DOCUMENT";
  sourceId?: string | null;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  concept?: string | null;
  topic?: string | null;
  errorType?: "KNOWLEDGE_GAP" | "MISUNDERSTANDING" | "CARELESS" | "MEMORY_FAILURE" | "CALCULATION" | "VOCABULARY" | "CONCEPT_CONFUSION";
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  explanation?: string | null;
}

export async function recordMistake(params: RecordMistakeParams) {
  // Check if identical question already recorded for this user
  const existing = await prisma.mistakeRecord.findFirst({
    where: {
      userId: params.userId,
      question: params.question,
      isResolved: false,
    },
  });

  if (existing) {
    return await prisma.mistakeRecord.update({
      where: { id: existing.id },
      data: {
        repetitionCount: { increment: 1 },
        userAnswer: params.userAnswer,
        errorType: params.errorType || existing.errorType,
        concept: params.concept || existing.concept,
        topic: params.topic || existing.topic,
        explanation: params.explanation || existing.explanation,
        lastReviewedAt: new Date(),
        nextReviewDate: addDays(new Date(), 1), // review tomorrow
      },
    });
  }

  return await prisma.mistakeRecord.create({
    data: {
      userId: params.userId,
      subjectId: params.subjectId || null,
      sourceType: params.sourceType,
      sourceId: params.sourceId || null,
      question: params.question,
      correctAnswer: params.correctAnswer,
      userAnswer: params.userAnswer,
      concept: params.concept || null,
      topic: params.topic || null,
      errorType: params.errorType || "KNOWLEDGE_GAP",
      difficulty: params.difficulty || "MEDIUM",
      repetitionCount: 1,
      masteryLevel: 0,
      isResolved: false,
      lastReviewedAt: new Date(),
      nextReviewDate: addDays(new Date(), 1),
      explanation: params.explanation || null,
    },
  });
}

export async function resolveOrUpdateMistake(
  mistakeId: string,
  userId: string,
  isCorrect: boolean,
  rating?: number // 1: Again, 2: Hard, 3: Good, 4: Easy
) {
  const mistake = await prisma.mistakeRecord.findFirst({
    where: { id: mistakeId, userId },
  });

  if (!mistake) throw new Error("Không tìm thấy bản ghi lỗi sai");

  let newMastery = mistake.masteryLevel;
  let isResolved = mistake.isResolved;
  let intervalDays = 1;

  if (isCorrect) {
    newMastery = Math.min(5, newMastery + 1);
    if (newMastery >= 3) {
      isResolved = true;
    }
    intervalDays = newMastery === 1 ? 2 : newMastery === 2 ? 4 : newMastery === 3 ? 7 : 14;
  } else {
    newMastery = Math.max(0, newMastery - 1);
    isResolved = false;
    intervalDays = 1;
  }

  const updated = await prisma.mistakeRecord.update({
    where: { id: mistakeId },
    data: {
      masteryLevel: newMastery,
      isResolved,
      lastReviewedAt: new Date(),
      nextReviewDate: isResolved ? null : addDays(new Date(), intervalDays),
      repetitionCount: { increment: 1 },
    },
  });

  return updated;
}

export async function getMistakeStats(userId: string) {
  const [total, unresolved, resolved, byErrorType, bySubject] = await Promise.all([
    prisma.mistakeRecord.count({ where: { userId } }),
    prisma.mistakeRecord.count({ where: { userId, isResolved: false } }),
    prisma.mistakeRecord.count({ where: { userId, isResolved: true } }),
    prisma.mistakeRecord.groupBy({
      by: ["errorType"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.mistakeRecord.groupBy({
      by: ["subjectId"],
      where: { userId, isResolved: false },
      _count: { id: true },
    }),
  ]);

  return {
    total,
    unresolved,
    resolved,
    byErrorType: byErrorType.map((b) => ({ errorType: b.errorType, count: b._count.id })),
    bySubject: bySubject.map((b) => ({ subjectId: b.subjectId, count: b._count.id })),
  };
}

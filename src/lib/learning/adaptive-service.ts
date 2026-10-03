import { prisma } from "../prisma";
import {
  AdaptiveQuestionPayload,
  AdaptiveQuestionType,
  CrossSkillScores,
  LearningEventType,
  MasteryCalculationResult,
  QuestionCandidate,
} from "./types";
import { calculateAdaptiveMastery } from "./scoring";
import { evaluateForgettingCurve } from "./forgetting-curve";
import {
  buildAdaptiveQuestionPayload,
  selectAdaptiveCandidate,
} from "./question-selection";

export interface RecordEventParams {
  userId: string;
  vocabularyId: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  questionType: AdaptiveQuestionType;
  answer?: string;
  eventType?: LearningEventType;
  metadata?: Record<string, any>;
}

export interface GetNextQuestionParams {
  userId: string;
  wordSetId?: string;
  courseId?: string;
  recentlyShownIds?: string[];
  forceType?: AdaptiveQuestionType;
  minimumReviewGap?: number;
}

export class AdaptiveLearningService {
  /**
   * Records a user learning event, updates deterministic mastery and forgetting curve
   */
  static async recordLearningEvent(params: RecordEventParams): Promise<{
    mastery: MasteryCalculationResult;
    retentionRate: number;
    forgettingRisk: number;
    nextReviewAt: Date;
    vocabulary: {
      id: string;
      term: string;
      meaning: string;
    };
  }> {
    const {
      userId,
      vocabularyId,
      isCorrect,
      responseTimeSeconds,
      questionType,
      answer,
      eventType = isCorrect ? "ANSWER_CORRECT" : "ANSWER_INCORRECT",
      metadata,
    } = params;

    // 1. Fetch vocabulary item to ensure existence and grab wordSetId
    const vocab = await prisma.vocabWord.findUnique({
      where: { id: vocabularyId },
      include: { wordSet: true },
    });

    if (!vocab) {
      throw new Error(`Vocabulary item with id "${vocabularyId}" not found`);
    }

    // 2. Fetch or initialize UserVocabularyMastery
    let masteryRecord = await prisma.userVocabularyMastery.findUnique({
      where: {
        userId_vocabularyId: {
          userId,
          vocabularyId,
        },
      },
    });

    const previousMastery = masteryRecord?.knowledgeScore ?? 0.0;
    const currentStability = masteryRecord?.memoryStability ?? 1.0;

    const crossSkills: CrossSkillScores = {
      recognition: masteryRecord?.recognitionScore ?? 0.0,
      recall: masteryRecord?.recallScore ?? 0.0,
      spelling: masteryRecord?.spellingScore ?? 0.0,
      listening: masteryRecord?.listeningScore ?? 0.0,
      usage: masteryRecord?.usageScore ?? 0.0,
    };

    // 3. Compute updated mastery score
    const masteryCalc = calculateAdaptiveMastery({
      currentKnowledge: masteryRecord?.knowledgeScore ?? 0.0,
      currentConfidence: masteryRecord?.confidenceScore ?? 0.0,
      totalAttempts: masteryRecord?.totalAttempts ?? 0,
      correctAttempts: masteryRecord?.correctAttempts ?? 0,
      incorrectAttempts: masteryRecord?.incorrectAttempts ?? 0,
      consecutiveCorrect: masteryRecord?.consecutiveCorrect ?? 0,
      consecutiveIncorrect: masteryRecord?.consecutiveIncorrect ?? 0,
      averageResponseTime: masteryRecord?.averageResponseTime ?? 0.0,
      isCorrect,
      responseTimeSeconds,
      questionType,
      difficultyScore: masteryRecord?.difficultyScore ?? 0.5,
      crossSkills,
    });

    // 4. Evaluate updated forgetting curve & next review schedule
    const forgettingCalc = evaluateForgettingCurve({
      lastSeenAt: masteryRecord?.lastSeenAt ?? null,
      currentKnowledge: masteryCalc.newKnowledgeScore,
      memoryStabilityDays: currentStability,
      isCorrectNow: isCorrect,
    });

    const now = new Date();

    // 5. Database Transaction: Save Mastery + Event + Sync UserWordProgress
    await prisma.$transaction(async (tx) => {
      // Upsert Mastery Record
      await tx.userVocabularyMastery.upsert({
        where: {
          userId_vocabularyId: {
            userId,
            vocabularyId,
          },
        },
        create: {
          userId,
          vocabularyId,
          knowledgeScore: masteryCalc.newKnowledgeScore,
          confidenceScore: masteryCalc.newConfidenceScore,
          totalAttempts: masteryCalc.newTotalAttempts,
          correctAttempts: masteryCalc.newCorrectAttempts,
          incorrectAttempts: masteryCalc.newIncorrectAttempts,
          consecutiveCorrect: masteryCalc.newConsecutiveCorrect,
          consecutiveIncorrect: masteryCalc.newConsecutiveIncorrect,
          averageResponseTime: masteryCalc.newAverageResponseTime,
          difficultyScore: masteryCalc.updatedDifficulty,
          memoryStability: forgettingCalc.newMemoryStability,
          forgettingRisk: forgettingCalc.forgettingRisk,
          nextReviewAt: forgettingCalc.nextReviewAt,
          recognitionScore: masteryCalc.updatedCrossSkills.recognition,
          recallScore: masteryCalc.updatedCrossSkills.recall,
          spellingScore: masteryCalc.updatedCrossSkills.spelling,
          listeningScore: masteryCalc.updatedCrossSkills.listening,
          usageScore: masteryCalc.updatedCrossSkills.usage,
          lastSeenAt: now,
          lastCorrectAt: isCorrect ? now : masteryRecord?.lastCorrectAt,
          lastIncorrectAt: !isCorrect ? now : masteryRecord?.lastIncorrectAt,
        },
        update: {
          knowledgeScore: masteryCalc.newKnowledgeScore,
          confidenceScore: masteryCalc.newConfidenceScore,
          totalAttempts: masteryCalc.newTotalAttempts,
          correctAttempts: masteryCalc.newCorrectAttempts,
          incorrectAttempts: masteryCalc.newIncorrectAttempts,
          consecutiveCorrect: masteryCalc.newConsecutiveCorrect,
          consecutiveIncorrect: masteryCalc.newConsecutiveIncorrect,
          averageResponseTime: masteryCalc.newAverageResponseTime,
          difficultyScore: masteryCalc.updatedDifficulty,
          memoryStability: forgettingCalc.newMemoryStability,
          forgettingRisk: forgettingCalc.forgettingRisk,
          nextReviewAt: forgettingCalc.nextReviewAt,
          recognitionScore: masteryCalc.updatedCrossSkills.recognition,
          recallScore: masteryCalc.updatedCrossSkills.recall,
          spellingScore: masteryCalc.updatedCrossSkills.spelling,
          listeningScore: masteryCalc.updatedCrossSkills.listening,
          usageScore: masteryCalc.updatedCrossSkills.usage,
          lastSeenAt: now,
          lastCorrectAt: isCorrect ? now : masteryRecord?.lastCorrectAt,
          lastIncorrectAt: !isCorrect ? now : masteryRecord?.lastIncorrectAt,
        },
      });

      // Log Learning Event
      await tx.learningEvent.create({
        data: {
          userId,
          vocabularyId,
          eventType,
          answer: answer || null,
          isCorrect,
          responseTime: responseTimeSeconds,
          questionType,
          difficulty: masteryCalc.updatedDifficulty,
          previousMastery,
          newMastery: masteryCalc.newKnowledgeScore,
          metadata: metadata ? JSON.stringify(metadata) : null,
          createdAt: now,
        },
      });

      // Keep UserWordProgress in sync for legacy views
      const legacyStatus =
        masteryCalc.newKnowledgeScore >= 0.85
          ? "MASTERED"
          : masteryCalc.newKnowledgeScore >= 0.35
          ? "LEARNING"
          : "NEW";

      await tx.userWordProgress.upsert({
        where: {
          userId_wordId: {
            userId,
            wordId: vocabularyId,
          },
        },
        create: {
          userId,
          wordId: vocabularyId,
          wordSetId: vocab.wordSetId,
          status: legacyStatus,
          timesStudied: masteryCalc.newTotalAttempts,
          correctCount: masteryCalc.newCorrectAttempts,
          incorrectCount: masteryCalc.newIncorrectAttempts,
          lastReviewedAt: now,
          nextReviewDate: forgettingCalc.nextReviewAt,
        },
        update: {
          status: legacyStatus,
          timesStudied: masteryCalc.newTotalAttempts,
          correctCount: masteryCalc.newCorrectAttempts,
          incorrectCount: masteryCalc.newIncorrectAttempts,
          lastReviewedAt: now,
          nextReviewDate: forgettingCalc.nextReviewAt,
        },
      });
    });

    return {
      mastery: masteryCalc,
      retentionRate: forgettingCalc.retentionRate,
      forgettingRisk: forgettingCalc.forgettingRisk,
      nextReviewAt: forgettingCalc.nextReviewAt,
      vocabulary: {
        id: vocab.id,
        term: vocab.term,
        meaning: vocab.meaning,
      },
    };
  }

  /**
   * Generates the next adaptive question for a user with weighted sampling & anti-repetition
   */
  static async getNextQuestion(
    params: GetNextQuestionParams
  ): Promise<AdaptiveQuestionPayload> {
    const {
      userId,
      wordSetId,
      courseId,
      recentlyShownIds = [],
      forceType,
      minimumReviewGap = 4,
    } = params;

    // 1. Build word filter
    const wordFilter: any = {};
    if (wordSetId) {
      wordFilter.wordSetId = wordSetId;
    } else if (courseId) {
      wordFilter.wordSet = { courseId };
    }

    // 2. Fetch vocabulary words
    const words = await prisma.vocabWord.findMany({
      where: wordFilter,
      include: {
        masteryRecords: {
          where: { userId },
        },
      },
      take: 200,
    });

    if (words.length === 0) {
      throw new Error("No vocabulary words found for the specified criteria");
    }

    // 3. Map into QuestionCandidates
    const candidates: QuestionCandidate[] = words.map((w) => {
      const mastery = w.masteryRecords[0] || null;

      // Recalculate real-time dynamic forgetting risk based on elapsed time
      let dynamicForgettingRisk = mastery?.forgettingRisk ?? 0.0;
      if (mastery?.lastSeenAt) {
        const fc = evaluateForgettingCurve({
          lastSeenAt: mastery.lastSeenAt,
          currentKnowledge: mastery.knowledgeScore,
          memoryStabilityDays: mastery.memoryStability || 1.0,
        });
        dynamicForgettingRisk = fc.forgettingRisk;
      }

      const crossSkills: CrossSkillScores = {
        recognition: mastery?.recognitionScore ?? 0.0,
        recall: mastery?.recallScore ?? 0.0,
        spelling: mastery?.spellingScore ?? 0.0,
        listening: mastery?.listeningScore ?? 0.0,
        usage: mastery?.usageScore ?? 0.0,
      };

      return {
        vocabularyId: w.id,
        term: w.term,
        meaning: w.meaning,
        phonetic: w.phonetic,
        partOfSpeech: w.partOfSpeech,
        exampleSentence: w.exampleSentence,
        exampleMeaning: w.exampleMeaning,
        audioUrl: w.audioUrl,
        wordSetId: w.wordSetId,
        knowledgeScore: mastery?.knowledgeScore ?? 0.0,
        confidenceScore: mastery?.confidenceScore ?? 0.0,
        forgettingRisk: dynamicForgettingRisk,
        difficultyScore: mastery?.difficultyScore ?? 0.5,
        nextReviewAt: mastery?.nextReviewAt ?? null,
        lastSeenAt: mastery?.lastSeenAt ?? null,
        consecutiveIncorrect: mastery?.consecutiveIncorrect ?? 0,
        consecutiveCorrect: mastery?.consecutiveCorrect ?? 0,
        crossSkills,
      };
    });

    // 4. Select candidate using weighted probabilistic sampling
    const { candidate } = selectAdaptiveCandidate(
      candidates,
      recentlyShownIds,
      minimumReviewGap
    );

    // 5. Construct question payload with smart distractors
    return buildAdaptiveQuestionPayload(candidate, candidates, forceType);
  }

  /**
   * Retrieves comprehensive metrics for the user's Adaptive Learning Dashboard
   */
  static async getAnalyticsDashboard(userId: string) {
    const masteries = await prisma.userVocabularyMastery.findMany({
      where: { userId },
      include: {
        vocabulary: {
          select: {
            id: true,
            term: true,
            meaning: true,
            wordSet: { select: { title: true } },
          },
        },
      },
    });

    const now = new Date();
    let weakCount = 0;
    let mediumCount = 0;
    let strongCount = 0;
    let masteredCount = 0;

    let highForgettingRiskCount = 0;
    let overdueCount = 0;

    let totalAttempts = 0;
    let correctAttempts = 0;
    let sumResponseTime = 0;
    let responseTimeCount = 0;

    let sumRecognition = 0;
    let sumRecall = 0;
    let sumSpelling = 0;
    let sumListening = 0;
    let sumUsage = 0;

    const wordsAtRisk: any[] = [];
    const wordsDueForReview: any[] = [];

    for (const m of masteries) {
      totalAttempts += m.totalAttempts;
      correctAttempts += m.correctAttempts;

      if (m.averageResponseTime > 0) {
        sumResponseTime += m.averageResponseTime;
        responseTimeCount++;
      }

      sumRecognition += m.recognitionScore;
      sumRecall += m.recallScore;
      sumSpelling += m.spellingScore;
      sumListening += m.listeningScore;
      sumUsage += m.usageScore;

      // Dynamic forgetting risk
      const fc = evaluateForgettingCurve({
        lastSeenAt: m.lastSeenAt,
        currentKnowledge: m.knowledgeScore,
        memoryStabilityDays: m.memoryStability,
      });

      if (m.knowledgeScore >= 0.85) masteredCount++;
      else if (m.knowledgeScore >= 0.65) strongCount++;
      else if (m.knowledgeScore >= 0.40) mediumCount++;
      else weakCount++;

      if (fc.forgettingRisk >= 0.40) {
        highForgettingRiskCount++;
        wordsAtRisk.push({
          id: m.vocabularyId,
          term: m.vocabulary.term,
          meaning: m.vocabulary.meaning,
          knowledgeScore: m.knowledgeScore,
          forgettingRisk: fc.forgettingRisk,
          lastSeenAt: m.lastSeenAt,
        });
      }

      if (m.nextReviewAt && new Date(m.nextReviewAt) <= now) {
        overdueCount++;
        wordsDueForReview.push({
          id: m.vocabularyId,
          term: m.vocabulary.term,
          meaning: m.vocabulary.meaning,
          nextReviewAt: m.nextReviewAt,
          knowledgeScore: m.knowledgeScore,
        });
      }
    }

    const totalWords = masteries.length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) / 100 : 0.0;
    const averageResponseTime =
      responseTimeCount > 0 ? Math.round((sumResponseTime / responseTimeCount) * 10) / 10 : 0.0;

    // Sort words at risk by highest risk
    wordsAtRisk.sort((a, b) => b.forgettingRisk - a.forgettingRisk);
    wordsDueForReview.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());

    // Most difficult words
    const mostDifficultWords = [...masteries]
      .sort((a, b) => b.difficultyScore - a.difficultyScore || a.knowledgeScore - b.knowledgeScore)
      .slice(0, 5)
      .map((m) => ({
        id: m.vocabularyId,
        term: m.vocabulary.term,
        meaning: m.vocabulary.meaning,
        difficulty: m.difficultyScore,
        knowledgeScore: m.knowledgeScore,
        consecutiveIncorrect: m.consecutiveIncorrect,
      }));

    return {
      totalWordsTracked: totalWords,
      masteryBreakdown: {
        weak: weakCount,
        medium: mediumCount,
        strong: strongCount,
        mastered: masteredCount,
      },
      accuracy,
      averageResponseTime,
      retentionRate:
        totalWords > 0
          ? Math.round((1.0 - highForgettingRiskCount / totalWords) * 100) / 100
          : 1.0,
      highForgettingRiskCount,
      overdueCount,
      wordsAtRisk: wordsAtRisk.slice(0, 8),
      wordsDueForReview: wordsDueForReview.slice(0, 8),
      mostDifficultWords,
      crossSkillAverages: {
        recognition: totalWords > 0 ? Math.round((sumRecognition / totalWords) * 100) / 100 : 0.0,
        recall: totalWords > 0 ? Math.round((sumRecall / totalWords) * 100) / 100 : 0.0,
        spelling: totalWords > 0 ? Math.round((sumSpelling / totalWords) * 100) / 100 : 0.0,
        listening: totalWords > 0 ? Math.round((sumListening / totalWords) * 100) / 100 : 0.0,
        usage: totalWords > 0 ? Math.round((sumUsage / totalWords) * 100) / 100 : 0.0,
      },
    };
  }
}

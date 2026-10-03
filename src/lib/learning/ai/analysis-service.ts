import { prisma } from "../../prisma";
import { executeAiLearningAnalysis } from "./provider";
import { AiLearningAnalysisResponse } from "../types";

export class LearningAnalysisService {
  /**
   * Generates or fetches the latest cognitive AI learning report for a user.
   * If a report was created within cacheDurationHours, it returns the cached version.
   */
  static async getUserLearningReport(
    userId: string,
    forceRefresh: boolean = false,
    cacheDurationHours: number = 4
  ): Promise<{
    report: AiLearningAnalysisResponse;
    providerUsed: string;
    createdAt: Date;
    cached: boolean;
  }> {
    // 1. Check for recent cached report
    if (!forceRefresh) {
      const cutoff = new Date(Date.now() - cacheDurationHours * 60 * 60 * 1000);
      const latestReport = await prisma.userAiLearningReport.findFirst({
        where: {
          userId,
          createdAt: { gte: cutoff },
        },
        orderBy: { createdAt: "desc" },
      });

      if (latestReport) {
        try {
          const wordsNeedingAttention = JSON.parse(latestReport.wordsNeedingAttention);
          const wordsImprovingRapidly = JSON.parse(latestReport.wordsImprovingRapidly);

          return {
            report: {
              strongestArea: latestReport.strongestArea,
              weakestArea: latestReport.weakestArea,
              wordsNeedingAttention,
              wordsImprovingRapidly,
              recommendedFocus: latestReport.recommendedFocus,
              cognitiveInsights: latestReport.cognitiveInsights || "",
            },
            providerUsed: latestReport.providerUsed || "Cached AI Report",
            createdAt: latestReport.createdAt,
            cached: true,
          };
        } catch (e) {
          console.warn("Failed to parse cached AI report JSON, regenerating:", e);
        }
      }
    }

    // 2. Fetch real database statistics
    const masteries = await prisma.userVocabularyMastery.findMany({
      where: { userId },
      include: {
        vocabulary: {
          select: {
            term: true,
            meaning: true,
          },
        },
      },
    });

    const recentEvents = await prisma.learningEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalWords = masteries.length;
    if (totalWords === 0) {
      // Empty state report
      const emptyReport: AiLearningAnalysisResponse = {
        strongestArea: "Chưa có dữ liệu",
        weakestArea: "Chưa có dữ liệu",
        wordsNeedingAttention: [],
        wordsImprovingRapidly: [],
        recommendedFocus:
          "Hãy hoàn thành ít nhất 10 câu hỏi trong bất kỳ bộ từ vựng nào để hệ thống AI bắt đầu đo lường chỉ số nhận thức.",
        cognitiveInsights:
          "Hệ thống đang sẵn sàng ghi nhận các tín hiệu phản hồi, thời gian tư duy và chuỗi ghi nhớ.",
        estimatedMasteryGrade: "C",
      };

      return {
        report: emptyReport,
        providerUsed: "Default Initializer",
        createdAt: new Date(),
        cached: false,
      };
    }

    let totalCorrectAttempts = 0;
    let totalAttempts = 0;
    let sumResponseTime = 0;
    let responseTimeCount = 0;

    let sumRecognition = 0;
    let sumRecall = 0;
    let sumSpelling = 0;
    let sumListening = 0;
    let sumUsage = 0;

    let masteredCount = 0;
    let weakCount = 0;

    for (const m of masteries) {
      totalCorrectAttempts += m.correctAttempts;
      totalAttempts += m.totalAttempts;

      if (m.averageResponseTime > 0) {
        sumResponseTime += m.averageResponseTime;
        responseTimeCount++;
      }

      sumRecognition += m.recognitionScore;
      sumRecall += m.recallScore;
      sumSpelling += m.spellingScore;
      sumListening += m.listeningScore;
      sumUsage += m.usageScore;

      if (m.knowledgeScore >= 0.85) masteredCount++;
      else if (m.knowledgeScore < 0.40) weakCount++;
    }

    const averageAccuracy = totalAttempts > 0 ? totalCorrectAttempts / totalAttempts : 0.5;
    const averageResponseTime =
      responseTimeCount > 0
        ? Math.round((sumResponseTime / responseTimeCount) * 10) / 10
        : 3.2;

    const crossSkillAverages = {
      recognition: Math.round((sumRecognition / totalWords) * 100) / 100,
      recall: Math.round((sumRecall / totalWords) * 100) / 100,
      spelling: Math.round((sumSpelling / totalWords) * 100) / 100,
      listening: Math.round((sumListening / totalWords) * 100) / 100,
      usage: Math.round((sumUsage / totalWords) * 100) / 100,
    };

    // Sort by struggling (highest forgetting risk / lowest score)
    const sortedStruggling = [...masteries].sort(
      (a, b) => b.forgettingRisk - a.forgettingRisk || a.knowledgeScore - b.knowledgeScore
    );
    const topWeakWords = sortedStruggling.slice(0, 5).map((m) => ({
      term: m.vocabulary.term,
      meaning: m.vocabulary.meaning,
      consecutiveIncorrect: m.consecutiveIncorrect,
      forgettingRisk: m.forgettingRisk,
    }));

    // Sort by strong/fast
    const sortedFast = [...masteries].sort((a, b) => b.knowledgeScore - a.knowledgeScore);
    const topFastWords = sortedFast.slice(0, 5).map((m) => ({
      term: m.vocabulary.term,
      meaning: m.vocabulary.meaning,
      knowledgeScore: m.knowledgeScore,
    }));

    const userStats = {
      totalWords,
      masteredWords: masteredCount,
      weakWords: weakCount,
      averageAccuracy,
      averageResponseTime,
      topWeakWords,
      topFastWords,
      crossSkillAverages,
    };

    // 3. Dispatch to AI Provider (Gemini / OpenAI / Anthropic / Local Cognitive Heuristic)
    const aiResult = await executeAiLearningAnalysis(userId, userStats);

    // 4. Save to Database
    await prisma.userAiLearningReport.create({
      data: {
        userId,
        strongestArea: aiResult.data.strongestArea,
        weakestArea: aiResult.data.weakestArea,
        wordsNeedingAttention: JSON.stringify(aiResult.data.wordsNeedingAttention),
        wordsImprovingRapidly: JSON.stringify(aiResult.data.wordsImprovingRapidly),
        recommendedFocus: aiResult.data.recommendedFocus,
        cognitiveInsights: aiResult.data.cognitiveInsights,
        providerUsed: aiResult.providerUsed,
      },
    });

    return {
      report: aiResult.data,
      providerUsed: aiResult.providerUsed,
      createdAt: new Date(),
      cached: false,
    };
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateForgettingCurve } from "@/lib/learning/forgetting-curve";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const masteries = await prisma.userVocabularyMastery.findMany({
      where: { userId: user.id },
      include: {
        vocabulary: {
          select: {
            id: true,
            term: true,
            meaning: true,
            phonetic: true,
            partOfSpeech: true,
            wordSet: { select: { id: true, title: true } },
          },
        },
      },
    });

    const now = new Date();
    const overdueList: any[] = [];
    const atRiskList: any[] = [];
    const strugglingList: any[] = [];

    let sumRecognition = 0;
    let sumRecall = 0;
    let sumSpelling = 0;
    let sumListening = 0;
    let sumUsage = 0;

    for (const m of masteries) {
      sumRecognition += m.recognitionScore;
      sumRecall += m.recallScore;
      sumSpelling += m.spellingScore;
      sumListening += m.listeningScore;
      sumUsage += m.usageScore;

      const fc = evaluateForgettingCurve({
        lastSeenAt: m.lastSeenAt,
        currentKnowledge: m.knowledgeScore,
        memoryStabilityDays: m.memoryStability,
      });

      const itemData = {
        id: m.vocabularyId,
        term: m.vocabulary.term,
        meaning: m.vocabulary.meaning,
        phonetic: m.vocabulary.phonetic,
        partOfSpeech: m.vocabulary.partOfSpeech,
        wordSetTitle: m.vocabulary.wordSet?.title,
        knowledgeScore: m.knowledgeScore,
        forgettingRisk: fc.forgettingRisk,
        nextReviewAt: m.nextReviewAt,
        consecutiveIncorrect: m.consecutiveIncorrect,
      };

      if (m.nextReviewAt && new Date(m.nextReviewAt) <= now) {
        overdueList.push(itemData);
      }

      if (fc.forgettingRisk >= 0.40) {
        atRiskList.push(itemData);
      }

      if (m.consecutiveIncorrect >= 2) {
        strugglingList.push(itemData);
      }
    }

    overdueList.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
    atRiskList.sort((a, b) => b.forgettingRisk - a.forgettingRisk);
    strugglingList.sort((a, b) => b.consecutiveIncorrect - a.consecutiveIncorrect);

    const totalWords = masteries.length;
    let recommendedSkill = "RECOGNITION";
    if (totalWords > 0) {
      const skills = [
        { type: "RECOGNITION", score: sumRecognition / totalWords, label: "Nhận diện từ vựng" },
        { type: "RECALL", score: sumRecall / totalWords, label: "Truy xuất nghĩa tiếng Anh" },
        { type: "SPELLING", score: sumSpelling / totalWords, label: "Luyện gõ chính tả" },
        { type: "LISTENING", score: sumListening / totalWords, label: "Luyện nghe phát âm" },
        { type: "SENTENCE_COMPLETION", score: sumUsage / totalWords, label: "Ngữ cảnh & đặt câu" },
      ];
      skills.sort((a, b) => a.score - b.score);
      recommendedSkill = skills[0].type;
    }

    return NextResponse.json({
      success: true,
      totalTracked: totalWords,
      recommendedSkill,
      overdueItems: overdueList.slice(0, 10),
      atRiskItems: atRiskList.slice(0, 10),
      strugglingItems: strugglingList.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Error in /api/learning/recommendations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}

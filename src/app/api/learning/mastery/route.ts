import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateForgettingCurve } from "@/lib/learning/forgetting-curve";
import { getMasteryCategory } from "@/lib/learning/scoring";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const wordSetId = searchParams.get("wordSetId");
  const courseId = searchParams.get("courseId");
  const status = searchParams.get("status"); // WEAK, MEDIUM, STRONG, MASTERED
  const search = searchParams.get("search")?.toLowerCase().trim();
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  try {
    const whereClause: any = {
      userId: user.id,
    };

    if (wordSetId) {
      whereClause.vocabulary = { wordSetId };
    } else if (courseId) {
      whereClause.vocabulary = { wordSet: { courseId } };
    }

    if (search) {
      whereClause.vocabulary = {
        ...whereClause.vocabulary,
        OR: [
          { term: { contains: search, mode: "insensitive" } },
          { meaning: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (status === "WEAK") {
      whereClause.knowledgeScore = { lt: 0.40 };
    } else if (status === "MEDIUM") {
      whereClause.knowledgeScore = { gte: 0.40, lt: 0.65 };
    } else if (status === "STRONG") {
      whereClause.knowledgeScore = { gte: 0.65, lt: 0.85 };
    } else if (status === "MASTERED") {
      whereClause.knowledgeScore = { gte: 0.85 };
    }

    const [total, masteries] = await Promise.all([
      prisma.userVocabularyMastery.count({ where: whereClause }),
      prisma.userVocabularyMastery.findMany({
        where: whereClause,
        include: {
          vocabulary: {
            include: {
              wordSet: {
                select: {
                  id: true,
                  title: true,
                  orderNumber: true,
                },
              },
            },
          },
        },
        orderBy: [{ knowledgeScore: "asc" }, { updatedAt: "desc" }],
        take: limit,
        skip: offset,
      }),
    ]);

    const formatted = masteries.map((m) => {
      // Re-evaluate instantaneous forgetting risk
      const fc = evaluateForgettingCurve({
        lastSeenAt: m.lastSeenAt,
        currentKnowledge: m.knowledgeScore,
        memoryStabilityDays: m.memoryStability,
      });

      return {
        id: m.id,
        vocabularyId: m.vocabularyId,
        term: m.vocabulary.term,
        meaning: m.vocabulary.meaning,
        phonetic: m.vocabulary.phonetic,
        partOfSpeech: m.vocabulary.partOfSpeech,
        wordSetTitle: m.vocabulary.wordSet?.title,
        knowledgeScore: m.knowledgeScore,
        confidenceScore: m.confidenceScore,
        category: getMasteryCategory(m.knowledgeScore),
        forgettingRisk: fc.forgettingRisk,
        retentionRate: fc.retentionRate,
        isOverdue: fc.isOverdue,
        totalAttempts: m.totalAttempts,
        correctAttempts: m.correctAttempts,
        incorrectAttempts: m.incorrectAttempts,
        consecutiveCorrect: m.consecutiveCorrect,
        consecutiveIncorrect: m.consecutiveIncorrect,
        averageResponseTime: m.averageResponseTime,
        nextReviewAt: m.nextReviewAt,
        lastSeenAt: m.lastSeenAt,
        crossSkills: {
          recognition: m.recognitionScore,
          recall: m.recallScore,
          spelling: m.spellingScore,
          listening: m.listeningScore,
          usage: m.usageScore,
        },
      };
    });

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      masteries: formatted,
    });
  } catch (error: any) {
    console.error("Error in /api/learning/mastery:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch mastery records" },
      { status: 500 }
    );
  }
}

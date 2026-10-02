import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all answers user submitted across all attempts
    const answers = await prisma.quizAnswer.findMany({
      where: {
        attempt: { userId: user.id },
      },
      include: {
        question: {
          select: { topic: true, difficulty: true },
        },
      },
      orderBy: { id: "desc" },
      take: 200, // Look at recent 200 answers for responsive analysis
    });

    const topicStats: Record<string, { total: number; correct: number; wrong: number }> = {};

    for (const a of answers) {
      const topicName = a.question.topic || "Tổng quan";
      if (!topicStats[topicName]) {
        topicStats[topicName] = { total: 0, correct: 0, wrong: 0 };
      }
      topicStats[topicName].total += 1;
      if (a.isCorrect) {
        topicStats[topicName].correct += 1;
      } else {
        topicStats[topicName].wrong += 1;
      }
    }

    const analyzedTopics = Object.entries(topicStats).map(([topic, stats]) => {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      const isWeak = accuracy < 65 && stats.total >= 2;
      return {
        topic,
        totalAttempts: stats.total,
        correctCount: stats.correct,
        wrongCount: stats.wrong,
        accuracy,
        isWeak,
      };
    });

    // Sort weakest first
    analyzedTopics.sort((a, b) => a.accuracy - b.accuracy);

    const weakTopics = analyzedTopics.filter((t) => t.isWeak);
    const strongTopics = analyzedTopics.filter((t) => !t.isWeak && t.totalAttempts >= 2);

    return NextResponse.json({
      weakTopics,
      strongTopics,
      allTopics: analyzedTopics,
      totalAnswered: answers.length,
    });
  } catch (err: any) {
    console.error("Fetch weak topics error:", err);
    return NextResponse.json({ error: "Lỗi phân tích chủ đề yếu" }, { status: 500 });
  }
}

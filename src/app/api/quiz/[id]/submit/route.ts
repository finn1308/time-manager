import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SubmittedAnswerItem {
  questionId: string;
  selectedAnswer: number;
  timeSpentSeconds?: number;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;

  try {
    const { mode = "PRACTICE", answers = [], isTimerRunning = false } = (await req.json()) as {
      mode?: string;
      answers: SubmittedAnswerItem[];
      isTimerRunning?: boolean;
    };

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        stage: true,
        questions: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Không tìm thấy bài Quiz" }, { status: 404 });
    }

    // Map answers by questionId for fast lookup
    const answerMap = new Map<string, SubmittedAnswerItem>();
    for (const a of answers) {
      answerMap.set(a.questionId, a);
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let totalTimeSpent = 0;

    const evaluatedAnswers: Array<{
      questionId: string;
      questionText: string;
      selectedAnswer: number;
      correctAnswer: number;
      isCorrect: boolean;
      rationale: string;
      topic: string;
      sourceReference?: string | null;
      sourcePage?: number | null;
      timeSpentSeconds: number;
    }> = [];

    const weakTopicCounts: Record<string, { wrong: number; total: number }> = {};

    for (const q of quiz.questions) {
      const userSubmission = answerMap.get(q.id);
      const topicName = q.topic || "Chủ đề chung";

      if (!weakTopicCounts[topicName]) {
        weakTopicCounts[topicName] = { wrong: 0, total: 0 };
      }
      weakTopicCounts[topicName].total += 1;

      if (!userSubmission || userSubmission.selectedAnswer === -1) {
        // Skipped
        skippedCount++;
        weakTopicCounts[topicName].wrong += 1;

        evaluatedAnswers.push({
          questionId: q.id,
          questionText: q.question,
          selectedAnswer: -1,
          correctAnswer: q.correctAnswer,
          isCorrect: false,
          rationale: q.rationale,
          topic: topicName,
          sourceReference: q.sourceReference,
          sourcePage: q.sourcePage,
          timeSpentSeconds: 0,
        });
      } else {
        const isCorrect = userSubmission.selectedAnswer === q.correctAnswer;
        const timeSpent = userSubmission.timeSpentSeconds || 10;
        totalTimeSpent += timeSpent;

        if (isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
          weakTopicCounts[topicName].wrong += 1;
        }

        evaluatedAnswers.push({
          questionId: q.id,
          questionText: q.question,
          selectedAnswer: userSubmission.selectedAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          rationale: q.rationale,
          topic: topicName,
          sourceReference: q.sourceReference,
          sourcePage: q.sourcePage,
          timeSpentSeconds: timeSpent,
        });
      }
    }

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = score >= 60;

    // Calculate XP: 10 XP per correct question + passing bonus
    let xpEarned = correctCount * 10;
    if (score === 100) {
      xpEarned += 60; // Perfect score bonus
    } else if (score >= 80) {
      xpEarned += 35;
    } else if (isPassed) {
      xpEarned += 20;
    }

    let unlockedNextDay = false;
    let nextDayNumber: number | null = null;

    // Execute database persistence in transaction
    const attempt = await prisma.$transaction(
      async (tx) => {
        // 1. Create Quiz Attempt with nested answers in one atomic write
        const newAttempt = await tx.quizAttempt.create({
          data: {
            userId: user.id,
            quizId: quiz.id,
            mode,
            score,
            totalQuestions,
            correctAnswers: correctCount,
            incorrectAnswers: incorrectCount,
            skippedQuestions: skippedCount,
            timeSpentSeconds: totalTimeSpent,
            xpEarned,
            completedAt: new Date(),
            answers: {
              create: evaluatedAnswers.map((ea) => ({
                questionId: ea.questionId,
                selectedAnswer: ea.selectedAnswer,
                isCorrect: ea.isCorrect,
                timeSpentSeconds: ea.timeSpentSeconds,
              })),
            },
          },
        });

        // 2. Update User XP
        await tx.user.update({
          where: { id: user.id },
          data: {
            xp: { increment: xpEarned },
          },
        });

        // 3. Create StudySession if not handled by PIP timer
        if (!isTimerRunning && quiz.subjectId && totalTimeSpent > 0) {
          await tx.studySession.create({
            data: {
              userId: user.id,
              subjectId: quiz.subjectId,
              actualStart: new Date(Date.now() - totalTimeSpent * 1000),
              actualEnd: new Date(),
              actualDurationSeconds: totalTimeSpent,
              status: "COMPLETED",
              source: "PRACTICE_QUIZ",
            }
          });
        }

      // 4. UNLOCK NEXT DAY LOGIC (If user passed and quiz is attached to a Roadmap Stage)
      if (isPassed && quiz.stageId && quiz.stage) {
        // Mark current stage completed
        await tx.roadmapStage.update({
          where: { id: quiz.stageId },
          data: { isCompleted: true },
        });

        // Find and unlock next stage in the same roadmap
        const currentDay = quiz.stage.dayNumber;
        const nextStage = await tx.roadmapStage.findFirst({
          where: {
            roadmapId: quiz.stage.roadmapId,
            dayNumber: currentDay + 1,
          },
        });

        if (nextStage) {
          await tx.roadmapStage.update({
            where: { id: nextStage.id },
            data: { isUnlocked: true },
          });
          unlockedNextDay = true;
          nextDayNumber = nextStage.dayNumber;
        }

        // Recalculate completed stages in roadmap
        const completedCount = await tx.roadmapStage.count({
          where: {
            roadmapId: quiz.stage.roadmapId,
            isCompleted: true,
          },
        });

        await tx.learningRoadmap.update({
          where: { id: quiz.stage.roadmapId },
          data: {
            completedStages: completedCount,
            totalXp: { increment: xpEarned },
          },
        });
      }

      return newAttempt;
    },
    { timeout: 30000, maxWait: 10000 }
  );

    // Determine Weak Topics
    const weakTopics = Object.entries(weakTopicCounts)
      .map(([topic, stats]) => {
        const accuracy = Math.round(((stats.total - stats.wrong) / stats.total) * 100);
        return {
          topic,
          wrongCount: stats.wrong,
          totalQuestions: stats.total,
          accuracy,
        };
      })
      .filter((t) => t.wrongCount > 0)
      .sort((a, b) => a.accuracy - b.accuracy);

    // AI Study Recommendations
    const recommendations: string[] = [];
    if (weakTopics.length > 0) {
      recommendations.push(
        `Ôn tập lại chủ đề yếu nhất: "${weakTopics[0].topic}" (${weakTopics[0].accuracy}% chính xác).`
      );
    }
    if (isPassed) {
      if (unlockedNextDay && nextDayNumber) {
        recommendations.push(
          `Tuyệt vời! Bạn đã mở khóa Day ${nextDayNumber < 10 ? "0" + nextDayNumber : nextDayNumber}. Hãy tiếp tục lộ trình vào ngày mai!`
        );
      } else {
        recommendations.push("Bạn đã xuất sắc hoàn thành toàn bộ lộ trình học tập này! 🎉");
      }
    } else {
      recommendations.push(
        "Điểm chưa đạt chuẩn (cần tối thiểu 60%). Hãy xem lại giải thích chi tiết các câu sai và làm lại bài để mở khóa chặng tiếp theo."
      );
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      isPassed,
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      timeSpentSeconds: totalTimeSpent,
      xpEarned,
      unlockedNextDay,
      nextDayNumber,
      answers: evaluatedAnswers,
      weakTopics,
      recommendations,
    });
  } catch (err: any) {
    console.error("Submit quiz error:", err);
    return NextResponse.json({ error: "Lỗi nộp bài Quiz" }, { status: 500 });
  }
}

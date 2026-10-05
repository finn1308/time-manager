import { NextResponse } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { wordSetId, subjectId, durationSeconds, results } = body;

    if (!wordSetId || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const correctItems = results.filter((r: any) => r.isKnown).length;
    const totalItems = results.length;
    const accuracy = totalItems > 0 ? (correctItems / totalItems) * 100 : 0;

    // 1. Tạo VocabStudySession
    await db.vocabStudySession.create({
      data: {
        userId: user.id,
        wordSetId,
        subjectId: subjectId || undefined,
        mode: "FLASHCARD",
        totalItems,
        correctItems,
        accuracy,
        durationSeconds,
      }
    });

    // 2. Tạo StudySession chính (để tính vào Dashboard / Statistics)
    if (subjectId) {
      // Find active session for this specific subject & task if it exists (started by PIP)
      const existingSession = await db.studySession.findFirst({
        where: {
          userId: user.id,
          taskId: `vocab_${wordSetId}`,
          status: "IN_PROGRESS",
        }
      });

      if (existingSession) {
        await db.studySession.update({
          where: { id: existingSession.id },
          data: {
            actualEnd: new Date(),
            actualDurationSeconds: durationSeconds,
            status: "COMPLETED",
          }
        });
      } else {
        // Fallback: manually create one if PIP wasn't used or failed
        await db.studySession.create({
          data: {
            userId: user.id,
            subjectId,
            taskId: `vocab_${wordSetId}`,
            actualStart: new Date(Date.now() - durationSeconds * 1000),
            actualEnd: new Date(),
            actualDurationSeconds: durationSeconds,
            status: "COMPLETED",
            source: "VOCAB_PRACTICE",
          }
        });
      }
    }

    // 3. Cập nhật UserWordProgress
    // Để tối ưu, dùng transaction
    const updatePromises = results.map((result: any) => {
      const newStatus = result.isKnown ? "MASTERED" : "LEARNING";
      
      return db.userWordProgress.upsert({
        where: {
          userId_wordId: {
            userId: user.id,
            wordId: result.wordId,
          }
        },
        update: {
          status: newStatus,
          timesStudied: { increment: 1 },
          correctCount: result.isKnown ? { increment: 1 } : undefined,
          incorrectCount: !result.isKnown ? { increment: 1 } : undefined,
          lastReviewedAt: new Date(),
        },
        create: {
          userId: user.id,
          wordId: result.wordId,
          wordSetId,
          status: newStatus,
          timesStudied: 1,
          correctCount: result.isKnown ? 1 : 0,
          incorrectCount: !result.isKnown ? 1 : 0,
          lastReviewedAt: new Date(),
        }
      });
    });

    await db.$transaction(updatePromises);

    // 4. Update WordSet progress (summary)
    const allProgresses = await db.userWordProgress.findMany({
      where: { userId: user.id, wordSetId }
    });

    const masteredCount = allProgresses.filter(p => p.status === "MASTERED").length;

    await db.userWordSetProgress.upsert({
      where: {
        userId_wordSetId: {
          userId: user.id,
          wordSetId,
        }
      },
      update: {
        completedWords: masteredCount,
      },
      create: {
        userId: user.id,
        wordSetId,
        completedWords: masteredCount,
        totalWords: totalItems, // Approximation
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vocabulary submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

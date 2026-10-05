import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();

    // Find all words due for review (where nextReviewDate <= now or status is LEARNING)
    const dueProgress = await prisma.userWordProgress.findMany({
      where: {
        userId: user.id,
        OR: [
          { nextReviewDate: { lte: now } },
          { nextReviewDate: null, status: "LEARNING" },
        ],
      },
      include: {
        word: {
          include: {
            wordSet: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ nextReviewDate: "asc" }],
      take: 50,
    });

    const dueWords = dueProgress.map((p) => ({
      id: p.word.id,
      term: p.word.term,
      phonetic: p.word.phonetic,
      partOfSpeech: p.word.partOfSpeech,
      meaning: p.word.meaning,
      exampleSentence: p.word.exampleSentence,
      exampleMeaning: p.word.exampleMeaning,
      audioUrl: p.word.audioUrl,
      wordSetTitle: p.word.wordSet.title,
      courseTitle: p.word.wordSet.course.title,
      status: p.status,
      repetition: p.repetition,
      intervalDays: p.intervalDays,
      easeFactor: p.easeFactor,
      nextReviewDate: p.nextReviewDate,
    }));

    return NextResponse.json({
      success: true,
      dueWords,
      totalDue: dueWords.length,
    });
  } catch (error: any) {
    console.error("GET /api/vocab/spaced-repetition error:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách ôn tập ngắt quãng: " + error.message },
      { status: 500 }
    );
  }
}

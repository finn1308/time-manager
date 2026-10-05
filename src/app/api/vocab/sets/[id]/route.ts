import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const statusFilter = searchParams.get("status") || "ALL"; // ALL, NOT_MEMORIZED, LEARNING, MASTERED, FAVORITE
  const limitParam = searchParams.get("limit") || "20"; // 5, 10, 15, 20, ALL
  const sortParam = searchParams.get("sort") || "DEFAULT"; // RANDOM, DEFAULT, ALPHABETICAL

  try {
    const [wordSet, userWordProgresses] = await Promise.all([
      prisma.wordSet.findUnique({
        where: { id },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              icon: true,
            },
          },
          words: {
            orderBy: { order: "asc" },
          },
        },
      }),
      user
        ? prisma.userWordProgress.findMany({
            where: {
              userId: user.id,
              wordSetId: id,
            },
          })
        : Promise.resolve([]),
    ]);

    if (!wordSet) {
      return NextResponse.json({ error: "Không tìm thấy bộ từ vựng" }, { status: 404 });
    }

    const progressMap = new Map(
      userWordProgresses.map((p) => [p.wordId, p])
    );

    let learnedCount = 0;
    let masteredCount = 0;

    const wordsWithProgress = wordSet.words.map((w) => {
      const p = progressMap.get(w.id);
      const status = p?.status || "NEW";
      const isFavorite = Boolean(p?.isFavorite);

      if (status === "LEARNING" || status === "MASTERED") {
        learnedCount++;
      }
      if (status === "MASTERED") {
        masteredCount++;
      }

      return {
        id: w.id,
        term: w.term,
        phonetic: w.phonetic,
        partOfSpeech: w.partOfSpeech,
        meaning: w.meaning,
        explanation: w.explanation,
        exampleSentence: w.exampleSentence,
        exampleMeaning: w.exampleMeaning,
        audioUrl: w.audioUrl,
        imageUrl: w.imageUrl,
        order: w.order,
        status,
        isFavorite,
        timesStudied: p?.timesStudied || 0,
        repetition: p?.repetition || 0,
        intervalDays: p?.intervalDays || 1,
        nextReviewDate: p?.nextReviewDate || null,
      };
    });

    // Apply Filter: TRẠNG THÁI
    let filtered = wordsWithProgress.filter((w) => {
      if (statusFilter === "NOT_MEMORIZED") {
        return w.status === "NEW" || w.status === "LEARNING";
      }
      if (statusFilter === "LEARNING") {
        return w.status === "LEARNING";
      }
      if (statusFilter === "MASTERED") {
        return w.status === "MASTERED";
      }
      if (statusFilter === "FAVORITE") {
        return w.isFavorite;
      }
      return true; // ALL
    });

    // Apply Sort: THỨ TỰ
    if (sortParam === "RANDOM") {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    } else if (sortParam === "ALPHABETICAL") {
      filtered = [...filtered].sort((a, b) => a.term.localeCompare(b.term));
    }

    // Apply Limit: SỐ LƯỢNG
    if (limitParam !== "ALL") {
      const limitNum = parseInt(limitParam, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filtered = filtered.slice(0, limitNum);
      }
    }

    const totalWords = wordSet.words.length;
    const progressPercent =
      totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

    const setPayload = {
      id: wordSet.id,
      orderNumber: wordSet.orderNumber,
      title: wordSet.title,
      description: wordSet.description,
      isPro: wordSet.isPro,
      course: wordSet.course,
      totalWords,
      learnedWordsCount: learnedCount,
      masteredWordsCount: masteredCount,
      progressPercent,
    };

    return NextResponse.json({
      success: true,
      set: setPayload,
      wordSet: setPayload,
      words: wordsWithProgress,
      allWords: wordsWithProgress,
      filteredWords: filtered,
    });
  } catch (error: any) {
    console.error("GET /api/vocab/sets/[id] error:", error);
    return NextResponse.json(
      { error: "Lỗi tải bộ từ vựng: " + error.message },
      { status: 500 }
    );
  }
}

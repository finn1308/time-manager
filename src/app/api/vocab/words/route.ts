import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("query")?.trim() || "";
  const status = searchParams.get("status") || "ALL";
  const courseId = searchParams.get("courseId");
  const wordSetId = searchParams.get("wordSetId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
  const skip = (page - 1) * limit;

  try {
    const where: any = {};

    if (query) {
      where.OR = [
        { term: { contains: query, mode: "insensitive" } },
        { meaning: { contains: query, mode: "insensitive" } },
        { explanation: { contains: query, mode: "insensitive" } },
      ];
    }

    const subjectId = searchParams.get("subjectId");
    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (wordSetId) {
      where.wordSetId = wordSetId;
    } else if (courseId) {
      where.wordSet = { courseId };
    }

    const now = new Date();

    // If filtering by user progress status
    if (user && status !== "ALL") {
      if (status === "FAVORITE") {
        where.userProgress = {
          some: {
            userId: user.id,
            isFavorite: true,
          },
        };
      } else if (status === "REVIEW_DUE") {
        where.userProgress = {
          some: {
            userId: user.id,
            OR: [
              { nextReviewDate: { lte: now } },
              { nextReviewDate: null, status: "LEARNING" },
            ],
          },
        };
      } else {
        where.userProgress = {
          some: {
            userId: user.id,
            status,
          },
        };
      }
    }

    // Base query without status filter to calculate counts
    const baseWhere = { ...where };
    delete baseWhere.userProgress;

    const [totalWords, words, allWordsForCounts] = await Promise.all([
      prisma.vocabWord.count({ where }),
      prisma.vocabWord.findMany({
        where,
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
          userProgress: user
            ? {
                where: { userId: user.id },
              }
            : false,
        },
        orderBy: [{ order: "asc" }, { term: "asc" }],
        skip,
        take: limit,
      }),
      user
        ? prisma.vocabWord.findMany({
            where: baseWhere,
            select: {
              id: true,
              userProgress: {
                where: { userId: user.id },
                select: {
                  status: true,
                  nextReviewDate: true,
                },
              },
            },
          })
        : [],
    ]);

    const statusCounts = {
      all: allWordsForCounts.length,
      new: 0,
      learning: 0,
      mastered: 0,
      reviewDue: 0,
    };

    if (user) {
      for (const item of allWordsForCounts) {
        const p = item.userProgress?.[0];
        const itemStatus = p?.status || "NEW";
        if (itemStatus === "MASTERED") statusCounts.mastered++;
        else if (itemStatus === "LEARNING") statusCounts.learning++;
        else statusCounts.new++;

        if (p && ((p.nextReviewDate && p.nextReviewDate <= now) || (!p.nextReviewDate && p.status === "LEARNING"))) {
          statusCounts.reviewDue++;
        }
      }
    }

    const formattedWords = words.map((w) => {
      const p = w.userProgress?.[0];
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
        difficulty: w.difficulty,
        topic: w.topic,
        wordSetTitle: w.wordSet.title,
        courseTitle: w.wordSet.course.title,
        courseSlug: w.wordSet.course.slug,
        status: p?.status || "NEW",
        isFavorite: Boolean(p?.isFavorite),
        repetition: p?.repetition || 0,
        intervalDays: p?.intervalDays || 1,
        nextReviewDate: p?.nextReviewDate,
      };
    });

    return NextResponse.json({
      success: true,
      words: formattedWords,
      statusCounts,
      pagination: {
        page,
        limit,
        total: totalWords,
        totalPages: Math.ceil(totalWords / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/vocab/words error:", error);
    return NextResponse.json(
      { error: "Lỗi tải kho từ vựng: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      wordSetId,
      term,
      phonetic,
      partOfSpeech,
      meaning,
      explanation,
      exampleSentence,
      exampleMeaning,
    } = body;

    if (!wordSetId || !term?.trim() || !meaning?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ bộ từ, từ tiếng Anh và nghĩa tiếng Việt" },
        { status: 400 }
      );
    }

    const word = await prisma.vocabWord.create({
      data: {
        wordSetId,
        term: term.trim(),
        phonetic: phonetic?.trim() || null,
        partOfSpeech: partOfSpeech?.trim() || null,
        meaning: meaning.trim(),
        explanation: explanation?.trim() || null,
        exampleSentence: exampleSentence?.trim() || null,
        exampleMeaning: exampleMeaning?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, word });
  } catch (error: any) {
    console.error("POST /api/vocab/words error:", error);
    return NextResponse.json(
      { error: "Lỗi tạo từ vựng: " + error.message },
      { status: 500 }
    );
  }
}

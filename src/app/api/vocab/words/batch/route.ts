import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface BatchWordInput {
  term: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  meaning: string;
  exampleSentence?: string | null;
  exampleMeaning?: string | null;
  explanation?: string | null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { wordSetId, words } = body as {
      wordSetId: string;
      words: BatchWordInput[];
    };

    if (!wordSetId) {
      return NextResponse.json({ error: "Thiếu ID bộ từ vựng" }, { status: 400 });
    }

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "Danh sách từ rỗng" }, { status: 400 });
    }

    // Verify wordSet exists
    const wordSet = await prisma.wordSet.findUnique({
      where: { id: wordSetId },
    });

    if (!wordSet) {
      return NextResponse.json({ error: "Không tìm thấy bộ từ vựng" }, { status: 404 });
    }

    // Filter valid words (term and meaning must be non-empty)
    const validWords = words
      .map((w, index) => ({
        wordSetId,
        term: w.term?.trim() || "",
        phonetic: w.phonetic?.trim() || null,
        partOfSpeech: w.partOfSpeech?.trim() || null,
        meaning: w.meaning?.trim() || "",
        exampleSentence: w.exampleSentence?.trim() || null,
        exampleMeaning: w.exampleMeaning?.trim() || null,
        explanation: w.explanation?.trim() || null,
        order: index + 1,
      }))
      .filter((w) => w.term.length > 0 && w.meaning.length > 0);

    if (validWords.length === 0) {
      return NextResponse.json(
        { error: "Không có từ vựng hợp lệ (mỗi từ phải có ít nhất Từ vựng và Nghĩa)" },
        { status: 400 }
      );
    }

    // Get current highest order in set
    const lastWord = await prisma.vocabWord.findFirst({
      where: { wordSetId },
      orderBy: { order: "desc" },
    });
    const startOrder = (lastWord?.order || 0) + 1;

    // Insert all words in transaction
    const wordsToCreate = validWords.map((w, idx) => ({
      ...w,
      order: startOrder + idx,
    }));

    await prisma.vocabWord.createMany({
      data: wordsToCreate,
    });

    // Update total count in set progress for user if needed
    const totalCount = await prisma.vocabWord.count({
      where: { wordSetId },
    });

    await prisma.userWordSetProgress.upsert({
      where: {
        userId_wordSetId: {
          userId: user.id,
          wordSetId,
        },
      },
      update: {
        totalWords: totalCount,
      },
      create: {
        userId: user.id,
        wordSetId,
        totalWords: totalCount,
        completedWords: 0,
      },
    });

    return NextResponse.json({
      success: true,
      count: wordsToCreate.length,
      message: `Đã lưu thành công ${wordsToCreate.length} từ vựng vào bộ từ!`,
      totalWordsInSet: totalCount,
    });
  } catch (error: any) {
    console.error("POST /api/vocab/words/batch error:", error);
    return NextResponse.json(
      { error: "Lỗi lưu danh sách từ: " + error.message },
      { status: 500 }
    );
  }
}

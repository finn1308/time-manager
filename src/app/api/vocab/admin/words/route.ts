import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { wordSetId, term, phonetic, partOfSpeech, meaning, exampleSentence, exampleMeaning, explanation } = body;

    if (!wordSetId || !term || !meaning) {
      return NextResponse.json(
        { error: "wordSetId, term, and meaning are required" },
        { status: 400 }
      );
    }

    // Verify wordSet exists
    const set = await prisma.wordSet.findUnique({
      where: { id: wordSetId },
    });

    if (!set) {
      return NextResponse.json({ error: "Word set not found" }, { status: 404 });
    }

    const newWord = await prisma.vocabWord.create({
      data: {
        wordSetId,
        term: term.trim(),
        phonetic: phonetic ? phonetic.trim() : null,
        partOfSpeech: partOfSpeech ? partOfSpeech.trim() : null,
        meaning: meaning.trim(),
        exampleSentence: exampleSentence ? exampleSentence.trim() : null,
        exampleMeaning: exampleMeaning ? exampleMeaning.trim() : null,
        explanation: explanation ? explanation.trim() : null,
      },
    });

    // Update totalWords count in all UserWordSetProgress for this set
    await prisma.userWordSetProgress.updateMany({
      where: { wordSetId },
      data: {
        totalWords: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, word: newWord });
  } catch (error) {
    console.error("Create vocab word error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const wordId = searchParams.get("id");

    if (!wordId) {
      return NextResponse.json({ error: "Word ID required" }, { status: 400 });
    }

    const word = await prisma.vocabWord.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    await prisma.vocabWord.delete({
      where: { id: wordId },
    });

    return NextResponse.json({ success: true, message: "Word deleted successfully" });
  } catch (error) {
    console.error("Delete vocab word error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

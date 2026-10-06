import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: deckId } = await params;

  try {
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId, userId: user.id },
    });

    if (!deck) {
      return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    }

    const {
      front,
      back,
      hint,
      topic,
      sourceReference,
      phonetic,
      partOfSpeech,
      exampleSentence,
      exampleMeaning,
      imageUrl,
      audioUrl,
    } = await req.json();

    if (!front || !back || !front.trim() || !back.trim()) {
      return NextResponse.json({ error: "Mặt trước và mặt sau không được để trống" }, { status: 400 });
    }

    const card = await prisma.flashcard.create({
      data: {
        deckId,
        front: front.trim(),
        back: back.trim(),
        hint: hint?.trim() || null,
        topic: topic?.trim() || null,
        sourceReference: sourceReference?.trim() || null,
        phonetic: phonetic?.trim() || null,
        partOfSpeech: partOfSpeech?.trim() || null,
        exampleSentence: exampleSentence?.trim() || null,
        exampleMeaning: exampleMeaning?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        audioUrl: audioUrl?.trim() || null,
        status: "NEW",
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 0,
        masteryLevel: 0,
      },
    });

    // Increment deck cardCount
    await prisma.flashcardDeck.update({
      where: { id: deckId },
      data: { cardCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, card }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/flashcards/decks/[id]/cards error:", err);
    return NextResponse.json({ error: "Lỗi thêm thẻ flashcard" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decks = await prisma.flashcardDeck.findMany({
      where: { userId: user.id },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        flashcards: {
          select: {
            id: true,
            status: true,
            nextReview: true,
            masteryLevel: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();

    const formattedDecks = decks.map((deck) => {
      const cards = deck.flashcards;
      const dueCount = cards.filter(
        (c) => c.status === "NEW" || !c.nextReview || new Date(c.nextReview) <= now
      ).length;
      const newCount = cards.filter((c) => c.status === "NEW").length;
      const learningCount = cards.filter((c) => c.status === "LEARNING").length;
      const reviewCount = cards.filter((c) => c.status === "REVIEW").length;
      const masteredCount = cards.filter((c) => c.status === "MASTERED").length;

      return {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        cardCount: cards.length,
        dueCount,
        newCount,
        learningCount,
        reviewCount,
        masteredCount,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      };
    });

    return NextResponse.json({ decks: formattedDecks });
  } catch (err: any) {
    console.error("GET /api/flashcards/decks error:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách bộ thẻ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, subjectId } = await req.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Tiêu đề bộ thẻ không được để trống" }, { status: 400 });
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        subjectId: subjectId || null,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ success: true, deck }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/flashcards/decks error:", err);
    return NextResponse.json({ error: "Lỗi tạo bộ thẻ mới" }, { status: 500 });
  }
}

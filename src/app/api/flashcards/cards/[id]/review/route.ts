import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateSM2, FlashcardRating } from "@/lib/anki/sm2";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: cardId } = await params;

  try {
    const { rating } = await req.json();

    if (![1, 2, 3, 4].includes(rating)) {
      return NextResponse.json({ error: "Đánh giá không hợp lệ (phải từ 1 đến 4)" }, { status: 400 });
    }

    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      include: {
        deck: {
          select: { userId: true },
        },
      },
    });

    if (!card || card.deck.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ hoặc không có quyền truy cập" }, { status: 404 });
    }

    const sm2Result = calculateSM2({
      rating: rating as FlashcardRating,
      repetitionCount: card.repetitionCount,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
    });

    const now = new Date();

    // Transactionally update card and record review + XP
    const [updatedCard] = await prisma.$transaction([
      prisma.flashcard.update({
        where: { id: cardId },
        data: {
          repetitionCount: sm2Result.repetitionCount,
          intervalDays: sm2Result.intervalDays,
          easeFactor: sm2Result.easeFactor,
          nextReview: sm2Result.nextReview,
          status: sm2Result.status,
          masteryLevel: sm2Result.masteryLevel,
          lastReviewed: now,
        },
      }),
      prisma.flashcardReview.create({
        data: {
          userId: user.id,
          flashcardId: cardId,
          rating,
          intervalDays: sm2Result.intervalDays,
          easeFactor: sm2Result.easeFactor,
          reviewedAt: now,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: 10 },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      card: updatedCard,
      sm2Result,
      xpGained: 10,
    });
  } catch (err: any) {
    console.error("POST /api/flashcards/cards/[id]/review error:", err);
    return NextResponse.json({ error: "Lỗi ghi nhận kết quả ôn tập" }, { status: 500 });
  }
}

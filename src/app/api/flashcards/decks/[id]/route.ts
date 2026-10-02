import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id, userId: user.id },
      include: {
        subject: true,
        flashcards: {
          orderBy: [{ nextReview: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    }

    const now = new Date();
    const dueCards = deck.flashcards.filter(
      (c) => c.status === "NEW" || !c.nextReview || new Date(c.nextReview) <= now
    );

    return NextResponse.json({
      deck,
      totalCards: deck.flashcards.length,
      dueCards,
      dueCount: dueCards.length,
    });
  } catch (err: any) {
    console.error("GET /api/flashcards/decks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi tải thông tin bộ thẻ" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { title, description, subjectId } = await req.json();

    const updated = await prisma.flashcardDeck.update({
      where: { id, userId: user.id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        subjectId: subjectId !== undefined ? subjectId || null : undefined,
      },
      include: { subject: true },
    });

    return NextResponse.json({ success: true, deck: updated });
  } catch (err: any) {
    console.error("PATCH /api/flashcards/decks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật bộ thẻ" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.flashcardDeck.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa bộ thẻ" });
  } catch (err: any) {
    console.error("DELETE /api/flashcards/decks/[id] error:", err);
    return NextResponse.json({ error: "Lỗi xóa bộ thẻ" }, { status: 500 });
  }
}

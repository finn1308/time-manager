import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const moveCardSchema = z.object({
  targetColumnId: z.string().min(1),
  newSortOrder: z.number().int().min(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, cardId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const body = await req.json();
    const parsed = moveCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { targetColumnId, newSortOrder } = parsed.data;

    // Verify target column belongs to this room
    const targetColumn = await prisma.boardColumn.findUnique({
      where: { id: targetColumnId },
    });

    if (!targetColumn || targetColumn.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Cột đích không thuộc phòng họp này" }, { status: 400 });
    }

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
      include: { column: true },
    });

    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ công việc" }, { status: 404 });
    }

    const isNowCompleted = targetColumn.key === "COMPLETED";

    const updated = await prisma.$transaction(async (tx) => {
      // Shift other cards in target column down if newSortOrder causes collision
      await tx.taskCard.updateMany({
        where: {
          roomId: auth.room.id,
          columnId: targetColumnId,
          sortOrder: { gte: newSortOrder },
          id: { not: cardId },
        },
        data: {
          sortOrder: { increment: 1 },
        },
      });

      return await tx.taskCard.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          sortOrder: newSortOrder,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? new Date() : card.completedAt,
        },
      });
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "CARD_MOVED",
      entityType: "CARD",
      entityId: cardId,
      details: {
        fromColumn: card.column.name,
        toColumn: targetColumn.name,
        newSortOrder,
      },
    });

    return NextResponse.json({ success: true, card: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Move card error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi di chuyển thẻ" }, { status: 500 });
  }
}

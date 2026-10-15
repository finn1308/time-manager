import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth } from "@/lib/rooms/room-auth";
import { z } from "zod";

const addChecklistSchema = z.object({
  text: z.string().min(1, "Nội dung checklist không được để trống").max(200),
});

const updateChecklistSchema = z.object({
  itemId: z.string().min(1),
  isCompleted: z.boolean().optional(),
  text: z.string().min(1).max(200).optional(),
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

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
    });
    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = addChecklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const maxSort = await prisma.taskChecklistItem.aggregate({
      where: { taskId: cardId },
      _max: { sortOrder: true },
    });
    const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId: cardId,
        text: parsed.data.text,
        sortOrder: nextSort,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Add checklist error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi thêm checklist" }, { status: 500 });
  }
}

export async function PATCH(
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

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
    });
    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateChecklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { itemId, isCompleted, text } = parsed.data;

    const updated = await prisma.taskChecklistItem.update({
      where: { id: itemId, taskId: cardId },
      data: {
        ...(isCompleted !== undefined ? { isCompleted, completedAt: isCompleted ? new Date() : null, completedBy: isCompleted ? user.id : null } : {}),
        ...(text !== undefined ? { text } : {}),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Update checklist error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật checklist" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "Thiếu itemId" }, { status: 400 });
    }

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
    });
    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    await prisma.taskChecklistItem.delete({
      where: { id: itemId, taskId: cardId },
    });

    return NextResponse.json({ success: true, message: "Đã xóa mục checklist" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Delete checklist error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa checklist" }, { status: 500 });
  }
}

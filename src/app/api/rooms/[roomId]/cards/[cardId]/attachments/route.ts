import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const createAttachmentSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().min(1),
  size: z.number().int().optional().nullable(),
  type: z.string().max(100).optional().nullable(),
});

export async function GET(
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
      return NextResponse.json({ error: "Không tìm thấy thẻ công việc" }, { status: 404 });
    }

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: cardId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List attachments error:", err);
    return NextResponse.json({ error: "Lỗi tải tệp đính kèm" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Không tìm thấy thẻ công việc" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createAttachmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: cardId,
        name: parsed.data.name,
        url: parsed.data.url,
        size: parsed.data.size ?? null,
        type: parsed.data.type ?? null,
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      userId: user.id,
      action: "ATTACHMENT_CREATE",
      targetType: "TASK_CARD",
      targetId: cardId,
      metadata: { attachmentId: attachment.id, name: attachment.name },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Create attachment error:", err);
    return NextResponse.json({ error: "Lỗi thêm tệp đính kèm" }, { status: 500 });
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
    const attachmentId = searchParams.get("attachmentId");
    if (!attachmentId) {
      return NextResponse.json({ error: "Thiếu mã tệp đính kèm" }, { status: 400 });
    }

    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    });

    if (!attachment || attachment.taskId !== cardId || attachment.task.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy tệp đính kèm" }, { status: 404 });
    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      userId: user.id,
      action: "ATTACHMENT_DELETE",
      targetType: "TASK_CARD",
      targetId: cardId,
      metadata: { attachmentId, name: attachment.name },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Delete attachment error:", err);
    return NextResponse.json({ error: "Lỗi xóa tệp đính kèm" }, { status: 500 });
  }
}

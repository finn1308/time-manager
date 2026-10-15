import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth } from "@/lib/rooms/room-auth";
import { z } from "zod";

const addCommentSchema = z.object({
  body: z.string().min(1, "Nội dung bình luận không được để trống").max(1000),
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
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId: cardId },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List comments error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải bình luận" }, { status: 500 });
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
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = addCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: cardId,
        authorId: user.id,
        body: parsed.data.body,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Add comment error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi thêm bình luận" }, { status: 500 });
  }
}

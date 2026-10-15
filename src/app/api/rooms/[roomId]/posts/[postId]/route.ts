import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; postId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, postId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const post = await prisma.roomActivityPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    // Permission check: only author or Admin can delete
    const canDelete = post.authorId === user.id || auth.isAdmin;
    if (!canDelete) {
      return NextResponse.json(
        { error: "Bạn chỉ có thể xóa bài viết của chính mình (hoặc cần quyền Admin)" },
        { status: 403 }
      );
    }

    await prisma.roomActivityPost.delete({
      where: { id: postId },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "POST_DELETED",
      entityType: "POST",
      entityId: postId,
    });

    return NextResponse.json({ success: true, message: "Đã xóa bài viết thành công" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Delete post error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa bài viết" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(250).optional().nullable(),
  color: z.string().optional(),
  joinPolicy: z.enum(["OPEN", "APPROVAL_REQUIRED", "INVITE_ONLY"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string; groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, groupId } = await params;
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN, ROOM_ROLES.HOST]);

    const targetGroup = await prisma.roomGroup.findUnique({
      where: { id: groupId },
    });

    if (!targetGroup || targetGroup.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await prisma.roomGroup.update({
      where: { id: groupId },
      data: parsed.data,
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "GROUP_UPDATED",
      entityType: "GROUP",
      entityId: groupId,
      details: parsed.data,
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Không có quyền sửa nhóm" }, { status: 403 });
    }
    console.error("Update group error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật nhóm" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, groupId } = await params;
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN, ROOM_ROLES.HOST]);

    const targetGroup = await prisma.roomGroup.findUnique({
      where: { id: groupId },
    });

    if (!targetGroup || targetGroup.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
    }

    await prisma.roomGroup.delete({
      where: { id: groupId },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "GROUP_DELETED",
      entityType: "GROUP",
      entityId: groupId,
      details: { name: targetGroup.name },
    });

    return NextResponse.json({ success: true, message: "Đã xóa nhóm thành công" });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Không có quyền xóa nhóm" }, { status: 403 });
    }
    console.error("Delete group error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa nhóm" }, { status: 500 });
  }
}

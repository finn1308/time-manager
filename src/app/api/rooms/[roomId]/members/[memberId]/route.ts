import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "HOST", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, memberId } = await params;
    // Only ADMIN can modify membership role or status
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    const targetMembership = await prisma.roomMembership.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMembership || targetMembership.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thành viên trong phòng" }, { status: 404 });
    }

    // Safeguard: Room owner cannot be demoted or deactivated
    if (targetMembership.userId === auth.room.ownerId) {
      return NextResponse.json(
        { error: "Không thể thay đổi vai trò hoặc vô hiệu hóa Chủ phòng" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await prisma.roomMembership.update({
      where: { id: memberId },
      data: parsed.data,
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "MEMBER_ROLE_UPDATED",
      entityType: "MEMBER",
      entityId: memberId,
      details: { targetUserId: targetMembership.userId, updates: parsed.data },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền cập nhật thành viên" }, { status: 403 });
    }
    console.error("Update member error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật thành viên" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, memberId } = await params;
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    const targetMembership = await prisma.roomMembership.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thành viên" }, { status: 404 });
    }

    if (targetMembership.userId === auth.room.ownerId) {
      return NextResponse.json({ error: "Không thể xóa Chủ phòng" }, { status: 400 });
    }

    await prisma.roomMembership.delete({
      where: { id: memberId },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "MEMBER_REMOVED",
      entityType: "MEMBER",
      entityId: memberId,
    });

    return NextResponse.json({ success: true, message: "Đã xóa thành viên khỏi phòng" });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền xóa thành viên" }, { status: 403 });
    }
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa thành viên" }, { status: 500 });
  }
}

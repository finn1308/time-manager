import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import bcrypt from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, memberId } = await params;
    // Only Admin can reset member passwords
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    const targetMembership = await prisma.roomMembership.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMembership || targetMembership.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thành viên trong phòng" }, { status: 404 });
    }

    // Set password to default temporary password '12345678'
    const newPasswordHash = await bcrypt.hash("12345678", 10);

    await prisma.user.update({
      where: { id: targetMembership.userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: true,
      },
    });

    // Record audit WITHOUT any secret/password
    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "MEMBER_PASSWORD_RESET",
      entityType: "MEMBER",
      entityId: memberId,
      details: { targetUserId: targetMembership.userId, resetToDefault: true },
    });

    return NextResponse.json({
      success: true,
      message: "Mật khẩu của thành viên đã được đặt lại về mật khẩu tạm '12345678'. Thành viên phải đổi mật khẩu ở lần đăng nhập tiếp theo.",
    });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền đặt lại mật khẩu" }, { status: 403 });
    }
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi đặt lại mật khẩu" }, { status: 500 });
  }
}

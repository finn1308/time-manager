import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    // Only ADMIN or owner can view the admin credentials
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    // Retrieve dedicated admin account for this room
    const dedicatedAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: `admin_${auth.room.publicId}@room.local` },
          { name: `admin_${auth.room.publicId}` },
          { id: auth.room.ownerId },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        mustChangePassword: true,
      },
    });

    const username = dedicatedAdmin?.name || `admin_${auth.room.publicId}`;
    const email = dedicatedAdmin?.email || `${username}@room.local`;
    const mustChangePassword = dedicatedAdmin ? !!dedicatedAdmin.mustChangePassword : true;

    return NextResponse.json({
      username,
      email,
      publicId: auth.room.publicId,
      roomTitle: auth.room.title,
      roomSubject: auth.room.subject,
      mustChangePassword,
      // If the admin hasn't changed their password yet, provide the default temporary password
      initialPassword: mustChangePassword ? "12345678" : null,
    });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS" || err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Chỉ Quản trị viên phòng mới có quyền xem thông tin này" }, { status: 403 });
    }
    console.error("Get admin credentials error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải thông tin tài khoản" }, { status: 500 });
  }
}

/**
 * POST endpoint to reset the admin password back to temporary 12345678
 * in case the admin forgot their new password.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    const dedicatedAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: `admin_${auth.room.publicId}@room.local` },
          { name: `admin_${auth.room.publicId}` },
          { id: auth.room.ownerId },
        ],
      },
    });

    if (!dedicatedAdmin) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản quản trị phòng" }, { status: 404 });
    }

    const defaultPwHash = await bcrypt.hash("12345678", 10);

    await prisma.user.update({
      where: { id: dedicatedAdmin.id },
      data: {
        passwordHash: defaultPwHash,
        mustChangePassword: true,
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "RESET_ADMIN_CREDENTIALS",
      entityType: "USER",
      entityId: dedicatedAdmin.id,
      details: { resetBy: user.email },
    });

    return NextResponse.json({
      success: true,
      message: "Đã đặt lại mật khẩu tạm thành công về 12345678",
      tempPassword: "12345678",
      mustChangePassword: true,
    });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS" || err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Chỉ Quản trị viên phòng mới có quyền thực hiện" }, { status: 403 });
    }
    console.error("Reset admin credentials error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi đặt lại mật khẩu" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import { z } from "zod";

const updateRoomSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  subject: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  coverColor: z.string().optional(),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  joinPolicy: z.enum(["OPEN", "APPROVAL_REQUIRED", "INVITE_ONLY"]).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "LOCKED"]).optional(),
});

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
    const auth = await requireRoomAuth(roomId, user.id);

    // Retrieve columns, groups, labels, and member count
    const [columns, groups, labels, memberCount, fullUser] = await Promise.all([
      prisma.boardColumn.findMany({
        where: { roomId: auth.room.id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.roomGroup.findMany({
        where: { roomId: auth.room.id },
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.taskLabel.findMany({
        where: { roomId: auth.room.id },
        orderBy: { name: "asc" },
      }),
      prisma.roomMembership.count({
        where: { roomId: auth.room.id, status: "ACTIVE" },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { mustChangePassword: true },
      }),
    ]);

    return NextResponse.json({
      room: {
        id: auth.room.id,
        publicId: auth.room.publicId,
        title: auth.room.title,
        subject: auth.room.subject,
        description: auth.room.description,
        coverColor: auth.room.coverColor,
        coverImage: auth.room.coverImage,
        ownerId: auth.room.ownerId,
        status: auth.room.status,
        joinPolicy: auth.room.joinPolicy,
        createdAt: auth.room.createdAt,
        updatedAt: auth.room.updatedAt,
      },
      membership: {
        id: auth.membership.id,
        role: auth.membership.role,
        status: auth.membership.status,
        joinedAt: auth.membership.joinedAt,
      },
      permissions: {
        isAdmin: auth.isAdmin,
        isHost: auth.isHost,
        isMember: auth.isMember,
      },
      mustChangePassword: !!fullUser?.mustChangePassword,
      columns,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        color: g.color,
        joinPolicy: g.joinPolicy,
        memberCount: g._count.memberships,
      })),
      labels,
      memberCount,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập phòng họp này" },
        { status: 403 }
      );
    }
    console.error("Get room error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải thông tin phòng" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    // Only ADMIN can modify room settings
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    const body = await req.json();
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const updated = await prisma.meetingRoom.update({
      where: { id: auth.room.id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "ROOM_UPDATED",
      entityType: "ROOM",
      entityId: auth.room.id,
      details: parsed.data,
    });

    return NextResponse.json({ success: true, room: updated });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền sửa cài đặt phòng" }, { status: 403 });
    }
    console.error("Update room error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật phòng" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    // Only ADMIN can delete a room
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    await prisma.$transaction(async (tx) => {
      // Cascade delete deletes all memberships, groups, cards, columns, posts, and audits
      await tx.meetingRoom.delete({
        where: { id: auth.room.id },
      });
    });

    return NextResponse.json({ success: true, message: "Phòng họp đã được xóa thành công" });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền xóa phòng họp" }, { status: 403 });
    }
    console.error("Delete room error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa phòng" }, { status: 500 });
  }
}

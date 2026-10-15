import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const joinGroupSchema = z.object({
  note: z.string().max(200).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, groupId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const group = await prisma.roomGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || group.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
    }

    // Check if already a group member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_membershipId: {
          groupId: group.id,
          membershipId: auth.membership.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: "Bạn đã là thành viên của nhóm này rồi" }, { status: 400 });
    }

    if (group.joinPolicy === "INVITE_ONLY") {
      return NextResponse.json(
        { error: "Nhóm này ở chế độ chỉ mời, bạn không thể gửi yêu cầu trực tiếp" },
        { status: 400 }
      );
    }

    let note: string | undefined;
    try {
      const body = await req.json();
      const parsed = joinGroupSchema.safeParse(body);
      if (parsed.success) note = parsed.data.note;
    } catch {
      // note is optional
    }

    // If OPEN join policy, directly join
    if (group.joinPolicy === "OPEN") {
      const newMembership = await prisma.groupMembership.create({
        data: {
          groupId: group.id,
          membershipId: auth.membership.id,
          status: "ACTIVE",
        },
      });

      await recordRoomAudit({
        roomId: auth.room.id,
        actorId: user.id,
        action: "GROUP_MEMBER_JOINED",
        entityType: "GROUP",
        entityId: group.id,
        details: { groupName: group.name, policy: "OPEN" },
      });

      return NextResponse.json({
        success: true,
        joined: true,
        message: `Bạn đã tham gia nhóm "${group.name}" thành công!`,
        membership: newMembership,
      });
    }

    // For APPROVAL_REQUIRED: Check if pending request exists
    const existingRequest = await prisma.groupJoinRequest.findFirst({
      where: {
        groupId: group.id,
        membershipId: auth.membership.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Yêu cầu tham gia của bạn đang chờ Host hoặc Admin duyệt" },
        { status: 400 }
      );
    }

    const request = await prisma.groupJoinRequest.create({
      data: {
        groupId: group.id,
        membershipId: auth.membership.id,
        status: "PENDING",
        note,
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "GROUP_JOIN_REQUESTED",
      entityType: "GROUP",
      entityId: group.id,
      details: { groupName: group.name, requestId: request.id },
    });

    return NextResponse.json({
      success: true,
      pending: true,
      message: `Đã gửi yêu cầu tham gia nhóm "${group.name}". Vui lòng chờ Host/Admin duyệt.`,
      request,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Join group error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi gửi yêu cầu tham gia nhóm" }, { status: 500 });
  }
}

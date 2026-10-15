import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import { z } from "zod";

const reviewRequestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string; groupId: string; requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, groupId, requestId } = await params;
    // Host or Admin can review group join requests
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN, ROOM_ROLES.HOST]);

    const request = await prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        group: true,
        membership: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!request || request.groupId !== groupId || request.group.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu tham gia" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: `Yêu cầu này đã được xử lý trước đó (${request.status})` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { action } = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (action === "APPROVE") {
        // Create or update group membership
        await tx.groupMembership.upsert({
          where: {
            groupId_membershipId: {
              groupId: request.groupId,
              membershipId: request.membershipId,
            },
          },
          create: {
            groupId: request.groupId,
            membershipId: request.membershipId,
            status: "ACTIVE",
            approvedBy: user.id,
          },
          update: {
            status: "ACTIVE",
            approvedBy: user.id,
          },
        });

        await tx.groupJoinRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedBy: user.id,
            reviewedAt: new Date(),
          },
        });
      } else {
        await tx.groupJoinRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            reviewedBy: user.id,
            reviewedAt: new Date(),
          },
        });
      }
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: action === "APPROVE" ? "GROUP_REQUEST_APPROVED" : "GROUP_REQUEST_REJECTED",
      entityType: "GROUP",
      entityId: groupId,
      details: {
        requestId,
        targetUserId: request.membership.userId,
        targetUserName: request.membership.user.name,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      message: action === "APPROVE" ? "Đã duyệt thành viên vào nhóm" : "Đã từ chối yêu cầu tham gia",
    });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Host hoặc Admin mới có quyền duyệt yêu cầu" }, { status: 403 });
    }
    console.error("Review join request error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi duyệt yêu cầu" }, { status: 500 });
  }
}

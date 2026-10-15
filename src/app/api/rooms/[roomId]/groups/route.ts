import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(2, "Tên nhóm tối thiểu 2 ký tự").max(50),
  description: z.string().max(250).optional(),
  color: z.string().default("sky"),
  joinPolicy: z.enum(["OPEN", "APPROVAL_REQUIRED", "INVITE_ONLY"]).default("APPROVAL_REQUIRED"),
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

    const groups = await prisma.roomGroup.findMany({
      where: { roomId: auth.room.id },
      include: {
        memberships: {
          include: {
            membership: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
        joinRequests: {
          where: { status: "PENDING" },
          include: {
            membership: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const formatted = groups.map((g) => {
      const isUserMember = g.memberships.some((m) => m.membership.userId === user.id);
      const pendingRequest = g.joinRequests.find((r) => r.membership.userId === user.id);

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        color: g.color,
        joinPolicy: g.joinPolicy,
        memberCount: g.memberships.length,
        isMember: isUserMember,
        requestStatus: pendingRequest ? "PENDING" : null,
        members: g.memberships.map((m) => ({
          membershipId: m.membershipId,
          userId: m.membership.user.id,
          name: m.membership.user.name || "Thành viên",
          image: m.membership.user.image,
          joinedAt: m.joinedAt,
        })),
        pendingRequests: auth.isHost
          ? g.joinRequests.map((r) => ({
              id: r.id,
              membershipId: r.membershipId,
              userId: r.membership.user.id,
              name: r.membership.user.name || "Thành viên",
              email: r.membership.user.email,
              image: r.membership.user.image,
              createdAt: r.createdAt,
            }))
          : [],
      };
    });

    return NextResponse.json({ groups: formatted });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List groups error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải nhóm" }, { status: 500 });
  }
}

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
    // Host or Admin can create groups
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN, ROOM_ROLES.HOST]);

    const body = await req.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { name, description, color, joinPolicy } = parsed.data;

    const group = await prisma.roomGroup.create({
      data: {
        roomId: auth.room.id,
        name,
        description: description || null,
        color,
        joinPolicy,
        createdBy: user.id,
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "GROUP_CREATED",
      entityType: "GROUP",
      entityId: group.id,
      details: { name, color, joinPolicy },
    });

    return NextResponse.json({ success: true, group });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Host hoặc Admin mới có quyền tạo nhóm" }, { status: 403 });
    }
    console.error("Create group error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo nhóm" }, { status: 500 });
  }
}

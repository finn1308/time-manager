import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateRandomRoomPublicId,
  ROOM_ROLES,
  DEFAULT_COLUMNS,
  PASTEL_LABELS,
} from "@/lib/rooms/room-utils";
import { recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const createRoomSchema = z.object({
  title: z.string().min(2, "Tên phòng tối thiểu 2 ký tự").max(100),
  subject: z.string().min(2, "Môn học/chủ đề tối thiểu 2 ký tự").max(100),
  description: z.string().max(500).optional(),
  coverColor: z.string().default("indigo"),
  coverImage: z.string().url().optional().or(z.literal("")),
  joinPolicy: z.enum(["OPEN", "APPROVAL_REQUIRED", "INVITE_ONLY"]).default("INVITE_ONLY"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all rooms where user is owner or active member
    const memberships = await prisma.roomMembership.findMany({
      where: {
        userId: user.id,
        status: { not: "DEACTIVATED" },
      },
      include: {
        room: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, image: true },
            },
            _count: {
              select: {
                memberships: true,
                groups: true,
                cards: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const rooms = memberships
      .filter((m) => m.room.status !== "ARCHIVED")
      .map((m) => ({
        id: m.room.id,
        publicId: m.room.publicId,
        title: m.room.title,
        subject: m.room.subject,
        description: m.room.description,
        coverColor: m.room.coverColor,
        coverImage: m.room.coverImage,
        ownerId: m.room.ownerId,
        owner: m.room.owner,
        status: m.room.status,
        joinPolicy: m.room.joinPolicy,
        role: m.role,
        memberCount: m.room._count.memberships,
        groupCount: m.room._count.groups,
        taskCount: m.room._count.cards,
        createdAt: m.room.createdAt,
        updatedAt: m.room.updatedAt,
      }));

    return NextResponse.json({ rooms });
  } catch (err: any) {
    console.error("List rooms error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải danh sách phòng" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { title, subject, description, coverColor, coverImage, joinPolicy } = parsed.data;

    // Generate secure random publicId
    const publicId = generateRandomRoomPublicId();
    const adminUsername = `admin_${publicId}`;
    const adminEmail = `${adminUsername}@room.local`;
    const defaultPasswordHash = await bcrypt.hash("12345678", 10);

    // Create room with default columns, labels, and dedicated room admin in a single transaction
    const { room: newRoom, adminUser } = await prisma.$transaction(async (tx) => {
      // Create dedicated room admin user
      const createdAdmin = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminUsername,
          passwordHash: defaultPasswordHash,
          mustChangePassword: true,
          role: "USER", // Non-global admin
        },
      });

      const room = await tx.meetingRoom.create({
        data: {
          publicId,
          title,
          subject,
          description: description || null,
          coverColor,
          coverImage: coverImage || null,
          ownerId: createdAdmin.id,
          joinPolicy,
          status: "ACTIVE",
        },
      });

      // Add dedicated admin as ADMIN membership
      await tx.roomMembership.create({
        data: {
          roomId: room.id,
          userId: createdAdmin.id,
          role: ROOM_ROLES.ADMIN,
          status: "ACTIVE",
        },
      });

      // Also add the ChronoMind creator as an admin member so they can manage it from their dashboard
      if (user.id !== createdAdmin.id) {
        await tx.roomMembership.create({
          data: {
            roomId: room.id,
            userId: user.id,
            role: ROOM_ROLES.ADMIN,
            status: "ACTIVE",
          },
        });
      }

      // Create default 4 columns
      for (const col of DEFAULT_COLUMNS) {
        await tx.boardColumn.create({
          data: {
            roomId: room.id,
            name: col.name,
            key: col.key,
            color: col.color,
            sortOrder: col.sortOrder,
            isDefault: col.isDefault,
          },
        });
      }

      // Create default pastel labels
      for (const label of PASTEL_LABELS) {
        await tx.taskLabel.create({
          data: {
            roomId: room.id,
            name: label.name,
            color: label.color,
          },
        });
      }

      return { room, adminUser: createdAdmin };
    });

    // Record audit event
    await recordRoomAudit({
      roomId: newRoom.id,
      actorId: user.id,
      action: "ROOM_CREATED",
      entityType: "ROOM",
      entityId: newRoom.id,
      details: { title, subject, publicId, adminUsername },
    });

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        publicId: newRoom.publicId,
        title: newRoom.title,
        subject: newRoom.subject,
        role: ROOM_ROLES.ADMIN,
      },
      adminCredential: {
        username: adminUsername,
        email: adminEmail,
        tempPassword: "12345678",
      },
    });
  } catch (err: any) {
    console.error("Create room error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo phòng mới" }, { status: 500 });
  }
}

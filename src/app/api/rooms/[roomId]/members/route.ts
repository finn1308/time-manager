import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

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

    const members = await prisma.roomMembership.findMany({
      where: { roomId: auth.room.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            mustChangePassword: true,
          },
        },
        groupMemberships: {
          include: {
            group: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
      orderBy: [
        { role: "asc" }, // ADMIN, HOST, MEMBER
        { joinedAt: "asc" },
      ],
    });

    const result = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name || "Thành viên",
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      mustChangePassword: m.user.mustChangePassword,
      groups: m.groupMemberships.map((gm) => gm.group),
    }));

    return NextResponse.json({ members: result });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List members error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải danh sách thành viên" }, { status: 500 });
  }
}

const addMembersSchema = z.object({
  lines: z.array(z.string()).min(1, "Danh sách không được để trống"),
  defaultRole: z.enum(["MEMBER", "HOST"]).default("MEMBER"),
});

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
    // Only ADMIN can bulk add members
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN]);

    const body = await req.json();
    const parsed = addMembersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { lines, defaultRole } = parsed.data;
    const defaultPasswordHash = await bcrypt.hash("12345678", 10);

    let addedCount = 0;
    let linkedCount = 0;
    let alreadyMemberCount = 0;
    const errors: string[] = [];

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      let email = "";
      let name = "";

      // Format 1: "Tên hiển thị <email@example.com>"
      const matchBracket = rawLine.match(/^(.+?)\s*<([^>]+)>$/);
      if (matchBracket) {
        name = matchBracket[1].trim();
        email = matchBracket[2].trim().toLowerCase();
      } else if (rawLine.includes("|")) {
        // Format 2: "email@example.com | Tên hiển thị" or "Tên hiển thị | email@example.com"
        const parts = rawLine.split("|").map((p) => p.trim());
        if (parts[0].includes("@")) {
          email = parts[0].toLowerCase();
          name = parts[1] || "";
        } else if (parts[1] && parts[1].includes("@")) {
          name = parts[0];
          email = parts[1].toLowerCase();
        } else {
          name = parts[0];
          email = `${parts[0].toLowerCase().replace(/\s+/g, ".")}@chronomind.local`;
        }
      } else if (rawLine.includes("@")) {
        // Format 3: "email@example.com"
        email = rawLine.toLowerCase();
        name = email.split("@")[0];
      } else {
        // Format 4: Just display name "Nguyễn Văn A" -> generate sanitized internal email
        name = rawLine;
        const sanitizedSlug = rawLine
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        email = `${sanitizedSlug || "member"}.${Date.now().toString(36).slice(-4)}@chronomind.local`;
      }

      if (!email) {
        errors.push(`Dòng ${i + 1}: Không tìm thấy định danh hợp lệ (${rawLine})`);
        continue;
      }

      try {
        // Check if user already exists
        let targetUser = await prisma.user.findUnique({
          where: { email },
        });

        let isNewUser = false;
        if (!targetUser) {
          // Create new user with default temporary password "12345678"
          targetUser = await prisma.user.create({
            data: {
              email,
              name: name || email.split("@")[0],
              passwordHash: defaultPasswordHash,
              mustChangePassword: true,
              role: "USER",
            },
          });
          isNewUser = true;
        }

        // Check if already a member of this room
        const existingMembership = await prisma.roomMembership.findUnique({
          where: {
            roomId_userId: {
              roomId: auth.room.id,
              userId: targetUser.id,
            },
          },
        });

        if (existingMembership) {
          if (existingMembership.status === "DEACTIVATED") {
            // Reactivate membership
            await prisma.roomMembership.update({
              where: { id: existingMembership.id },
              data: { status: "ACTIVE", role: defaultRole },
            });
            linkedCount++;
          } else {
            alreadyMemberCount++;
          }
          continue;
        }

        // Create membership
        await prisma.roomMembership.create({
          data: {
            roomId: auth.room.id,
            userId: targetUser.id,
            role: defaultRole,
            status: "ACTIVE",
            invitedBy: user.id,
          },
        });

        if (isNewUser) {
          addedCount++;
        } else {
          linkedCount++;
        }
      } catch (lineErr: any) {
        errors.push(`Dòng ${i + 1}: ${lineErr.message || "Lỗi tạo thành viên"}`);
      }
    }

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "MEMBERS_BULK_ADDED",
      entityType: "MEMBER",
      details: { addedCount, linkedCount, alreadyMemberCount, errorCount: errors.length },
    });

    return NextResponse.json({
      success: true,
      summary: {
        added: addedCount,
        linked: linkedCount,
        alreadyMembers: alreadyMemberCount,
        errors,
      },
    });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền thêm thành viên" }, { status: 403 });
    }
    console.error("Bulk add members error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi thêm thành viên" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { findRoom } from "@/lib/rooms/room-auth";
import { createRoomSession } from "@/lib/rooms/room-session";
import { createSession } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập hoặc email"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await findRoom(roomId);

    if (!room || room.status === "ARCHIVED" || room.status === "LOCKED") {
      return NextResponse.json(
        { error: "Phòng họp không tồn tại hoặc hiện không khả dụng" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const cleanUsername = username.trim().toLowerCase();

    // Look up user by exact email, generated room email, or display name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanUsername },
          { email: `${cleanUsername}@room.local` },
          { email: `${cleanUsername}@chronomind.local` },
          { name: { equals: username.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Verify membership in this specific room
    let membership = await prisma.roomMembership.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: user.id,
        },
      },
    });

    // Auto-heal owner membership as ADMIN if needed
    if (!membership && room.ownerId === user.id) {
      membership = await prisma.roomMembership.create({
        data: {
          roomId: room.id,
          userId: user.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
    }

    if (!membership || membership.status === "DEACTIVATED") {
      return NextResponse.json(
        { error: "Tài khoản của bạn không có quyền truy cập vào phòng họp này" },
        { status: 403 }
      );
    }

    // Set both room session and main user session
    await Promise.all([
      createRoomSession({
        userId: user.id,
        roomId: room.id,
        role: membership.role,
        email: user.email,
        name: user.name,
      }),
      createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (err: any) {
    console.error("Room login error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi đăng nhập phòng" }, { status: 500 });
  }
}

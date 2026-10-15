import { NextResponse } from "next/server";
import { findRoom } from "@/lib/rooms/room-auth";
import { getRoomSession } from "@/lib/rooms/room-session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await findRoom(roomId);

    if (!room || room.status === "ARCHIVED" || room.status === "LOCKED") {
      return NextResponse.json(
        { error: "Phòng họp không tồn tại hoặc đã bị đóng" },
        { status: 404 }
      );
    }

    const session = await getRoomSession(room.id);
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    const membership = await prisma.roomMembership.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.status === "DEACTIVATED") {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: membership.role,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false });
  }
}

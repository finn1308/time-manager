import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth } from "@/lib/rooms/room-auth";

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

    const auditEvents = await prisma.roomAuditEvent.findMany({
      where: { roomId: auth.room.id },
      include: {
        actor: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = auditEvents.map((e) => {
      // Ensure details are sanitized
      const safeDetails = e.details ? JSON.parse(JSON.stringify(e.details)) : null;
      if (safeDetails) {
        delete safeDetails.password;
        delete safeDetails.passwordHash;
        delete safeDetails.token;
        delete safeDetails.secret;
      }

      return {
        id: e.id,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        details: safeDetails,
        createdAt: e.createdAt,
        actor: e.actor || { name: "Hệ thống", email: null, image: null },
      };
    });

    return NextResponse.json({ events: formatted });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Get audit events error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải lịch sử hoạt động" }, { status: 500 });
  }
}

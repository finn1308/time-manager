import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndGenerateNotifications } from "@/lib/notifications/generator";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Trigger auto-scan for new alerts
    await checkAndGenerateNotifications(user.id).catch((err) =>
      console.error("Auto-scan notifications error:", err)
    );

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: error.message || "Lỗi lấy thông báo" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const created = await checkAndGenerateNotifications(user.id);
    return NextResponse.json({ success: true, count: created.length, created });
  } catch (error: any) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo thông báo" }, { status: 500 });
  }
}

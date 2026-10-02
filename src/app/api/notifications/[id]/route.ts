import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const isRead = body.isRead !== undefined ? Boolean(body.isRead) : true;

    const notif = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead },
    });

    return NextResponse.json({ success: true, updated: notif.count > 0 });
  } catch (error: any) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json({ error: error.message || "Lỗi cập nhật thông báo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.notification.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json({ error: error.message || "Lỗi xóa thông báo" }, { status: 500 });
  }
}

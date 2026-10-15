import { NextResponse } from "next/server";
import { findRoom } from "@/lib/rooms/room-auth";
import { destroyRoomSession } from "@/lib/rooms/room-session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await findRoom(roomId);
    if (room) {
      await destroyRoomSession(room.id);
    }
    return NextResponse.json({ success: true, message: "Đã đăng xuất khỏi phòng" });
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi đăng xuất" }, { status: 500 });
  }
}

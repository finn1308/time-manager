import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { commitScheduleEvents } from "@/lib/ai/scheduler";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { events } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Không có sự kiện nào để lưu" }, { status: 400 });
    }

    const created = await commitScheduleEvents(user.id, events);

    return NextResponse.json({ success: true, count: created.length });
  } catch (err: any) {
    console.error("Commit schedule error:", err);
    return NextResponse.json({ error: "Lỗi lưu lịch vào cơ sở dữ liệu" }, { status: 500 });
  }
}

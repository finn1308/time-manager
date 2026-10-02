import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rescheduleTodaySchedule } from "@/lib/scheduling/reschedule-engine";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mode = "SPREAD_WEEK" } = await req.json();
    const result = await rescheduleTodaySchedule(user.id, mode);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Reschedule today error:", err);
    return NextResponse.json({ error: "Lỗi dời lịch hôm nay" }, { status: 500 });
  }
}

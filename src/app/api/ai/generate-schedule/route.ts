import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateAutoSchedule } from "@/lib/ai/scheduler";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { startDate, endDate, subjectIds, customInstructions } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Vui lòng chọn khoảng thời gian cần lập lịch" }, { status: 400 });
    }

    const schedulePlan = await generateAutoSchedule({
      userId: user.id,
      startDate,
      endDate,
      subjectIds,
      customInstructions,
    });

    return NextResponse.json(schedulePlan);
  } catch (err: any) {
    console.error("AI Scheduling Error:", err);
    return NextResponse.json({ error: err.message || "Lỗi khi chạy thuật toán lập lịch AI" }, { status: 500 });
  }
}

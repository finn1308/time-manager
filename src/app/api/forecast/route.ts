import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateProgressForecast } from "@/lib/forecast/progress-forecast";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const forecast = await calculateProgressForecast(user.id);
    return NextResponse.json(forecast);
  } catch (error: any) {
    console.error("GET /api/forecast error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tính toán dự báo tiến độ" }, { status: 500 });
  }
}

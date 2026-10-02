import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserGamificationData } from "@/lib/gamification/engine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const data = await getUserGamificationData(user.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/gamification error:", error);
    return NextResponse.json({ error: error.message || "Lỗi lấy thông tin gamification" }, { status: 500 });
  }
}

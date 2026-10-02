import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyReview } from "@/lib/analytics/weekly-review-generator";
import { getDateKeyVN } from "@/lib/date-utils";

function getCurrentWeekBounds() {
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (day + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekStartDate: getDateKeyVN(monday),
    weekEndDate: getDateKeyVN(sunday),
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { weekStartDate: defStart, weekEndDate: defEnd } = getCurrentWeekBounds();
    const weekStartDate = searchParams.get("weekStartDate") || defStart;

    const review = await prisma.weeklyReview.findUnique({
      where: {
        userId_weekStartDate: {
          userId: user.id,
          weekStartDate,
        },
      },
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error("GET /api/weekly-review error:", error);
    return NextResponse.json({ error: error.message || "Lỗi lấy đánh giá tuần" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { weekStartDate: defStart, weekEndDate: defEnd } = getCurrentWeekBounds();
    const weekStartDate = body.weekStartDate || defStart;
    const weekEndDate = body.weekEndDate || defEnd;

    const review = await generateWeeklyReview(user.id, weekStartDate, weekEndDate);

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error("POST /api/weekly-review error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo đánh giá tuần bằng AI" }, { status: 500 });
  }
}

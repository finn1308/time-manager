import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVNDayOffsets } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Get date keys for past 14 days in VN timezone
    const recentKeys = getVNDayOffsets(-14, 1);

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        habitLogs: {
          where: {
            dateKey: { in: recentKeys },
          },
          select: {
            id: true,
            dateKey: true,
            value: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ habits });
  } catch (error: any) {
    console.error("GET /api/habits error:", error);
    return NextResponse.json({ error: error.message || "Lỗi lấy danh sách thói quen" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      subjectId,
      frequency = "DAILY",
      targetDays = "1,2,3,4,5,6,0",
      targetValue = 1,
      unit = "lần",
      color = "#2d6a4f",
      icon = "Check",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Tiêu đề thói quen không được để trống" }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        subjectId: subjectId || null,
        frequency,
        targetDays,
        targetValue: Number(targetValue) || 1,
        unit,
        color,
        icon,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        habitLogs: true,
      },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/habits error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo thói quen" }, { status: 500 });
  }
}

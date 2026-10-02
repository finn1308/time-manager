import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVNTodayKey, getVNDayOffsets } from "@/lib/date-utils";
import { awardUserXp } from "@/lib/gamification/engine";

export async function POST(
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
    const dateKey = body.dateKey || getVNTodayKey();

    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy thói quen" }, { status: 404 });
    }

    // Check existing log
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_dateKey: {
          habitId: id,
          dateKey,
        },
      },
    });

    let toggledOn = false;
    let xpAwarded = 0;

    if (existingLog) {
      // Toggle OFF: delete log
      await prisma.habitLog.delete({
        where: { id: existingLog.id },
      });
      toggledOn = false;
    } else {
      // Toggle ON: create log & award XP
      await prisma.habitLog.create({
        data: {
          habitId: id,
          dateKey,
          value: 1,
        },
      });
      toggledOn = true;
      xpAwarded = 10;
      await awardUserXp(user.id, xpAwarded, "Hoàn thành thói quen " + habit.title);
    }

    // Recalculate streak for this habit
    const allLogs = await prisma.habitLog.findMany({
      where: { habitId: id },
      select: { dateKey: true },
      orderBy: { dateKey: "desc" },
    });

    const loggedKeySet = new Set(allLogs.map((l) => l.dateKey));
    const today = getVNTodayKey();

    // Check backward consecutive days
    const past30Days = getVNDayOffsets(-30, 1);
    const todayIndex = past30Days.indexOf(today);

    let streak = 0;
    if (todayIndex !== -1) {
      // Start from today or yesterday
      let checkIdx = todayIndex;
      if (!loggedKeySet.has(past30Days[checkIdx])) {
        checkIdx--; // Try yesterday
      }

      while (checkIdx >= 0 && loggedKeySet.has(past30Days[checkIdx])) {
        streak++;
        checkIdx--;
      }
    }

    const longestStreak = Math.max(habit.longestStreak, streak);

    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: {
        streak,
        longestStreak,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
      },
    });

    return NextResponse.json({
      toggled: toggledOn,
      xpAwarded,
      habit: updatedHabit,
    });
  } catch (error: any) {
    console.error("POST /api/habits/[id]/toggle error:", error);
    return NextResponse.json({ error: error.message || "Lỗi thay đổi trạng thái thói quen" }, { status: 500 });
  }
}

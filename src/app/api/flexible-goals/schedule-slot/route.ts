import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";
import { invalidateCalendarServerCache } from "@/app/api/calendar/events/route";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { goalId, startTime, endTime, title } = body;

    if (!goalId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp goalId, startTime và endTime" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(
        { error: "Thời gian bắt đầu và kết thúc không hợp lệ" },
        { status: 400 }
      );
    }

    // 1. Verify goal ownership
    const goal = await prisma.flexibleStudyGoal.findFirst({
      where: { id: goalId, userId: user.id },
      include: { subject: true, skill: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Không tìm thấy mục tiêu linh hoạt" }, { status: 404 });
    }

    // 2. Conflict detection
    const existingEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id, isCancelled: false },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        title: true,
        isLocked: true,
        recurrence: true,
        recurrenceRule: true,
        parentId: true,
        isException: true,
        isCancelled: true,
      },
    });

    const expandedEvents = expandRecurringEvents(existingEvents as any, start, end);
    const existingTimeSlots = expandedEvents.map((e: any) => ({
      start: e.startTime,
      end: e.endTime,
      title: e.title,
      isLocked: e.isLocked,
    }));

    const rules = await prisma.availabilityRule.findMany({
      where: { userId: user.id },
      select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
    });

    const conflict = detectSlotConflict(start, end, existingTimeSlots, rules);
    if (conflict.hasConflict) {
      return NextResponse.json(
        { error: conflict.reason || "Khung giờ này đã bị trùng lịch với sự kiện khác" },
        { status: 400 }
      );
    }

    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

    // 3. Create CalendarEvent linked to the flexible goal
    const event = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: title || goal.title,
        description: goal.description,
        startTime: start,
        endTime: end,
        subjectId: goal.subjectId || null,
        skillId: goal.skillId || null,
        flexibleGoalId: goal.id,
        schedulingMode: "FIXED",
        type: "SELF_STUDY",
        trackStudyTime: true,
        plannedDurationMinutes: durationMinutes,
        completed: false,
      },
      include: {
        subject: true,
        skill: true,
        flexibleGoal: true,
      },
    });

    invalidateCalendarServerCache(user.id);

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Schedule slot error:", err);
    return NextResponse.json(
      { error: "Lỗi xếp mục tiêu vào lịch: " + err.message },
      { status: 500 }
    );
  }
}

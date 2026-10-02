import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";
import { parseISO, subMonths, addMonths } from "date-fns";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const now = new Date();
  const rangeStart = startStr ? parseISO(startStr) : subMonths(now, 2);
  const rangeEnd = endStr ? parseISO(endStr) : addMonths(now, 6);

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: {
      subject: true,
      studySessions: true,
    },
    orderBy: { startTime: "asc" },
  });

  const expanded = expandRecurringEvents(events, rangeStart, rangeEnd);

  return NextResponse.json({ events: expanded });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, subjectId, startTime, endTime, type, isLocked, timezone, recurrence, recurrenceRule, recurrenceEnd } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Tiêu đề sự kiện không được để trống" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Định dạng thời gian không hợp lệ" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    // 1. Fetch existing calendar events for collision check
    const existingEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id },
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

    const timeSlots = expandedEvents.map((e: any) => ({
      start: e.startTime,
      end: e.endTime,
      title: e.title,
      isLocked: e.isLocked,
    }));

    // 2. Fetch availability rules
    const rules = await prisma.availabilityRule.findMany({
      where: { userId: user.id },
      select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
    });

    // 3. Conflict Detection
    const conflictResult = detectSlotConflict(start, end, timeSlots, rules);
    if (conflictResult.hasConflict) {
      return NextResponse.json(
        { error: conflictResult.reason || "Trùng lịch với sự kiện hoặc khung giờ bận khác" },
        { status: 400 }
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        subjectId: subjectId || null,
        startTime: start,
        endTime: end,
        type: type || "STUDY",
        isLocked: !!isLocked,
        timezone: timezone || "Asia/Ho_Chi_Minh",
        isAiGenerated: false,
        recurrence: recurrence || "NONE",
        recurrenceRule: recurrenceRule || null,
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Create calendar event error:", err);
    return NextResponse.json({ error: "Lỗi khi tạo sự kiện lịch" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, title, description, subjectId, startTime, endTime, type, isLocked, recurrence, recurrenceRule, recurrenceEnd, originalId, exceptionDate, updateMode } = await req.json();

    if (!id) return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });

    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    if (start && end && end <= start) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    // Determine the actual record to update
    let targetId = id;
    let isException = false;
    let parentId = null;

    if (originalId && id !== originalId && updateMode === "SINGLE") {
      // It's a generated occurrence, we need to create an exception instead of updating
      const exceptionEvent = await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: title?.trim(),
          description: description !== undefined ? description?.trim() || null : null,
          subjectId: subjectId !== undefined ? subjectId : null,
          startTime: start!,
          endTime: end!,
          type: type || "STUDY",
          isLocked: isLocked !== undefined ? !!isLocked : false,
          timezone: "Asia/Ho_Chi_Minh",
          parentId: originalId,
          exceptionDate: exceptionDate,
          isException: true,
        },
        include: { subject: true }
      });
      return NextResponse.json({ success: true, event: exceptionEvent });
    }

    if (updateMode === "ALL" && originalId) {
       targetId = originalId; // update the master event
    }

    const event = await prisma.calendarEvent.update({
      where: { id: targetId, userId: user.id },
      data: {
        title: title?.trim(),
        description: description !== undefined ? description?.trim() || null : undefined,
        subjectId: subjectId !== undefined ? subjectId : undefined,
        startTime: start,
        endTime: end,
        type: type !== undefined ? type : undefined,
        isLocked: isLocked !== undefined ? !!isLocked : undefined,
        recurrence: recurrence !== undefined ? recurrence : undefined,
        recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : undefined,
        recurrenceEnd: recurrenceEnd !== undefined ? (recurrenceEnd ? new Date(recurrenceEnd) : null) : undefined,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error("Update calendar event error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật sự kiện" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const originalId = searchParams.get("originalId");
  const exceptionDate = searchParams.get("exceptionDate");
  const deleteMode = searchParams.get("deleteMode"); // SINGLE, ALL

  if (!id) return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });

  try {
    if (deleteMode === "SINGLE" && originalId && exceptionDate) {
      // Create a cancellation exception
      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: "Cancelled",
          startTime: new Date(),
          endTime: new Date(),
          parentId: originalId,
          exceptionDate: exceptionDate,
          isException: true,
          isCancelled: true,
        }
      });
    } else {
      // Delete all (or just standard single event)
      const targetId = originalId || id;
      await prisma.calendarEvent.delete({
        where: { id: targetId, userId: user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete calendar event error:", error);
    return NextResponse.json({ error: "Lỗi xóa sự kiện" }, { status: 500 });
  }
}

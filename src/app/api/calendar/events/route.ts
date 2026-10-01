import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: {
      subject: true,
      studySessions: true,
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, subjectId, startTime, endTime, type, isLocked, timezone } = await req.json();

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
      select: { startTime: true, endTime: true, title: true, isLocked: true },
    });

    const timeSlots = existingEvents.map((e) => ({
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
    const { id, title, description, subjectId, startTime, endTime, type, isLocked } = await req.json();

    if (!id) return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });

    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    if (start && end && end <= start) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    // Check collision with other events if time is modified
    if (start && end) {
      const otherEvents = await prisma.calendarEvent.findMany({
        where: { userId: user.id, id: { not: id } },
        select: { startTime: true, endTime: true, title: true, isLocked: true },
      });

      const conflictResult = detectSlotConflict(
        start,
        end,
        otherEvents.map((e) => ({ start: e.startTime, end: e.endTime, title: e.title, isLocked: e.isLocked }))
      );

      if (conflictResult.hasConflict) {
        return NextResponse.json({ error: conflictResult.reason }, { status: 400 });
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id, userId: user.id },
      data: {
        title: title?.trim(),
        description: description !== undefined ? description?.trim() || null : undefined,
        subjectId: subjectId !== undefined ? subjectId : undefined,
        startTime: start,
        endTime: end,
        type: type !== undefined ? type : undefined,
        isLocked: isLocked !== undefined ? !!isLocked : undefined,
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
  if (!id) return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });

  await prisma.calendarEvent.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}

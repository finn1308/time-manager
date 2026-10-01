import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { collidesWithBlockedSlot, isOverlapping } from "@/lib/date-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.scheduleEvent.findMany({
    where: { userId: user.id },
    include: { subject: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, description, subjectId, startTime, endTime, eventType } = await req.json();

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    // 1. Check collision with BlockedSlots
    const blockedSlots = await prisma.blockedSlot.findMany({ where: { userId: user.id } });
    const blockCheck = collidesWithBlockedSlot(start, end, blockedSlots);
    if (blockCheck.conflict) {
      return NextResponse.json({ error: `Không thể tạo: ${blockCheck.reason}` }, { status: 400 });
    }

    // 2. Check collision with existing events
    const existingEvents = await prisma.scheduleEvent.findMany({ where: { userId: user.id } });
    const conflict = existingEvents.some((e) =>
      isOverlapping({ start, end }, { start: e.startTime, end: e.endTime })
    );
    if (conflict) {
      return NextResponse.json({ error: "Khung giờ này đã có một buổi học khác trong lịch" }, { status: 400 });
    }

    const event = await prisma.scheduleEvent.create({
      data: {
        userId: user.id,
        title,
        description,
        subjectId: subjectId || null,
        startTime: start,
        endTime: end,
        eventType: eventType || "STUDY",
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: "Lỗi khi tạo sự kiện" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, title, description, subjectId, startTime, endTime, eventType, isCompleted } = await req.json();

    const start = new Date(startTime);
    const end = new Date(endTime);

    const event = await prisma.scheduleEvent.update({
      where: { id, userId: user.id },
      data: {
        title,
        description,
        subjectId: subjectId || null,
        startTime: start,
        endTime: end,
        eventType,
        isCompleted: isCompleted ?? undefined,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi cập nhật sự kiện" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

  await prisma.scheduleEvent.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}

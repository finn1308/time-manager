import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addDays, parseISO } from "date-fns";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";
import {
  getDateKeyVN,
  makeVNDate,
  formatVN,
  getDayNameVN,
  DAY_PERIODS,
} from "@/lib/date-utils";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { eventId, subjectId, durationMinutes = 90 } = await req.json();

    // 1. Fetch Subject info
    let targetSubject = null;
    let targetTitle = "Buổi học bù";

    if (eventId) {
      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId, userId: user.id },
        include: { subject: true },
      });
      if (event) {
        targetSubject = event.subject;
        targetTitle = event.title;
      }
    } else if (subjectId) {
      targetSubject = await prisma.subject.findUnique({
        where: { id: subjectId, userId: user.id },
      });
      if (targetSubject) {
        targetTitle = `Học bù môn ${targetSubject.name}`;
      }
    }

    // 2. Fetch existing calendar events for the next 7 days in Vietnam timezone
    const todayKey = getDateKeyVN(new Date());
    const todayBase = parseISO(todayKey);
    const rangeStart = makeVNDate(todayKey, "00:00");
    const endKey = getDateKeyVN(addDays(todayBase, 7));
    const rangeEnd = makeVNDate(endKey, "23:59");

    const existingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        isLocked: true,
      },
    });

    // 3. Fetch availability rules
    const availabilityRules = await prisma.availabilityRule.findMany({
      where: { userId: user.id },
    });

    // 4. Candidate search across 4 Buổi (Sáng, Trưa, Chiều, Tối) for open conflict-free slots
    const candidateSlots: Array<{
      start: Date;
      end: Date;
      reason: string;
    }> = [];

    const timeWindows = [
      { time: "19:30", label: "Tối", emoji: "🌙" },
      { time: "14:30", label: "Chiều", emoji: "🌤️" },
      { time: "09:00", label: "Sáng", emoji: "🌅" },
      { time: "12:30", label: "Trưa", emoji: "☀️" },
    ];

    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      if (candidateSlots.length >= 4) break;

      const targetDateKey = getDateKeyVN(addDays(todayBase, dayOffset));

      for (const win of timeWindows) {
        const slotStart = makeVNDate(targetDateKey, win.time);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        const conflict = detectSlotConflict(
          slotStart,
          slotEnd,
          existingEvents.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.startTime,
            end: e.endTime,
            isLocked: e.isLocked,
          })),
          availabilityRules.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            isAvailable: r.isAvailable,
          }))
        );

        if (!conflict.hasConflict) {
          const dayName = getDayNameVN(slotStart);
          candidateSlots.push({
            start: slotStart,
            end: slotEnd,
            reason: `Khung giờ trống vào Buổi ${win.label} (${win.emoji}) ${dayName}, ${formatVN(slotStart, "dd/MM")}, không xung đột với lịch bận.`,
          });
          if (candidateSlots.length >= 4) break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      missedTitle: targetTitle,
      subjectName: targetSubject?.name || "Môn học",
      durationMinutes,
      proposedSlots: candidateSlots.map((s) => ({
        startTime: s.start.toISOString(),
        endTime: s.end.toISOString(),
        formattedTime: `${formatVN(s.start, "HH:mm")} - ${formatVN(s.end, "HH:mm, dd/MM/yyyy")}`,
        reason: s.reason,
      })),
    });
  } catch (err: any) {
    console.error("AI Reschedule Error:", err);
    return NextResponse.json({ error: "Lỗi tìm lịch bù" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addDays, setHours, setMinutes, startOfDay, endOfDay, format } from "date-fns";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";

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

    // 2. Fetch existing calendar events for the next 7 days
    const now = new Date();
    const rangeStart = now;
    const rangeEnd = addDays(now, 7);

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

    // 4. Candidate search for open conflict-free slots
    const candidateSlots: Array<{
      start: Date;
      end: Date;
      reason: string;
    }> = [];

    // Check candidate intervals for each of the next 5 days
    // Candidate slots: Morning (09:00 - 10:30), Afternoon (14:30 - 16:00), Evening (19:30 - 21:00)
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      if (candidateSlots.length >= 3) break;

      const targetDay = addDays(now, dayOffset);
      const dayOfWeek = targetDay.getDay();

      const timeWindows = [
        { startH: 19, startM: 30, label: "Tối" },
        { startH: 14, startM: 30, label: "Chiều" },
        { startH: 9, startM: 0, label: "Sáng" },
      ];

      for (const win of timeWindows) {
        const slotStart = setMinutes(setHours(startOfDay(targetDay), win.startH), win.startM);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        // Check conflicts using deterministic conflict engine
        const conflict = detectSlotConflict(
          slotStart,
          slotEnd,
          existingEvents.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.startTime,
            end: e.endTime,
            isLocked: e.isLocked,
          }))
        );

        if (!conflict.hasConflict) {
          candidateSlots.push({
            start: slotStart,
            end: slotEnd,
            reason: `Khung giờ trống vào ${win.label} ${format(targetDay, "EEEE (dd/MM)")}, không xung đột với bất kỳ lịch nào.`,
          });
          if (candidateSlots.length >= 3) break;
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
        formattedTime: `${format(s.start, "HH:mm")} - ${format(s.end, "HH:mm, dd/MM")}`,
        reason: s.reason,
      })),
    });
  } catch (err: any) {
    console.error("AI Reschedule Error:", err);
    return NextResponse.json({ error: "Lỗi tìm lịch bù" }, { status: 500 });
  }
}

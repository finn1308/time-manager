import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addDays, nextDay, setHours, setMinutes, format } from "date-fns";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Vui lòng nhập câu lệnh tự nhiên" }, { status: 400 });
    }

    // 1. Fetch user's subjects to match
    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
    });

    const lower = text.toLowerCase();

    // 2. Identify Subject
    let matchedSubject = null;
    for (const sub of subjects) {
      if (
        lower.includes(sub.name.toLowerCase()) ||
        (sub.code && lower.includes(sub.code.toLowerCase()))
      ) {
        matchedSubject = sub;
        break;
      }
    }

    // 3. Extract Duration (e.g. 90 phút, 2 tiếng, 1 giờ, 2h)
    let durationMinutes = 60;
    const minuteMatch = lower.match(/(\d+)\s*(phút|mins?|m\b)/);
    const hourMatch = lower.match(/(\d+(\.\d+)?)\s*(tiếng|giờ|h\b)/);

    if (minuteMatch) {
      durationMinutes = parseInt(minuteMatch[1], 10);
    } else if (hourMatch) {
      durationMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    }

    // 4. Extract Target Day
    const now = new Date();
    let targetDate = new Date(now);

    if (lower.includes("ngày mai") || lower.includes("mai")) {
      targetDate = addDays(now, 1);
    } else if (lower.includes("ngày kia")) {
      targetDate = addDays(now, 2);
    } else if (lower.includes("thứ 2") || lower.includes("thứ hai")) {
      targetDate = nextDay(now, 1);
    } else if (lower.includes("thứ 3") || lower.includes("thứ ba")) {
      targetDate = nextDay(now, 2);
    } else if (lower.includes("thứ 4") || lower.includes("thứ tư")) {
      targetDate = nextDay(now, 3);
    } else if (lower.includes("thứ 5") || lower.includes("thứ năm")) {
      targetDate = nextDay(now, 4);
    } else if (lower.includes("thứ 6") || lower.includes("thứ sáu")) {
      targetDate = nextDay(now, 5);
    } else if (lower.includes("thứ 7") || lower.includes("thứ bảy")) {
      targetDate = nextDay(now, 6);
    } else if (lower.includes("chủ nhật") || lower.includes("cn")) {
      targetDate = nextDay(now, 0);
    }

    // 5. Extract Time of Day (e.g. 7 giờ tối, 19:00, 8h sáng, 14h)
    let startHour = 19;
    let startMinute = 0;

    const timeExplicitMatch = lower.match(/(\d{1,2})[:h](\d{2})/);
    const eveningHourMatch = lower.match(/(\d{1,2})\s*(giờ|h)?\s*(tối|chiều|pm)/);
    const morningHourMatch = lower.match(/(\d{1,2})\s*(giờ|h)?\s*(sáng|am)/);
    const generalHourMatch = lower.match(/(\d{1,2})\s*(giờ|h\b)/);

    if (timeExplicitMatch) {
      startHour = parseInt(timeExplicitMatch[1], 10);
      startMinute = parseInt(timeExplicitMatch[2], 10);
    } else if (eveningHourMatch) {
      let h = parseInt(eveningHourMatch[1], 10);
      if (h < 12) h += 12;
      startHour = h;
    } else if (morningHourMatch) {
      startHour = parseInt(morningHourMatch[1], 10);
    } else if (generalHourMatch) {
      let h = parseInt(generalHourMatch[1], 10);
      if (h <= 6) h += 12; // e.g. 7h or 8h
      startHour = h;
    }

    const startTime = setMinutes(setHours(targetDate, startHour), startMinute);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // 6. Check conflicts against database
    const existingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: addDays(startTime, -1),
          lte: addDays(endTime, 1),
        },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        isLocked: true,
      },
    });

    const conflict = detectSlotConflict(
      startTime,
      endTime,
      existingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.startTime,
        end: e.endTime,
        isLocked: e.isLocked,
      }))
    );

    const title = matchedSubject
      ? `Học môn ${matchedSubject.name}`
      : text.length > 40
      ? text.slice(0, 40) + "..."
      : text;

    return NextResponse.json({
      success: true,
      parsed: {
        title,
        subjectId: matchedSubject?.id || null,
        subjectName: matchedSubject?.name || null,
        subjectColor: matchedSubject?.color || "#2d6a4f",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        formattedDate: format(startTime, "EEEE, dd/MM/yyyy"),
        formattedTime: `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`,
        hasConflict: conflict.hasConflict,
        conflictReason: conflict.reason || null,
      },
    });
  } catch (err: any) {
    console.error("Natural Language Parse Error:", err);
    return NextResponse.json({ error: "Lỗi phân tích cú pháp lịch học" }, { status: 500 });
  }
}

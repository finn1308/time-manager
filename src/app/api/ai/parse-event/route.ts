import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  formatVN,
  makeVNDate,
  getDateKeyVN,
  getDayOfWeekVN,
  VIETNAM_TIMEZONE,
} from "@/lib/date-utils";
import { addDays, parseISO } from "date-fns";
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

    // 3. Extract Duration (e.g. 90 phút, 2 tiếng, 1 giờ, 2h, 1h30)
    let durationMinutes = 60;
    const hourMinuteCombo = lower.match(/(\d+)\s*(?:tiếng|giờ|h)\s*(\d+)\s*(?:phút|p|m)?/);
    const minuteMatch = lower.match(/(\d+)\s*(phút|mins?|m\b)/);
    const hourMatch = lower.match(/(\d+(\.\d+)?)\s*(tiếng|giờ|h\b)/);

    if (hourMinuteCombo) {
      durationMinutes = parseInt(hourMinuteCombo[1], 10) * 60 + parseInt(hourMinuteCombo[2], 10);
    } else if (minuteMatch) {
      durationMinutes = parseInt(minuteMatch[1], 10);
    } else if (hourMatch) {
      durationMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    }

    // 4. Extract Target Day in Vietnam Timezone
    // Current date key in VN: "YYYY-MM-DD"
    const todayKeyVN = getDateKeyVN(new Date());
    const todayBase = parseISO(todayKeyVN);
    let targetDayKey = todayKeyVN;

    // Map day strings to JS day of week (0 = Sun, 1 = Mon ... 6 = Sat)
    let requestedDow: number | null = null;
    if (lower.includes("thứ 2") || lower.includes("thứ hai")) requestedDow = 1;
    else if (lower.includes("thứ 3") || lower.includes("thứ ba")) requestedDow = 2;
    else if (lower.includes("thứ 4") || lower.includes("thứ tư")) requestedDow = 3;
    else if (lower.includes("thứ 5") || lower.includes("thứ năm")) requestedDow = 4;
    else if (lower.includes("thứ 6") || lower.includes("thứ sáu")) requestedDow = 5;
    else if (lower.includes("thứ 7") || lower.includes("thứ bảy")) requestedDow = 6;
    else if (lower.includes("chủ nhật") || lower.includes("cn")) requestedDow = 0;

    if (requestedDow !== null) {
      const todayDow = getDayOfWeekVN(new Date());
      let diff = requestedDow - todayDow;
      if (diff <= 0) {
        diff += 7; // Next occurrence of this day of week
      }
      targetDayKey = getDateKeyVN(addDays(todayBase, diff));
    } else if (lower.includes("ngày mai") || lower.includes("hôm sau") || lower.includes("mai")) {
      targetDayKey = getDateKeyVN(addDays(todayBase, 1));
    } else if (lower.includes("ngày kia")) {
      targetDayKey = getDateKeyVN(addDays(todayBase, 2));
    } else if (lower.includes("hôm nay")) {
      targetDayKey = todayKeyVN;
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
      if (h <= 6) h += 12; // e.g. 7h or 8h -> 19h or 20h
      startHour = h;
    }

    const timeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
    const startTime = makeVNDate(targetDayKey, timeStr);
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
        formattedDate: formatVN(startTime, "EEEE, dd/MM/yyyy"),
        formattedTime: `${formatVN(startTime, "HH:mm")} - ${formatVN(endTime, "HH:mm")}`,
        hasConflict: conflict.hasConflict,
        conflictReason: conflict.reason || null,
      },
    });
  } catch (err: any) {
    console.error("Natural Language Parse Error:", err);
    return NextResponse.json({ error: "Lỗi phân tích cú pháp lịch học" }, { status: 500 });
  }
}

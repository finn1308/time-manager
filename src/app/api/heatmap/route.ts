import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { subMonths, startOfYear, startOfDay, endOfDay, format } from "date-fns";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "12m"; // 3m, 6m, 12m, year
  const subjectId = searchParams.get("subjectId"); // optional

  const now = new Date();
  let startDate: Date;

  if (range === "3m") {
    startDate = subMonths(now, 3);
  } else if (range === "6m") {
    startDate = subMonths(now, 6);
  } else if (range === "year") {
    startDate = startOfYear(now);
  } else {
    // 12m default
    startDate = subMonths(now, 12);
  }
  startDate = startOfDay(startDate);
  const endDate = endOfDay(now);

  // 1. Query Study Sessions for exact actual duration
  const sessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      actualStart: {
        gte: startDate,
        lte: endDate,
      },
      ...(subjectId && subjectId !== "all" ? { subjectId } : {}),
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
        },
      },
      calendarEvent: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { actualStart: "asc" },
  });

  // 2. Query Calendar Events for planned time
  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId: user.id,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      type: "STUDY",
      ...(subjectId && subjectId !== "all" ? { subjectId } : {}),
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      subjectId: true,
    },
  });

  // 3. Aggregate by Date (YYYY-MM-DD)
  const dayMap: Record<
    string,
    {
      date: string;
      actualMinutes: number;
      plannedMinutes: number;
      sessionsCount: number;
      subjects: Record<string, { id: string; name: string; color: string; minutes: number }>;
      sessions: Array<{
        id: string;
        title: string;
        subjectName: string;
        subjectColor: string;
        actualMinutes: number;
        startTime: string;
        endTime: string;
        notes: string | null;
      }>;
    }
  > = {};

  // Process planned minutes
  for (const ev of calendarEvents) {
    const dStr = format(ev.startTime, "yyyy-MM-dd");
    const diffMins = Math.max(0, Math.round((ev.endTime.getTime() - ev.startTime.getTime()) / 60000));
    if (!dayMap[dStr]) {
      dayMap[dStr] = {
        date: dStr,
        actualMinutes: 0,
        plannedMinutes: 0,
        sessionsCount: 0,
        subjects: {},
        sessions: [],
      };
    }
    dayMap[dStr].plannedMinutes += diffMins;
  }

  // Process actual sessions
  for (const s of sessions) {
    const dStr = format(s.actualStart, "yyyy-MM-dd");
    const durationMinutes = Math.round(s.actualDurationSeconds / 60);

    if (!dayMap[dStr]) {
      dayMap[dStr] = {
        date: dStr,
        actualMinutes: 0,
        plannedMinutes: 0,
        sessionsCount: 0,
        subjects: {},
        sessions: [],
      };
    }

    dayMap[dStr].actualMinutes += durationMinutes;
    dayMap[dStr].sessionsCount += 1;

    // Subject breakdown
    const sId = s.subjectId || "general";
    if (!dayMap[dStr].subjects[sId]) {
      dayMap[dStr].subjects[sId] = {
        id: s.subject?.id || sId,
        name: s.subject?.name || "Khác",
        color: s.subject?.color || "#2d6a4f",
        minutes: 0,
      };
    }
    dayMap[dStr].subjects[sId].minutes += durationMinutes;

    // Detailed session info
    dayMap[dStr].sessions.push({
      id: s.id,
      title: s.calendarEvent?.title || s.notes || `${s.subject?.name || "Khác"} Session`,
      subjectName: s.subject?.name || "Khác",
      subjectColor: s.subject?.color || "#2d6a4f",
      actualMinutes: durationMinutes,
      startTime: format(s.actualStart, "HH:mm"),
      endTime: format(s.actualEnd, "HH:mm"),
      notes: s.notes,
    });
  }

  // Convert subjects map to array and format response
  const aggregatedDays = Object.values(dayMap).map((d) => ({
    date: d.date,
    actualMinutes: d.actualMinutes,
    plannedMinutes: d.plannedMinutes,
    sessionsCount: d.sessionsCount,
    subjects: Object.values(d.subjects),
    sessions: d.sessions,
    completionPercent:
      d.plannedMinutes > 0
        ? Math.min(100, Math.round((d.actualMinutes / d.plannedMinutes) * 100))
        : d.actualMinutes > 0
        ? 100
        : 0,
  }));

  return NextResponse.json({
    range,
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
    days: aggregatedDays,
  });
}

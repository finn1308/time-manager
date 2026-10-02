import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let prefs = await prisma.userStudyPreferences.findUnique({
    where: { userId: user.id },
  });

  if (!prefs) {
    prefs = await prisma.userStudyPreferences.create({
      data: {
        userId: user.id,
        maxSessionDurationMins: 90,
        breakDurationMins: 15,
        pomodoroDurationMins: 25,
        pomodoroBreakMins: 5,
        preferredStudyHours: "08:00-11:30,14:00-17:30,19:30-22:30",
        unwantedStudyHours: "23:00-06:00,12:00-13:30",
        maxDailyStudyHours: 6.0,
        maxDailySessions: 4,
        restDays: "0",
        timePreference: "BALANCED",
        scheduleFlexibility: "MODERATE",
        minBreakBetweenSessions: 15,
      },
    });
  }

  return NextResponse.json({ preferences: prefs });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const prefs = await prisma.userStudyPreferences.upsert({
      where: { userId: user.id },
      update: {
        ...(body.maxSessionDurationMins !== undefined ? { maxSessionDurationMins: parseInt(body.maxSessionDurationMins, 10) } : {}),
        ...(body.breakDurationMins !== undefined ? { breakDurationMins: parseInt(body.breakDurationMins, 10) } : {}),
        ...(body.pomodoroDurationMins !== undefined ? { pomodoroDurationMins: parseInt(body.pomodoroDurationMins, 10) } : {}),
        ...(body.pomodoroBreakMins !== undefined ? { pomodoroBreakMins: parseInt(body.pomodoroBreakMins, 10) } : {}),
        ...(body.preferredStudyHours !== undefined ? { preferredStudyHours: String(body.preferredStudyHours) } : {}),
        ...(body.unwantedStudyHours !== undefined ? { unwantedStudyHours: String(body.unwantedStudyHours) } : {}),
        ...(body.maxDailyStudyHours !== undefined ? { maxDailyStudyHours: parseFloat(body.maxDailyStudyHours) } : {}),
        ...(body.maxDailySessions !== undefined ? { maxDailySessions: parseInt(body.maxDailySessions, 10) } : {}),
        ...(body.restDays !== undefined ? { restDays: String(body.restDays) } : {}),
        ...(body.timePreference !== undefined ? { timePreference: String(body.timePreference) } : {}),
        ...(body.scheduleFlexibility !== undefined ? { scheduleFlexibility: String(body.scheduleFlexibility) } : {}),
        ...(body.minBreakBetweenSessions !== undefined ? { minBreakBetweenSessions: parseInt(body.minBreakBetweenSessions, 10) } : {}),
      },
      create: {
        userId: user.id,
        maxSessionDurationMins: body.maxSessionDurationMins ? parseInt(body.maxSessionDurationMins, 10) : 90,
        breakDurationMins: body.breakDurationMins ? parseInt(body.breakDurationMins, 10) : 15,
        pomodoroDurationMins: body.pomodoroDurationMins ? parseInt(body.pomodoroDurationMins, 10) : 25,
        pomodoroBreakMins: body.pomodoroBreakMins ? parseInt(body.pomodoroBreakMins, 10) : 5,
        preferredStudyHours: body.preferredStudyHours || "08:00-11:30,14:00-17:30,19:30-22:30",
        unwantedStudyHours: body.unwantedStudyHours || "23:00-06:00,12:00-13:30",
        maxDailyStudyHours: body.maxDailyStudyHours ? parseFloat(body.maxDailyStudyHours) : 6.0,
        maxDailySessions: body.maxDailySessions ? parseInt(body.maxDailySessions, 10) : 4,
        restDays: body.restDays || "0",
        timePreference: body.timePreference || "BALANCED",
        scheduleFlexibility: body.scheduleFlexibility || "MODERATE",
        minBreakBetweenSessions: body.minBreakBetweenSessions ? parseInt(body.minBreakBetweenSessions, 10) : 15,
      },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err: any) {
    console.error("Error updating study preferences:", err);
    return NextResponse.json({ error: "Lỗi cập nhật cấu hình sở thích học tập" }, { status: 500 });
  }
}

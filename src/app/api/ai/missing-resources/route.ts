import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDateKeyVN, formatVN } from "@/lib/date-utils";
import { addDays, subDays } from "date-fns";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (settings && settings.remindMissingResources === false) {
    return NextResponse.json({ reminders: [] });
  }

  // Look for sessions within today and tomorrow
  const now = new Date();
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: user.id,
      startTime: {
        gte: subDays(now, 1),
        lte: addDays(now, 2),
      },
      isCancelled: false,
    },
    include: {
      subject: true,
      resources: true,
    },
    orderBy: { startTime: "asc" },
  });

  const reminders = [];

  for (const ev of events) {
    // Check if event has any resource attached
    if (!ev.resources || ev.resources.length === 0) {
      reminders.push({
        calendarEventId: ev.id,
        title: ev.title,
        subjectName: ev.subject?.name || "Môn học",
        subjectColor: ev.subject?.color || "#2d6a4f",
        dateFormatted: formatVN(ev.startTime, "dd/MM"),
        timeFormatted: `${formatVN(ev.startTime, "HH:mm")} - ${formatVN(ev.endTime, "HH:mm")}`,
        message: `Buổi học "${ev.title}" (${formatVN(ev.startTime, "dd/MM")}) chưa có link phòng học hoặc tài liệu.`,
      });
    }
  }

  return NextResponse.json({ reminders });
}

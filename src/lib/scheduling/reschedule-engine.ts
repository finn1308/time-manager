import { prisma } from "../prisma";
import { makeVNDate, getDateKeyVN, formatVN, getDayNameVN, VIETNAM_TIMEZONE } from "../date-utils";
import { detectSlotConflict, TimeSlot, AvailabilityRuleItem } from "./conflict-detector";
import { addDays, differenceInMinutes, parseISO, isBefore, isAfter } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export interface MissedSessionItem {
  id: string;
  calendarEventId?: string | null;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  title: string;
  plannedStart: Date;
  plannedEnd: Date;
  durationMinutes: number;
}

export interface RecoveryProposal {
  type: "OPTION_A" | "OPTION_B";
  title: string;
  subtitle: string;
  strategy: string;
  totalHours: number;
  sessions: Array<{
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    title: string;
    startTime: string; // ISO
    endTime: string;   // ISO
    durationMinutes: number;
    formattedTime: string;
    reason: string;
  }>;
}

/**
 * Detects missed study sessions (planned sessions in the past that were not completed)
 */
export async function detectMissedSessions(userId: string): Promise<{
  missedSessions: MissedSessionItem[];
  totalMissedMinutes: number;
}> {
  const now = new Date();
  const past7Days = addDays(now, -7);

  // 1. Query StudySessions with status PLANNED whose plannedEnd has passed
  const plannedPastSessions = await prisma.studySession.findMany({
    where: {
      userId,
      status: "PLANNED",
      plannedEnd: { lt: now, gte: past7Days },
    },
    include: {
      subject: true,
      calendarEvent: true,
    },
    orderBy: { plannedStart: "asc" },
  });

  // 2. Query CalendarEvents of type STUDY in the past that have no completed StudySession
  const pastStudyEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
      type: "STUDY",
      endTime: { lt: now, gte: past7Days },
      isCancelled: false,
    },
    include: {
      subject: true,
      studySessions: true,
    },
    orderBy: { startTime: "asc" },
  });

  const missedMap = new Map<string, MissedSessionItem>();

  plannedPastSessions.forEach((s) => {
    const duration = s.plannedDurationSeconds
      ? Math.round(s.plannedDurationSeconds / 60)
      : s.plannedStart && s.plannedEnd
      ? differenceInMinutes(s.plannedEnd, s.plannedStart)
      : 60;

    missedMap.set(s.id, {
      id: s.id,
      calendarEventId: s.calendarEventId,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      subjectColor: s.subject.color,
      title: s.calendarEvent?.title || `Buổi học môn ${s.subject.name}`,
      plannedStart: s.plannedStart || s.actualStart,
      plannedEnd: s.plannedEnd || s.actualEnd,
      durationMinutes: duration,
    });
  });

  pastStudyEvents.forEach((ev) => {
    const hasCompleted = ev.studySessions.some((s) => s.status === "COMPLETED");
    if (!hasCompleted && !missedMap.has(ev.id)) {
      const duration = differenceInMinutes(ev.endTime, ev.startTime);
      missedMap.set(ev.id, {
        id: ev.id,
        calendarEventId: ev.id,
        subjectId: ev.subjectId || "",
        subjectName: ev.subject?.name || "Môn học",
        subjectColor: ev.subject?.color || "#2d6a4f",
        title: ev.title,
        plannedStart: ev.startTime,
        plannedEnd: ev.endTime,
        durationMinutes: duration,
      });
    }
  });

  const missedSessions = Array.from(missedMap.values());
  const totalMissedMinutes = missedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return { missedSessions, totalMissedMinutes };
}

/**
 * Generates Option A (Concentrated Fast Catch-up) and Option B (Gentle Distributed Catch-up)
 */
export async function generateRecoveryProposals(
  userId: string,
  missedSessions: MissedSessionItem[]
): Promise<{
  optionA: RecoveryProposal | null;
  optionB: RecoveryProposal | null;
}> {
  if (missedSessions.length === 0) {
    return { optionA: null, optionB: null };
  }

  const now = new Date();
  const todayKey = getDateKeyVN(now);
  const todayBase = parseISO(todayKey);

  // 1. Fetch existing events in next 7 days
  const rangeStart = makeVNDate(todayKey, "00:00");
  const rangeEnd = makeVNDate(getDateKeyVN(addDays(todayBase, 7)), "23:59");

  const existingEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
      startTime: { gte: rangeStart, lte: rangeEnd },
      isCancelled: false,
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      isLocked: true,
    },
  });

  const availabilityRules = await prisma.availabilityRule.findMany({
    where: { userId },
  });

  const timeSlots: TimeSlot[] = existingEvents.map((e) => ({
    start: e.startTime,
    end: e.endTime,
    title: e.title,
    isLocked: e.isLocked,
  }));

  const ruleItems: AvailabilityRuleItem[] = availabilityRules
    .filter((r) => r.dayOfWeek !== null)
    .map((r) => ({
      dayOfWeek: r.dayOfWeek as number,
      startTime: r.startTime,
      endTime: r.endTime,
      isAvailable: r.isAvailable,
    }));

  const checkSlotSafe = (start: Date, end: Date, localAdded: Array<{ start: Date; end: Date }>): boolean => {
    const conflict = detectSlotConflict(start, end, timeSlots, ruleItems);
    if (conflict.hasConflict) return false;
    // Check against local added in this proposal
    const localConflict = localAdded.some((s) => start < s.end && end > s.start);
    return !localConflict;
  };

  // ==========================================
  // GENERATE OPTION A: Concentrated Fast Catch-up
  // Slots 60 - 90 mins in the next 1 - 3 days
  // ==========================================
  const optionASessions: RecoveryProposal["sessions"] = [];
  const localOptionASlots: Array<{ start: Date; end: Date }> = [];
  const preferredTimesA = ["19:30", "14:30", "09:00", "20:45"];

  for (const item of missedSessions) {
    let placed = false;
    for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
      if (placed) break;
      const targetDateKey = getDateKeyVN(addDays(todayBase, dayOffset));

      for (const timeStr of preferredTimesA) {
        const slotStart = makeVNDate(targetDateKey, timeStr);
        const slotEnd = new Date(slotStart.getTime() + item.durationMinutes * 60000);

        if (checkSlotSafe(slotStart, slotEnd, localOptionASlots)) {
          localOptionASlots.push({ start: slotStart, end: slotEnd });
          const dayName = getDayNameVN(slotStart);

          optionASessions.push({
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            subjectColor: item.subjectColor,
            title: `[Học bù] ${item.title}`,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            durationMinutes: item.durationMinutes,
            formattedTime: `${dayName}, ${formatVN(slotStart, "dd/MM")} (${formatVN(slotStart, "HH:mm")} - ${formatVN(slotEnd, "HH:mm")})`,
            reason: "Học bù tập trung vào khung giờ rảnh sớm nhất trong 3 ngày tới",
          });
          placed = true;
          break;
        }
      }
    }
  }

  // ==========================================
  // GENERATE OPTION B: Gentle Distributed Catch-up
  // Split workload into smaller 30 - 45 min sessions spread across 5 - 7 days
  // ==========================================
  const optionBSessions: RecoveryProposal["sessions"] = [];
  const localOptionBSlots: Array<{ start: Date; end: Date }> = [];
  const preferredTimesB = ["21:15", "16:30", "11:30", "19:00"];

  for (const item of missedSessions) {
    // If session is long (> 60m), split into two smaller sessions
    const chunks = item.durationMinutes > 60
      ? [Math.ceil(item.durationMinutes / 2), Math.floor(item.durationMinutes / 2)]
      : [item.durationMinutes];

    chunks.forEach((chunkMins, chunkIdx) => {
      let placed = false;
      const startDay = chunkIdx === 0 ? 1 : 3;

      for (let dayOffset = startDay; dayOffset <= 7; dayOffset++) {
        if (placed) break;
        const targetDateKey = getDateKeyVN(addDays(todayBase, dayOffset));

        for (const timeStr of preferredTimesB) {
          const slotStart = makeVNDate(targetDateKey, timeStr);
          const slotEnd = new Date(slotStart.getTime() + chunkMins * 60000);

          if (checkSlotSafe(slotStart, slotEnd, localOptionBSlots)) {
            localOptionBSlots.push({ start: slotStart, end: slotEnd });
            const dayName = getDayNameVN(slotStart);

            optionBSessions.push({
              subjectId: item.subjectId,
              subjectName: item.subjectName,
              subjectColor: item.subjectColor,
              title: chunks.length > 1
                ? `[Học bù - Phần ${chunkIdx + 1}/2] ${item.title}`
                : `[Học bù nhẹ] ${item.title}`,
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              durationMinutes: chunkMins,
              formattedTime: `${dayName}, ${formatVN(slotStart, "dd/MM")} (${formatVN(slotStart, "HH:mm")} - ${formatVN(slotEnd, "HH:mm")})`,
              reason: "Chia nhỏ thời lượng học bù trải đều qua nhiều ngày, tránh kiệt sức và quá tải",
            });
            placed = true;
            break;
          }
        }
      }
    });
  }

  const totalMinsA = optionASessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalMinsB = optionBSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const optionA: RecoveryProposal = {
    type: "OPTION_A",
    title: "Phương án A: Học bù tập trung (Fast Catch-up)",
    subtitle: "Dành cho người muốn dứt điểm sớm bài học tồn đọng trong 1 - 3 ngày tới",
    strategy: "Tập trung học bù trong 1-2 buổi trọn vẹn ở khung giờ rảnh sớm nhất",
    totalHours: Math.round((totalMinsA / 60) * 10) / 10,
    sessions: optionASessions,
  };

  const optionB: RecoveryProposal = {
    type: "OPTION_B",
    title: "Phương án B: Phân bổ nhẹ nhàng (Gentle Catch-up)",
    subtitle: "Dành cho người bận rộn, không muốn dồn ép hay thức khuya",
    strategy: "Chia nhỏ bài học thành các phiên 30 - 45 phút rải đều suốt tuần",
    totalHours: Math.round((totalMinsB / 60) * 10) / 10,
    sessions: optionBSessions,
  };

  return { optionA, optionB };
}

/**
 * Reschedules today's remaining sessions when user has an unexpected conflict
 */
export async function rescheduleTodaySchedule(
  userId: string,
  mode: "TOMORROW" | "SPREAD_WEEK" = "SPREAD_WEEK"
): Promise<{
  success: boolean;
  movedEventsCount: number;
  newSlots: any[];
  message: string;
}> {
  const now = new Date();
  const todayKey = getDateKeyVN(now);
  const todayStart = makeVNDate(todayKey, "00:00");
  const todayEnd = makeVNDate(todayKey, "23:59");

  // Fetch today's upcoming/remaining study events
  const todayEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
      startTime: { gte: now, lte: todayEnd },
      type: "STUDY",
      isCancelled: false,
    },
    include: {
      subject: true,
      studySessions: true,
    },
  });

  if (todayEvents.length === 0) {
    return {
      success: true,
      movedEventsCount: 0,
      newSlots: [],
      message: "Hôm nay bạn không còn phiên học nào chưa diễn ra.",
    };
  }

  // Convert today's events to missed items format
  const missedItems: MissedSessionItem[] = todayEvents.map((ev) => ({
    id: ev.id,
    calendarEventId: ev.id,
    subjectId: ev.subjectId || "",
    subjectName: ev.subject?.name || "Môn học",
    subjectColor: ev.subject?.color || "#2d6a4f",
    title: ev.title,
    plannedStart: ev.startTime,
    plannedEnd: ev.endTime,
    durationMinutes: differenceInMinutes(ev.endTime, ev.startTime),
  }));

  const { optionA, optionB } = await generateRecoveryProposals(userId, missedItems);
  const chosenProposal = mode === "TOMORROW" ? optionA : optionB;
  const sessionsToCreate = chosenProposal?.sessions || [];

  // Execute in transaction: cancel today's events, create new future events
  await prisma.$transaction(async (tx) => {
    // 1. Cancel today's remaining events
    for (const ev of todayEvents) {
      await tx.calendarEvent.update({
        where: { id: ev.id },
        data: { isCancelled: true },
      });

      // Update study sessions to CANCELLED
      await tx.studySession.updateMany({
        where: { calendarEventId: ev.id },
        data: { status: "CANCELLED" },
      });
    }

    // 2. Create new rescheduled events
    for (const s of sessionsToCreate) {
      const newCal = await tx.calendarEvent.create({
        data: {
          userId,
          subjectId: s.subjectId || null,
          title: s.title,
          description: s.reason,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          type: "STUDY",
          isAiGenerated: true,
        },
      });

      await tx.studySession.create({
        data: {
          userId,
          subjectId: s.subjectId,
          calendarEventId: newCal.id,
          plannedStart: new Date(s.startTime),
          plannedEnd: new Date(s.endTime),
          actualStart: new Date(s.startTime),
          actualEnd: new Date(s.endTime),
          actualDurationSeconds: 0,
          plannedDurationSeconds: s.durationMinutes * 60,
          status: "PLANNED",
          source: "AI_RESCHEDULE",
        },
      });
    }
  });

  return {
    success: true,
    movedEventsCount: todayEvents.length,
    newSlots: sessionsToCreate,
    message: `Đã dời ${todayEvents.length} phiên học hôm nay thành ${sessionsToCreate.length} buổi học bù mới trong tuần!`,
  };
}

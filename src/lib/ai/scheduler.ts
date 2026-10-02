import { prisma } from "../prisma";
import { executeAIScheduling, ProposedEvent, AISchedulerResponse } from "./client-factory";
import { validateProposedSchedule, TimeSlot, AvailabilityRuleItem } from "../scheduling/conflict-detector";
import { makeVNDate } from "../date-utils";
import { expandRecurringEvents } from "../scheduling/recurrence";

export async function generateAutoSchedule(params: {
  userId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  subjectIds?: string[];
  customInstructions?: string;
}): Promise<AISchedulerResponse & { totalValidHours: number; rejectedSessions?: any[] }> {
  const { userId, startDate, endDate, subjectIds, customInstructions } = params;

  // 1. Fetch subjects and their goals & study sessions
  const subjects = await prisma.subject.findMany({
    where: {
      userId,
      ...(subjectIds && subjectIds.length > 0 ? { id: { in: subjectIds } } : {}),
    },
    include: {
      goals: true,
      studySessions: true,
    },
  });

  const subjectPayload = subjects.map((sub) => {
    const activeGoal = sub.goals.find((g) => g.status === "ACTIVE") || sub.goals[0];
    const targetHours = activeGoal ? activeGoal.targetHours : sub.targetHours || 10.0;
    const totalActualSeconds = sub.studySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
    const loggedHours = Math.round((totalActualSeconds / 3600) * 10) / 10;
    const remainingHours = Math.max(0, targetHours - loggedHours);
    const priority = sub.priority || 3;

    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      targetHours,
      loggedHours,
      remainingHours,
      priority,
    };
  });

  // 2. Fetch Availability Rules
  const availabilityRules = await prisma.availabilityRule.findMany({
    where: { userId },
  });

  // 3. Fetch existing Calendar Events in the target window (strictly Asia/Ho_Chi_Minh)
  const startWindow = makeVNDate(startDate, "00:00");
  const endWindow = makeVNDate(endDate, "23:59");

  const existingCalendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      isLocked: true,
      recurrence: true,
      recurrenceRule: true,
      parentId: true,
      isException: true,
      isCancelled: true,
    },
  });

  const expandedEvents = expandRecurringEvents(existingCalendarEvents, startWindow, endWindow);
  
  // Filter expanded events to only those in the requested window
  const eventsInWindow = expandedEvents.filter((e: any) => e.startTime <= endWindow && e.endTime >= startWindow);

  const timeSlots: TimeSlot[] = eventsInWindow.map((e: any) => ({
    start: e.startTime,
    end: e.endTime,
    title: e.title,
    isLocked: e.isLocked,
  }));

  const ruleItems: AvailabilityRuleItem[] = availabilityRules.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    isAvailable: r.isAvailable,
  }));

  // Fetch AI preferences for break duration
  const aiPref = await prisma.aiPreferences.findUnique({
    where: { userId },
  });
  const minBreakMinutes = aiPref?.preferredBreakDuration || 15;

  // 4. Generate proposed events via AI provider or deterministic engine
  const rawResult = await executeAIScheduling(userId, {
    startDate,
    endDate,
    subjects: subjectPayload,
    blockedSlots: availabilityRules.filter((r) => !r.isAvailable).map((b) => ({
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      dayOfWeek: b.dayOfWeek,
      specificDate: null,
      isLocked: true,
    })),
    existingEvents: eventsInWindow.map((e: any) => ({
      title: e.title,
      startTime: typeof e.startTime === "string" ? new Date(e.startTime).toISOString() : e.startTime.toISOString(),
      endTime: typeof e.endTime === "string" ? new Date(e.endTime).toISOString() : e.endTime.toISOString(),
    })),
    customInstructions,
  });

  // 5. SERVER-SIDE DETERMINISTIC CONFLICT VALIDATION LAYER
  // Strict non-negotiable rule: absolutely no collision with calendar events, locked events, or unavailable times
  const validation = validateProposedSchedule(
    rawResult.proposedEvents.map((pe) => ({
      subjectId: pe.subjectId,
      title: pe.title,
      startTime: pe.startTime,
      endTime: pe.endTime,
      durationMinutes: pe.durationMinutes,
      reason: pe.reasoning,
    })),
    timeSlots,
    ruleItems,
    minBreakMinutes
  );

  const safeEvents: ProposedEvent[] = validation.validSessions.map((vs) => ({
    subjectId: vs.subjectId || "",
    title: vs.title,
    description: `Buổi học được lập lịch tự động bởi AI (${vs.durationMinutes || 90} phút)`,
    startTime: typeof vs.startTime === "string" ? vs.startTime : vs.startTime.toISOString(),
    endTime: typeof vs.endTime === "string" ? vs.endTime : vs.endTime.toISOString(),
    durationMinutes: vs.durationMinutes || 90,
    reasoning: vs.reason || "Phù hợp với mục tiêu môn học và khung giờ rảnh",
  }));

  return {
    proposedEvents: safeEvents,
    summary: `${rawResult.summary} (Xác thực bởi Server: ${safeEvents.length} phiên hợp lệ, ${validation.rejectedSessions.length} phiên bị loại do trùng lịch/nghỉ ngơi).`,
    providerUsed: rawResult.providerUsed,
    totalValidHours: validation.totalValidHours,
    rejectedSessions: validation.rejectedSessions,
  };
}

/**
 * Commits approved proposed events into CalendarEvent in the database
 */
export async function commitScheduleEvents(
  userId: string,
  events: Array<{
    subjectId?: string | null;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
  }>
) {
  const created = await prisma.$transaction(
    events.map((ev) =>
      prisma.calendarEvent.create({
        data: {
          userId,
          subjectId: ev.subjectId || null,
          title: ev.title,
          description: ev.description || null,
          startTime: new Date(ev.startTime),
          endTime: new Date(ev.endTime),
          type: "STUDY",
          isAiGenerated: true,
          isLocked: false,
          timezone: "Asia/Ho_Chi_Minh",
        },
        include: {
          subject: true,
        },
      })
    )
  );

  return created;
}

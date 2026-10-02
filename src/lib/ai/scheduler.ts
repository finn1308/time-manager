import { prisma } from "../prisma";
import { executeAIScheduling, ProposedEvent, AISchedulerResponse } from "./client-factory";
import { validateProposedSchedule, TimeSlot, AvailabilityRuleItem } from "../scheduling/conflict-detector";
import { buildComprehensiveStudyContext } from "./context-builder";

export async function generateAutoSchedule(params: {
  userId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  subjectIds?: string[];
  customInstructions?: string;
}): Promise<AISchedulerResponse & { totalValidHours: number; rejectedSessions?: any[] }> {
  const { userId, startDate, endDate, subjectIds, customInstructions } = params;

  // 1. Build 360-degree comprehensive study context (User Preferences, Subjects, Goals, Tasks, Deadlines, History)
  const context = await buildComprehensiveStudyContext({
    userId,
    startDate,
    endDate,
    subjectIds,
  });

  const timeSlots: TimeSlot[] = context.existingEvents.map((e) => ({
    start: new Date(e.startTime),
    end: new Date(e.endTime),
    title: e.title,
    isLocked: e.isLocked,
  }));

  const ruleItems: AvailabilityRuleItem[] = context.availabilityRules.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    isAvailable: r.isAvailable,
  }));

  const minBreakMinutes = context.preferences.minBreakBetweenSessions || 15;

  // 2. Execute AI scheduling with full enriched context
  const rawResult = await executeAIScheduling(userId, {
    startDate,
    endDate,
    preferences: context.preferences,
    subjects: context.subjects,
    goals: context.goals,
    activeTasks: context.activeTasks,
    historySummary: context.historySummary,
    blockedSlots: context.availabilityRules
      .filter((r) => !r.isAvailable)
      .map((b) => ({
        title: b.title || "Khung giờ khóa",
        startTime: b.startTime,
        endTime: b.endTime,
        dayOfWeek: b.dayOfWeek,
        specificDate: null,
        isLocked: true,
      })),
    existingEvents: context.existingEvents.map((e) => ({
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
    customInstructions,
  });

  // 3. SERVER-SIDE DETERMINISTIC CONFLICT VALIDATION LAYER
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

  const safeEvents: ProposedEvent[] = validation.validSessions.map((vs) => {
    const rawMatch = rawResult.proposedEvents.find(
      (pe) => pe.startTime === vs.startTime || pe.title === vs.title
    );
    return {
      subjectId: vs.subjectId || "",
      taskId: rawMatch?.taskId || null,
      title: vs.title,
      description:
        rawMatch?.description ||
        `Buổi học được lập lịch tự động bởi AI (${vs.durationMinutes || 90} phút)`,
      startTime: typeof vs.startTime === "string" ? vs.startTime : vs.startTime.toISOString(),
      endTime: typeof vs.endTime === "string" ? vs.endTime : vs.endTime.toISOString(),
      durationMinutes: vs.durationMinutes || 90,
      reasoning: vs.reason || "Phù hợp với mục tiêu môn học và khung giờ rảnh",
    };
  });

  return {
    proposedEvents: safeEvents,
    summary: `${rawResult.summary} (Xác thực bởi Server: ${safeEvents.length} phiên hợp lệ, ${validation.rejectedSessions.length} phiên bị loại do trùng lịch/nghỉ ngơi).`,
    providerUsed: rawResult.providerUsed,
    totalValidHours: validation.totalValidHours,
    rejectedSessions: validation.rejectedSessions,
  };
}

/**
 * Commits approved proposed events into CalendarEvent & paired StudySession in the database
 * Uses a safe transactional commit ensuring data consistency and task linkage
 */
export async function commitScheduleEvents(
  userId: string,
  events: Array<{
    subjectId?: string | null;
    taskId?: string | null;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
  }>
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Resolve fallback subject if any event lacks subjectId
    let defaultSubjectId: string | null = null;
    const firstSubject = await tx.subject.findFirst({ where: { userId } });
    if (firstSubject) {
      defaultSubjectId = firstSubject.id;
    } else {
      const fallbackSubject = await tx.subject.create({
        data: {
          userId,
          name: "Chung",
          color: "#2d6a4f",
        },
      });
      defaultSubjectId = fallbackSubject.id;
    }

    const createdEvents = [];

    for (const ev of events) {
      const targetSubjectId = ev.subjectId || defaultSubjectId;
      const start = new Date(ev.startTime);
      const end = new Date(ev.endTime);
      const durationSeconds = Math.max(900, Math.round((end.getTime() - start.getTime()) / 1000));

      // 1. Create CalendarEvent
      const calEvent = await tx.calendarEvent.create({
        data: {
          userId,
          subjectId: targetSubjectId,
          taskId: ev.taskId || null,
          title: ev.title,
          description: ev.description || null,
          startTime: start,
          endTime: end,
          type: "STUDY",
          isAiGenerated: true,
          isLocked: false,
          timezone: "Asia/Ho_Chi_Minh",
        },
        include: {
          subject: true,
        },
      });

      // 2. Create paired StudySession in PLANNED state
      await tx.studySession.create({
        data: {
          userId,
          subjectId: targetSubjectId,
          calendarEventId: calEvent.id,
          taskId: ev.taskId || null,
          plannedStart: start,
          plannedEnd: end,
          actualStart: start,
          actualEnd: end,
          actualDurationSeconds: 0,
          plannedDurationSeconds: durationSeconds,
          status: "PLANNED",
          source: "AI_SCHEDULER",
        },
      });

      // 3. If tied to a task, update task status and schedule range
      if (ev.taskId) {
        await tx.task.update({
          where: { id: ev.taskId },
          data: {
            scheduledStartTime: start,
            scheduledEndTime: end,
            status: "IN_PROGRESS",
          },
        });
      }

      createdEvents.push(calEvent);
    }

    return createdEvents;
  });
}

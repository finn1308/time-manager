import { prisma } from "../prisma";
import { executeAIScheduling, ProposedEvent, AISchedulerResponse } from "./client-factory";
import { collidesWithBlockedSlot, isOverlapping } from "../date-utils";

export async function generateAutoSchedule(params: {
  userId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  subjectIds?: string[];
  customInstructions?: string;
}): Promise<AISchedulerResponse> {
  const { userId, startDate, endDate, subjectIds, customInstructions } = params;

  // 1. Fetch subjects and their study goals
  const subjects = await prisma.subject.findMany({
    where: {
      userId,
      ...(subjectIds && subjectIds.length > 0 ? { id: { in: subjectIds } } : {}),
    },
    include: {
      studyGoals: true,
      studyLogs: true,
    },
  });

  const subjectPayload = subjects.map((sub) => {
    const activeGoal = sub.studyGoals[0];
    const targetHours = activeGoal ? activeGoal.targetHours : 10.0;
    const totalLoggedMinutes = sub.studyLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const loggedHours = Math.round((totalLoggedMinutes / 60) * 10) / 10;
    const remainingHours = Math.max(0, targetHours - loggedHours);
    const priority = activeGoal ? activeGoal.priority : 3;

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

  // 2. Fetch all BlockedSlots (recurring + specific)
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { userId },
  });

  // 3. Fetch existing ScheduleEvents within the window
  const startWindow = new Date(`${startDate}T00:00:00Z`);
  const endWindow = new Date(`${endDate}T23:59:59Z`);

  const existingEvents = await prisma.scheduleEvent.findMany({
    where: {
      userId,
      startTime: { gte: startWindow, lte: endWindow },
    },
    select: {
      title: true,
      startTime: true,
      endTime: true,
    },
  });

  // 4. Run AI or Heuristic Engine
  const rawResult = await executeAIScheduling(userId, {
    startDate,
    endDate,
    subjects: subjectPayload,
    blockedSlots: blockedSlots.map((b) => ({
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      dayOfWeek: b.dayOfWeek,
      specificDate: b.specificDate?.toISOString() || null,
      isLocked: b.isLocked,
    })),
    existingEvents: existingEvents.map((e) => ({
      title: e.title,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
    })),
    customInstructions,
  });

  // 5. Post-validation: filter out any event that strictly collides with a locked slot or existing event
  const safeEvents: ProposedEvent[] = [];

  for (const event of rawResult.proposedEvents) {
    const candStart = new Date(event.startTime);
    const candEnd = new Date(event.endTime);

    // Collision check with blocked slots
    const blockConflict = collidesWithBlockedSlot(candStart, candEnd, blockedSlots);
    if (blockConflict.conflict) {
      console.warn(`[Conflict filter] Removed AI event "${event.title}" because it collided with blocked slot.`);
      continue;
    }

    // Collision check with existing schedules
    const existingConflict = existingEvents.some((ex) =>
      isOverlapping({ start: candStart, end: candEnd }, { start: ex.startTime, end: ex.endTime }, 5)
    );
    if (existingConflict) {
      console.warn(`[Conflict filter] Removed AI event "${event.title}" because it collided with an existing event.`);
      continue;
    }

    // Check with previously accepted events in this loop
    const overlapWithBatch = safeEvents.some((se) =>
      isOverlapping({ start: candStart, end: candEnd }, { start: new Date(se.startTime), end: new Date(se.endTime) }, 5)
    );
    if (overlapWithBatch) {
      continue;
    }

    safeEvents.push(event);
  }

  return {
    proposedEvents: safeEvents,
    summary: rawResult.summary,
    providerUsed: rawResult.providerUsed,
  };
}

/**
 * Commits approved proposed events directly into the database
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
      prisma.scheduleEvent.create({
        data: {
          userId,
          subjectId: ev.subjectId,
          title: ev.title,
          description: ev.description,
          startTime: new Date(ev.startTime),
          endTime: new Date(ev.endTime),
          eventType: "STUDY",
          isAiGenerated: true,
          isCompleted: false,
        },
      })
    )
  );

  return created;
}

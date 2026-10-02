import { areIntervalsOverlapping } from "date-fns";
import {
  getDayOfWeekVN,
  getMinuteOfDayVN,
  isSameDayVN,
  formatVN,
} from "../date-utils";

export interface TimeSlot {
  start: Date;
  end: Date;
  title?: string;
  isLocked?: boolean;
}

export interface AvailabilityRuleItem {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:mm" e.g. "19:00"
  endTime: string;   // "HH:mm" e.g. "22:00"
  isAvailable: boolean; // true = user is free, false = user is busy/sleeping
}

export interface ProposedSession {
  subjectId?: string | null;
  subjectName?: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  durationMinutes?: number;
  reason?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  conflictingSlot?: {
    title: string;
    start: Date;
    end: Date;
    type: "CALENDAR_EVENT" | "LOCKED_SLOT" | "UNAVAILABLE_TIME" | "OVERLAP";
  };
}

/**
 * Deterministic Conflict Detection Layer.
 * Checks whether [proposedStart, proposedEnd) collides with:
 * 1. Invalid duration (start >= end)
 * 2. Existing calendar events (especially locked events)
 * 3. Unavailable / sleeping time windows from AvailabilityRules (in Vietnam timezone)
 */
export function detectSlotConflict(
  proposedStart: Date,
  proposedEnd: Date,
  existingEvents: TimeSlot[],
  availabilityRules: AvailabilityRuleItem[] = []
): ConflictCheckResult {
  // 1. Validate basic interval integrity
  if (proposedStart >= proposedEnd) {
    return {
      hasConflict: true,
      reason: "Thời gian bắt đầu phải trước thời gian kết thúc (duration > 0)",
    };
  }

  // 2. Overlap check with existing calendar events
  for (const event of existingEvents) {
    const isOverlapped = proposedStart < event.end && proposedEnd > event.start;
    if (isOverlapped) {
      return {
        hasConflict: true,
        reason: `Xung đột lịch với "${event.title || 'Sự kiện hiện có'}" (${formatVN(event.start, "HH:mm")} - ${formatVN(event.end, "HH:mm")})`,
        conflictingSlot: {
          title: event.title || "Sự kiện hiện có",
          start: event.start,
          end: event.end,
          type: event.isLocked ? "LOCKED_SLOT" : "CALENDAR_EVENT",
        },
      };
    }
  }

  // 3. Availability Rules check in Vietnam timezone
  // Day of week: 0 (Sun) -> 6 (Sat)
  const dayOfWeek = getDayOfWeekVN(proposedStart);
  const proposedStartMins = getMinuteOfDayVN(proposedStart);
  const proposedEndMins = getMinuteOfDayVN(proposedEnd);

  const rulesForDay = availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek);

  for (const rule of rulesForDay) {
    const [startH, startM] = rule.startTime.split(":").map(Number);
    const [endH, endM] = rule.endTime.split(":").map(Number);
    const ruleStartMins = startH * 60 + startM;
    const ruleEndMins = endH * 60 + endM;

    // If rule specifies busy/sleeping period (isAvailable === false), AI must NOT overlap it
    if (!rule.isAvailable) {
      const isOverlap = proposedStartMins < ruleEndMins && proposedEndMins > ruleStartMins;
      if (isOverlap) {
        return {
          hasConflict: true,
          reason: `Trùng với khung giờ bận/nghỉ ngơi (${rule.startTime} - ${rule.endTime})`,
          conflictingSlot: {
            title: "Khung giờ bận/nghỉ ngơi",
            start: proposedStart,
            end: proposedEnd,
            type: "UNAVAILABLE_TIME",
          },
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Validates a full batch of AI proposed sessions.
 * Returns only valid sessions and a detailed list of rejected/conflicted items.
 */
export function validateProposedSchedule(
  proposedSessions: ProposedSession[],
  existingEvents: TimeSlot[],
  availabilityRules: AvailabilityRuleItem[] = [],
  minBreakMinutes: number = 15
): {
  validSessions: ProposedSession[];
  rejectedSessions: Array<{ session: ProposedSession; reason: string }>;
  totalValidHours: number;
} {
  const validSessions: ProposedSession[] = [];
  const rejectedSessions: Array<{ session: ProposedSession; reason: string }> = [];
  const runningEvents: TimeSlot[] = [...existingEvents];

  for (const session of proposedSessions) {
    const start = typeof session.startTime === "string" ? new Date(session.startTime) : session.startTime;
    const end = typeof session.endTime === "string" ? new Date(session.endTime) : session.endTime;

    // Run deterministic conflict check
    const check = detectSlotConflict(start, end, runningEvents, availabilityRules);
    if (check.hasConflict) {
      rejectedSessions.push({
        session,
        reason: check.reason || "Xung đột lịch trình",
      });
      continue;
    }

    // Buffer break validation if needed
    if (minBreakMinutes > 0 && validSessions.length > 0) {
      const lastSession = validSessions[validSessions.length - 1];
      const lastEnd = new Date(lastSession.endTime);
      const diffMinutes = (start.getTime() - lastEnd.getTime()) / (1000 * 60);

      // If on the same calendar day in VN and diff is between 0 and minBreakMinutes, adjust or flag
      if (isSameDayVN(start, lastEnd) && diffMinutes > 0 && diffMinutes < minBreakMinutes) {
        rejectedSessions.push({
          session,
          reason: `Không đủ thời gian nghỉ (${Math.round(diffMinutes)} phút < ${minBreakMinutes} phút tối thiểu)`,
        });
        continue;
      }
    }

    // Passed validation
    validSessions.push(session);
    runningEvents.push({
      start,
      end,
      title: session.title,
      isLocked: false,
    });
  }

  const totalValidMinutes = validSessions.reduce((acc, s) => {
    const sStart = new Date(s.startTime).getTime();
    const sEnd = new Date(s.endTime).getTime();
    return acc + (sEnd - sStart) / (1000 * 60);
  }, 0);

  return {
    validSessions,
    rejectedSessions,
    totalValidHours: Math.round((totalValidMinutes / 60) * 10) / 10,
  };
}

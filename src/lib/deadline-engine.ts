import { addDays, differenceInDays, format, isBefore, isAfter, startOfDay, endOfDay, setHours, setMinutes } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { VIETNAM_TIMEZONE } from "./date-utils";

export interface DeadlineDistributionRequest {
  title: string;
  deadlineDate: Date | string;
  estimatedMinutes: number;
  subjectId?: string | null;
  taskId?: string | null;
  goalId?: string | null;
  sessionDurationMins?: number;
  bufferDays?: number; // Days before deadline to keep buffer for review/rest (default: 1)
  preferences?: {
    maxSessionDurationMins?: number;
    pomodoroDurationMins?: number;
    preferredStudyHours?: string;
    unwantedStudyHours?: string;
    restDays?: string; // e.g. "0" for Sunday
    timePreference?: string; // MORNING, AFTERNOON, EVENING, BALANCED
  };
  existingEvents?: Array<{
    startTime: Date | string;
    endTime: Date | string;
  }>;
}

export interface DistributedSession {
  sessionNumber: number;
  totalSessions: number;
  title: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  dateFormatted: string;
  dayOfWeek: string;
  periodName: string;
  subjectId?: string | null;
  taskId?: string | null;
  goalId?: string | null;
}

export interface DistributionResult {
  success: boolean;
  totalEstimatedMinutes: number;
  sessionCount: number;
  sessions: DistributedSession[];
  bufferDaysApplied: number;
  warning?: string;
  summary: string;
}

/**
 * Returns urgency categorization for deadlines
 */
export function getDeadlineUrgency(deadline: Date | string): {
  status: "OVERDUE" | "URGENT" | "UPCOMING" | "FUTURE";
  daysRemaining: number;
  badgeLabel: string;
  badgeColor: string;
} {
  const targetDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diffDays = differenceInDays(targetDate, now);

  if (diffDays < 0) {
    return {
      status: "OVERDUE",
      daysRemaining: diffDays,
      badgeLabel: "Đã quá hạn",
      badgeColor: "#b87474", // soft red
    };
  }

  if (diffDays <= 2) {
    return {
      status: "URGENT",
      daysRemaining: diffDays,
      badgeLabel: diffDays === 0 ? "Hạn hôm nay" : `Gấp: còn ${diffDays} ngày`,
      badgeColor: "#d97706", // amber/orange
    };
  }

  if (diffDays <= 7) {
    return {
      status: "UPCOMING",
      daysRemaining: diffDays,
      badgeLabel: `Còn ${diffDays} ngày`,
      badgeColor: "#2d6a4f", // brand green
    };
  }

  return {
    status: "FUTURE",
    daysRemaining: diffDays,
    badgeLabel: `Còn ${diffDays} ngày`,
    badgeColor: "#526b5c", // slate muted
  };
}

/**
 * Parses time string like "19:30" into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

/**
 * Distributes a deadline's workload into evenly spaced study sessions leading up to the deadline
 * Avoids last-minute cramming by scheduling buffer time before the target date.
 */
export function distributeDeadlineToSessions(
  req: DeadlineDistributionRequest
): DistributionResult {
  const deadline = typeof req.deadlineDate === "string" ? new Date(req.deadlineDate) : req.deadlineDate;
  const now = new Date();

  const totalMinutes = Math.max(30, req.estimatedMinutes);
  const maxSessionMins = req.preferences?.maxSessionDurationMins || 90;
  const sessionDuration = Math.min(
    maxSessionMins,
    req.sessionDurationMins || (req.preferences?.pomodoroDurationMins ? req.preferences.pomodoroDurationMins * 2 : 60)
  );

  const totalSessions = Math.max(1, Math.ceil(totalMinutes / sessionDuration));
  const daysUntilDeadline = differenceInDays(deadline, now);

  // Buffer days: ensure we don't pack everything onto the day before deadline
  let buffer = req.bufferDays !== undefined ? req.bufferDays : 1;
  if (daysUntilDeadline <= 1) {
    buffer = 0; // If already due today or tomorrow, no buffer possible
  }

  // Parse rest days from preferences (e.g. "0" for Sunday, "6" for Saturday)
  const restDays = (req.preferences?.restDays || "0")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  // Preferred slots to test per day based on timePreference
  const preferredTimePref = req.preferences?.timePreference || "BALANCED";
  let preferredSlotCandidates: Array<{ name: string; start: string }> = [];

  if (preferredTimePref === "MORNING") {
    preferredSlotCandidates = [
      { name: "Sáng", start: "08:30" },
      { name: "Sáng sớm", start: "07:00" },
      { name: "Tối", start: "19:30" },
      { name: "Chiều", start: "14:30" },
    ];
  } else if (preferredTimePref === "EVENING") {
    preferredSlotCandidates = [
      { name: "Tối", start: "19:30" },
      { name: "Tối muộn", start: "20:30" },
      { name: "Chiều", start: "15:00" },
      { name: "Sáng", start: "09:00" },
    ];
  } else if (preferredTimePref === "AFTERNOON") {
    preferredSlotCandidates = [
      { name: "Chiều", start: "14:30" },
      { name: "Chiều muộn", start: "16:00" },
      { name: "Tối", start: "19:30" },
      { name: "Sáng", start: "09:00" },
    ];
  } else {
    // BALANCED
    preferredSlotCandidates = [
      { name: "Tối", start: "19:30" },
      { name: "Sáng", start: "08:30" },
      { name: "Chiều", start: "14:30" },
    ];
  }

  // Generate available calendar days between tomorrow (or today if urgent) and deadline - buffer
  const startDayOffset = daysUntilDeadline <= 1 ? 0 : 1;
  const lastStudyDayOffset = Math.max(startDayOffset, daysUntilDeadline - buffer);

  const candidateDays: Date[] = [];
  for (let offset = startDayOffset; offset <= lastStudyDayOffset; offset++) {
    const candidateDate = addDays(now, offset);
    const dayOfWeek = candidateDate.getDay();
    // Exclude rest days if we have plenty of days; otherwise include them
    if (daysUntilDeadline > 4 && restDays.includes(dayOfWeek)) {
      continue;
    }
    candidateDays.push(candidateDate);
  }

  // If candidateDays is empty (e.g. all filtered or zero range), fall back to everyday
  if (candidateDays.length === 0) {
    for (let offset = startDayOffset; offset <= Math.max(startDayOffset, daysUntilDeadline); offset++) {
      candidateDays.push(addDays(now, offset));
    }
  }

  // Evenly pick days from candidateDays
  const selectedDays: Date[] = [];
  if (candidateDays.length <= totalSessions) {
    // We need to schedule across all candidate days, and some days may get multiple sessions
    selectedDays.push(...candidateDays);
  } else {
    // Evenly space out across available candidate days
    const step = (candidateDays.length - 1) / Math.max(1, totalSessions - 1);
    for (let i = 0; i < totalSessions; i++) {
      const idx = Math.min(candidateDays.length - 1, Math.round(i * step));
      selectedDays.push(candidateDays[idx]);
    }
  }

  const existing = (req.existingEvents || []).map((e) => ({
    start: new Date(e.startTime).getTime(),
    end: new Date(e.endTime).getTime(),
  }));

  const isOverlapping = (startMs: number, endMs: number): boolean => {
    return existing.some((e) => startMs < e.end && endMs > e.start);
  };

  const sessions: DistributedSession[] = [];
  let currentSession = 1;
  let dayIndex = 0;

  while (currentSession <= totalSessions) {
    const targetDate = selectedDays[dayIndex % selectedDays.length];
    const dateFormatted = formatInTimeZone(targetDate, VIETNAM_TIMEZONE, "dd/MM/yyyy");
    const dayOfWeekVN = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][targetDate.getDay()];

    // Try finding an open slot on this day
    let foundSlot: { start: Date; end: Date; periodName: string } | null = null;

    for (const candidate of preferredSlotCandidates) {
      const { hours, minutes } = parseTime(candidate.start);
      const slotStart = new Date(targetDate);
      slotStart.setHours(hours, minutes, 0, 0);

      const slotEnd = new Date(slotStart.getTime() + sessionDuration * 60 * 1000);

      if (!isOverlapping(slotStart.getTime(), slotEnd.getTime())) {
        foundSlot = { start: slotStart, end: slotEnd, periodName: candidate.name };
        break;
      }
    }

    // If all preferred slots overlapped, fallback to evening 20:00 or 15:00
    if (!foundSlot) {
      const fallbackStart = new Date(targetDate);
      fallbackStart.setHours(20, 0, 0, 0);
      const fallbackEnd = new Date(fallbackStart.getTime() + sessionDuration * 60 * 1000);
      foundSlot = { start: fallbackStart, end: fallbackEnd, periodName: "Tối" };
    }

    sessions.push({
      sessionNumber: currentSession,
      totalSessions,
      title: `[Buổi ${currentSession}/${totalSessions}] ${req.title}`,
      startTime: foundSlot.start,
      endTime: foundSlot.end,
      durationMinutes: sessionDuration,
      dateFormatted,
      dayOfWeek: dayOfWeekVN,
      periodName: foundSlot.periodName,
      subjectId: req.subjectId,
      taskId: req.taskId,
      goalId: req.goalId,
    });

    // Add this new session to local existing list to prevent self-collision
    existing.push({
      start: foundSlot.start.getTime(),
      end: foundSlot.end.getTime(),
    });

    currentSession++;
    dayIndex++;
  }

  // Sort sessions chronologically
  sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const summary = `Đã phân bổ ${totalMinutes} phút học thành ${totalSessions} buổi (${sessionDuration}p/buổi) cách đều từ ${sessions[0]?.dateFormatted} đến ${sessions[sessions.length - 1]?.dateFormatted}, giữ ${buffer} ngày đệm trước deadline.`;

  return {
    success: true,
    totalEstimatedMinutes: totalMinutes,
    sessionCount: totalSessions,
    sessions,
    bufferDaysApplied: buffer,
    summary,
  };
}

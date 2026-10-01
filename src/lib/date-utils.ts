import { format, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Format a Date or ISO string into Vietnam local time
 */
export function formatVN(
  date: Date | string | number,
  formatStr: string = "HH:mm dd/MM/yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  return formatInTimeZone(d, VIETNAM_TIMEZONE, formatStr);
}

/**
 * Get the current Date in Vietnam timezone
 */
export function getNowInVN(): Date {
  return toZonedTime(new Date(), VIETNAM_TIMEZONE);
}

/**
 * Converts a Vietnam local date & time ("YYYY-MM-DD" and "HH:mm") into a UTC Date for database storage
 */
export function parseVNTimeToUTC(dateStr: string, timeStr: string): Date {
  const combined = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(combined, VIETNAM_TIMEZONE);
}

/**
 * Get start and end of week (Monday to Sunday) in Vietnam timezone
 */
export function getWeekDaysInVN(referenceDate: Date = new Date()): Date[] {
  const zoned = toZonedTime(referenceDate, VIETNAM_TIMEZONE);
  const weekStart = startOfWeek(zoned, { weekStartsOn: 1 }); // Monday
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
}

export interface TimeInterval {
  start: Date;
  end: Date;
}

/**
 * Check if two time intervals overlap (strictly or with minimal boundary touch)
 */
export function isOverlapping(
  slotA: TimeInterval,
  slotB: TimeInterval,
  bufferMinutes: number = 0
): boolean {
  const startA = slotA.start.getTime();
  const endA = slotA.end.getTime() + bufferMinutes * 60 * 1000;
  const startB = slotB.start.getTime();
  const endB = slotB.end.getTime() + bufferMinutes * 60 * 1000;

  return startA < endB && endA > startB;
}

/**
 * Converts "HH:mm" on a given target date to a UTC Date
 */
export function timeStringToDateOnDay(date: Date, timeStr: string): Date {
  const dateStr = formatInTimeZone(date, VIETNAM_TIMEZONE, "yyyy-MM-dd");
  return parseVNTimeToUTC(dateStr, timeStr);
}

/**
 * Checks if a candidate study slot collides with any BlockedSlot
 */
export function collidesWithBlockedSlot(
  candidateStart: Date,
  candidateEnd: Date,
  blockedSlots: Array<{
    startTime: string;
    endTime: string;
    dayOfWeek?: number | null;
    specificDate?: Date | string | null;
    isLocked: boolean;
  }>
): { conflict: boolean; reason?: string } {
  const candStartVN = toZonedTime(candidateStart, VIETNAM_TIMEZONE);
  const candDayOfWeek = candStartVN.getDay(); // 0 is Sunday, 1 is Monday...
  const candDateStr = formatInTimeZone(candidateStart, VIETNAM_TIMEZONE, "yyyy-MM-dd");

  for (const slot of blockedSlots) {
    // Check recurring by day of week
    let applies = false;
    if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
      if (slot.dayOfWeek === candDayOfWeek) {
        applies = true;
      }
    } else if (slot.specificDate) {
      const specDate = typeof slot.specificDate === "string" ? parseISO(slot.specificDate) : slot.specificDate;
      const specDateStr = formatInTimeZone(specDate, VIETNAM_TIMEZONE, "yyyy-MM-dd");
      if (specDateStr === candDateStr) {
        applies = true;
      }
    }

    if (applies) {
      const blockStart = timeStringToDateOnDay(candidateStart, slot.startTime);
      let blockEnd = timeStringToDateOnDay(candidateStart, slot.endTime);

      // Handle overnight blocked slots (e.g. 23:30 to 06:30)
      if (blockEnd <= blockStart) {
        // Overnight slot: candidate could fall in night before or night after
        const blockStartNightBefore = addDays(blockStart, -1);
        if (
          isOverlapping({ start: candidateStart, end: candidateEnd }, { start: blockStartNightBefore, end: blockEnd })
        ) {
          return { conflict: true, reason: `Trùng khung giờ bận cố định: ${slot.startTime} - ${slot.endTime}` };
        }
        blockEnd = addDays(blockEnd, 1);
      }

      if (
        isOverlapping(
          { start: candidateStart, end: candidateEnd },
          { start: blockStart, end: blockEnd }
        )
      ) {
        return { conflict: true, reason: `Trùng khung giờ bận cố định: ${slot.startTime} - ${slot.endTime}` };
      }
    }
  }

  return { conflict: false };
}

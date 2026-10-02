import { format, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * 4 Buổi trong ngày theo múi giờ Asia/Ho_Chi_Minh
 * Cấu hình tập trung toàn hệ thống:
 * - Sáng: 05:00 – 11:59
 * - Trưa: 12:00 – 13:59
 * - Chiều: 14:00 – 17:59
 * - Tối: 18:00 – 23:59
 */
export type PeriodKey = "morning" | "noon" | "afternoon" | "evening";

export interface DayPeriodConfig {
  key: PeriodKey;
  label: string;
  emoji: string;
  nominalRange: string;
  startMinutes: number; // minutes from 00:00
  endMinutes: number;   // minutes from 00:00 (exclusive boundary)
  defaultStart: string; // HH:mm
  defaultEnd: string;   // HH:mm
}

export const DAY_PERIODS: DayPeriodConfig[] = [
  {
    key: "morning",
    label: "Sáng",
    emoji: "🌅",
    nominalRange: "05:00 – 11:59",
    startMinutes: 0, // early morning included so no minute is lost
    endMinutes: 12 * 60, // 12:00
    defaultStart: "08:00",
    defaultEnd: "09:30",
  },
  {
    key: "noon",
    label: "Trưa",
    emoji: "☀️",
    nominalRange: "12:00 – 13:59",
    startMinutes: 12 * 60, // 12:00
    endMinutes: 14 * 60, // 14:00
    defaultStart: "12:30",
    defaultEnd: "13:30",
  },
  {
    key: "afternoon",
    label: "Chiều",
    emoji: "🌤️",
    nominalRange: "14:00 – 17:59",
    startMinutes: 14 * 60, // 14:00
    endMinutes: 18 * 60, // 18:00
    defaultStart: "14:30",
    defaultEnd: "16:00",
  },
  {
    key: "evening",
    label: "Tối",
    emoji: "🌙",
    nominalRange: "18:00 – 23:59",
    startMinutes: 18 * 60, // 18:00
    endMinutes: 24 * 60, // 24:00
    defaultStart: "19:30",
    defaultEnd: "21:00",
  },
];

export const VIETNAM_DAY_NAMES = [
  "Chủ Nhật", // 0
  "Thứ Hai",  // 1
  "Thứ Ba",   // 2
  "Thứ Tư",   // 3
  "Thứ Năm",  // 4
  "Thứ Sáu",  // 5
  "Thứ Bảy",  // 6
];

/**
 * Format a Date or ISO string into Vietnam local time
 */
export function formatVN(
  date: Date | string | number,
  formatStr: string = "HH:mm dd/MM/yyyy"
): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return "";
  return formatInTimeZone(d, VIETNAM_TIMEZONE, formatStr);
}

/**
 * Get the current Date in Vietnam timezone
 */
export function getNowInVN(): Date {
  return toZonedTime(new Date(), VIETNAM_TIMEZONE);
}

/**
 * Get date string formatted as "YYYY-MM-DD" strictly in Vietnam timezone.
 * Immune to browser / server local timezone shifts.
 */
export function getDateKeyVN(date: Date | string | number = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return "";
  return formatInTimeZone(d, VIETNAM_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Checks if two dates/timestamps fall on the exact same calendar day in Vietnam
 */
export function isSameDayVN(
  a: Date | string | number,
  b: Date | string | number
): boolean {
  return getDateKeyVN(a) === getDateKeyVN(b);
}

/**
 * Get day of week in Vietnam timezone (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeekVN(date: Date | string | number): number {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const dayStr = formatInTimeZone(d, VIETNAM_TIMEZONE, "i"); // 1 (Mon) to 7 (Sun)
  const iso = parseInt(dayStr, 10);
  return iso === 7 ? 0 : iso;
}

/**
 * Get day name in Vietnamese for a date (e.g. "Thứ Sáu", "Thứ Bảy")
 */
export function getDayNameVN(dateOrDayOfWeek: Date | string | number): string {
  if (typeof dateOrDayOfWeek === "number" && dateOrDayOfWeek >= 0 && dateOrDayOfWeek <= 6) {
    return VIETNAM_DAY_NAMES[dateOrDayOfWeek];
  }
  const dow = getDayOfWeekVN(dateOrDayOfWeek);
  return VIETNAM_DAY_NAMES[dow] || "";
}

/**
 * Converts a Vietnam local date & time ("YYYY-MM-DD" and "HH:mm") into a UTC Date for database storage
 */
export function parseVNTimeToUTC(dateStr: string, timeStr: string): Date {
  const combined = `${dateStr}T${timeStr.length === 5 ? timeStr + ":00" : timeStr}`;
  return fromZonedTime(combined, VIETNAM_TIMEZONE);
}

/**
 * Synonym helper for constructing UTC Date from Vietnam date & time
 */
export function makeVNDate(dateStr: string, timeStr: string): Date {
  return parseVNTimeToUTC(dateStr, timeStr);
}

/**
 * Get start and end of week (Monday to Sunday) in Vietnam timezone
 * Returns 7 dates (Mon -> Sun) with exact Vietnam local calendar alignment
 */
export function getWeekDaysInVN(referenceDate: Date | string = new Date()): Date[] {
  const refDateKey = getDateKeyVN(referenceDate);
  const refDateUTC = fromZonedTime(`${refDateKey}T12:00:00`, VIETNAM_TIMEZONE);
  const zoned = toZonedTime(refDateUTC, VIETNAM_TIMEZONE);
  const weekStart = startOfWeek(zoned, { weekStartsOn: 1 }); // Monday
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
}

/**
 * Detailed 7 week days metadata for calendar rendering
 */
export function getWeekDaysDetailedVN(referenceDate: Date | string = new Date()) {
  const days = getWeekDaysInVN(referenceDate);
  const todayKey = getDateKeyVN(new Date());

  return days.map((d, index) => {
    const dateKey = getDateKeyVN(d);
    const dayOfWeek = getDayOfWeekVN(d);
    return {
      date: d,
      dateKey,
      dayIndex: index,
      dayOfWeek,
      dayName: VIETNAM_DAY_NAMES[dayOfWeek],
      shortName: formatVN(d, "EEE"),
      dayOfMonth: formatVN(d, "d"),
      monthStr: formatVN(d, "MM"),
      fullFormatted: formatVN(d, "dd/MM/yyyy"),
      isToday: dateKey === todayKey,
    };
  });
}

/**
 * Get UTC range for a given date in Vietnam timezone
 */
export function getDayRangeVN(date: Date | string): { startUTC: Date; endUTC: Date; dateKey: string } {
  const dateKey = typeof date === "string" && date.length === 10 ? date : getDateKeyVN(date);
  const startUTC = fromZonedTime(`${dateKey}T00:00:00`, VIETNAM_TIMEZONE);
  const endUTC = fromZonedTime(`${dateKey}T23:59:59.999`, VIETNAM_TIMEZONE);
  return { startUTC, endUTC, dateKey };
}

/**
 * Get minute of day from 00:00 in Vietnam timezone
 */
export function getMinuteOfDayVN(date: Date | string | number): number {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const h = parseInt(formatInTimeZone(d, VIETNAM_TIMEZONE, "H"), 10);
  const m = parseInt(formatInTimeZone(d, VIETNAM_TIMEZONE, "m"), 10);
  return h * 60 + m;
}

/**
 * Determine which period an event starts in (morning, noon, afternoon, evening)
 */
export function getEventPrimaryPeriod(startTime: Date | string): PeriodKey {
  const minute = getMinuteOfDayVN(startTime);
  if (minute < 12 * 60) return "morning";
  if (minute < 14 * 60) return "noon";
  if (minute < 18 * 60) return "afternoon";
  return "evening";
}

/**
 * Calculate exact minute allocation across the 4 periods for an event.
 * Handles split sessions (e.g. 11:30 - 12:30 -> 30m Sáng, 30m Trưa)
 * Without dropping or duplicating a single minute.
 */
export function calculateEventPeriodAllocation(
  startTime: Date | string,
  endTime: Date | string
): {
  totalMinutes: number;
  primaryPeriod: PeriodKey;
  periods: Record<PeriodKey, number>;
  crossesPeriods: boolean;
  breakdownSummary: string;
} {
  const startD = typeof startTime === "string" ? new Date(startTime) : startTime;
  const endD = typeof endTime === "string" ? new Date(endTime) : endTime;

  const totalMinutes = Math.max(0, Math.round((endD.getTime() - startD.getTime()) / 60000));
  const startM = getMinuteOfDayVN(startD);
  const endM = startM + totalMinutes;

  const periods: Record<PeriodKey, number> = {
    morning: 0,
    noon: 0,
    afternoon: 0,
    evening: 0,
  };

  for (const p of DAY_PERIODS) {
    const overlapStart = Math.max(startM, p.startMinutes);
    const overlapEnd = Math.min(endM, p.endMinutes);
    if (overlapEnd > overlapStart) {
      periods[p.key] = overlapEnd - overlapStart;
    }
  }

  const primaryPeriod = getEventPrimaryPeriod(startD);
  const activePeriods = Object.entries(periods).filter(([_, mins]) => mins > 0);
  const crossesPeriods = activePeriods.length > 1;

  const breakdownSummary = activePeriods
    .map(([key, mins]) => {
      const cfg = DAY_PERIODS.find((p) => p.key === key);
      return `${mins}p ${cfg?.label || key}`;
    })
    .join(" + ");

  return {
    totalMinutes,
    primaryPeriod,
    periods,
    crossesPeriods,
    breakdownSummary,
  };
}

/**
 * Format minutes into friendly Vietnamese string (e.g. 90 -> "1h30", 45 -> "45m")
 */
export function formatMinutesVN(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hrs > 0 && mins > 0) return `${hrs}h${mins < 10 ? "0" : ""}${mins}`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Format hours into friendly Vietnamese string (e.g. 2.5 -> "2h30", 0.75 -> "45m")
 */
export function formatHoursVN(hours: number): string {
  return formatMinutesVN(Math.round(hours * 60));
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
 * Converts "HH:mm" on a given target date to a UTC Date in Vietnam timezone
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
  const candDayOfWeek = getDayOfWeekVN(candidateStart);
  const candDateStr = getDateKeyVN(candidateStart);

  for (const slot of blockedSlots) {
    // Check recurring by day of week
    let applies = false;
    if (slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
      if (slot.dayOfWeek === candDayOfWeek) {
        applies = true;
      }
    } else if (slot.specificDate) {
      const specDate = typeof slot.specificDate === "string" ? parseISO(slot.specificDate) : slot.specificDate;
      const specDateStr = getDateKeyVN(specDate);
      if (specDateStr === candDateStr) {
        applies = true;
      }
    }

    if (applies) {
      const blockStart = timeStringToDateOnDay(candidateStart, slot.startTime);
      let blockEnd = timeStringToDateOnDay(candidateStart, slot.endTime);

      // Handle overnight blocked slots (e.g. 23:30 to 06:30)
      if (blockEnd <= blockStart) {
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

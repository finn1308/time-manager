import { RRule, rrulestr } from "rrule";
import { formatVN, getDateKeyVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addMilliseconds } from "date-fns";

export interface ExpandedEvent {
  id: string; // generated id like `parentId_dateKey`
  originalId: string;
  userId: string;
  subjectId: string | null;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
  type: string;
  isLocked: boolean;
  isAiGenerated: boolean;
  recurrence: string;
  parentId: string | null;
  isException: boolean;
  isCancelled: boolean;
  subject?: any;
}

/**
 * Expand recurring events within a given range.
 */
export function expandRecurringEvents(
  events: any[],
  rangeStart: Date,
  rangeEnd: Date
): ExpandedEvent[] {
  const expanded: ExpandedEvent[] = [];

  // Separate master events and exceptions
  const masterEvents = events.filter((e) => !e.parentId && !e.isException);
  const exceptions = events.filter((e) => e.parentId || e.isException);

  for (const master of masterEvents) {
    if (master.isCancelled) continue;

    const effectiveRule =
      master.recurrenceRule ||
      (master.recurrence && master.recurrence !== "NONE" ? `FREQ=${master.recurrence}` : null);

    if (!effectiveRule) {
      // Single event
      expanded.push({
        ...master,
        originalId: master.id,
      });
      continue;
    }

    try {
      // Parse RRULE
      // Note: RRule deals with dates blindly. We treat the Date as local time in Vietnam.
      const startZoned = toZonedTime(master.startTime, VIETNAM_TIMEZONE);
      
      const rruleObj = rrulestr(effectiveRule, {
        dtstart: new Date(Date.UTC(
          startZoned.getFullYear(),
          startZoned.getMonth(),
          startZoned.getDate(),
          startZoned.getHours(),
          startZoned.getMinutes(),
          startZoned.getSeconds()
        )),
      });

      const rangeStartZoned = toZonedTime(rangeStart, VIETNAM_TIMEZONE);
      const rangeEndZoned = toZonedTime(rangeEnd, VIETNAM_TIMEZONE);

      const utcRangeStart = new Date(Date.UTC(
        rangeStartZoned.getFullYear(),
        rangeStartZoned.getMonth(),
        rangeStartZoned.getDate(),
        0, 0, 0
      ));
      
      const utcRangeEnd = new Date(Date.UTC(
        rangeEndZoned.getFullYear(),
        rangeEndZoned.getMonth(),
        rangeEndZoned.getDate(),
        23, 59, 59
      ));

      // Get occurrences
      const occurrences = rruleObj.between(utcRangeStart, utcRangeEnd, true);
      
      const duration = master.endTime.getTime() - master.startTime.getTime();

      for (const occ of occurrences) {
        // occ is a Date in UTC that represents local Vietnam time
        // Convert it back to real UTC Date
        const occVNString = `${occ.getUTCFullYear()}-${String(occ.getUTCMonth()+1).padStart(2, '0')}-${String(occ.getUTCDate()).padStart(2, '0')}T${String(occ.getUTCHours()).padStart(2, '0')}:${String(occ.getUTCMinutes()).padStart(2, '0')}:00`;
        const realStartUTC = fromZonedTime(occVNString, VIETNAM_TIMEZONE);
        const realEndUTC = addMilliseconds(realStartUTC, duration);
        const occDateKey = getDateKeyVN(realStartUTC);

        // Check if there's an exception for this date
        const exception = exceptions.find(
          (e) => e.parentId === master.id && e.exceptionDate === occDateKey
        );

        if (exception) {
          if (!exception.isCancelled) {
            expanded.push({
              ...exception,
              id: exception.id,
              originalId: exception.id,
            });
          }
          continue;
        }

        // Add instance
        expanded.push({
          ...master,
          id: `${master.id}_${occDateKey}`, // dynamic ID
          originalId: master.id,
          startTime: realStartUTC,
          endTime: realEndUTC,
        });
      }
    } catch (err) {
      console.error("Error expanding event", master.id, err);
      // Fallback: just return the master
      expanded.push({
        ...master,
        originalId: master.id,
      });
    }
  }

  // Include standalone exceptions if not matched
  for (const ex of exceptions) {
    if (!ex.isCancelled && !expanded.some(e => e.originalId === ex.id)) {
      expanded.push({
        ...ex,
        id: ex.id,
        originalId: ex.id,
      });
    }
  }

  // Sort by start time
  return expanded.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

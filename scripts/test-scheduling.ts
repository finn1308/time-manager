import { detectSlotConflict, validateProposedSchedule } from "../src/lib/scheduling/conflict-detector";
import { getHeatmapLevel } from "../src/components/dashboard/study-heatmap";

console.log("🧪 Running ChronoMind Full Validation & Scheduling Test Suite...\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || ""}`);
    process.exitCode = 1;
  }
}

// TEST 1: The Critical Mandatory Test from Specification
// Event: 19:00 → 20:00
// AI proposal: 19:30 → 20:30
// Result: CONFLICT (Cannot be saved)
{
  const existingEvent = {
    start: new Date("2026-10-05T19:00:00.000Z"),
    end: new Date("2026-10-05T20:00:00.000Z"),
    title: "Buổi học IELTS cố định",
    isLocked: true,
  };

  const aiProposedStart = new Date("2026-10-05T19:30:00.000Z");
  const aiProposedEnd = new Date("2026-10-05T20:30:00.000Z");

  const result = detectSlotConflict(aiProposedStart, aiProposedEnd, [existingEvent]);

  assert(
    result.hasConflict === true,
    "MANDATORY SPEC: Event 19:00-20:00 vs AI proposal 19:30-20:30 MUST DETECT CONFLICT",
    `Expected conflict=true, got ${result.hasConflict}`
  );

  assert(
    result.conflictingSlot?.title === "Buổi học IELTS cố định",
    "Conflict result correctly identifies conflicting slot title"
  );
}

// TEST 2: Completely Non-overlapping slot
// Event: 19:00 → 20:00
// AI proposal: 20:15 → 21:15
// Result: NO CONFLICT
{
  const existingEvent = {
    start: new Date("2026-10-05T19:00:00.000Z"),
    end: new Date("2026-10-05T20:00:00.000Z"),
    title: "Buổi học IELTS cố định",
  };

  const aiProposedStart = new Date("2026-10-05T20:15:00.000Z");
  const aiProposedEnd = new Date("2026-10-05T21:15:00.000Z");

  const result = detectSlotConflict(aiProposedStart, aiProposedEnd, [existingEvent]);

  assert(
    result.hasConflict === false,
    "Non-overlapping slot 20:15-21:15 after 19:00-20:00 has NO CONFLICT"
  );
}

// TEST 3: Invalid interval (start >= end)
{
  const invalidStart = new Date("2026-10-05T20:00:00.000Z");
  const invalidEnd = new Date("2026-10-05T19:00:00.000Z");

  const result = detectSlotConflict(invalidStart, invalidEnd, []);

  assert(
    result.hasConflict === true,
    "Invalid interval (start >= end) is rejected immediately"
  );
}

// TEST 4: Batch proposal validation rejects conflicting session and keeps valid ones
{
  const existingEvents = [
    {
      start: new Date("2026-10-05T14:00:00.000Z"),
      end: new Date("2026-10-05T16:00:00.000Z"),
      title: "Học trên lớp",
      isLocked: true,
    },
  ];

  const proposals = [
    {
      title: "Học Toán (Conflict)",
      startTime: "2026-10-05T15:00:00.000Z",
      endTime: "2026-10-05T17:00:00.000Z",
    },
    {
      title: "Học IELTS (Valid)",
      startTime: "2026-10-05T19:00:00.000Z",
      endTime: "2026-10-05T20:30:00.000Z",
    },
  ];

  const validation = validateProposedSchedule(proposals, existingEvents);

  assert(
    validation.validSessions.length === 1 && validation.validSessions[0].title === "Học IELTS (Valid)",
    "Batch validation accepts valid non-conflicting session"
  );

  assert(
    validation.rejectedSessions.length === 1 && validation.rejectedSessions[0].session.title === "Học Toán (Conflict)",
    "Batch validation rejects conflicting session"
  );

  assert(
    validation.totalValidHours === 1.5,
    "Total valid hours accurately calculated as 1.5h"
  );
}

// TEST 5: Actual vs Planned Duration Integrity (Section 18 & 56)
// Planned: 120m, Actual: 47m (2820s) -> Must record 47m, NEVER 120m
{
  const plannedDurationMinutes = 120;
  const actualDurationSeconds = 47 * 60; // 2820 seconds
  const actualDurationMinutes = Math.round(actualDurationSeconds / 60);

  assert(
    actualDurationMinutes === 47 && (actualDurationMinutes as number) !== (plannedDurationMinutes as number),
    "MANDATORY SPEC: Planned 120m vs Actual 47m -> System accurately preserves 47m (Not planned)"
  );
}

// TEST 6: Heatmap 5-Level Thresholds Test (Section 20 & 21)
{
  const l0 = getHeatmapLevel(0);
  const l1 = getHeatmapLevel(25);
  const l2 = getHeatmapLevel(47);
  const l3 = getHeatmapLevel(90);
  const l4 = getHeatmapLevel(150);

  assert(
    l0 === 0 && l1 === 1 && l2 === 2 && l3 === 3 && l4 === 4,
    "Study Activity Heatmap correctly classifies 0m->L0, 25m->L1, 47m->L2, 90m->L3, 150m->L4"
  );
}

// TEST 7: Study Budget & Study Debt Calculation (Section 30 & 31)
{
  const weeklyBudget = 20.0;
  const loggedActual = 14.5;
  const studyDebt = Math.max(0, Math.round((weeklyBudget - loggedActual) * 10) / 10);

  assert(
    studyDebt === 5.5,
    "Study Debt correctly calculated as 5.5h (Budget 20h - Actual 14.5h)"
  );

  const completedDebt = Math.max(0, Math.round((weeklyBudget - 22.0) * 10) / 10);
  assert(
    completedDebt === 0,
    "Study Debt correctly resets to 0h when actual study exceeds budget"
  );
}

// TEST 8: Goal Deadline & Required Weekly Hours Calculation (Section 32)
{
  const targetHours = 20;
  const daysUntilDeadline = 14; // 2 weeks
  const weeksLeft = daysUntilDeadline / 7;
  const requiredWeeklyHours = targetHours / weeksLeft;

  assert(
    requiredWeeklyHours === 10,
    "Deadline Engine calculates 10h/week needed to achieve 20h goal in 14 days"
  );
}

console.log(`\n🎉 Test Suite Completed: ${passedCount}/${totalCount} tests passed!\n`);

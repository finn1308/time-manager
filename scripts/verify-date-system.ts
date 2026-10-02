import {
  getDateKeyVN,
  getDayOfWeekVN,
  getDayNameVN,
  formatTimeVN,
  formatDateVN,
  makeVNDate,
  calculateEventPeriodAllocation,
  getWeekDaysDetailedVN,
  DAY_PERIODS,
} from "../src/lib/date-utils";
import { expandRecurringEvents } from "../src/lib/scheduling/recurrence";
import { validateProposedSchedule } from "../src/lib/scheduling/conflict-detector";

console.log("=================================================");
console.log("  TIME MANAGER: DATE & TIMEZONE VERIFICATION TEST");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   Details: ${detail}`);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: FRIDAY DATE PRESERVATION ACROSS ALL HOURS (Edge cases 00:05, 12:00, 19:00, 23:45)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 1: Friday Event Preservation (Root cause verification) ---");

const testTimes = ["00:05", "06:30", "11:30", "12:00", "19:00", "23:45", "23:59"];
const targetFriday = "2026-10-02"; // Known Friday

for (const timeStr of testTimes) {
  const vnDate = makeVNDate(targetFriday, timeStr);
  const key = getDateKeyVN(vnDate);
  const dow = getDayOfWeekVN(vnDate);
  const dayName = getDayNameVN(vnDate);
  const formattedTime = formatTimeVN(vnDate);

  assert(
    key === targetFriday,
    `Date key preserved for ${targetFriday} ${timeStr}`,
    `Expected ${targetFriday}, got ${key}`
  );
  assert(
    dow === 5,
    `Day of week is Friday (5) for ${timeStr}`,
    `Expected 5 (Friday), got ${dow} (${dayName})`
  );
  assert(
    dayName === "Thứ Sáu",
    `Day name is "Thứ Sáu" for ${timeStr}`,
    `Expected "Thứ Sáu", got "${dayName}"`
  );
  assert(
    formattedTime === timeStr,
    `Time correctly formatted as ${timeStr}`,
    `Expected ${timeStr}, got ${formattedTime}`
  );
}

// ---------------------------------------------------------------------------
// TEST 2: ALL DAYS OF THE WEEK MAPPING (Thứ 2 -> CN)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 2: Accurate Day of Week Mapping for Entire Week ---");

const sampleWeekDates = [
  { date: "2026-09-28", expectedDow: 1, expectedName: "Thứ Hai" },
  { date: "2026-09-29", expectedDow: 2, expectedName: "Thứ Ba" },
  { date: "2026-09-30", expectedDow: 3, expectedName: "Thứ Tư" },
  { date: "2026-10-01", expectedDow: 4, expectedName: "Thứ Năm" },
  { date: "2026-10-02", expectedDow: 5, expectedName: "Thứ Sáu" },
  { date: "2026-10-03", expectedDow: 6, expectedName: "Thứ Bảy" },
  { date: "2026-10-04", expectedDow: 0, expectedName: "Chủ Nhật" },
];

for (const item of sampleWeekDates) {
  const d = makeVNDate(item.date, "19:00");
  const dow = getDayOfWeekVN(d);
  const name = getDayNameVN(d);
  assert(
    dow === item.expectedDow,
    `${item.date} dayOfWeek is ${item.expectedDow}`,
    `Expected ${item.expectedDow}, got ${dow}`
  );
  assert(
    name === item.expectedName,
    `${item.date} dayName is ${item.expectedName}`,
    `Expected ${item.expectedName}, got ${name}`
  );
}

// ---------------------------------------------------------------------------
// TEST 3: 4-PERIOD CROSS-PERIOD MINUTE ALLOCATION (Yêu cầu 8, 9)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 3: 4-Period Cross-Period Minute Allocation ---");

// Example A: 11:30 to 12:30 (Sáng: 05:00-11:59, Trưa: 12:00-13:59)
// Should allocate 30m to Morning and 30m to Noon
const ev1Start = makeVNDate("2026-10-02", "11:30");
const ev1End = makeVNDate("2026-10-02", "12:30");
const alloc1 = calculateEventPeriodAllocation(ev1Start, ev1End);

assert(alloc1.totalMinutes === 60, "Event 11:30-12:30 totalMinutes is 60");
assert(alloc1.periods.morning === 30, "Event 11:30-12:30 morning portion is 30m", `Got ${alloc1.periods.morning}`);
assert(alloc1.periods.noon === 30, "Event 11:30-12:30 noon portion is 30m", `Got ${alloc1.periods.noon}`);
assert(alloc1.periods.afternoon === 0, "Event 11:30-12:30 afternoon portion is 0m");
assert(alloc1.periods.evening === 0, "Event 11:30-12:30 evening portion is 0m");

// Example B: Single period 08:00 - 09:30 (Morning)
const ev2Start = makeVNDate("2026-10-02", "08:00");
const ev2End = makeVNDate("2026-10-02", "09:30");
const alloc2 = calculateEventPeriodAllocation(ev2Start, ev2End);

assert(alloc2.totalMinutes === 90, "Event 08:00-09:30 totalMinutes is 90");
assert(alloc2.periods.morning === 90, "Event 08:00-09:30 morning portion is 90m");
assert(alloc2.primaryPeriod === "morning", "Event 08:00-09:30 primaryPeriod is morning");

// Example C: Cross Noon to Afternoon: 13:30 to 15:00
// 13:30 to 14:00 (30m Noon), 14:00 to 15:00 (60m Afternoon)
const ev3Start = makeVNDate("2026-10-02", "13:30");
const ev3End = makeVNDate("2026-10-02", "15:00");
const alloc3 = calculateEventPeriodAllocation(ev3Start, ev3End);

assert(alloc3.totalMinutes === 90, "Event 13:30-15:00 totalMinutes is 90");
assert(alloc3.periods.noon === 30, "Event 13:30-15:00 noon portion is 30m", `Got ${alloc3.periods.noon}`);
assert(alloc3.periods.afternoon === 60, "Event 13:30-15:00 afternoon portion is 60m", `Got ${alloc3.periods.afternoon}`);

// ---------------------------------------------------------------------------
// TEST 4: RECURRING EVENTS EXPANSION IN VN TIMEZONE
// ---------------------------------------------------------------------------
console.log("\n--- TEST 4: Recurring Events on Friday (Never shift to Saturday) ---");

const recurringEvent = {
  id: "rec-test-1",
  title: "Lớp tiếng Anh Thứ 6",
  startTime: makeVNDate("2026-10-02", "19:00"),
  endTime: makeVNDate("2026-10-02", "20:30"),
  recurrence: "WEEKLY",
  recurrenceRule: null,
  isLocked: false,
};

const windowStart = makeVNDate("2026-10-01", "00:00");
const windowEnd = makeVNDate("2026-10-31", "23:59");

const expanded = expandRecurringEvents([recurringEvent], windowStart, windowEnd);

assert(expanded.length >= 4, `Recurring event expanded into at least 4 occurrences (got ${expanded.length})`);
let allOccurrencesAreFriday = true;
for (const occ of expanded) {
  const dow = getDayOfWeekVN(occ.startTime);
  const time = formatTimeVN(occ.startTime);
  if (dow !== 5 || time !== "19:00") {
    allOccurrencesAreFriday = false;
    console.error(`Occurrence shifted! dow=${dow}, time=${time}, dateKey=${getDateKeyVN(occ.startTime)}`);
  }
}
assert(allOccurrencesAreFriday, "All expanded weekly occurrences remain strictly on Friday at 19:00");

// ---------------------------------------------------------------------------
// TEST 5: CONFLICT DETECTION IN VN TIMEZONE
// ---------------------------------------------------------------------------
console.log("\n--- TEST 5: Conflict Detection with Availability Rules in VN Time ---");

// Availability rule: Friday available only 18:00 - 22:00
const availabilityRules = [
  { dayOfWeek: 5, startTime: "18:00", endTime: "22:00", isAvailable: true },
];

// Existing event on Friday 19:00 - 20:00
const existingSlots = [
  {
    start: makeVNDate("2026-10-02", "19:00"),
    end: makeVNDate("2026-10-02", "20:00"),
    title: "Toán",
    isLocked: true,
  },
];

// Proposed 1: Outside available hours on Friday (14:00 - 15:00) -> Should fail
const validation1 = validateProposedSchedule(
  [{
    startTime: makeVNDate("2026-10-02", "14:00"),
    endTime: makeVNDate("2026-10-02", "15:00"),
    title: "Vật lý",
  }],
  existingSlots,
  availabilityRules
);
assert(!validation1.isValid, "Proposed slot outside available hours was rejected as expected");

// Proposed 2: Overlapping with existing locked event (19:30 - 20:30) -> Should fail
const validation2 = validateProposedSchedule(
  [{
    startTime: makeVNDate("2026-10-02", "19:30"),
    endTime: makeVNDate("2026-10-02", "20:30"),
    title: "Vật lý",
  }],
  existingSlots,
  availabilityRules
);
assert(!validation2.isValid, "Proposed slot overlapping existing locked event was rejected as expected");

// Proposed 3: Valid slot within available hours (20:30 - 21:30) -> Should succeed
const validation3 = validateProposedSchedule(
  [{
    startTime: makeVNDate("2026-10-02", "20:30"),
    endTime: makeVNDate("2026-10-02", "21:30"),
    title: "Hóa học",
  }],
  existingSlots,
  availabilityRules
);
assert(validation3.isValid, "Proposed valid non-overlapping slot was accepted");

// ---------------------------------------------------------------------------
// TEST 6: WEEK DAYS GENERATOR (Mon to Sun in VN Time)
// ---------------------------------------------------------------------------
console.log("\n--- TEST 6: Week View Days Generation ---");

const weekDays = getWeekDaysDetailedVN(makeVNDate("2026-10-02", "12:00"));
assert(weekDays.length === 7, "getWeekDaysDetailedVN returns exactly 7 days");
assert(weekDays[0].dayName === "Thứ Hai", `Week starts on Thứ Hai (${weekDays[0].dateKey})`);
assert(weekDays[4].dayName === "Thứ Sáu", `Day 5 is Thứ Sáu (${weekDays[4].dateKey})`);
assert(weekDays[4].dateKey === "2026-10-02", `Thứ 6 dateKey is 2026-10-02 (got ${weekDays[4].dateKey})`);
assert(weekDays[6].dayName === "Chủ Nhật", `Week ends on Chủ Nhật (${weekDays[6].dateKey})`);

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n=================================================");
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log("=================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

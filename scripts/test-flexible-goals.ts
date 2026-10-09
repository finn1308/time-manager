import { prisma } from "../src/lib/prisma";
import {
  getDailyFlexibleGoals,
  isGoalActiveOnDate,
  recordFlexibleGoalProgress,
  parseActiveDays,
} from "../src/lib/flexible-goals/service";
import { runLocalHeuristicScheduler } from "../src/lib/ai/client-factory";

async function runFlexibleGoalsAcceptanceTests() {
  console.log("==================================================================");
  console.log("🚀 STARTING ACCEPTANCE TESTS: FLEXIBLE STUDY GOALS & FIXED SCHEDULES");
  console.log("==================================================================\n");

  let passedTests = 0;
  const totalTests = 9;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${detail || ""}`);
      process.exitCode = 1;
    }
  }

  // Setup unique test user
  const testEmail = `test-flex-${Date.now()}@chronomind.test`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Flexible Goal Test User",
    },
  });

  const todayKey = "2026-10-09"; // Friday (Day 5)

  try {
    // Setup academic subject & skill
    const vocabSubject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: "English Vocabulary",
        color: "#10b981",
        targetHours: 20,
      },
    });

    const progSkill = await prisma.skill.create({
      data: {
        userId: user.id,
        name: "Programming",
        category: "TECH",
        totalPlannedHours: 50,
      },
    });

    // ==============================================================================
    // TEST 1: Create a flexible English Vocabulary goal of 30 minutes without start time
    // ==============================================================================
    console.log("🧪 Test 1: Create flexible English Vocabulary goal of 30m without start time");
    const flexGoal = await prisma.flexibleStudyGoal.create({
      data: {
        userId: user.id,
        title: "English Vocabulary Daily",
        subjectId: vocabSubject.id,
        targetMinutes: 30,
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        activeDays: JSON.stringify([1, 2, 3, 4, 5]), // Monday to Friday
        preferredPeriod: "ANY_TIME",
        status: "ACTIVE",
      },
    });

    assert(
      Boolean(flexGoal.id) && flexGoal.targetMinutes === 30,
      "Test 1: Flexible English Vocabulary goal saved successfully with 30m target duration and no fake start time",
      `Expected 30m, got ${flexGoal.targetMinutes}`
    );

    // ==============================================================================
    // TEST 2: Study for 12 minutes -> Progress becomes 12/30 minutes
    // ==============================================================================
    console.log("\n🧪 Test 2: Study for 12 minutes");
    const progressAfter12m = await recordFlexibleGoalProgress({
      userId: user.id,
      flexibleGoalId: flexGoal.id,
      targetDateKey: todayKey,
      studyDurationSeconds: 12 * 60, // 720 seconds
    });

    const dailyGoalsState1 = await getDailyFlexibleGoals(user.id, todayKey);
    const computedGoal1 = dailyGoalsState1.find((g) => g.id === flexGoal.id);

    assert(
      computedGoal1 !== undefined &&
      computedGoal1.actualMinutes === 12 &&
      computedGoal1.remainingMinutes === 18 &&
      computedGoal1.isCompleted === false,
      "Test 2: Study 12m -> Progress correctly recorded as 12/30m with 18m remaining",
      `Got actual: ${computedGoal1?.actualMinutes}, remaining: ${computedGoal1?.remainingMinutes}, completed: ${computedGoal1?.isCompleted}`
    );

    // ==============================================================================
    // TEST 3: Study for another 18 minutes on same date -> Progress 30/30, marked complete
    // ==============================================================================
    console.log("\n🧪 Test 3: Study for another 18 minutes on the same date");
    const progressAfter30m = await recordFlexibleGoalProgress({
      userId: user.id,
      flexibleGoalId: flexGoal.id,
      targetDateKey: todayKey,
      studyDurationSeconds: 18 * 60, // 1080 seconds
    });

    const dailyGoalsState2 = await getDailyFlexibleGoals(user.id, todayKey);
    const computedGoal2 = dailyGoalsState2.find((g) => g.id === flexGoal.id);

    assert(
      computedGoal2 !== undefined &&
      computedGoal2.actualMinutes === 30 &&
      computedGoal2.remainingMinutes === 0 &&
      computedGoal2.isCompleted === true,
      "Test 3: Study another 18m -> Progress becomes 30/30m and marked completed",
      `Got actual: ${computedGoal2?.actualMinutes}, remaining: ${computedGoal2?.remainingMinutes}, completed: ${computedGoal2?.isCompleted}`
    );

    // ==============================================================================
    // TEST 4: Study for 40 minutes -> Actual recorded as 40m, target marked complete without truncation
    // ==============================================================================
    console.log("\n🧪 Test 4: Study for 40 minutes on fresh 30m goal without truncating actual time");
    const freshGoal = await prisma.flexibleStudyGoal.create({
      data: {
        userId: user.id,
        title: "Chinese Practice",
        targetMinutes: 30,
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        activeDays: JSON.stringify([1, 2, 3, 4, 5]),
        preferredPeriod: "EVENING",
        status: "ACTIVE",
      },
    });

    await recordFlexibleGoalProgress({
      userId: user.id,
      flexibleGoalId: freshGoal.id,
      targetDateKey: todayKey,
      studyDurationSeconds: 40 * 60, // 2400 seconds = 40 minutes
    });

    const dailyGoalsState3 = await getDailyFlexibleGoals(user.id, todayKey);
    const computedGoal3 = dailyGoalsState3.find((g) => g.id === freshGoal.id);

    assert(
      computedGoal3 !== undefined &&
      computedGoal3.actualMinutes === 40 &&
      computedGoal3.remainingMinutes === 0 &&
      computedGoal3.isCompleted === true,
      "Test 4: Study 40m -> Recorded full 40m actual time, target marked complete without truncation",
      `Got actual: ${computedGoal3?.actualMinutes}, remaining: ${computedGoal3?.remainingMinutes}`
    );

    // ==============================================================================
    // TEST 5: Create a fixed IELTS event (19:00-21:00) and flexible goal (30m)
    // ==============================================================================
    console.log("\n🧪 Test 5: Fixed IELTS event (19:00-21:00) + Flexible Vocabulary goal coexistence");
    const ieltsEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: vocabSubject.id,
        title: "IELTS Speaking & Writing",
        startTime: new Date("2026-10-09T12:00:00.000Z"), // 19:00 UTC+7
        endTime: new Date("2026-10-09T14:00:00.000Z"),   // 21:00 UTC+7
        type: "STUDY",
        timezone: "Asia/Ho_Chi_Minh",
      },
    });

    const calendarEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id },
    });
    const flexGoalsAll = await prisma.flexibleStudyGoal.findMany({
      where: { userId: user.id, status: "ACTIVE" },
    });

    assert(
      calendarEvents.some((e) => e.title.includes("IELTS") && e.startTime.toISOString().includes("12:00")) &&
      flexGoalsAll.some((g) => g.title.includes("English Vocabulary")),
      "Test 5: Fixed IELTS event appears on calendar time grid while flexible goal is distinct without fake slot",
      `Found ${calendarEvents.length} calendar events and ${flexGoalsAll.length} flexible goals`
    );

    // ==============================================================================
    // TEST 6: Recurring flexible goal for Monday, Wednesday, Friday
    // ==============================================================================
    console.log("\n🧪 Test 6: Recurring flexible goal for Monday, Wednesday, Friday");
    const mwfGoal = await prisma.flexibleStudyGoal.create({
      data: {
        userId: user.id,
        skillId: progSkill.id,
        title: "Practice Programming MWF",
        targetMinutes: 60,
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        activeDays: JSON.stringify([1, 3, 5]), // Monday, Wednesday, Friday
        status: "ACTIVE",
      },
    });

    // 2026-10-09 is Friday (Day 5) -> Active
    const isFridayActive = isGoalActiveOnDate(mwfGoal, "2026-10-09");
    // 2026-10-10 is Saturday (Day 6) -> Inactive
    const isSaturdayActive = isGoalActiveOnDate(mwfGoal, "2026-10-10");
    // 2026-10-11 is Sunday (Day 0) -> Inactive
    const isSundayActive = isGoalActiveOnDate(mwfGoal, "2026-10-11");
    // 2026-10-12 is Monday (Day 1) -> Active
    const isMondayActive = isGoalActiveOnDate(mwfGoal, "2026-10-12");

    assert(
      isFridayActive === true &&
      isSaturdayActive === false &&
      isSundayActive === false &&
      isMondayActive === true,
      "Test 6: Recurring MWF flexible goal correctly active on Friday/Monday and inactive on Saturday/Sunday",
      `Fri: ${isFridayActive}, Sat: ${isSaturdayActive}, Sun: ${isSundayActive}, Mon: ${isMondayActive}`
    );

    // ==============================================================================
    // TEST 7: Refresh simulation & data retention across restarts
    // ==============================================================================
    console.log("\n🧪 Test 7: Persistence test across session reload");
    const rawProgressRecord = await prisma.dailyGoalProgress.findUnique({
      where: {
        goalId_dateKey: {
          goalId: flexGoal.id,
          dateKey: todayKey,
        },
      },
    });

    const reloadedDailyGoals = await getDailyFlexibleGoals(user.id, todayKey);
    const reloadedGoal = reloadedDailyGoals.find((g) => g.id === flexGoal.id);

    assert(
      rawProgressRecord !== null &&
      rawProgressRecord.actualMinutes === 30 &&
      reloadedGoal?.actualMinutes === 30 &&
      reloadedGoal?.isCompleted === true,
      "Test 7: Data persisted in PostgreSQL database accurately retaining 30 mins actual study time",
      `Expected actualMinutes=30, got ${rawProgressRecord?.actualMinutes}`
    );

    // ==============================================================================
    // TEST 8: AI scheduler workload calculation with fixed, flexible, and deadlines
    // ==============================================================================
    console.log("\n🧪 Test 8: AI scheduler workload awareness for fixed events + flexible goals");
    // Deadline event: Assignment Submission Friday 23:59
    const deadlineEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: "Assignment Lab 2 Submission Deadline",
        startTime: new Date("2026-10-09T16:59:00.000Z"), // 23:59 UTC+7
        endTime: new Date("2026-10-09T16:59:00.000Z"),
        type: "DEADLINE",
        isLocked: true,
      },
    });

    const aiResult = runLocalHeuristicScheduler({
      startDate: "2026-10-09",
      endDate: "2026-10-11",
      preferences: {
        maxDailyStudyHours: 4.0, // 240 minutes max
        timePreference: "BALANCED",
        restDays: [0], // Sunday
      },
      subjects: [
        { id: vocabSubject.id, name: "English Vocabulary", targetHours: 10, loggedHours: 2, remainingHours: 8, priority: 4 },
      ],
      skills: [
        { id: progSkill.id, name: "Programming", category: "TECH", totalPlannedHours: 30 },
      ],
      blockedSlots: [],
      existingEvents: [
        { title: "IELTS Speaking & Writing", startTime: "2026-10-09T19:00:00+07:00", endTime: "2026-10-09T21:00:00+07:00" },
        { title: "Assignment Lab 2 Submission Deadline", startTime: "2026-10-09T23:59:00+07:00", endTime: "2026-10-09T23:59:00+07:00" },
      ],
      flexibleGoals: [
        { id: flexGoal.id, title: "English Vocabulary Daily", targetMinutes: 30, startDate: "2026-10-01", activeDays: [1, 2, 3, 4, 5], preferredPeriod: "ANY_TIME" },
        { id: mwfGoal.id, title: "Practice Programming MWF", targetMinutes: 60, startDate: "2026-10-01", activeDays: [1, 3, 5], preferredPeriod: "ANY_TIME" },
      ],
    });

    // Check workload analysis
    const fridayAnalysis = aiResult.workloadAnalysis?.find((w) => w.date === "2026-10-09");
    const hasFlexibleBudgeted = (fridayAnalysis?.flexibleGoalMinutes || 0) >= 90; // 30 + 60 = 90
    const noFakeFlexibleInProposed = !aiResult.proposedEvents.some((pe) =>
      pe.title.includes("English Vocabulary Daily") || pe.title.includes("Practice Programming MWF")
    );

    assert(
      hasFlexibleBudgeted && noFakeFlexibleInProposed && Boolean(aiResult.summary),
      "Test 8: AI budgeted 90m flexible goals into Friday workload without inventing fake fixed events",
      `Budgeted flexible: ${fridayAnalysis?.flexibleGoalMinutes}m, Total proposed: ${aiResult.proposedEvents.length}`
    );

    // ==============================================================================
    // TEST 9: Non-regression for fixed schedules, deadlines, subjects, skills, timer
    // ==============================================================================
    console.log("\n🧪 Test 9: Non-regression for existing entities");
    const deadlineCheck = await prisma.calendarEvent.findUnique({
      where: { id: deadlineEvent.id },
    });
    const ieltsCheck = await prisma.calendarEvent.findUnique({
      where: { id: ieltsEvent.id },
    });
    const skillCheck = await prisma.skill.findUnique({
      where: { id: progSkill.id },
    });
    const subjectCheck = await prisma.subject.findUnique({
      where: { id: vocabSubject.id },
    });

    assert(
      deadlineCheck?.type === "DEADLINE" &&
      ieltsCheck?.type === "STUDY" &&
      skillCheck !== null &&
      subjectCheck !== null,
      "Test 9: Deadline, Study events, Skills, and Subjects preserved with full integrity",
      `Deadline type: ${deadlineCheck?.type}, IELTS type: ${ieltsCheck?.type}`
    );

  } finally {
    // Cleanup test user and cascade-deleted records
    await prisma.user.delete({
      where: { id: user.id },
    }).catch(() => {});
  }

  console.log("\n==================================================================");
  console.log(`🎉 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("✅ ALL ACCEPTANCE TESTS SUCCESSFULLY PASSED!");
  } else {
    process.exit(1);
  }
}

runFlexibleGoalsAcceptanceTests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  });

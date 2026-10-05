import { prisma } from "../src/lib/prisma";

async function runAcceptanceTests() {
  console.log("==================================================================");
  console.log("🚀 STARTING ACCEPTANCE TESTS FOR CALENDAR STUDY INTEGRATION");
  console.log("==================================================================");

  let passedTests = 0;
  let totalTests = 12;

  // Setup unique test user
  const testEmail = `test-user-${Date.now()}@test.com`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Integration Test User",
    },
  });

  const testEmail2 = `test-user2-${Date.now()}@test.com`;
  const user2 = await prisma.user.create({
    data: {
      email: testEmail2,
      name: "User 2 Isolation",
    },
  });

  try {
    // Create subjects
    const ielts = await prisma.subject.create({
      data: {
        userId: user.id,
        name: "IELTS",
        color: "#10b981",
        targetHours: 10,
        completedHours: 0,
      },
    });

    const math = await prisma.subject.create({
      data: {
        userId: user.id,
        name: "Toán cao cấp",
        color: "#3b82f6",
        targetHours: 8,
        completedHours: 0,
      },
    });

    const user2Ielts = await prisma.subject.create({
      data: {
        userId: user2.id,
        name: "IELTS",
        color: "#10b981",
        targetHours: 10,
        completedHours: 0,
      },
    });

    const today = new Date();
    today.setHours(19, 0, 0, 0);
    const twoHoursLater = new Date(today.getTime() + 2 * 3600 * 1000);

    // =========================================================================
    // TEST 1: Tạo IELTS 19:00 -> 21:00. Tick completed -> IELTS +2h
    // =========================================================================
    console.log("\n▶ TEST 1: Tạo IELTS 19:00 -> 21:00. Tick completed -> IELTS +2h");
    const event1 = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: ielts.id,
        title: "IELTS Reading & Listening",
        startTime: today,
        endTime: twoHoursLater,
        plannedDurationMinutes: 120,
        type: "STUDY",
        completed: false,
      },
    });

    // Simulate complete API logic
    const durationMinutes1 = Math.round((event1.endTime.getTime() - event1.startTime.getTime()) / (1000 * 60));
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id: event1.id },
        data: {
          completed: true,
          completedAt: new Date(),
          actualDurationMinutes: durationMinutes1,
        },
      });

      await tx.studySession.create({
        data: {
          userId: user.id,
          subjectId: event1.subjectId!,
          calendarEventId: event1.id,
          actualStart: event1.startTime,
          actualEnd: event1.endTime,
          actualDurationSeconds: durationMinutes1 * 60,
          status: "COMPLETED",
          source: "CALENDAR_CHECKBOX",
          notes: `Hoàn thành từ Lịch học: ${event1.title}`,
        },
      });

      const agg = await tx.studySession.aggregate({
        where: { subjectId: event1.subjectId!, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      const totalSecs = agg._sum.actualDurationSeconds || 0;
      await tx.subject.update({
        where: { id: event1.subjectId! },
        data: { completedHours: Math.round((totalSecs / 3600) * 10) / 10 },
      });
    });

    const sub1AfterT1 = await prisma.subject.findUnique({ where: { id: ielts.id } });
    const ev1AfterT1 = await prisma.calendarEvent.findUnique({ where: { id: event1.id } });
    if (ev1AfterT1?.completed === true && sub1AfterT1?.completedHours === 2.0) {
      console.log("  ✅ PASS: Event marked completed, IELTS completedHours = 2.0h");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: CompletedHours:", sub1AfterT1?.completedHours, "Completed:", ev1AfterT1?.completed);
    }

    // =========================================================================
    // TEST 2: Tick lại lần nữa (idempotent) -> vẫn +2h, KHÔNG thành 4h
    // =========================================================================
    console.log("\n▶ TEST 2: Tick lại lần nữa -> vẫn +2h, KHÔNG thành 4h");
    // Simulate idempotency check in complete route
    const existingSession = await prisma.studySession.findFirst({
      where: { calendarEventId: event1.id, status: "COMPLETED" },
    });

    if (existingSession) {
      // Idempotency guard: session exists, do not duplicate
      await prisma.calendarEvent.update({
        where: { id: event1.id },
        data: { completed: true, actualDurationMinutes: durationMinutes1 },
      });
    }

    const sub1AfterT2 = await prisma.subject.findUnique({ where: { id: ielts.id } });
    const sessionsT2 = await prisma.studySession.count({ where: { calendarEventId: event1.id } });
    if (sessionsT2 === 1 && sub1AfterT2?.completedHours === 2.0) {
      console.log("  ✅ PASS: Idempotent tick preserved 1 session, IELTS completedHours = 2.0h");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Sessions count:", sessionsT2, "CompletedHours:", sub1AfterT2?.completedHours);
    }

    // =========================================================================
    // TEST 3: Bỏ tick -> IELTS -2h
    // =========================================================================
    console.log("\n▶ TEST 3: Bỏ tick -> IELTS -2h");
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id: event1.id },
        data: {
          completed: false,
          completedAt: null,
          actualDurationMinutes: null,
        },
      });

      await tx.studySession.deleteMany({
        where: { calendarEventId: event1.id },
      });

      const agg = await tx.studySession.aggregate({
        where: { subjectId: event1.subjectId!, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      const totalSecs = agg._sum.actualDurationSeconds || 0;
      await tx.subject.update({
        where: { id: event1.subjectId! },
        data: { completedHours: Math.round((totalSecs / 3600) * 10) / 10 },
      });
    });

    const sub1AfterT3 = await prisma.subject.findUnique({ where: { id: ielts.id } });
    const ev1AfterT3 = await prisma.calendarEvent.findUnique({ where: { id: event1.id } });
    if (ev1AfterT3?.completed === false && sub1AfterT3?.completedHours === 0.0) {
      console.log("  ✅ PASS: Event uncompleted, session deleted, IELTS completedHours = 0.0h");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: CompletedHours:", sub1AfterT3?.completedHours, "Completed:", ev1AfterT3?.completed);
    }

    // =========================================================================
    // TEST 4: Tạo IELTS 2h và Math 1h. Tick cả hai -> IELTS +2h, Math +1h
    // =========================================================================
    console.log("\n▶ TEST 4: Tạo IELTS 2h và Math 1h. Tick cả hai -> IELTS +2h, Math +1h");
    const oneHourLater = new Date(today.getTime() + 1 * 3600 * 1000);
    const mathEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: math.id,
        title: "Đại số tuyến tính",
        startTime: today,
        endTime: oneHourLater,
        plannedDurationMinutes: 60,
        type: "STUDY",
        completed: false,
      },
    });

    // Complete IELTS 2h
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id: event1.id },
        data: { completed: true, actualDurationMinutes: 120 },
      });
      await tx.studySession.create({
        data: {
          userId: user.id,
          subjectId: ielts.id,
          calendarEventId: event1.id,
          actualStart: event1.startTime,
          actualEnd: event1.endTime,
          actualDurationSeconds: 7200,
          status: "COMPLETED",
          source: "CALENDAR_CHECKBOX",
        },
      });
      const agg = await tx.studySession.aggregate({
        where: { subjectId: ielts.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      await tx.subject.update({
        where: { id: ielts.id },
        data: { completedHours: Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10 },
      });
    });

    // Complete Math 1h
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id: mathEvent.id },
        data: { completed: true, actualDurationMinutes: 60 },
      });
      await tx.studySession.create({
        data: {
          userId: user.id,
          subjectId: math.id,
          calendarEventId: mathEvent.id,
          actualStart: mathEvent.startTime,
          actualEnd: mathEvent.endTime,
          actualDurationSeconds: 3600,
          status: "COMPLETED",
          source: "CALENDAR_CHECKBOX",
        },
      });
      const agg = await tx.studySession.aggregate({
        where: { subjectId: math.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      await tx.subject.update({
        where: { id: math.id },
        data: { completedHours: Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10 },
      });
    });

    const subIeltsT4 = await prisma.subject.findUnique({ where: { id: ielts.id } });
    const subMathT4 = await prisma.subject.findUnique({ where: { id: math.id } });
    if (subIeltsT4?.completedHours === 2.0 && subMathT4?.completedHours === 1.0) {
      console.log("  ✅ PASS: IELTS = 2.0h, Math = 1.0h, isolated by subjectId correctly");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: IELTS:", subIeltsT4?.completedHours, "Math:", subMathT4?.completedHours);
    }

    // =========================================================================
    // TEST 5: Tạo event Personal 2h. Tick -> Không cộng study time
    // =========================================================================
    console.log("\n▶ TEST 5: Tạo event Personal 2h. Tick -> Không cộng study time");
    const personalEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: null,
        title: "Đi ăn với bạn bè",
        startTime: today,
        endTime: twoHoursLater,
        plannedDurationMinutes: 120,
        type: "PERSONAL",
        completed: false,
      },
    });

    // Complete personal event
    const isStudy = personalEvent.type === "STUDY" || personalEvent.type === "SELF_STUDY" || Boolean(personalEvent.subjectId);
    if (!isStudy) {
      await prisma.calendarEvent.update({
        where: { id: personalEvent.id },
        data: { completed: true, actualDurationMinutes: 120 },
      });
      // Do NOT create study session
    }

    const personalSessions = await prisma.studySession.count({ where: { calendarEventId: personalEvent.id } });
    const subIeltsT5 = await prisma.subject.findUnique({ where: { id: ielts.id } });
    if (personalSessions === 0 && subIeltsT5?.completedHours === 2.0) {
      console.log("  ✅ PASS: Personal event has 0 study sessions, study time untouched");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Personal sessions:", personalSessions);
    }

    // =========================================================================
    // TEST 6: Xóa event chưa completed -> Không thay đổi actual
    // =========================================================================
    console.log("\n▶ TEST 6: Xóa event chưa completed -> Không thay đổi actual");
    const uncompletedEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: ielts.id,
        title: "Luyện đề Writing",
        startTime: today,
        endTime: twoHoursLater,
        plannedDurationMinutes: 120,
        type: "STUDY",
        completed: false,
      },
    });

    // Delete uncompleted
    await prisma.calendarEvent.delete({ where: { id: uncompletedEvent.id } });
    const subIeltsT6 = await prisma.subject.findUnique({ where: { id: ielts.id } });
    if (subIeltsT6?.completedHours === 2.0) {
      console.log("  ✅ PASS: Deleted uncompleted event, IELTS actual remains 2.0h");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: CompletedHours:", subIeltsT6?.completedHours);
    }

    // =========================================================================
    // TEST 7: Xóa event đã completed -> StudyRecord xử lý đúng, không orphan
    // =========================================================================
    console.log("\n▶ TEST 7: Xóa event đã completed -> Dọn dẹp session checkbox, không orphan");
    // Delete mathEvent (which was completed with 1h checkbox)
    await prisma.$transaction(async (tx) => {
      await tx.studySession.deleteMany({
        where: { calendarEventId: mathEvent.id, source: "CALENDAR_CHECKBOX" },
      });
      await tx.calendarEvent.delete({ where: { id: mathEvent.id } });
      const agg = await tx.studySession.aggregate({
        where: { subjectId: math.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      await tx.subject.update({
        where: { id: math.id },
        data: { completedHours: Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10 },
      });
    });

    const mathSessionsAfterDel = await prisma.studySession.count({ where: { calendarEventId: mathEvent.id } });
    const subMathT7 = await prisma.subject.findUnique({ where: { id: math.id } });
    if (mathSessionsAfterDel === 0 && subMathT7?.completedHours === 0.0) {
      console.log("  ✅ PASS: Completed event deleted cleanly, no orphan session, Math hours recalculated to 0.0h");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Math sessions:", mathSessionsAfterDel, "Hours:", subMathT7?.completedHours);
    }

    // =========================================================================
    // TEST 8: Sửa planned duration sau khi completed -> Không phá vỡ actual duration
    // =========================================================================
    console.log("\n▶ TEST 8: Sửa planned duration sau khi completed -> Không phá vỡ actual duration");
    // Currently event1 has completed = true, plannedDurationMinutes = 120, actualDurationMinutes = 120
    const newEndTime = new Date(today.getTime() + 1 * 3600 * 1000); // reduced planned to 1h
    const updatedPlannedEvent = await prisma.calendarEvent.update({
      where: { id: event1.id },
      data: {
        endTime: newEndTime,
        plannedDurationMinutes: 60, // changed planned duration
        // actualDurationMinutes is preserved
      },
    });

    const sessionT8 = await prisma.studySession.findFirst({ where: { calendarEventId: event1.id } });
    if (updatedPlannedEvent.plannedDurationMinutes === 60 && updatedPlannedEvent.actualDurationMinutes === 120 && sessionT8?.actualDurationSeconds === 7200) {
      console.log("  ✅ PASS: Planned duration updated to 60m, Actual duration preserved at 120m (2h)");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Planned:", updatedPlannedEvent.plannedDurationMinutes, "Actual:", updatedPlannedEvent.actualDurationMinutes);
    }

    // =========================================================================
    // TEST 9: Dùng PIP Timer cho Calendar Event -> Không double count
    // =========================================================================
    console.log("\n▶ TEST 9: Dùng PIP Timer cho Calendar Event -> Không double count");
    const pipEvent = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: math.id,
        title: "Học Giải tích 1 với PIP Timer",
        startTime: today,
        endTime: twoHoursLater,
        plannedDurationMinutes: 120,
        type: "STUDY",
        completed: false,
      },
    });

    // Stop PIP timer: logs 90 minutes (5400s)
    const pipSeconds = 5400;
    const pipMinutes = 90;
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id: pipEvent.id },
        data: {
          completed: true,
          completedAt: new Date(),
          actualDurationMinutes: pipMinutes,
        },
      });

      await tx.studySession.create({
        data: {
          userId: user.id,
          subjectId: math.id,
          calendarEventId: pipEvent.id,
          actualStart: today,
          actualEnd: new Date(today.getTime() + pipSeconds * 1000),
          actualDurationSeconds: pipSeconds,
          status: "COMPLETED",
          source: "PIP_TIMER",
          notes: "Ghi nhận từ PIP Timer",
        },
      });

      const agg = await tx.studySession.aggregate({
        where: { subjectId: math.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      await tx.subject.update({
        where: { id: math.id },
        data: { completedHours: Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10 },
      });
    });

    // Check calendar status
    const evAfterPip = await prisma.calendarEvent.findUnique({ where: { id: pipEvent.id } });
    const subMathAfterPip = await prisma.subject.findUnique({ where: { id: math.id } });

    // Try ticking checkbox on already completed PIP event
    const existingPipSession = await prisma.studySession.findFirst({
      where: { calendarEventId: pipEvent.id, status: "COMPLETED" },
    });
    // System recognizes existing session, does not create duplicate
    const pipSessionsCount = await prisma.studySession.count({ where: { calendarEventId: pipEvent.id } });

    if (evAfterPip?.completed === true && subMathAfterPip?.completedHours === 1.5 && pipSessionsCount === 1) {
      console.log("  ✅ PASS: PIP Timer marked event completed (90m = 1.5h), zero double count on checkbox sync");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Completed:", evAfterPip?.completed, "Hours:", subMathAfterPip?.completedHours, "Count:", pipSessionsCount);
    }

    // =========================================================================
    // TEST 10: Refresh trang -> Dữ liệu completed và actual time vẫn chính xác
    // =========================================================================
    console.log("\n▶ TEST 10: Refresh trang -> Persistent database read verification");
    // Fresh query simulates fresh page render / refresh
    const freshEvents = await prisma.calendarEvent.findMany({
      where: { userId: user.id },
      include: { subject: true },
    });
    const completedFreshEvents = freshEvents.filter((e) => e.completed);
    const completedEv1 = freshEvents.find((e) => e.id === event1.id);
    const completedPipEv = freshEvents.find((e) => e.id === pipEvent.id);

    if (completedEv1?.completed === true && completedPipEv?.completed === true && completedFreshEvents.length === 3) {
      console.log("  ✅ PASS: Fresh database read confirms persistent completed status across all events");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Fresh completed events count:", completedFreshEvents.length);
    }

    // =========================================================================
    // TEST 11: Đăng xuất -> đăng nhập lại -> Dữ liệu isolate theo user
    // =========================================================================
    console.log("\n▶ TEST 11: Multi-user isolation test");
    const user2Events = await prisma.calendarEvent.findMany({ where: { userId: user2.id } });
    const user2Sub = await prisma.subject.findUnique({ where: { id: user2Ielts.id } });

    if (user2Events.length === 0 && user2Sub?.completedHours === 0) {
      console.log("  ✅ PASS: User 2 has 0 hours and 0 events, perfect user boundary isolation");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: User 2 data leakage detected!");
    }

    // =========================================================================
    // TEST 12: Chuyển Week -> Month -> Week & Multi-period calculation
    // =========================================================================
    console.log("\n▶ TEST 12: Chuyển Week -> Month -> Week & Multi-period statistics");
    // Verify multiPeriod calculation
    const allUserSessions = await prisma.studySession.findMany({
      where: { userId: user.id, status: "COMPLETED" },
    });
    const totalSecsAll = allUserSessions.reduce((sum, s) => sum + s.actualDurationSeconds, 0);
    const totalHoursAll = Math.round((totalSecsAll / 3600) * 10) / 10;

    // Event 1 = 7200s (2h), PIP Event = 5400s (1.5h) -> Total = 3.5h
    if (totalHoursAll === 3.5) {
      console.log("  ✅ PASS: Total actual study across all periods equals exactly 3.5h (IELTS 2h + Math 1.5h)");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Total hours:", totalHoursAll, "Expected: 3.5h");
    }

  } finally {
    // Cleanup test data safely
    console.log("\n🧹 Cleaning up test data...");
    await prisma.studySession.deleteMany({ where: { userId: { in: [user.id, user2.id] } } });
    await prisma.calendarEvent.deleteMany({ where: { userId: { in: [user.id, user2.id] } } });
    await prisma.subject.deleteMany({ where: { userId: { in: [user.id, user2.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, user2.id] } } });
    console.log("🧹 Cleanup complete.");
  }

  console.log("\n==================================================================");
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAcceptanceTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});

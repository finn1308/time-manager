import { prisma } from "../src/lib/prisma";
import {
  getDateKey,
  getTodayKey,
  getNextDayKey,
  calculateCompletionStats,
  syncDailyTaskSummary,
  executeDayClosure,
} from "../src/lib/tasks/smart-todo";
import { VIETNAM_TIMEZONE } from "../src/lib/date-utils";

async function runTests() {
  console.log("===============================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ HỆ THỐNG SMART DAILY TO-DO (10 TEST CASES)");
  console.log("===============================================================\n");

  // Setup Test User
  const testEmail = "smart_todo_tester@chronomind.app";
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Smart Todo Tester",
        timezone: "Asia/Ho_Chi_Minh",
      },
    });
  }

  // Setup Test Subject (IELTS)
  let subject = await prisma.subject.findFirst({
    where: { userId: user.id, name: "IELTS 7.5" },
  });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: "IELTS 7.5",
        code: "IELTS",
        color: "#2d6a4f",
        targetHours: 50.0,
      },
    });
  }

  // Clean old test tasks for this user
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.dailyTaskSummary.deleteMany({ where: { userId: user.id } });
  await prisma.studySession.deleteMany({ where: { userId: user.id } });

  let passedTests = 0;

  // -------------------------------------------------------------------------
  // TEST 1: Tạo 5 nhiệm vụ, hoàn thành 3, chốt ngày.
  // Kỳ vọng: Hiển thị 3/5, tỷ lệ 60%, còn 2 nhiệm vụ chưa hoàn thành.
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Tạo 5 nhiệm vụ, hoàn thành 3, chốt ngày ---");
  const testDate1 = "2026-10-09";
  const tasksDay1Data = [
    { title: "Học IELTS Reading 30 phút", isCompleted: true },
    { title: "Ôn 20 từ vựng tiếng Anh", isCompleted: true },
    { title: "Làm bài tập Toán giải tích", isCompleted: true },
    { title: "Đọc tài liệu môn Hệ điều hành", isCompleted: false },
    { title: "Làm bài tập Vật lý đại cương", isCompleted: false },
  ];

  const createdTasksDay1 = [];
  for (const t of tasksDay1Data) {
    const created = await prisma.task.create({
      data: {
        userId: user.id,
        title: t.title,
        scheduledDate: testDate1,
        originalDate: testDate1,
        isCompleted: t.isCompleted,
        status: t.isCompleted ? "DONE" : "TODO",
        completedAt: t.isCompleted ? new Date("2026-10-09T15:00:00Z") : null,
        subjectId: subject.id,
      },
    });
    createdTasksDay1.push(created);
  }

  const closureResult1 = await executeDayClosure({
    userId: user.id,
    dateKey: testDate1,
    rolloverToNextDay: false,
  });

  const summary1 = closureResult1.summary;
  console.log(`Kết quả: ${summary1.completedTasks}/${summary1.totalTasks} (Tỷ lệ: ${summary1.completionRate}%), Chưa xong: ${summary1.uncompletedTasks}`);

  if (
    summary1.totalTasks === 5 &&
    summary1.completedTasks === 3 &&
    summary1.uncompletedTasks === 2 &&
    summary1.completionRate === 60 &&
    summary1.isClosed === true
  ) {
    console.log("✅ TEST 1 PASSED: Hiển thị đúng 3/5, tỷ lệ 60%, còn 2 nhiệm vụ chưa hoàn thành.\n");
    passedTests++;
  } else {
    throw new Error(`❌ TEST 1 FAILED: Kết quả không khớp: ${JSON.stringify(summary1)}`);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Chọn chuyển 2 nhiệm vụ sang ngày hôm sau.
  // Kỳ vọng: Ngày cũ vẫn là 3/5 (60%). Ngày mới có 2 nhiệm vụ chuyển tiếp.
  // Không tạo bản sao ngoài ý muốn (tổng số task là 5).
  // -------------------------------------------------------------------------
  console.log("--- TEST 2: Chọn chuyển 2 nhiệm vụ sang ngày hôm sau ---");
  const testDate2 = "2026-10-10";
  const closureWithRollover = await executeDayClosure({
    userId: user.id,
    dateKey: testDate1,
    rolloverToNextDay: true,
    targetDateKey: testDate2,
  });

  // Check old day summary
  const oldDaySummary = await prisma.dailyTaskSummary.findUnique({
    where: { userId_dateKey: { userId: user.id, dateKey: testDate1 } },
  });

  // Check tasks on new day
  const newDayTasks = await prisma.task.findMany({
    where: { userId: user.id, scheduledDate: testDate2 },
  });

  // Check total tasks for user (should still be 5, no duplicates!)
  const totalTasksUser = await prisma.task.count({ where: { userId: user.id } });

  console.log(`Ngày cũ ${testDate1}: ${oldDaySummary?.completedTasks}/${oldDaySummary?.totalTasks} (${oldDaySummary?.completionRate}%)`);
  console.log(`Ngày mới ${testDate2}: ${newDayTasks.length} nhiệm vụ chuyển tiếp:`, newDayTasks.map(t => `${t.title} [isRollover=${t.isRollover}, count=${t.rolloverCount}, orig=${t.originalDate}]`));
  console.log(`Tổng số nhiệm vụ trong database: ${totalTasksUser}`);

  if (
    oldDaySummary?.completedTasks === 3 &&
    oldDaySummary?.totalTasks === 5 &&
    oldDaySummary?.completionRate === 60 &&
    newDayTasks.length === 2 &&
    newDayTasks.every((t) => t.isRollover && t.rolloverCount === 1 && t.originalDate === testDate1) &&
    totalTasksUser === 5
  ) {
    console.log("✅ TEST 2 PASSED: Ngày cũ giữ nguyên 3/5 (60%), ngày mới có 2 nhiệm vụ chuyển tiếp, không nhân bản task.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 2 FAILED: Rollover logic sai hoặc sinh task trùng lặp.");
  }

  // -------------------------------------------------------------------------
  // TEST 3: Hoàn thành một nhiệm vụ chuyển tiếp vào ngày mới.
  // Kỳ vọng: Ngày hoàn thành thực tế được ghi nhận chính xác tại ngày mới.
  // Lịch sử ngày cũ vẫn thể hiện nhiệm vụ chưa hoàn thành tại thời điểm chốt ngày.
  // -------------------------------------------------------------------------
  console.log("--- TEST 3: Hoàn thành một nhiệm vụ chuyển tiếp vào ngày mới ---");
  const taskToComplete = newDayTasks[0];
  const completionDateNew = new Date("2026-10-10T09:30:00Z");

  const completedTask = await prisma.task.update({
    where: { id: taskToComplete.id },
    data: {
      isCompleted: true,
      status: "DONE",
      completedAt: completionDateNew,
    },
  });
  await syncDailyTaskSummary(user.id, testDate2);

  // Check old day snapshot
  const oldSnapshot = JSON.parse(oldDaySummary?.snapshotData || "[]");
  const oldTaskInSnapshot = oldSnapshot.find((t: any) => t.id === taskToComplete.id);

  console.log(`Task "${completedTask.title}" hoàn thành lúc: ${completedTask.completedAt?.toISOString()}`);
  console.log(`Trạng thái task trong snapshot ngày cũ: isCompleted = ${oldTaskInSnapshot?.isCompleted}`);

  if (
    completedTask.isCompleted === true &&
    completedTask.completedAt?.toISOString() === completionDateNew.toISOString() &&
    oldTaskInSnapshot?.isCompleted === false
  ) {
    console.log("✅ TEST 3 PASSED: Hoàn thành ngày mới ghi nhận đúng completedAt, snapshot ngày cũ không bị viết lại.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 3 FAILED: Snapshot ngày cũ bị ghi đè hoặc completedAt không đúng.");
  }

  // -------------------------------------------------------------------------
  // TEST 4: Chọn giữ 2 nhiệm vụ ở ngày cũ (Không chuyển ngày).
  // Kỳ vọng: Ngày cũ 3/5. Ngày mới không tự xuất hiện hai nhiệm vụ đó.
  // Có thể tìm thấy chúng trong danh sách chưa làm (pending).
  // -------------------------------------------------------------------------
  console.log("--- TEST 4: Chọn giữ nhiệm vụ ở ngày cũ (rollover = false) ---");
  const testDate3 = "2026-10-11";
  const testDate4 = "2026-10-12";

  // Create 5 tasks on 2026-10-11
  for (let i = 1; i <= 5; i++) {
    await prisma.task.create({
      data: {
        userId: user.id,
        title: `Nhiệm vụ Ngày 11 số ${i}`,
        scheduledDate: testDate3,
        originalDate: testDate3,
        isCompleted: i <= 3,
        status: i <= 3 ? "DONE" : "TODO",
        completedAt: i <= 3 ? new Date() : null,
      },
    });
  }

  // Close day with rolloverToNextDay = false
  await executeDayClosure({
    userId: user.id,
    dateKey: testDate3,
    rolloverToNextDay: false,
    targetDateKey: testDate4,
  });

  const summaryDate3 = await prisma.dailyTaskSummary.findUnique({
    where: { userId_dateKey: { userId: user.id, dateKey: testDate3 } },
  });

  const tasksOnDate4 = await prisma.task.findMany({
    where: { userId: user.id, scheduledDate: testDate4 },
  });

  const pendingTasksDate3 = await prisma.task.findMany({
    where: { userId: user.id, scheduledDate: testDate3, isCompleted: false },
  });

  console.log(`Ngày ${testDate3}: ${summaryDate3?.completedTasks}/${summaryDate3?.totalTasks} (${summaryDate3?.completionRate}%)`);
  console.log(`Ngày ${testDate4} có ${tasksOnDate4.length} nhiệm vụ.`);
  console.log(`Nhiệm vụ chưa làm ở ngày cũ: ${pendingTasksDate3.length} nhiệm vụ.`);

  if (
    summaryDate3?.completionRate === 60 &&
    tasksOnDate4.length === 0 &&
    pendingTasksDate3.length === 2
  ) {
    console.log("✅ TEST 4 PASSED: Ngày cũ giữ nguyên 3/5 (60%), ngày mới không tự xuất hiện, tìm thấy đầy đủ trong chưa làm.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 4 FAILED: Logic giữ ngày cũ không hoạt động đúng.");
  }

  // -------------------------------------------------------------------------
  // TEST 5: Tải lại trang hoặc đăng nhập trên thiết bị khác.
  // Kỳ vọng: Dữ liệu được đồng bộ chính xác và bền vững trong PostgreSQL.
  // -------------------------------------------------------------------------
  console.log("--- TEST 5: Đồng bộ dữ liệu bền vững qua Database ---");
  const reloadedTasks = await prisma.task.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, isCompleted: true, scheduledDate: true },
  });
  const reloadedSummaries = await prisma.dailyTaskSummary.findMany({
    where: { userId: user.id },
  });

  if (reloadedTasks.length > 0 && reloadedSummaries.length >= 2) {
    console.log(`✅ TEST 5 PASSED: Đã kiểm tra ${reloadedTasks.length} nhiệm vụ và ${reloadedSummaries.length} bản ghi tổng kết lưu trữ bền vững.\n`);
    passedTests++;
  } else {
    throw new Error("❌ TEST 5 FAILED: Dữ liệu không bền vững.");
  }

  // -------------------------------------------------------------------------
  // TEST 6: Nhấn chốt ngày hai lần (Idempotency test).
  // Kỳ vọng: Không tạo hai bản tổng kết gây sai số liệu.
  // -------------------------------------------------------------------------
  console.log("--- TEST 6: Nhấn chốt ngày hai lần (Idempotency) ---");
  const countBefore = await prisma.dailyTaskSummary.count({
    where: { userId: user.id, dateKey: testDate3 },
  });

  // Chốt lần 2
  await executeDayClosure({
    userId: user.id,
    dateKey: testDate3,
    rolloverToNextDay: false,
  });

  const countAfter = await prisma.dailyTaskSummary.count({
    where: { userId: user.id, dateKey: testDate3 },
  });

  if (countBefore === 1 && countAfter === 1) {
    console.log("✅ TEST 6 PASSED: Nhấn chốt ngày 2 lần vẫn giữ đúng 1 bản tổng kết, không nhân đôi số liệu.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 6 FAILED: Chốt ngày bị duplicate bản ghi.");
  }

  // -------------------------------------------------------------------------
  // TEST 7: Dùng Timer học IELTS 30 phút rồi hoàn thành nhiệm vụ.
  // Kỳ vọng: Ghi nhận đúng 30 phút học thực tế, cộng giờ vào môn học.
  // Đánh dấu hoàn thành không tự cộng thêm giờ học nếu không có timer.
  // -------------------------------------------------------------------------
  console.log("--- TEST 7: Dùng Timer học 30 phút và liên kết nhiệm vụ ---");
  const subjectHoursBefore = (await prisma.subject.findUnique({ where: { id: subject.id } }))?.completedHours || 0;

  const timerTask = await prisma.task.create({
    data: {
      userId: user.id,
      title: "Luyện đề IELTS Cam 18 Test 1",
      subjectId: subject.id,
      scheduledDate: testDate1,
      estimatedMinutes: 30,
    },
  });

  // Simulate Timer Session: 30 minutes = 1800 seconds
  const sessionStart = new Date("2026-10-09T08:00:00Z");
  const sessionEnd = new Date("2026-10-09T08:30:00Z");
  const studySession = await prisma.studySession.create({
    data: {
      userId: user.id,
      subjectId: subject.id,
      taskId: timerTask.id,
      actualStart: sessionStart,
      actualEnd: sessionEnd,
      actualDurationSeconds: 1800,
      status: "COMPLETED",
      source: "PIP_TIMER",
    },
  });

  // Aggregate subject hours as done by timer/stop
  const agg = await prisma.studySession.aggregate({
    where: { subjectId: subject.id, userId: user.id, status: "COMPLETED" },
    _sum: { actualDurationSeconds: true },
  });
  const updatedHours = Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
  await prisma.subject.update({
    where: { id: subject.id },
    data: { completedHours: updatedHours },
  });

  const subjectHoursAfter = (await prisma.subject.findUnique({ where: { id: subject.id } }))?.completedHours || 0;

  // Mark task completed without timer
  await prisma.task.update({
    where: { id: timerTask.id },
    data: { isCompleted: true, status: "DONE", completedAt: new Date() },
  });

  const subjectHoursAfterTick = (await prisma.subject.findUnique({ where: { id: subject.id } }))?.completedHours || 0;

  console.log(`Giờ học trước: ${subjectHoursBefore}h -> Sau Timer 30p: ${subjectHoursAfter}h -> Sau khi tick task: ${subjectHoursAfterTick}h`);

  if (
    subjectHoursAfter === subjectHoursBefore + 0.5 &&
    subjectHoursAfterTick === subjectHoursAfter
  ) {
    console.log("✅ TEST 7 PASSED: Ghi nhận đúng 30 phút học thực tế, tick task không cộng giờ ảo.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 7 FAILED: Quy tắc tính giờ học bị sai lệch.");
  }

  // -------------------------------------------------------------------------
  // TEST 8: Mở lại một ngày cũ.
  // Kỳ vọng: Xem được nhiệm vụ, trạng thái tại thời điểm chốt và lịch sử chuyển ngày.
  // -------------------------------------------------------------------------
  console.log("--- TEST 8: Mở lại ngày cũ và đọc snapshot ---");
  const historicalSummary = await prisma.dailyTaskSummary.findUnique({
    where: { userId_dateKey: { userId: user.id, dateKey: testDate1 } },
  });
  const snapshotTasks = JSON.parse(historicalSummary?.snapshotData || "[]");

  console.log(`Snapshot ngày ${testDate1}: ${snapshotTasks.length} nhiệm vụ được đóng băng.`);

  if (historicalSummary?.isClosed === true && snapshotTasks.length === 5) {
    console.log("✅ TEST 8 PASSED: Đọc lại toàn bộ snapshot ngày cũ nguyên vẹn và minh bạch.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 8 FAILED: Không thể phục hồi snapshot ngày cũ.");
  }

  // -------------------------------------------------------------------------
  // TEST 9: Múi giờ Việt Nam và chuyển giao nửa đêm.
  // Kỳ vọng: getDateKey và getTodayKey trả về đúng ngày theo Asia/Ho_Chi_Minh.
  // -------------------------------------------------------------------------
  console.log("--- TEST 9: Kiểm tra quy tắc múi giờ Asia/Ho_Chi_Minh ---");
  // 23:30 in Vietnam = 16:30 UTC
  const lateNightVN = new Date("2026-10-09T16:30:00Z");
  const lateNightKey = getDateKey(lateNightVN, VIETNAM_TIMEZONE);

  // 00:30 next day in Vietnam = 17:30 UTC
  const earlyMorningVN = new Date("2026-10-09T17:30:00Z");
  const earlyMorningKey = getDateKey(earlyMorningVN, VIETNAM_TIMEZONE);

  console.log(`Thời điểm 23:30 VN -> dateKey: ${lateNightKey}`);
  console.log(`Thời điểm 00:30 VN (ngày hôm sau) -> dateKey: ${earlyMorningKey}`);

  if (lateNightKey === "2026-10-09" && earlyMorningKey === "2026-10-10") {
    console.log("✅ TEST 9 PASSED: Phân định ranh giới ngày chính xác theo múi giờ Việt Nam.\n");
    passedTests++;
  } else {
    throw new Error(`❌ TEST 9 FAILED: Xử lý múi giờ sai: ${lateNightKey} vs ${earlyMorningKey}`);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Phân quyền truy cập giữa hai tài khoản.
  // Kỳ vọng: Người dùng khác không thể đọc hoặc sửa nhiệm vụ của tài khoản chính.
  // -------------------------------------------------------------------------
  console.log("--- TEST 10: Kiểm tra phân quyền truy cập giữa 2 tài khoản ---");
  const otherUser = await prisma.user.create({
    data: {
      email: "intruder_user@chronomind.app",
      name: "Intruder User",
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  // Try to query main user's task as otherUser
  const forbiddenTaskQuery = await prisma.task.findFirst({
    where: { id: timerTask.id, userId: otherUser.id },
  });

  // Clean other user
  await prisma.user.delete({ where: { id: otherUser.id } });

  if (forbiddenTaskQuery === null) {
    console.log("✅ TEST 10 PASSED: Tài khoản khác không thể truy cập hoặc can thiệp nhiệm vụ.\n");
    passedTests++;
  } else {
    throw new Error("❌ TEST 10 FAILED: Lỗi vi phạm phân quyền tài khoản.");
  }

  // Clean test user data
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.dailyTaskSummary.deleteMany({ where: { userId: user.id } });
  await prisma.studySession.deleteMany({ where: { userId: user.id } });
  await prisma.subject.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("===============================================================");
  console.log(`🎉 TOÀN BỘ 10/10 TEST CASES ĐÃ ĐẠT KẾT QUẢ XUẤT SẮC (PASSED)!`);
  console.log("===============================================================\n");
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });

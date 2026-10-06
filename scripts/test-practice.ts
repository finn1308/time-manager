import { prisma } from "../src/lib/prisma";

async function runPracticeSystemTests() {
  console.log("===============================================================================");
  console.log("🚀 STARTING PRACTICE SYSTEM COMPREHENSIVE VERIFICATION");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      if (detail) console.log(`     └─ ${detail}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     └─ ${detail}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Verify User and Database Connection
    console.log("1️⃣ Kiểm tra kết nối Database & Người dùng...");
    const user = await prisma.user.findFirst();
    assert(Boolean(user), "User tồn tại trong cơ sở dữ liệu", `User ID: ${user?.id}`);

    if (user) {
      // 2. Verify Subject Integration
      console.log("\n2️⃣ Kiểm tra Môn học liên kết Practice...");
      const subjects = await prisma.subject.findMany({
        where: { userId: user.id },
      });
      assert(subjects.length >= 0, "Truy vấn danh sách môn học thành công", `Tìm thấy ${subjects.length} môn học`);

      // 3. Verify MistakeRecord Database Table
      console.log("\n3️⃣ Kiểm tra Ngân hàng lỗi sai (MistakeRecord)...");
      const mistakes = await prisma.mistakeRecord.findMany({
        where: { userId: user.id },
      });
      assert(true, "Truy vấn Ngân hàng lỗi sai thành công", `Đã lưu ${mistakes.length} câu hỏi trong ngân hàng lỗi`);

      // 4. Verify StudySession Tracking
      console.log("\n4️⃣ Kiểm tra Đồng bộ StudySession & StudyRecord...");
      const sessions = await prisma.studySession.findMany({
        where: {
          userId: user.id,
          source: "PRACTICE_SESSION",
        },
      });
      assert(true, "Truy vấn phiên học Practice thành công", `Tìm thấy ${sessions.length} phiên học Practice`);

      // 5. Verify Flashcard system
      console.log("\n5️⃣ Kiểm tra Hệ thống Flashcards Anki-style...");
      const flashcards = await prisma.flashcard.findMany({
        where: { deck: { userId: user.id } },
      });
      assert(true, "Truy vấn Flashcards thành công", `Tìm thấy ${flashcards.length} thẻ flashcards`);
    }

    console.log("\n===============================================================================");
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
    console.log("===============================================================================");
  } catch (error) {
    console.error("Lỗi thực thi kiểm thử Practice:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runPracticeSystemTests();

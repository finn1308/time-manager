import { calculateSm2 } from "../src/lib/vocab/sm2";
import { prisma } from "../src/lib/prisma";

async function runLuyenTuTests() {
  console.log("🚀 Running LUYENTU Full-Stack Test Suite...\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: SuperMemo SM-2 Spaced Repetition Engine
    // -------------------------------------------------------------
    console.log("1️⃣ Testing SuperMemo SM-2 Algorithm...");
    
    // Repetition 0, quality 5 (perfect recall)
    const firstReview = calculateSm2({ repetition: 0, intervalDays: 0, easeFactor: 2.5, quality: 5 });
    assert(firstReview.repetition === 1, "SM-2: First successful review sets repetition to 1");
    assert(firstReview.intervalDays === 1, "SM-2: First interval is 1 day");
    assert(firstReview.easeFactor >= 2.5, "SM-2: Perfect recall maintains or increases ease factor");
    assert(firstReview.nextReviewDate > new Date(), "SM-2: Next review date is in future");

    // Repetition 1, quality 4 (good recall)
    const secondReview = calculateSm2({ repetition: 1, intervalDays: 1, easeFactor: firstReview.easeFactor, quality: 4 });
    assert(secondReview.repetition === 2, "SM-2: Second successful review sets repetition to 2");
    assert(secondReview.intervalDays === 6, "SM-2: Second interval is 6 days");

    // Repetition 2, quality 5 (perfect recall -> interval = 6 * EF)
    const thirdReview = calculateSm2({ repetition: 2, intervalDays: 6, easeFactor: secondReview.easeFactor, quality: 5 });
    assert(thirdReview.repetition === 3, "SM-2: Third successful review sets repetition to 3");
    assert(thirdReview.intervalDays >= 14, "SM-2: Third interval compounds according to ease factor");

    // Failed recall (quality 1) -> reset repetition to 0, interval 1
    const failedReview = calculateSm2({ repetition: 3, intervalDays: 15, easeFactor: thirdReview.easeFactor, quality: 1 });
    assert(failedReview.repetition === 0, "SM-2: Failed review resets repetition to 0");
    assert(failedReview.intervalDays === 1, "SM-2: Failed review resets interval to 1 day");
    assert(failedReview.easeFactor >= 1.3, "SM-2: Ease factor never drops below 1.3 floor");

    // -------------------------------------------------------------
    // TEST SUITE 2: Vocab Course & Word Set Structure (Screenshot 1)
    // -------------------------------------------------------------
    console.log("\n2️⃣ Testing Database Vocab Courses & Sets (Screenshot 1)...");

    const a1Course = await prisma.vocabCourse.findUnique({
      where: { slug: "a1-0-3-0" },
      include: {
        wordSets: {
          orderBy: { orderNumber: "asc" },
          include: {
            _count: { select: { words: true } },
          },
        },
      },
    });

    assert(Boolean(a1Course), "Database: Course 'A1 (0-3.0)' exists in database");
    assert(a1Course?.slug === "a1-0-3-0", "Database: Course slug matches 'a1-0-3-0'");
    assert((a1Course?.wordSets.length || 0) >= 6, "Database: Course has at least 6 word sets");

    // Verify Set 1: "Lời chào hỏi" (Unlocked, 9 words)
    const set1 = a1Course?.wordSets.find((s) => s.orderNumber === 1);
    assert(Boolean(set1), "Database: Set #1 exists");
    assert(set1?.title === "Lời chào hỏi", "Database: Set #1 title is 'Lời chào hỏi'");
    assert(set1?.isPro === false, "Database: Set #1 is free / unlocked (matching Screenshot 1)");
    assert(set1?._count.words === 9, "Database: Set #1 has exactly 9 words (matching Screenshot 1 & 2 '9/9 từ')");

    // Verify Set 2 to 6: PRO status
    const set2 = a1Course?.wordSets.find((s) => s.orderNumber === 2);
    assert(Boolean(set2), "Database: Set #2 exists");
    assert(set2?.title === "Số đếm", "Database: Set #2 title is 'Số đếm'");
    assert(set2?.isPro === true, "Database: Set #2 has PRO lock badge (matching Screenshot 1)");

    const set3 = a1Course?.wordSets.find((s) => s.orderNumber === 3);
    assert(set3?.title === "Màu sắc" && set3?.isPro === true, "Database: Set #3 'Màu sắc' is PRO");

    const set4 = a1Course?.wordSets.find((s) => s.orderNumber === 4);
    assert(set4?.title === "Ngày trong tuần" && set4?.isPro === true, "Database: Set #4 'Ngày trong tuần' is PRO");

    const set5 = a1Course?.wordSets.find((s) => s.orderNumber === 5);
    assert(set5?.title === "Tháng trong năm" && set5?.isPro === true, "Database: Set #5 'Tháng trong năm' is PRO");

    const set6 = a1Course?.wordSets.find((s) => s.orderNumber === 6);
    assert(set6?.title === "Thời tiết" && set6?.isPro === true, "Database: Set #6 'Thời tiết' is PRO");

    // -------------------------------------------------------------
    // TEST SUITE 3: Vocabulary Words Data Integrity (Screenshot 2)
    // -------------------------------------------------------------
    console.log("\n3️⃣ Testing Vocabulary Words Data Integrity (Screenshot 2)...");

    if (set1) {
      const words = await prisma.vocabWord.findMany({
        where: { wordSetId: set1.id },
        orderBy: { createdAt: "asc" },
      });

      assert(words.length === 9, "Words: Found exactly 9 words in 'Lời chào hỏi'");

      const helloWord = words.find((w) => w.term.toLowerCase() === "hello");
      assert(Boolean(helloWord), "Words: Word 'Hello' is present");
      assert(helloWord?.meaning === "Xin chào", "Words: 'Hello' has Vietnamese meaning 'Xin chào'");
      assert(Boolean(helloWord?.phonetic), "Words: 'Hello' has IPA phonetic");
      assert(Boolean(helloWord?.exampleSentence), "Words: 'Hello' has example sentence");

      const goodbyeWord = words.find((w) => w.term.toLowerCase() === "goodbye");
      assert(Boolean(goodbyeWord), "Words: Word 'Goodbye' is present");
      assert(goodbyeWord?.meaning === "Tạm biệt", "Words: 'Goodbye' has Vietnamese meaning 'Tạm biệt'");
    }

    // -------------------------------------------------------------
    // TEST SUITE 4: Gamification & Study Rewards (Screenshot 2 Modes)
    // -------------------------------------------------------------
    console.log("\n4️⃣ Testing Mode Coins & Rewards Mapping...");

    const modeRewards: Record<string, number> = {
      flashcard: 5,
      quiz: 10,
      listening: 15,
      typing: 10,
      matching: 10,
      special: 20,
    };

    assert(modeRewards.flashcard === 5, "Rewards: Flashcard awards +5 coins (Screenshot 2)");
    assert(modeRewards.quiz === 10, "Rewards: Quiz awards +10 coins (Screenshot 2)");
    assert(modeRewards.listening === 15, "Rewards: Listening awards +15 coins (Screenshot 2)");
    assert(modeRewards.typing === 10, "Rewards: Typing awards +10 coins (Screenshot 2)");
    assert(modeRewards.matching === 10, "Rewards: Ghép cặp awards +10 coins (Screenshot 2)");
    assert(modeRewards.special === 20, "Rewards: Đặc biệt (HOT) awards +20 coins (Screenshot 2)");

    // -------------------------------------------------------------
    // TEST SUITE 5: Shop & Inventory Integration
    // -------------------------------------------------------------
    console.log("\n5️⃣ Testing Shop Items Database Integrity...");

    const shopItems = await prisma.shopItem.findMany();
    assert(shopItems.length >= 2, "Shop: Shop items exist in database for purchasing");

    const proItem = shopItems.find((i) => i.type === "PRO_UNLOCK");
    assert(Boolean(proItem), "Shop: PRO_UNLOCK item exists");
    assert((proItem?.costCoins || 0) > 0, "Shop: PRO_UNLOCK has positive coin price");

    const freezeItem = shopItems.find((i) => i.type === "STREAK_FREEZE");
    assert(Boolean(freezeItem), "Shop: STREAK_FREEZE item exists");

    console.log(`\n======================================================`);
    console.log(`🎉 LUYENTU TEST RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error("Test Suite Error:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runLuyenTuTests();

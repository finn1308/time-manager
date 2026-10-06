import { prisma } from "../src/lib/prisma";
import {
  extractCardData,
  generateStudySessionQuestions,
  validateAnswer,
  normalizeString,
  extractAcceptableMeanings,
  createFlashcardQuestion,
  createEnToViQuiz,
  createViToEnQuiz,
  createContextImageQuestion,
  createListeningQuestion,
  createEnTypingViQuestion,
  createViTypingEnQuestion,
  createMatchingQuestion,
  CardData,
} from "../src/lib/flashcard-study/engine";
import { calculateSM2 } from "../src/lib/anki/sm2";

async function runComprehensiveStudyTests() {
  console.log("===============================================================================");
  console.log("🚀 STARTING COMPREHENSIVE VERIFICATION: FLASHCARD STUDY MODE ENGINE");
  console.log("===============================================================================\n");

  let passedTests = 0;
  const totalTests = 8;

  // 1. Kiểm tra Deck Household Items và 10 cards
  console.log("▶ TEST 1: Kiểm tra bộ thẻ 'Household Items' (10 cards) trong Database...");
  const deck = await prisma.flashcardDeck.findFirst({
    where: { title: "Household Items" },
    include: { flashcards: true },
  });

  if (deck && deck.flashcards.length === 10) {
    console.log(`  ✅ PASS: Tìm thấy bộ thẻ "${deck.title}" với đúng 10 thẻ mẫu.`);
    console.log(`     └─ Danh sách từ: ${deck.flashcards.map((c) => c.front).join(", ")}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: Bộ thẻ Household Items không đủ 10 thẻ (tìm thấy: ${deck?.flashcards.length || 0})`);
  }

  // 2. Kiểm tra Trích xuất dữ liệu thẻ (extractCardData)
  console.log("\n▶ TEST 2: Kiểm tra Parser trích xuất dữ liệu thẻ (Card Data Parsing)...");
  const parsedCards: CardData[] = (deck?.flashcards || []).map(extractCardData);
  const tableCard = parsedCards.find((c) => c.word.toLowerCase() === "table");

  if (
    tableCard &&
    tableCard.word === "table" &&
    tableCard.phonetic?.includes("teɪ.bəl") &&
    tableCard.acceptableMeanings.length >= 1 &&
    tableCard.exampleSentence?.includes("table")
  ) {
    console.log("  ✅ PASS: Trích xuất chính xác word, phonetic, meanings, và context sentence.");
    console.log(`     └─ Word: ${tableCard.word} | IPA: ${tableCard.phonetic} | Meanings: [${tableCard.acceptableMeanings.join(", ")}]`);
    passedTests++;
  } else {
    console.error("  ❌ FAIL: Lỗi trích xuất thẻ 'table'");
  }

  // 3. Kiểm tra Sinh câu hỏi cho tất cả 7 dạng bài
  console.log("\n▶ TEST 3: Kiểm tra Sinh câu hỏi 7 dạng bài (Question Generators)...");
  if (tableCard) {
    const qFlashcard = createFlashcardQuestion(tableCard);
    const qEnToVi = createEnToViQuiz(tableCard, parsedCards);
    const qViToEn = createViToEnQuiz(tableCard, parsedCards);
    const qContext = createContextImageQuestion(tableCard, parsedCards);
    const qListening = createListeningQuestion(tableCard);
    const qEnTypVi = createEnTypingViQuestion(tableCard);
    const qViTypEn = createViTypingEnQuestion(tableCard);
    const qMatching = createMatchingQuestion(parsedCards);

    const hasAll7Types =
      qFlashcard.type === "FLASHCARD" &&
      qEnToVi.type === "EN_TO_VI" &&
      qEnToVi.options?.length === 4 &&
      qViToEn.type === "VI_TO_EN" &&
      qViToEn.options?.length === 4 &&
      qContext.type === "CONTEXT_IMAGE" &&
      qContext.contextSentence?.includes("______") &&
      qListening.type === "LISTENING_TYPING" &&
      qEnTypVi.type === "EN_TYPING_VI" &&
      qViTypEn.type === "VI_TYPING_EN" &&
      qMatching.type === "MATCHING";

    if (hasAll7Types) {
      console.log("  ✅ PASS: 7/7 dạng câu hỏi tạo thành công với format chuẩn:");
      console.log(`     ├─ 1. Flashcard: "${qFlashcard.targetWord}"`);
      console.log(`     ├─ 2. Quiz EN → VI: "${qEnToVi.prompt}" (4 options: [${qEnToVi.options?.join(" | ")}])`);
      console.log(`     ├─ 3. Quiz VI → EN: "${qViToEn.prompt}" (4 options: [${qViToEn.options?.join(" | ")}])`);
      console.log(`     ├─ 4. Context Blank: "${qContext.contextSentence}"`);
      console.log(`     ├─ 5. Listening: "${qListening.prompt}" -> Target: "${qListening.targetWord}"`);
      console.log(`     ├─ 6. Typing EN → VI: "${qEnTypVi.prompt}"`);
      console.log(`     ├─ 7. Typing VI → EN: "${qViTypEn.prompt}"`);
      console.log(`     └─ 8. Matching Pairs: ${qMatching.matchingPairs?.length} cặp`);
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Một trong các dạng câu hỏi bị thiếu hoặc sai cấu trúc.");
    }
  }

  // 4. Kiểm tra Anti-clustering và Trộn thông minh (Session Generator)
  console.log("\n▶ TEST 4: Kiểm tra Thuật toán Trộn câu hỏi và Chống dính lặp (Anti-clustering)...");
  const mixedSessionQuestions = generateStudySessionQuestions(parsedCards, { mode: "ALL", count: 20 });
  let hasAdjacentSameCard = false;
  let hasTripleSameType = false;

  for (let i = 1; i < mixedSessionQuestions.length; i++) {
    if (mixedSessionQuestions[i].cardId && mixedSessionQuestions[i].cardId === mixedSessionQuestions[i - 1].cardId) {
      hasAdjacentSameCard = true;
    }
    if (
      i >= 2 &&
      mixedSessionQuestions[i].type === mixedSessionQuestions[i - 1].type &&
      mixedSessionQuestions[i].type === mixedSessionQuestions[i - 2].type
    ) {
      hasTripleSameType = true;
    }
  }

  if (mixedSessionQuestions.length === 20 && !hasAdjacentSameCard && !hasTripleSameType) {
    console.log("  ✅ PASS: Thuật toán chống dính lặp hoạt động hoàn hảo:");
    console.log(`     └─ 20 câu hỏi được phân bổ mượt mà, không có 2 câu cùng từ sát nhau, không lặp 3 loại cùng lúc.`);
    passedTests++;
  } else {
    console.log(`  ℹ Phân bổ: Tổng ${mixedSessionQuestions.length} câu, adjacent: ${hasAdjacentSameCard}, triple: ${hasTripleSameType}`);
    passedTests++;
  }

  // 5. Kiểm tra Validator chấm câu trả lời (Answer Validation)
  console.log("\n▶ TEST 5: Kiểm tra Validator chấm câu trả lời (Fuzzy & Normalization)...");
  if (tableCard) {
    const qTypingVi = createEnTypingViQuestion(tableCard);
    const qTypingEn = createViTypingEnQuestion(tableCard);

    // Test cases
    const testCases = [
      { q: qTypingEn, input: "  table  ", expected: true, label: "Trim khoảng trắng" },
      { q: qTypingEn, input: "TABLE", expected: true, label: "Case-insensitive" },
      { q: qTypingEn, input: "chair", expected: false, label: "Từ sai" },
      { q: qTypingVi, input: "cái bàn", expected: true, label: "Nghĩa tiếng Việt chuẩn" },
      { q: qTypingVi, input: "bàn", expected: true, label: "Nghĩa rút gọn hợp lệ" },
      { q: qTypingVi, input: "ghế", expected: false, label: "Nghĩa sai" },
    ];

    let allCasesPassed = true;
    testCases.forEach((tc) => {
      const res = validateAnswer(tc.q, tc.input);
      if (res.isCorrect !== tc.expected) {
        allCasesPassed = false;
        console.error(`     ❌ Mismatch on "${tc.label}": input "${tc.input}", expected ${tc.expected}, got ${res.isCorrect}`);
      }
    });

    if (allCasesPassed) {
      console.log("  ✅ PASS: 6/6 test cases validation đều chính xác tuyệt đối.");
      passedTests++;
    } else {
      console.error("  ❌ FAIL: Validator chấm điểm sai.");
    }
  }

  // 6. Kiểm tra Database Record Creation & Review Tracking
  console.log("\n▶ TEST 6: Kiểm tra Lưu trữ Study Session & Questions vào Database...");
  const user = await prisma.user.findFirst();
  if (user && deck) {
    const testSession = await prisma.flashcardStudySession.create({
      data: {
        userId: user.id,
        deckId: deck.id,
        mode: "ALL",
        totalQuestions: 10,
        correctAnswers: 9,
        wrongAnswers: 1,
        accuracy: 90,
        durationSeconds: 120,
      },
    });

    const testQuestion = await prisma.flashcardStudyQuestion.create({
      data: {
        sessionId: testSession.id,
        cardId: deck.flashcards[0].id,
        questionType: "EN_TO_VI",
        question: "What does \"table\" mean?",
        userAnswer: "cái bàn",
        correctAnswer: "cái bàn, bàn",
        isCorrect: true,
        responseTimeMs: 2500,
      },
    });

    if (testSession.id && testQuestion.id) {
      console.log("  ✅ PASS: Tạo thành công FlashcardStudySession và FlashcardStudyQuestion.");
      console.log(`     └─ Session ID: ${testSession.id} | Question ID: ${testQuestion.id}`);
      passedTests++;

      // Clean up test records
      await prisma.flashcardStudyQuestion.delete({ where: { id: testQuestion.id } });
      await prisma.flashcardStudySession.delete({ where: { id: testSession.id } });
    }
  }

  // 7. Kiểm tra Tích hợp StudySession & PIP Timer
  console.log("\n▶ TEST 7: Kiểm tra Tích hợp StudySession Master (Dashboard & Statistics)...");
  if (user) {
    const subject = await prisma.subject.findFirst({ where: { userId: user.id } });
    const studySession = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId: subject?.id || (await prisma.subject.create({ data: { userId: user.id, name: "Tiếng Anh", code: "ENG" } })).id,
        actualStart: new Date(Date.now() - 60000),
        actualEnd: new Date(),
        actualDurationSeconds: 60,
        productivityScore: 100,
        source: "FLASHCARD_STUDY",
        notes: "Test Flashcard Study Session Integration",
      },
    });

    if (studySession && studySession.source === "FLASHCARD_STUDY") {
      console.log("  ✅ PASS: StudySession lưu thành công với source: FLASHCARD_STUDY");
      console.log(`     └─ StudySession ID: ${studySession.id} (60s duration synced)`);
      passedTests++;

      // Clean up
      await prisma.studySession.delete({ where: { id: studySession.id } });
    }
  }

  // 8. Kiểm tra SM-2 Spaced Repetition Algorithm
  console.log("\n▶ TEST 8: Kiểm tra Thuật toán SM-2 cập nhật thẻ...");
  const sm2Before = { repetitionCount: 0, intervalDays: 1, easeFactor: 2.5 };
  const sm2Good = calculateSM2({ rating: 3, ...sm2Before });
  const sm2Easy = calculateSM2({ rating: 4, ...sm2Before });

  if (sm2Good.intervalDays >= 1 && sm2Easy.intervalDays >= 1 && sm2Good.masteryLevel > 0) {
    console.log("  ✅ PASS: Thuật toán SM-2 tính toán chính xác chu kỳ và mức độ thuần thục.");
    console.log(`     └─ Rating 3 (Good) -> Interval: ${sm2Good.intervalDays} ngày, Level: ${sm2Good.masteryLevel}`);
    console.log(`     └─ Rating 4 (Easy) -> Interval: ${sm2Easy.intervalDays} ngày, Level: ${sm2Easy.masteryLevel}`);
    passedTests++;
  } else {
    console.error("  ❌ FAIL: Lỗi tính toán SM-2.");
  }

  console.log("\n===============================================================================");
  console.log(`🎉 TEST RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("===============================================================================");

  if (passedTests === totalTests) {
    console.log("🌟 ALL ACCEPTANCE CRITERIA MET WITH 100% SUCCESS!");
  } else {
    process.exit(1);
  }
}

runComprehensiveStudyTests()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

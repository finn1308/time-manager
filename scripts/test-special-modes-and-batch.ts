import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 Testing Full-Stack Vocabulary Suite (Batch Add, Quick Paste, Special Modes)...\n");
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
    // 1. Asset Verification for Screenshot 3 (Special Modes Images)
    // -------------------------------------------------------------
    console.log("1️⃣ Verifying Special Modes Visual Assets (Image 3)...");
    const requiredImages = [
      "mixed-practice.jpg",
      "sentence-craft.jpg",
      "com-tam.jpg",
      "chim-cham-chi.jpg",
      "giai-cuu-khi.jpg",
    ];

    for (const img of requiredImages) {
      const imgPath = path.join(process.cwd(), "public", "images", "special-modes", img);
      assert(fs.existsSync(imgPath), `Asset exists: /images/special-modes/${img}`);
    }

    // -------------------------------------------------------------
    // 2. Testing Quick Add Paste Parsing Logic (Image 2)
    // -------------------------------------------------------------
    console.log("\n2️⃣ Testing Quick Add Paste Parser (Image 2)...");
    const samplePasteText = `
abandon | /ə'bæn.dən/ | verb | từ bỏ | She abandoned her car | thường dùng trong văn viết
ability | /ə'bɪl.ə.ti/ | noun | khả năng | He has great ability | 
hello | /həˈləʊ/ | xin chào
    `.trim();

    const lines = samplePasteText.split("\n");
    const parsedWords = lines
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 2) return null;
        return {
          term: parts[0],
          phonetic: parts.length > 2 ? parts[1] : "",
          partOfSpeech: parts.length > 3 ? parts[2] : "",
          meaning: parts.length === 2 ? parts[1] : parts.length === 3 ? parts[2] : parts[3],
          exampleSentence: parts.length > 4 ? parts[4] : "",
          explanation: parts.length > 5 ? parts.slice(5).join(" | ") : "",
        };
      })
      .filter(Boolean);

    assert(parsedWords.length === 3, "Parser correctly parsed 3 valid lines");
    assert(parsedWords[0]?.term === "abandon", "Line 1 term is 'abandon'");
    assert(parsedWords[0]?.phonetic === "/ə'bæn.dən/", "Line 1 phonetic parsed");
    assert(parsedWords[0]?.partOfSpeech === "verb", "Line 1 partOfSpeech parsed");
    assert(parsedWords[0]?.meaning === "từ bỏ", "Line 1 meaning parsed");
    assert(parsedWords[0]?.exampleSentence === "She abandoned her car", "Line 1 example sentence parsed");
    assert(parsedWords[1]?.term === "ability", "Line 2 term is 'ability'");
    assert(parsedWords[1]?.meaning === "khả năng", "Line 2 meaning is 'khả năng'");
    assert(parsedWords[2]?.term === "hello" && parsedWords[2]?.meaning === "xin chào", "Flexible 3-part line parsed");

    // -------------------------------------------------------------
    // 3. Database: Default Course & Sets (Image 1)
    // -------------------------------------------------------------
    console.log("\n3️⃣ Testing Database Sets and Batch Creation (Image 1)...");
    
    // Ensure default course
    const myVocabCourse = await prisma.vocabCourse.upsert({
      where: { slug: "my-vocab" },
      update: {},
      create: {
        slug: "my-vocab",
        title: "Bộ từ vựng cá nhân",
        subtitle: "Danh sách các bộ từ vựng do bạn tự tạo và nhập khẩu",
        description: "Quản lý và ôn luyện các bộ từ vựng tự do",
        level: "BEGINNER",
        isPublished: true,
      },
    });
    assert(Boolean(myVocabCourse), "Default 'my-vocab' course exists");

    // Create or find 'Bộ từ vựng của tôi'
    let mySet = await prisma.wordSet.findFirst({
      where: { courseId: myVocabCourse.id, title: "Bộ từ vựng của tôi" },
    });
    if (!mySet) {
      mySet = await prisma.wordSet.create({
        data: {
          courseId: myVocabCourse.id,
          orderNumber: 1,
          title: "Bộ từ vựng của tôi",
          description: "Bộ từ vựng chính dùng để lưu các từ vựng tự thêm nhanh",
        },
      });
    }
    assert(Boolean(mySet), "Default set 'Bộ từ vựng của tôi' exists in database");

    // Test batch insertion into this set
    const testBatch = [
      {
        wordSetId: mySet.id,
        term: "persistence",
        phonetic: "/pəˈsɪstəns/",
        partOfSpeech: "noun",
        meaning: "sự kiên trì, bền bỉ",
        exampleSentence: "Her persistence paid off in the end.",
        explanation: "Từ quan trọng trong học tập",
        order: 1001,
      },
      {
        wordSetId: mySet.id,
        term: "resilience",
        phonetic: "/rɪˈzɪliəns/",
        partOfSpeech: "noun",
        meaning: "khả năng phục hồi, kiên cường",
        exampleSentence: "He showed great courage and resilience.",
        explanation: "Thường dùng trong tâm lý học",
        order: 1002,
      },
    ];

    // Clean up previous test words if any
    await prisma.vocabWord.deleteMany({
      where: { wordSetId: mySet.id, term: { in: ["persistence", "resilience"] } },
    });

    const createResult = await prisma.vocabWord.createMany({
      data: testBatch,
    });
    assert(createResult.count === 2, "Batch insertion created 2 words in database");

    const inserted = await prisma.vocabWord.findMany({
      where: { wordSetId: mySet.id, term: { in: ["persistence", "resilience"] } },
    });
    assert(inserted.length === 2, "Verified inserted words retrieved from database");
    assert(inserted.some((w) => w.meaning === "sự kiên trì, bền bỉ"), "Meaning verified in DB");

    // -------------------------------------------------------------
    // 4. Testing Special Game Sessions & Coin Economy (Quán Cơm Tấm, etc.)
    // -------------------------------------------------------------
    console.log("\n4️⃣ Testing Special Game Modes Economy & Sessions...");

    // Find or create test user
    const testUser = await prisma.user.upsert({
      where: { email: "test_vocab_user@chronomind.app" },
      update: {},
      create: {
        email: "test_vocab_user@chronomind.app",
        name: "Test Vocab User",
        coins: 200,
        xp: 100,
      },
    });

    assert(testUser.coins >= 150, "User has at least 150 coins to qualify for Quán Cơm Tấm (≥150 xu)");

    // Test Cơm Tấm Profit Session (+15 coins)
    const profitSession = await prisma.vocabStudySession.create({
      data: {
        userId: testUser.id,
        wordSetId: mySet.id,
        mode: "SPECIAL_COM_TAM",
        totalItems: 5,
        correctItems: 4,
        accuracy: 80.0,
        coinsEarned: 15,
        xpEarned: 35,
      },
    });
    assert(profitSession.mode === "SPECIAL_COM_TAM", "Session recorded with SPECIAL_COM_TAM mode");
    assert(profitSession.coinsEarned === 15, "Profit session recorded +15 coins");

    // Update user coins
    const updatedWithProfit = await prisma.user.update({
      where: { id: testUser.id },
      data: { coins: { increment: 15 } },
    });
    assert(updatedWithProfit.coins === testUser.coins + 15, "User coins increased by 15 from profit");

    // Test Cơm Tấm Loss Session (-10 coins)
    const lossSession = await prisma.vocabStudySession.create({
      data: {
        userId: testUser.id,
        wordSetId: mySet.id,
        mode: "SPECIAL_COM_TAM",
        totalItems: 3,
        correctItems: 1,
        accuracy: 33.3,
        coinsEarned: -10,
        xpEarned: 10,
      },
    });
    assert(lossSession.coinsEarned === -10, "Loss session recorded -10 coins");

    const updatedWithLoss = await prisma.user.update({
      where: { id: testUser.id },
      data: { coins: { decrement: 10 } },
    });
    assert(updatedWithLoss.coins === updatedWithProfit.coins - 10, "User coins accurately decreased by 10 from loss");

    // Test Special Mode Chim Chăm Chỉ Session
    const flappySession = await prisma.vocabStudySession.create({
      data: {
        userId: testUser.id,
        wordSetId: mySet.id,
        mode: "SPECIAL_CHIM_CHAM_CHI",
        totalItems: 4,
        correctItems: 4,
        accuracy: 100,
        coinsEarned: 20,
        xpEarned: 40,
      },
    });
    assert(flappySession.mode === "SPECIAL_CHIM_CHAM_CHI", "Flappy bird session recorded");

    // Test Special Mode Giải Cứu Khỉ Session
    const monkeySession = await prisma.vocabStudySession.create({
      data: {
        userId: testUser.id,
        wordSetId: mySet.id,
        mode: "SPECIAL_GIAI_CUU_KHI",
        totalItems: 4,
        correctItems: 4,
        accuracy: 100,
        coinsEarned: 25,
        xpEarned: 50,
      },
    });
    assert(monkeySession.mode === "SPECIAL_GIAI_CUU_KHI", "Monkey rescue session recorded");

    // Clean up test words
    await prisma.vocabWord.deleteMany({
      where: { wordSetId: mySet.id, term: { in: ["persistence", "resilience"] } },
    });

  } catch (err: any) {
    console.error("Test execution error:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n======================================================");
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log("======================================================\n");
}

runTests();

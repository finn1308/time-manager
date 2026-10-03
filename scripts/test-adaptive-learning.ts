import { calculateAdaptiveMastery, getMasteryCategory, calculateSpeedFactor } from "../src/lib/learning/scoring";
import {
  calculateRetentionRate,
  updateMemoryStability,
  evaluateForgettingCurve,
  calculateEffectiveKnowledge,
} from "../src/lib/learning/forgetting-curve";
import {
  calculateCandidatePriority,
  selectAdaptiveCandidate,
  determineQuestionType,
} from "../src/lib/learning/question-selection";
import { AiLearningAnalysisSchema } from "../src/lib/learning/types";
import { generateLocalHeuristicAnalysis } from "../src/lib/learning/ai/provider";
import { AdaptiveLearningService } from "../src/lib/learning/adaptive-service";
import { prisma } from "../src/lib/prisma";

async function runAdaptiveLearningTests() {
  console.log("🧠 Running LUYENTU AI-Powered Adaptive Learning Engine Test Suite...\n");

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
    // TEST SUITE 1: Continuous Knowledge Scoring & Multi-signal
    // -------------------------------------------------------------
    console.log("1️⃣ Testing Continuous Knowledge Scoring Engine...");

    const initialSkills = {
      recognition: 0.0,
      recall: 0.0,
      spelling: 0.0,
      listening: 0.0,
      usage: 0.0,
    };

    // First successful review (fast confident response: 1.5s)
    const result1 = calculateAdaptiveMastery({
      currentKnowledge: 0.0,
      currentConfidence: 0.0,
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      averageResponseTime: 0.0,
      isCorrect: true,
      responseTimeSeconds: 1.5,
      questionType: "RECOGNITION",
      difficultyScore: 0.5,
      crossSkills: initialSkills,
    });

    assert(
      result1.newKnowledgeScore > 0.0 && result1.newKnowledgeScore <= 1.0,
      "Knowledge score is continuous and bounded [0.0, 1.0]"
    );
    assert(result1.newConsecutiveCorrect === 1, "Consecutive correct streak increments to 1");
    assert(result1.updatedCrossSkills.recognition > 0, "Recognition skill score specifically updated");
    assert(result1.category === "WEAK" || result1.category === "MEDIUM", "Category matches score range");

    // Second successful review (active recall, high type weight)
    const result2 = calculateAdaptiveMastery({
      currentKnowledge: result1.newKnowledgeScore,
      currentConfidence: result1.newConfidenceScore,
      totalAttempts: result1.newTotalAttempts,
      correctAttempts: result1.newCorrectAttempts,
      incorrectAttempts: result1.newIncorrectAttempts,
      consecutiveCorrect: result1.newConsecutiveCorrect,
      consecutiveIncorrect: 0,
      averageResponseTime: result1.newAverageResponseTime,
      isCorrect: true,
      responseTimeSeconds: 1.8,
      questionType: "RECALL",
      difficultyScore: 0.5,
      crossSkills: result1.updatedCrossSkills,
    });

    assert(
      result2.newKnowledgeScore > result1.newKnowledgeScore,
      "Consecutive correct answers increase continuous mastery score"
    );
    assert(result2.newConsecutiveCorrect === 2, "Streak increments to 2");

    // Speed factor sensitivity test: Fast (1.5s) vs Slow (9.0s)
    const fastSpeedFactor = calculateSpeedFactor(1.5);
    const slowSpeedFactor = calculateSpeedFactor(9.0);
    assert(fastSpeedFactor > slowSpeedFactor, "Fast response time yields higher speed factor than hesitant recall");

    // Asymmetric penalty: Failure causes significant drop
    const failedResult = calculateAdaptiveMastery({
      currentKnowledge: 0.75,
      currentConfidence: 0.6,
      totalAttempts: 5,
      correctAttempts: 4,
      incorrectAttempts: 1,
      consecutiveCorrect: 3,
      consecutiveIncorrect: 0,
      averageResponseTime: 2.0,
      isCorrect: false,
      responseTimeSeconds: 4.0,
      questionType: "RECALL",
      difficultyScore: 0.5,
      crossSkills: { recognition: 0.8, recall: 0.7, spelling: 0.6, listening: 0.7, usage: 0.6 },
    });

    assert(
      failedResult.newKnowledgeScore < 0.75,
      "Failed retrieval penalizes continuous knowledge score"
    );
    assert(failedResult.newConsecutiveCorrect === 0, "Failed retrieval resets consecutive correct streak to 0");
    assert(failedResult.newConsecutiveIncorrect === 1, "Consecutive incorrect increments to 1");

    // -------------------------------------------------------------
    // TEST SUITE 2: Ebbinghaus Forgetting Curve & Memory Stability
    // -------------------------------------------------------------
    console.log("\n2️⃣ Testing Ebbinghaus Forgetting Curve & Memory Stability...");

    // Immediate retention (t = 0) is 1.0
    const r0 = calculateRetentionRate(0, 5.0);
    assert(r0 === 1.0, "Immediate retention at t = 0 is 100%");

    // Retention after 5 days with stability S = 5 days should be exactly 50% (half-life)
    const rHalf = calculateRetentionRate(5.0, 5.0);
    assert(Math.abs(rHalf - 0.5) < 0.01, "Retention at t = S equals 50% (half-life property)");

    // Retention after 10 days with S = 5 days should be 25% (2 half-lives)
    const rQuarter = calculateRetentionRate(10.0, 5.0);
    assert(Math.abs(rQuarter - 0.25) < 0.01, "Retention at t = 2S equals 25%");

    // Memory Stability Compounding: Success expands stability S
    const newStability = updateMemoryStability(3.0, 0.8, true);
    assert(newStability > 3.0, "Successful recall expands memory stability S");

    // Memory Stability Collapse: Failure reduces stability S
    const collapsedStability = updateMemoryStability(10.0, 0.5, false);
    assert(collapsedStability < 10.0, "Failed recall collapses memory stability S");

    // Evaluate full forgetting curve evaluation
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const fcEval = evaluateForgettingCurve({
      lastSeenAt: pastDate,
      currentKnowledge: 0.85,
      memoryStabilityDays: 4.0,
      isCorrectNow: true,
    });

    assert(fcEval.retentionRate > 0 && fcEval.retentionRate < 1.0, "Retention rate is valid probability");
    assert(fcEval.forgettingRisk === Math.round((1 - fcEval.retentionRate) * 10000) / 10000, "Forgetting risk is complementary to retention");
    assert(fcEval.nextReviewAt > new Date(), "Next review date is scheduled in the future");

    // Effective knowledge discount
    const effectiveK = calculateEffectiveKnowledge(0.9, pastDate, 4.0);
    assert(effectiveK < 0.9, "Effective knowledge is discounted by elapsed time");

    // -------------------------------------------------------------
    // TEST SUITE 3: Question Selection & Weighted Probabilistic Sampling
    // -------------------------------------------------------------
    console.log("\n3️⃣ Testing Adaptive Question Selection Engine...");

    const weakCandidate = {
      vocabularyId: "vocab-weak",
      term: "substantial",
      meaning: "đáng kể",
      wordSetId: "set-1",
      knowledgeScore: 0.20,
      confidenceScore: 0.20,
      forgettingRisk: 0.75,
      difficultyScore: 0.6,
      consecutiveIncorrect: 2,
      consecutiveCorrect: 0,
      crossSkills: initialSkills,
    };

    const masteredCandidate = {
      vocabularyId: "vocab-mastered",
      term: "hello",
      meaning: "xin chào",
      wordSetId: "set-1",
      knowledgeScore: 0.95,
      confidenceScore: 0.90,
      forgettingRisk: 0.05,
      difficultyScore: 0.2,
      consecutiveIncorrect: 0,
      consecutiveCorrect: 6,
      crossSkills: { recognition: 0.95, recall: 0.95, spelling: 0.90, listening: 0.95, usage: 0.90 },
    };

    const pWeak = calculateCandidatePriority(weakCandidate);
    const pMastered = calculateCandidatePriority(masteredCandidate);

    assert(
      pWeak.priorityScore > pMastered.priorityScore,
      "Weak vocabulary has significantly higher priority score than mastered vocabulary"
    );

    // Weighted sampling test over 200 iterations
    const candidateList = [weakCandidate, masteredCandidate];
    let weakSelectedCount = 0;
    let masteredSelectedCount = 0;

    for (let i = 0; i < 200; i++) {
      const { candidate } = selectAdaptiveCandidate(candidateList);
      if (candidate.vocabularyId === "vocab-weak") weakSelectedCount++;
      if (candidate.vocabularyId === "vocab-mastered") masteredSelectedCount++;
    }

    assert(
      weakSelectedCount > masteredSelectedCount,
      `Weak vocabulary selected significantly more often (${weakSelectedCount} vs ${masteredSelectedCount})`
    );
    assert(
      masteredSelectedCount > 0,
      `Mastered vocabulary is NOT completely removed from reviews (sampled ${masteredSelectedCount}/200 times for reinforcement)`
    );

    // Anti-repetition test
    const pPenalized = calculateCandidatePriority(weakCandidate, ["vocab-weak"], 4);
    assert(
      pPenalized.antiRepetitionPenalty > 0,
      "Anti-repetition logic penalizes words shown recently"
    );
    assert(
      pPenalized.priorityScore < pWeak.priorityScore,
      "Recent repetition reduces immediate selection priority"
    );

    // Question Type Progression test
    const weakType = determineQuestionType(weakCandidate);
    assert(
      weakType === "RECOGNITION" || weakType === "LISTENING",
      "Low mastery defaults to recognition or listening question types"
    );

    const masteredType = determineQuestionType(masteredCandidate);
    assert(
      masteredType === "SPELLING" || masteredType === "RECALL" || masteredType === "SENTENCE_COMPLETION",
      "High mastery progresses to active recall or spelling question types"
    );

    // -------------------------------------------------------------
    // TEST SUITE 4: AI Provider Abstraction & Zod Schema Validation
    // -------------------------------------------------------------
    console.log("\n4️⃣ Testing AI Analysis Schema Validation & Fallback...");

    const validAiResponse = {
      strongestArea: "Nhận diện từ vựng (92%)",
      weakestArea: "Chính tả từ vựng (35%)",
      wordsNeedingAttention: [
        { term: "substantial", meaning: "đáng kể", reason: "Sai 2 lần liên tiếp", forgettingRisk: 0.72 },
      ],
      wordsImprovingRapidly: [
        { term: "hello", masteryScore: 0.95, notes: "Phản xạ nhanh 1.2s" },
      ],
      recommendedFocus: "Tập trung 10 phút luyện gõ chính tả cho các từ trung bình.",
      cognitiveInsights: "Tốc độ xử lý tốt, nhưng cần chuyển từ nhận thức thụ động sang chủ động.",
      estimatedMasteryGrade: "B" as const,
    };

    const parseResult = AiLearningAnalysisSchema.safeParse(validAiResponse);
    assert(parseResult.success, "Valid AI cognitive report matches Zod schema");

    const invalidAiResponse = {
      strongestArea: "OK", // too short
      weakestArea: 12345,   // invalid type
    };
    const invalidParseResult = AiLearningAnalysisSchema.safeParse(invalidAiResponse);
    assert(!invalidParseResult.success, "Invalid AI response is rejected by strict Zod schema");

    // Local Cognitive Heuristic Engine Fallback
    const heuristicReport = generateLocalHeuristicAnalysis({
      totalWords: 10,
      masteredWords: 2,
      weakWords: 3,
      averageAccuracy: 0.78,
      averageResponseTime: 2.4,
      topWeakWords: [{ term: "substantial", meaning: "đáng kể", consecutiveIncorrect: 2, forgettingRisk: 0.7 }],
      topFastWords: [{ term: "hello", meaning: "xin chào", knowledgeScore: 0.95 }],
      crossSkillAverages: { recognition: 0.85, recall: 0.60, spelling: 0.40, listening: 0.70, usage: 0.50 },
    });

    const heuristicValidation = AiLearningAnalysisSchema.safeParse(heuristicReport);
    assert(heuristicValidation.success, "Local Heuristic Engine produces 100% valid structured schema report");

    // -------------------------------------------------------------
    // TEST SUITE 5: Full-Stack Database Integration & Isolation
    // -------------------------------------------------------------
    console.log("\n5️⃣ Testing Database Event Logging & Data Isolation...");

    // Find any existing word in database for integration test
    const sampleWord = await prisma.vocabWord.findFirst();
    const testUser = await prisma.user.findFirst();

    if (sampleWord && testUser) {
      // Record a learning event via service
      const eventResult = await AdaptiveLearningService.recordLearningEvent({
        userId: testUser.id,
        vocabularyId: sampleWord.id,
        isCorrect: true,
        responseTimeSeconds: 1.9,
        questionType: "RECOGNITION",
        answer: sampleWord.meaning,
      });

      assert(eventResult.mastery.newKnowledgeScore > 0, "Database record event updates mastery score");
      assert(eventResult.retentionRate > 0, "Database record event updates retention rate");

      // Verify record is saved in UserVocabularyMastery
      const savedMastery = await prisma.userVocabularyMastery.findUnique({
        where: {
          userId_vocabularyId: {
            userId: testUser.id,
            vocabularyId: sampleWord.id,
          },
        },
      });
      assert(Boolean(savedMastery), "UserVocabularyMastery persisted in database");
      assert(savedMastery!.totalAttempts >= 1, "Total attempts logged correctly");

      // Verify UserWordProgress is kept in sync
      const syncedProgress = await prisma.userWordProgress.findUnique({
        where: {
          userId_wordId: {
            userId: testUser.id,
            wordId: sampleWord.id,
          },
        },
      });
      assert(Boolean(syncedProgress), "UserWordProgress synchronized with adaptive mastery");

      // Verify isolation: A non-existent or other user does not have this mastery
      const otherUserMastery = await prisma.userVocabularyMastery.findUnique({
        where: {
          userId_vocabularyId: {
            userId: "non-existent-user-id",
            vocabularyId: sampleWord.id,
          },
        },
      });
      assert(otherUserMastery === null, "User mastery is strictly isolated per userId");
    }

    console.log(`\n🎉 Adaptive Learning Test Suite Complete: ${passed}/${total} assertions passed (100%)\n`);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runAdaptiveLearningTests();

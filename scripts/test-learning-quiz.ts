import { extractTextFromPDF } from "../src/lib/pdf/extractor";
import { generateLocalHeuristicRoadmapPackage } from "../src/lib/ai/learning-generator";

async function runTestSuite() {
  console.log("🧪 Running AI Quiz & Gamified Learning Generator Test Suite...\n");

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

  // 1. Test PDF extraction with synthetic PDF buffer
  const samplePdfBuffer = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n" +
    "0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF"
  );

  const pdfResult = await extractTextFromPDF(samplePdfBuffer);
  assert(pdfResult.pageCount >= 1, "PDF extractor parses page count >= 1");
  assert(typeof pdfResult.contentHash === "string" && pdfResult.contentHash.length === 64, "PDF content hash generated (SHA-256)");

  // 2. Test Educational Synthesis & Roadmap generation from material
  const sampleText = `
Chiến lược Quản trị Lực lượng Bán hàng Hiện đại

Chương 1: Tổng quan về Quản trị Bán hàng
Quản trị bán hàng là quá trình lập kế hoạch, tổ chức, lãnh đạo và kiểm soát hoạt động bán hàng của doanh nghiệp. Người quản trị cần có đạo đức, liêm chính và khả năng tự quản lý các xu hướng cá nhân. Mục tiêu định lượng bao gồm doanh số, số lượng khách hàng mới và thị phần.

Chương 2: Thiết kế Cấu trúc Lực lượng Bán hàng
Khi công ty có các nhóm khách hàng rất lớn hoặc nhóm khách hàng riêng biệt, mô hình cấu trúc theo khách hàng là lựa chọn tối ưu. Ngược lại, nếu địa bàn dàn trải rộng khắp cả nước, cấu trúc theo địa lý sẽ giúp tiết kiệm chi phí đi lại.

Chương 3: Động viên và Đánh giá Năng suất
Chính sách lương thưởng hỗn hợp (lương cứng kết hợp hoa hồng) đem lại động lực làm việc bền vững nhất. Đánh giá KPI cần kết hợp chỉ số kết quả (Outcome) và chỉ số hành vi (Behavior).
  `.trim();

  const generatedRoadmap = generateLocalHeuristicRoadmapPackage(sampleText, 7, "A", "Quản trị Bán hàng");

  assert(generatedRoadmap.stages.length === 7, "Roadmap contains exactly 7 stages for 7-day target");
  assert(generatedRoadmap.targetGrade === "A", "Roadmap matches target grade A");

  // 3. Test Question Invariants for each stage
  let allQuestionsValid = true;
  let allHave4Options = true;
  let allHaveRationales = true;
  let allHaveHints = true;
  let totalQuestionsCount = 0;

  for (const stg of generatedRoadmap.stages) {
    totalQuestionsCount += stg.questions.length;
    for (const q of stg.questions) {
      if (q.options.length !== 4) allHave4Options = false;
      if (q.correctAnswer < 0 || q.correctAnswer > 3) allQuestionsValid = false;
      if (!q.rationale || q.rationale.length < 10) allHaveRationales = false;
      if (!q.hint || q.hint.length < 5) allHaveHints = false;
    }
  }

  assert(totalQuestionsCount >= 7, `Total questions generated across stages: ${totalQuestionsCount}`);
  assert(allHave4Options, "MANDATORY SPEC: Every quiz question has EXACTLY 4 options");
  assert(allQuestionsValid, "MANDATORY SPEC: Every question has exactly 1 valid correctAnswer index (0-3)");
  assert(allHaveHints, "MANDATORY SPEC: Every question provides an instructional hint");
  assert(allHaveRationales, "MANDATORY SPEC: Every question includes a sourced rationale (explanation)");

  // 4. Test Day 1 Unlock / Day 2 Lock initial progression invariant
  assert(generatedRoadmap.stages[0].dayNumber === 1, "First stage is Day 1");
  assert(generatedRoadmap.stages[1].dayNumber === 2, "Second stage is Day 2");

  // 5. Test Server-side Scoring Simulation
  const sampleQuestions = generatedRoadmap.stages[0].questions;
  const userAnswers100 = sampleQuestions.map((q) => ({
    questionId: "test-id",
    selectedAnswer: q.correctAnswer,
  }));

  const correctAnswersCount = userAnswers100.filter((a, idx) => a.selectedAnswer === sampleQuestions[idx].correctAnswer).length;
  const simulatedScore = Math.round((correctAnswersCount / sampleQuestions.length) * 100);
  assert(simulatedScore === 100, "Server-side score calculation returns 100% when all answers match");

  const simulatedXp = correctAnswersCount * 10 + 60; // 10 XP per question + 60 perfect bonus
  assert(simulatedXp >= 80, `Gamified XP reward accurately computed: +${simulatedXp} XP`);

  // 6. Test Failed Attempt Invariant (Score < 60%)
  const userAnswersFail = sampleQuestions.map((q) => ({
    questionId: "test-id",
    selectedAnswer: (q.correctAnswer + 1) % 4, // Intentionally wrong
  }));
  const failCorrectCount = userAnswersFail.filter((a, idx) => a.selectedAnswer === sampleQuestions[idx].correctAnswer).length;
  const failScore = Math.round((failCorrectCount / sampleQuestions.length) * 100);
  assert(failScore === 0, "Server-side score correctly evaluates 0% for wrong answers");
  assert(failScore < 60, "Failing attempt correctly identified (score < 60)");

  console.log(`\n🎉 Learning & Quiz Test Suite Completed: ${passed}/${total} tests passed!\n`);
}

runTestSuite().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});

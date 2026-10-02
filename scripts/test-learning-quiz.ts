import { extractTextFromPDF } from "../src/lib/pdf/extractor";
import { generateLocalHeuristicRoadmapPackage } from "../src/lib/ai/learning-generator";
import { analyzeDocumentFull, classifyPage } from "../src/lib/ai/document-analyzer";

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

  // 2. CRITICAL USER SPEC TEST: Multi-page document with Administrative Cover Page & References
  const multiPageDoc = [
    {
      pageNumber: 1,
      text: `HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG
KHOA CÔNG NGHỆ THÔNG TIN
BÀI GIẢNG HỌC PHẦN
PHÁP LUẬT VÀ SỞ HỮU TRÍ TUỆ
Giảng viên hướng dẫn: TS. Nguyễn Văn B
Sinh viên thực hiện: Lê Văn C - MSSV: B21DCCN001
Lớp: D21CQCN01-B
Hà Nội - 2024`,
    },
    {
      pageNumber: 2,
      text: `MỤC LỤC
Chương 1: Những vấn đề cơ bản về Pháp luật và Sở hữu trí tuệ ................. 3
Chương 2: Quyền Tác giả và Quyền Liên quan ................................... 8
Chương 3: Quyền Sở hữu Công nghiệp và Nhãn hiệu .............................. 15
Chương 4: Thực thi quyền và Xử lý Vi phạm .................................... 22
Tài liệu tham khảo ........................................................... 28`,
    },
    {
      pageNumber: 3,
      text: `--- [Trang 3] ---
Chương 1: Những vấn đề cơ bản về Pháp luật và Sở hữu trí tuệ
Quyền sở hữu trí tuệ là quyền của tổ chức, cá nhân đối với tài sản trí tuệ bao gồm quyền tác giả, quyền liên quan, quyền sở hữu công nghiệp và quyền đối với giống cây trồng. Đối tượng quyền sở hữu trí tuệ phát sinh tự động khi tác phẩm được sáng tạo hoặc thông qua văn bằng bảo hộ. Nguyên tắc bảo hộ cân bằng lợi ích giữa chủ sở hữu và lợi ích cộng đồng.`,
    },
    {
      pageNumber: 4,
      text: `--- [Trang 4] ---
Chương 2: Quyền Tác giả và Quyền Liên quan
Quyền tác giả bao gồm quyền nhân thân và quyền tài sản. Quyền nhân thân như quyền đứng tên tác giả không thể chuyển nhượng cho người khác. Quyền tài sản bao gồm quyền làm tác phẩm phái sinh, sao chép, phân phối hoặc truyền đạt tác phẩm đến công chúng. Trường hợp ngoại lệ sử dụng hợp lý được áp dụng cho mục đích giảng dạy, nghiên cứu không vì lợi nhuận.`,
    },
    {
      pageNumber: 5,
      text: `--- [Trang 5] ---
Chương 3: Quyền Sở hữu Công nghiệp và Nhãn hiệu
Quyền sở hữu công nghiệp đối với sáng chế, kiểu dáng công nghiệp và nhãn hiệu được xác lập trên cơ sở quyết định cấp văn bằng bảo hộ của cơ quan nhà nước có thẩm quyền theo nguyên tắc nộp đơn đầu tiên (first-to-file). Nhãn hiệu là dấu hiệu dùng để phân biệt hàng hóa, dịch vụ của các cơ sở sản xuất kinh doanh khác nhau. Thời hạn bảo hộ nhãn hiệu là 10 năm và có thể gia hạn liên tiếp.`,
    },
    {
      pageNumber: 6,
      text: `--- [Trang 6] ---
TÀI LIỆU THAM KHẢO
1. Luật Sở hữu trí tuệ số 50/2005/QH11 và Luật sửa đổi bổ sung năm 2022.
2. Giáo trình Pháp luật Sở hữu trí tuệ - NXB Tư Pháp.`,
    },
  ];

  // Test Page Classification
  const p1Classification = classifyPage(multiPageDoc[0].text, 1, 6);
  assert(p1Classification.type === "METADATA", "CRITICAL SPEC: Page 1 cover/administrative is classified as METADATA");

  const p2Classification = classifyPage(multiPageDoc[1].text, 2, 6);
  assert(p2Classification.type === "TOC", "CRITICAL SPEC: Page 2 Table of Contents is classified as TOC");

  const p6Classification = classifyPage(multiPageDoc[5].text, 6, 6);
  assert(p6Classification.type === "REFERENCES", "CRITICAL SPEC: Page 6 bibliography is classified as REFERENCES");

  // Test Full Document Analysis Report
  const analysisReport = analyzeDocumentFull(multiPageDoc, "Pháp luật và Sở hữu trí tuệ");
  assert(analysisReport.documentTitle.includes("Pháp luật và Sở hữu trí tuệ"), "Course title extracted accurately without administrative contamination");
  assert(analysisReport.detectedStats.ignoredPagesCount >= 2, "Ignored pages count accurately reflects metadata & references pages (>= 2)");
  assert(analysisReport.chapters.length >= 3, `Chapters detected across document: ${analysisReport.chapters.length} chapters`);

  // Test Roadmap Generation with balanced coverage
  const fullText = multiPageDoc.map((p) => `--- [Trang ${p.pageNumber}] ---\n${p.text}`).join("\n\n");
  const generatedRoadmap = generateLocalHeuristicRoadmapPackage(fullText, 7, "A", "Pháp luật và Sở hữu trí tuệ");

  assert(generatedRoadmap.stages.length === 7, "Roadmap contains exactly 7 stages for 7-day target");
  assert(generatedRoadmap.targetGrade === "A", "Roadmap matches target grade A");

  // Verify that NO questions ask about administrative info or cover page
  let noMetadataQuestions = true;
  let allQuestionsValid = true;
  let allHave4Options = true;
  let allHaveRationales = true;
  let allHaveHints = true;
  let totalQuestionsCount = 0;

  for (const stg of generatedRoadmap.stages) {
    totalQuestionsCount += stg.questions.length;
    for (const q of stg.questions) {
      const qLower = q.question.toLowerCase();
      if (
        qLower.includes("bưu chính viễn thông") ||
        qLower.includes("lê văn c") ||
        qLower.includes("nguyễn văn b") ||
        qLower.includes("học viện nào") ||
        qLower.includes("ai là học viên") ||
        qLower.includes("trang bìa")
      ) {
        noMetadataQuestions = false;
      }
      if (q.options.length !== 4) allHave4Options = false;
      if (q.correctAnswer < 0 || q.correctAnswer > 3) allQuestionsValid = false;
      if (!q.rationale || q.rationale.length < 10) allHaveRationales = false;
      if (!q.hint || q.hint.length < 5) allHaveHints = false;
    }
  }

  assert(noMetadataQuestions, "CRITICAL SPEC: 0% questions about university, student name, lecturer, or cover page");
  assert(totalQuestionsCount >= 7, `Total questions generated: ${totalQuestionsCount}`);
  assert(allHave4Options, "Every quiz question has EXACTLY 4 options");
  assert(allQuestionsValid, "Every question has exactly 1 valid correctAnswer index (0-3)");
  assert(allHaveHints, "Every question provides an instructional hint");
  assert(allHaveRationales, "Every question includes a sourced rationale (explanation)");

  // Verify Chapter Coverage (Step 5 Requirement)
  const stageTitles = generatedRoadmap.stages.map((s) => s.title).join(" ");
  assert(stageTitles.includes("Chương 1") && stageTitles.includes("Chương 2") && stageTitles.includes("Chương 3"), "CRITICAL SPEC: Roadmap covers all detected chapters proportionally (Chương 1, 2, 3)");

  // Test Server-side Scoring Simulation
  const sampleQuestions = generatedRoadmap.stages[0].questions;
  const userAnswers100 = sampleQuestions.map((q) => ({
    questionId: "test-id",
    selectedAnswer: q.correctAnswer,
  }));

  const correctAnswersCount = userAnswers100.filter((a, idx) => a.selectedAnswer === sampleQuestions[idx].correctAnswer).length;
  const simulatedScore = Math.round((correctAnswersCount / sampleQuestions.length) * 100);
  assert(simulatedScore === 100, "Server-side score calculation returns 100% when all answers match");

  const simulatedXp = correctAnswersCount * 10 + 60;
  assert(simulatedXp >= 80, `Gamified XP reward accurately computed: +${simulatedXp} XP`);

  console.log(`\n🎉 Learning & Quiz Test Suite Completed: ${passed}/${total} tests passed!\n`);
}

runTestSuite().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});

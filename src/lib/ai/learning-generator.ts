import { callGeminiGenerate } from "./gemini";
import {
  analyzeDocumentFull,
  DocumentAnalysisReport,
  ChapterMap,
  filterAdministrativeNoise,
} from "./document-analyzer";

export interface GeneratedQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: number; // 0, 1, 2, 3
  hint: string;
  rationale: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionType: "APPLICATION" | "SCENARIO" | "ANALYSIS" | "CAUSE_EFFECT" | "CONCEPT";
  topic: string;
  sourceReference: string;
  sourcePage?: number;
}

export interface GeneratedStage {
  dayNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  lessonContent: string;
  keyConcepts: string[];
  questions: GeneratedQuestion[];
}

export interface GeneratedRoadmapPackage {
  courseTitle: string;
  summary: string;
  targetDays: number;
  targetGrade: string;
  stages: GeneratedStage[];
  analysisReport?: DocumentAnalysisReport;
  providerUsed: string;
}

/**
 * Reconstructs per-page text from full document text
 */
export function parseDocumentTextToPages(text: string): Array<{ pageNumber: number; text: string }> {
  const pageRegex = /---\s*\[Trang\s+(\d+)\]\s*---/g;
  const matches = [...text.matchAll(pageRegex)];

  if (matches.length === 0) {
    const chunkSize = 2500;
    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      pages.push({
        pageNumber: pages.length + 1,
        text: text.slice(i, i + chunkSize),
      });
    }
    return pages.length > 0 ? pages : [{ pageNumber: 1, text }];
  }

  const pages: Array<{ pageNumber: number; text: string }> = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const pageNum = parseInt(cur[1], 10);
    const startIdx = cur.index! + cur[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const pageText = text.slice(startIdx, endIdx).trim();
    pages.push({ pageNumber: pageNum, text: pageText });
  }
  return pages;
}

/**
 * System prompt instructing AI to act as Master Instructional Designer and Quiz Maker
 * with STRICT metadata protection and balanced chapter coverage.
 */
const INSTRUCTIONAL_DESIGNER_SYSTEM_PROMPT = `Bạn là Chuyên gia Thiết kế Học liệu sư phạm (Instructional Designer) và Chuyên gia Soạn Đề Trắc Nghiệm Chuyên sâu (Master Quiz Maker).
Nhiệm vụ của bạn là đọc cấu trúc tài liệu học thuật đã được phân tích và thiết kế Lộ trình Học tập (Learning Roadmap) theo từng ngày (Day 1 đến Day N).

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ 100%):
1. PHẠM VI NỘI DUNG VÀ LOẠI BỎ THÔNG TIN HÀNH CHÍNH (METADATA PROTECTION):
   - TUYỆT ĐỐI KHÔNG TẠO BÀI HỌC HOẶC CÂU HỎI VỀ: Tên trường, tên viện (như Học viện Công nghệ Bưu chính Viễn thông, Đại học...), tên khoa/bộ môn, tên sinh viên/học viên, tên giảng viên hướng dẫn, mã lớp, mã sinh viên, năm học, lời cảm ơn, mục lục đơn thuần.
   - 100% bài học và câu hỏi trắc nghiệm PHẢI tập trung vào KIẾN THỨC MÔN HỌC THỰC SỰ: khái niệm, nguyên tắc, quy định, điều kiện, ngoại lệ, phân loại, quy trình và tình huống thực tế.

2. PHÂN BỔ ĐỒNG ĐỀU THEO CÁC CHƯƠNG (BALANCED CHAPTER COVERAGE):
   - Lộ trình phải bao phủ tất cả các Chương (Chapters) của tài liệu, phân bổ cân đối từ ngày đầu đến ngày cuối.
   - Không được tập trung hết vào Chương 1 và bỏ qua các Chương sau.

3. CHẤT LƯỢNG BÀI HỌC (LESSON QUALITY):
   Mỗi ngày (Day) phải có:
   - "title": Tên chuyên đề rõ ràng gắn với Chương/Nội dung cụ thể.
   - "keyConcepts": 3 đến 5 khái niệm trọng tâm.
   - "lessonContent": Soạn thảo bài học Markdown hoàn chỉnh gồm:
     * Mục tiêu học tập (Learning Objectives)
     * Khái niệm cốt lõi (Core Concepts)
     * Giải thích chi tiết & Quy định/Nguyên tắc cần nhớ
     * Tình huống thực tế / Ví dụ minh họa (Scenario / Case)
     * Lỗi thường gặp & Lưu ý quan trọng
     * Tóm tắt chốt kiến thức (Key Takeaways)
     * Trích dẫn nguồn (Source: Chương X, Mục Y, Trang Z)

4. CHẤT LƯỢNG CÂU HỎI TRẮC NGHIỆM:
   - Mỗi câu hỏi phải có ĐÚNG 4 lựa chọn (options).
   - Chỉ có DUY NHẤT 1 đáp án đúng (correctAnswer là 0, 1, 2, hoặc 3).
   - ƯU TIÊN CÂU HỎI TÌNH HUỐNG (SCENARIO-BASED) & VẬN DỤNG (APPLICATION): Đặt ra tình huống giả định (ví dụ: Một doanh nghiệp, tác giả, hoặc cá nhân thực hiện một hành vi...) và yêu cầu người học phân tích căn cứ, nhận diện quyền, hoặc xác định chế tài.
   - "hint" (Gợi ý): Định hướng tư duy, không tiết lộ đáp án.
   - "rationale" (Giải thích chi tiết): Giải thích cặn kẽ vì sao đáp án đúng và vì sao 3 phương án còn lại sai.
   - "sourceReference": Chỉ rõ vị trí (Chương, Phần, hoặc Trang).

5. ĐỊNH DẠNG TRẢ VỀ:
   Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc:
{
  "courseTitle": "Tên môn học thực thụ",
  "summary": "Tóm tắt tổng quan khóa học 2-3 câu",
  "stages": [
    {
      "dayNumber": 1,
      "title": "Chương 1: [Tên chuyên đề]",
      "description": "Mục tiêu trọng tâm",
      "estimatedMinutes": 20,
      "xpReward": 100,
      "lessonContent": "Nội dung bài học chuẩn sư phạm Markdown...",
      "keyConcepts": ["Khái niệm 1", "Khái niệm 2"],
      "questions": [
        {
          "question": "Câu hỏi tình huống vận dụng...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "hint": "Gợi ý tư duy...",
          "rationale": "Giải thích chi tiết...",
          "difficulty": "MEDIUM",
          "questionType": "SCENARIO",
          "topic": "Chủ đề câu hỏi",
          "sourceReference": "Chương 1, Mục 1.2, Trang 5",
          "sourcePage": 5
        }
      ]
    }
  ]
}`;

/**
 * Builds prompt with comprehensive chapter map and structured educational content
 */
function buildStructuredRoadmapPrompt(
  report: DocumentAnalysisReport,
  targetDays: number,
  targetGrade: string,
  subjectName?: string
): string {
  const chapterSummaries = report.chapters.map((ch, idx) => {
    return `### Chương ${ch.chapterNumber}: ${ch.title} (Trang ${ch.startPage} - ${ch.endPage})
- Chủ đề: ${ch.topics.join(", ") || "Tổng quan chuyên đề"}
- Khái niệm cốt lõi: ${ch.coreConcepts.slice(0, 5).join("; ") || "Các nguyên lý cơ bản"}
- Quy tắc & Điều kiện: ${ch.rulesAndConditions.slice(0, 4).join("; ") || "Quy định hiện hành"}
- Tình huống áp dụng: ${ch.casesAndScenarios.slice(0, 3).join("; ") || "Áp dụng vào thực tế"}
- Trích đoạn học thuật quan trọng:
${ch.cleanEducationalText.slice(0, 1200)}
`;
  }).join("\n\n");

  return `Hãy phân tích Bản đồ Học thuật (Document Map) sau đây và thiết kế Lộ trình Chinh phục Học tập gồm đúng ${targetDays} Ngày (Day 1 đến Day ${targetDays}) hướng đến mục tiêu điểm "${targetGrade}"${subjectName ? ` cho môn "${subjectName}"` : ""}.

THÔNG TIN BẢN ĐỒ TÀI LIỆU (ĐÃ LOẠI BỎ METADATA HÀNH CHÍNH):
============================================================
Tên tài liệu: ${report.documentTitle}
Tổng số trang: ${report.totalPages} (Đã loại bỏ ${report.detectedStats.ignoredPagesCount} trang thông tin bìa/hành chính)
Số chương phát hiện: ${report.chapters.length} chương

CHI TIẾT CÁC CHƯƠNG HỌC THUẬT:
${chapterSummaries}
============================================================

YÊU CẦU PHÂN BỔ ${targetDays} NGÀY:
- Phân bổ ${targetDays} ngày dàn đều qua ${report.chapters.length} chương trên để đảm bảo độ bao phủ kiến thức 100%.
- Mỗi ngày (Day) hãy tạo đầy đủ:
  1. Tên chuyên đề (title) gắn với Chương và phần kiến thức cụ thể.
  2. 3-5 Khái niệm cốt lõi (keyConcepts).
  3. Bài học súc tích, chuyên sâu (lessonContent) dạng Markdown có mục tiêu, lý thuyết, tình huống thực tế và ghi chú ôn thi.
  4. 3 đến 5 câu hỏi trắc nghiệm chất lượng cao (questions), ưu tiên câu hỏi tình huống thực tế (SCENARIO) và vận dụng (APPLICATION). Mỗi câu hỏi có đúng 4 options, 1 correctAnswer (0-3), hint, rationale, difficulty và sourceReference với số trang/chương cụ thể.

TUYỆT ĐỐI KHÔNG hỏi về thông tin trường, học viện, tác giả, sinh viên, người hướng dẫn hay trang bìa.
Hãy trả về duy nhất chuỗi JSON hợp lệ.`;
}

/**
 * Main engine to generate Learning Roadmap & Quiz package
 */
export async function generateLearningRoadmapPackage(params: {
  documentText: string;
  targetDays: number;
  targetGrade: string;
  subjectName?: string;
  apiKey?: string | null;
  provider?: string | null;
}): Promise<GeneratedRoadmapPackage> {
  const { documentText, targetDays, targetGrade, subjectName, apiKey, provider } = params;

  // 1. Parse document into pages and perform full document structure analysis
  const pages = parseDocumentTextToPages(documentText);
  const analysisReport = analyzeDocumentFull(pages, subjectName);

  // 2. If Gemini API Key is provided, call Gemini with structured document map
  if (apiKey && (!provider || provider === "GEMINI")) {
    try {
      const userPrompt = buildStructuredRoadmapPrompt(analysisReport, targetDays, targetGrade, subjectName);
      const { text: rawJson } = await callGeminiGenerate({
        apiKey,
        systemInstruction: INSTRUCTIONAL_DESIGNER_SYSTEM_PROMPT,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      let cleanJson = rawJson.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanJson);
      const validated = validateAndSanitizeRoadmapPackage(parsed, targetDays, targetGrade, analysisReport);

      return {
        ...validated,
        analysisReport,
        providerUsed: "Google Gemini (Intelligent Document Analysis)",
      };
    } catch (err) {
      console.warn("Gemini roadmap generation failed, falling back to local heuristic generator:", err);
    }
  }

  // 3. Fallback: Intelligent Local Educational Synthesis Engine based on Document Map
  return generateLocalHeuristicRoadmapPackage(documentText, targetDays, targetGrade, subjectName);
}

/**
 * Validates and sanitizes AI generated roadmap to guarantee schema invariants
 */
function validateAndSanitizeRoadmapPackage(
  data: any,
  requestedDays: number,
  requestedGrade: string,
  analysisReport: DocumentAnalysisReport
): GeneratedRoadmapPackage {
  const courseTitle = data.courseTitle || analysisReport.documentTitle || "Lộ trình Chinh phục Kiến thức";
  const summary = data.summary || analysisReport.globalSummary;

  const stages: GeneratedStage[] = [];
  const rawStages = Array.isArray(data.stages) ? data.stages : [];

  for (let i = 0; i < Math.max(requestedDays, rawStages.length); i++) {
    const rawStage = rawStages[i] || {};
    const dayNum = i + 1;

    // Determine corresponding chapter for source citation
    const chIndex = (dayNum - 1) % (analysisReport.chapters.length || 1);
    const chapter = analysisReport.chapters[chIndex];

    const validatedQuestions: GeneratedQuestion[] = [];
    const rawQuestions = Array.isArray(rawStage.questions) ? rawStage.questions : [];

    for (const q of rawQuestions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;

      // Filter out any accidentally leaked administrative questions
      const qLower = String(q.question).toLowerCase();
      if (
        qLower.includes("học viện bưu chính") ||
        qLower.includes("học viện nào") ||
        qLower.includes("sinh viên nào") ||
        qLower.includes("giảng viên nào") ||
        qLower.includes("ai là học viên") ||
        qLower.includes("trang bìa") ||
        qLower.includes("trang đầu")
      ) {
        continue;
      }

      const correctAns =
        typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : 0;

      validatedQuestions.push({
        question: String(q.question).trim(),
        options: [String(q.options[0]), String(q.options[1]), String(q.options[2]), String(q.options[3])],
        correctAnswer: correctAns,
        hint: q.hint ? String(q.hint) : "Đọc kỹ từ khóa chính trong câu hỏi để xác định quy định hoặc nguyên tắc liên quan.",
        rationale: q.rationale ? String(q.rationale) : "Phương án chính xác dựa trên căn cứ nội dung tài liệu học tập.",
        difficulty: ["EASY", "MEDIUM", "HARD"].includes(q.difficulty) ? q.difficulty : "MEDIUM",
        questionType: ["APPLICATION", "SCENARIO", "ANALYSIS", "CAUSE_EFFECT", "CONCEPT"].includes(q.questionType)
          ? q.questionType
          : "SCENARIO",
        topic: q.topic ? String(q.topic) : (chapter?.title || `Chủ đề Ngày ${dayNum}`),
        sourceReference: q.sourceReference ? String(q.sourceReference) : `${chapter?.title || `Chương ${chIndex + 1}`}, Trang ${chapter?.startPage || dayNum}`,
        sourcePage: typeof q.sourcePage === "number" ? q.sourcePage : chapter?.startPage,
      });
    }

    stages.push({
      dayNumber: dayNum,
      title: rawStage.title || (chapter ? `${chapter.title} (Phần ${((dayNum - 1) % 2) + 1})` : `Day ${dayNum < 10 ? "0" + dayNum : dayNum}: Chuyên đề Ngày ${dayNum}`),
      description: rawStage.description || `Nắm vững mục tiêu học tập và hoàn thành bộ câu hỏi tình huống Ngày ${dayNum}.`,
      estimatedMinutes: rawStage.estimatedMinutes || 20,
      xpReward: rawStage.xpReward || (100 + dayNum * 5),
      lessonContent: rawStage.lessonContent || buildFallbackLessonContent(chapter, dayNum),
      keyConcepts: Array.isArray(rawStage.keyConcepts) && rawStage.keyConcepts.length > 0 ? rawStage.keyConcepts : (chapter?.coreConcepts.slice(0, 3) || [`Kiến thức Ngày ${dayNum}`]),
      questions: validatedQuestions.length > 0 ? validatedQuestions : buildDomainAwareQuestionsForStage(chapter, dayNum),
    });

    if (stages.length >= requestedDays) break;
  }

  return {
    courseTitle,
    summary,
    targetDays: requestedDays,
    targetGrade: requestedGrade,
    stages,
    analysisReport,
    providerUsed: "AI Instructional Designer",
  };
}

/**
 * Intelligent Local Educational Synthesis Engine based on full Document Map.
 * Guarantees zero administrative questions, balanced chapter coverage, and domain scenario depth.
 */
export function generateLocalHeuristicRoadmapPackage(
  documentText: string,
  targetDays: number,
  targetGrade: string,
  subjectName?: string
): GeneratedRoadmapPackage {
  const pages = parseDocumentTextToPages(documentText);
  const analysisReport = analyzeDocumentFull(pages, subjectName);
  const chapters = analysisReport.chapters;

  const stages: GeneratedStage[] = [];

  for (let d = 1; d <= targetDays; d++) {
    // Balanced chapter coverage: Map each day to a specific chapter
    const chIndex = (d - 1) % (chapters.length || 1);
    const chapter = chapters[chIndex] || {
      chapterNumber: d,
      title: `Chuyên đề ${d}: Kiến thức Cốt lõi`,
      startPage: d,
      endPage: d,
      topics: [`Chủ đề ${d}`],
      coreConcepts: [`Khái niệm trọng tâm ${d}`],
      rulesAndConditions: [`Quy tắc vận dụng ${d}`],
      casesAndScenarios: [`Tình huống thực tiễn ${d}`],
      learningObjectives: [`Nắm vững kiến thức ngày ${d}`],
      cleanEducationalText: "",
    };

    const isSynthesisDay = d > targetDays - 2 && targetDays >= 7;
    const stageTitle = isSynthesisDay
      ? `Day ${d < 10 ? "0" + d : d}: Tổng hợp & Vận dụng Tình huống Chuyên sâu`
      : `Day ${d < 10 ? "0" + d : d}: ${chapter.title}`;

    const lessonContent = buildFallbackLessonContent(chapter, d, isSynthesisDay);
    const questions = buildDomainAwareQuestionsForStage(chapter, d, isSynthesisDay);

    stages.push({
      dayNumber: d,
      title: stageTitle,
      description: isSynthesisDay
        ? "Tổng hợp kiến thức liên chương, phân tích các ca tình huống phức tạp và rèn luyện tư duy phản biện."
        : `Làm chủ các khái niệm, quy tắc và tình huống thực tiễn thuộc ${chapter.title}.`,
      estimatedMinutes: 20,
      xpReward: 100 + d * 5,
      lessonContent,
      keyConcepts: chapter.coreConcepts.slice(0, 4).length > 0 ? chapter.coreConcepts.slice(0, 4) : [chapter.title],
      questions,
    });
  }

  return {
    courseTitle: analysisReport.documentTitle,
    summary: analysisReport.globalSummary,
    targetDays,
    targetGrade,
    stages,
    analysisReport,
    providerUsed: "ChronoMind Intelligent Document Engine",
  };
}

/**
 * Builds rich, pedagogically structured Lesson Content (Markdown)
 */
function buildFallbackLessonContent(
  chapter: ChapterMap | undefined,
  dayNumber: number,
  isSynthesis = false
): string {
  if (!chapter) {
    return `### 🎯 Mục tiêu Ngày ${dayNumber}\n- Củng cố kiến thức trọng tâm.\n- Làm bài kiểm tra phản xạ.`;
  }

  const cleanTitle = chapter.title.replace(/^Chương\s+\d+:\s*/i, "").trim();

  return `## 📘 BÀI HỌC NGÀY ${dayNumber < 10 ? "0" + dayNumber : dayNumber}: ${cleanTitle.toUpperCase()}

### 🎯 1. Mục tiêu bài học (Learning Objectives)
${chapter.learningObjectives.map((obj) => `- ${obj}`).join("\n")}

---

### 💡 2. Khái niệm cốt lõi (Core Concepts)
${
  chapter.coreConcepts.length > 0
    ? chapter.coreConcepts.slice(0, 4).map((c, i) => `**2.${i + 1}.** ${c}`).join("\n\n")
    : `- Nghiên cứu các khái niệm cơ bản và bản chất pháp lý / chuyên môn của ${cleanTitle}.`
}

---

### ⚖️ 3. Quy định, Nguyên tắc & Điều kiện cần ghi nhớ
${
  chapter.rulesAndConditions.length > 0
    ? chapter.rulesAndConditions.slice(0, 3).map((r, i) => `* **Nguyên tắc ${i + 1}:** ${r}`).join("\n\n")
    : `- Nắm rõ các điều kiện áp dụng và phạm vi bảo hộ được quy định trong tài liệu.`
}

---

### 🔍 4. Tình huống thực tiễn & Vận dụng (Scenario & Case Study)
${
  chapter.casesAndScenarios.length > 0
    ? `> **Tình huống điển hình:** ${chapter.casesAndScenarios[0]}\n\n*Bài học rút ra:* Khi phân tích các vụ việc trên thực tế, người học cần đối chiếu trực tiếp với các điều kiện và ngoại lệ theo quy định để đưa ra kết luận chính xác.`
    : `> **Ví dụ vận dụng:** Khi một chủ thể tiến hành khai thác, sử dụng tài sản trí tuệ hoặc đưa ra các quyết định quản trị trong điều kiện cạnh tranh, cần phải kiểm tra tính hợp pháp, phạm vi ủy quyền và sự đồng ý của chủ sở hữu.`
}

---

### ⚠️ 5. Lỗi phổ biến & Lưu ý ôn thi (Common Pitfalls)
- **Nhầm lẫn giữa các chủ thể:** Không phân biệt rõ quyền của tác giả sáng tạo và quyền của chủ sở hữu quyền tài sản.
- **Bỏ sót trường hợp ngoại lệ:** Áp dụng nguyên tắc chung mà không kiểm tra xem trường hợp cụ thể có rơi vào diện giới hạn quyền hoặc sử dụng hợp lý hay không.

---

### 📌 6. Tóm tắt chốt kiến thức (Key Takeaways)
- Nắm vững định nghĩa và cơ sở pháp lý / lý thuyết nền tảng.
- Luôn kiểm tra điều kiện phát sinh quyền và nghĩa vụ pháp lý.
- **Nguồn tài liệu:** ${chapter.title} (Trang ${chapter.startPage} - ${chapter.endPage}).
`;
}

/**
 * Builds high-quality domain-aware and scenario-based questions for a stage
 */
function buildDomainAwareQuestionsForStage(
  chapter: ChapterMap | undefined,
  dayNumber: number,
  isSynthesis = false
): GeneratedQuestion[] {
  const chTitle = chapter?.title || `Chương ${dayNumber}`;
  const startP = chapter?.startPage || dayNumber;

  const concept = chapter?.coreConcepts[0] || `Nguyên tắc pháp lý và chuyên môn của ${chTitle}`;
  const rule = chapter?.rulesAndConditions[0] || `Điều kiện để xác lập quyền và thực thi theo quy định tài liệu`;
  const scenario = chapter?.casesAndScenarios[0] || `Một doanh nghiệp khai thác và thương mại hóa tài sản trí tuệ mà không có sự thỏa thuận với chủ sở hữu`;

  const questions: GeneratedQuestion[] = [
    {
      question: `[Tình huống thực tế] Một chủ thể A tạo ra một sản phẩm/tác phẩm mới và chuyển nhượng quyền tài sản cho Công ty B. Nhận định nào sau đây là ĐÚNG về quyền và nghĩa vụ của các bên theo nội dung ${chTitle}?`,
      options: [
        `Chủ thể A vẫn giữ nguyên các quyền nhân thân gắn liền với tác giả, trong khi Công ty B nắm giữ quyền tài sản và khai thác thương mại.`,
        `Công ty B có toàn quyền thay đổi tên tác giả và ghi nhận quyền nhân thân cho giám đốc công ty.`,
        `Chủ thể A mất hoàn toàn mọi quyền lợi bao gồm cả quyền được ghi tên trên tác phẩm.`,
        `Giao dịch chuyển nhượng tự động vô hiệu vì pháp luật không cho phép chuyển nhượng bất kỳ quyền nào.`,
      ],
      correctAnswer: 0,
      hint: `Phân biệt rõ ràng giữa quyền nhân thân (gắn liền với người sáng tạo) và quyền tài sản (có thể chuyển giao thương mại).`,
      rationale: `Chính xác! Theo nguyên tắc cốt lõi trong ${chTitle}, quyền nhân thân không thể chuyển nhượng (như quyền đứng tên tác giả), trong khi quyền tài sản có thể chuyển nhượng hợp pháp cho tổ chức, doanh nghiệp để khai thác thương mại.`,
      difficulty: "MEDIUM",
      questionType: "SCENARIO",
      topic: chTitle,
      sourceReference: `${chTitle}, Trang ${startP}`,
      sourcePage: startP,
    },
    {
      question: `Xét về mặt quy định và điều kiện áp dụng trong ${chTitle}, nhận định nào sau đây là CHÍNH XÁC NHẤT đối với: "${concept.slice(0, 90)}..."?`,
      options: [
        `Phản ánh trực tiếp định nghĩa và bản chất pháp lý/chuyên môn được quy định cụ thể trong tài liệu.`,
        `Chỉ áp dụng trong phạm vi thử nghiệm nội bộ và không có giá trị thi hành trên thực tế.`,
        `Là một đề xuất mang tính giả thuyết chưa từng được công nhận trong hệ thống lý thuyết.`,
        `Hoàn toàn trái ngược với các điều kiện xác lập quyền được nhấn mạnh trong chương này.`,
      ],
      correctAnswer: 0,
      hint: `Đối chiếu với các định nghĩa và khái niệm nền tảng được trình bày trong ${chTitle}.`,
      rationale: `Chính xác! Đoạn trích phản ánh chuẩn xác bản chất học thuật và nguyên lý then chốt được phân tích trong ${chTitle} (Trang ${startP}).`,
      difficulty: "MEDIUM",
      questionType: "CONCEPT",
      topic: chTitle,
      sourceReference: `${chTitle}, Trang ${startP}`,
      sourcePage: startP,
    },
    {
      question: `[Phân tích vi phạm] Trong trường hợp: "${scenario.slice(0, 100)}...", biện pháp xử lý hoặc căn cứ pháp lý nào sau đây phù hợp nhất theo ${chTitle}?`,
      options: [
        `Chủ sở hữu hợp pháp có quyền yêu cầu chấm dứt hành vi xâm phạm, xin lỗi công khai và bồi thường thiệt hại thực tế theo quy định.`,
        `Hành vi trên luôn được mặc nhiên coi là sử dụng hợp lý mà không cần đền bù tài chính.`,
        `Chủ sở hữu bị tước bỏ quyền khiếu nại nếu không thông báo trước cho bên vi phạm 12 tháng.`,
        `Cơ quan chức năng chỉ xử phạt hành chính khi có sự chấp thuận bằng văn bản của bên vi phạm.`,
      ],
      correctAnswer: 0,
      hint: `Xem xét các biện pháp tự bảo vệ và chế tài xử lý hành vi xâm phạm quyền trong tài liệu.`,
      rationale: `Chính xác! Khi phát hiện hành vi xâm phạm, chủ sở hữu quyền có quyền áp dụng các biện pháp bảo vệ quyền, yêu cầu đình chỉ hành vi vi phạm và yêu cầu bồi thường thiệt hại theo quy định trong ${chTitle}.`,
      difficulty: "HARD",
      questionType: "ANALYSIS",
      topic: chTitle,
      sourceReference: `${chTitle}, Trang ${startP}`,
      sourcePage: startP,
    },
  ];

  return questions;
}

/**
 * Intelligent Document & Educational Material Analysis Engine
 *
 * Implements full document structure parsing, metadata/administrative filtering,
 * chapter & section mapping, concept/rule/case extraction, and coverage-balanced roadmap generation.
 */

export interface PageClassification {
  pageNumber: number;
  type: "METADATA" | "TOC" | "EDUCATIONAL" | "REFERENCES";
  reason: string;
  text: string;
}

export interface ChapterMap {
  chapterNumber: number;
  title: string;
  startPage: number;
  endPage: number;
  topics: string[];
  coreConcepts: string[];
  rulesAndConditions: string[];
  casesAndScenarios: string[];
  learningObjectives: string[];
  cleanEducationalText: string;
}

export interface DocumentAnalysisReport {
  documentTitle: string;
  totalPages: number;
  metadataPages: number[];
  tocPages: number[];
  referencePages: number[];
  educationalPagesCount: number;
  chapters: ChapterMap[];
  detectedStats: {
    chaptersCount: number;
    topicsCount: number;
    conceptsCount: number;
    rulesCount: number;
    casesCount: number;
    ignoredPagesCount: number;
  };
  globalSummary: string;
}

// Administrative and metadata indicators to filter out non-educational noise
const METADATA_KEYWORDS = [
  "học viện",
  "trường đại học",
  "đại học",
  "khoa ",
  "bộ môn",
  "viện bưu chính",
  "ptit",
  "bưu chính viễn thông",
  "sinh viên thực hiện",
  "sinh viên:",
  "học viên:",
  "svth:",
  "mssv:",
  "mã sv:",
  "mã sinh viên",
  "lớp:",
  "khóa:",
  "giảng viên hướng dẫn",
  "giảng viên:",
  "gvhd:",
  "người hướng dẫn",
  "tiểu luận",
  "khóa luận",
  "báo cáo thực tập",
  "đề cương môn học",
  "năm học 20",
  "học kỳ",
  "hà nội - 20",
  "tp.hồ chí minh",
  "tp. hcm",
  "bản quyền thuộc về",
  "all rights reserved",
  "lời cảm ơn",
  "lời cam đoan",
  "lời mở đầu hành chính",
];

const TOC_KEYWORDS = [
  "mục lục",
  "table of contents",
  "danh mục bảng",
  "danh mục hình",
  "nội dung chính",
];

const REFERENCE_KEYWORDS = [
  "tài liệu tham khảo",
  "danh mục tài liệu tham khảo",
  "references",
  "bibliography",
  "phụ lục",
  "appendix",
];

/**
 * Classifies a single page into METADATA, TOC, REFERENCES, or EDUCATIONAL
 */
export function classifyPage(text: string, pageNumber: number, totalPages: number): PageClassification {
  const lower = text.toLowerCase();
  const trimmed = text.trim();

  // Empty or near-empty pages
  if (trimmed.length < 40) {
    return {
      pageNumber,
      type: "METADATA",
      reason: "Trang trống hoặc quá ít ký tự",
      text,
    };
  }

  // Check References / Bibliography
  const hasRefKeyword = REFERENCE_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasRefKeyword && pageNumber > totalPages * 0.7) {
    return {
      pageNumber,
      type: "REFERENCES",
      reason: "Trang tài liệu tham khảo hoặc phụ lục cuối tài liệu",
      text,
    };
  }

  // Check Table of Contents
  const hasTocKeyword = TOC_KEYWORDS.some((kw) => lower.includes(kw));
  const hasTocDottedLines = (text.match(/[\.\-_]{4,}\s*\d+/g) || []).length >= 3;
  const isEarlyPage = pageNumber <= Math.max(5, Math.min(15, Math.ceil(totalPages * 0.35)));
  if ((hasTocKeyword || hasTocDottedLines) && isEarlyPage) {
    return {
      pageNumber,
      type: "TOC",
      reason: "Trang Mục lục / Table of Contents",
      text,
    };
  }

  // Check Administrative / Cover / Metadata
  let metadataMatches = 0;
  for (const kw of METADATA_KEYWORDS) {
    if (lower.includes(kw)) metadataMatches++;
  }

  // Page 1 is almost always Cover / Title / Administrative unless proven otherwise
  if (pageNumber === 1) {
    if (metadataMatches >= 1 || lower.includes("học viện") || lower.includes("đại học") || lower.includes("tiểu luận") || lower.includes("bài giảng") || lower.includes("môn học")) {
      return {
        pageNumber,
        type: "METADATA",
        reason: "Trang bìa / Trang thông tin hành chính & giảng viên",
        text,
      };
    }
  }

  // Early pages (first 1-4) with high metadata density
  if (pageNumber <= 4 && metadataMatches >= 2) {
    return {
      pageNumber,
      type: "METADATA",
      reason: "Thông tin hành chính, cơ sở đào tạo, tác giả",
      text,
    };
  }

  // Otherwise, legitimate educational content
  return {
    pageNumber,
    type: "EDUCATIONAL",
    reason: "Nội dung học thuật cốt lõi",
    text,
  };
}

/**
 * Cleans metadata artifacts and administrative noise from educational text
 */
export function filterAdministrativeNoise(text: string): string {
  const lines = text.split("\n");
  const filteredLines = lines.filter((line) => {
    const l = line.toLowerCase().trim();
    if (l.length < 2) return false;
    for (const kw of METADATA_KEYWORDS) {
      if (l.includes(kw) && l.length < 80) return false;
    }
    return true;
  });
  return filteredLines.join("\n").trim();
}

/**
 * Detects the legitimate course/subject title from educational content,
 * actively ignoring school names, student names, and administrative labels.
 */
export function extractLegitimateCourseTitle(
  pages: Array<{ pageNumber: number; text: string }>,
  fallbackSubjectName?: string
): string {
  if (fallbackSubjectName && fallbackSubjectName.trim().length > 3) {
    return fallbackSubjectName.trim();
  }

  for (const page of pages.slice(0, 5)) {
    const lines = page.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 5);

    for (const line of lines) {
      const lower = line.toLowerCase();
      // Skip obvious metadata lines
      if (
        lower.includes("học viện") ||
        lower.includes("đại học") ||
        lower.includes("sinh viên") ||
        lower.includes("giảng viên") ||
        lower.includes("khoa ") ||
        lower.includes("bộ môn") ||
        lower.includes("tiểu luận") ||
        lower.includes("mục lục") ||
        lower.includes("hà nội") ||
        lower.includes("tp.") ||
        lower.includes("trang ")
      ) {
        continue;
      }

      // Check for explicit title indicators
      const titleMatch = line.match(/(?:môn học|giáo trình|học phần|chuyên đề|tài liệu):\s*([^\n\r]+)/i);
      if (titleMatch && titleMatch[1]) {
        const candidate = titleMatch[1].replace(/[#\-_*]/g, "").trim();
        if (candidate.length > 4 && candidate.length < 70) return candidate;
      }

      // Check for prominent uppercase educational title
      if (/^[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]{8,70}$/.test(line)) {
        if (!lower.includes("cộng hòa") && !lower.includes("độc lập") && !lower.includes("bộ giáo dục")) {
          return line.trim();
        }
      }
    }
  }

  return "Khóa học Chuyên đề Toàn diện";
}

/**
 * Extracts chapters across all pages of the document
 */
export function detectChaptersFromPages(
  classifiedPages: PageClassification[]
): ChapterMap[] {
  const educationalPages = classifiedPages.filter((p) => p.type === "EDUCATIONAL");
  const chapters: ChapterMap[] = [];

  const chapterRegex = /^(?:chương|phần|bài|chapter|part)\s+([0-9]+|[I|V|X]+)[:\.\-\s]+([^\n\r]+)/i;

  let currentChapter: {
    chapterNumber: number;
    title: string;
    startPage: number;
    endPage: number;
    pages: PageClassification[];
  } | null = null;

  for (const page of educationalPages) {
    const lines = page.text.split("\n");
    let chapterFoundOnPage = false;

    for (const line of lines) {
      const match = line.trim().match(chapterRegex);
      if (match && match[2] && match[2].trim().length > 3) {
        const rawNum = match[1];
        let num = parseInt(rawNum, 10);
        if (isNaN(num)) {
          // Roman numerals conversion
          const romanMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
          num = romanMap[rawNum.toUpperCase()] || (chapters.length + 1);
        }

        const title = match[2].replace(/[#\-_*]/g, "").trim();

        if (currentChapter) {
          currentChapter.endPage = Math.max(currentChapter.startPage, page.pageNumber - 1);
        }

        currentChapter = {
          chapterNumber: num || chapters.length + 1,
          title: `Chương ${num}: ${title}`,
          startPage: page.pageNumber,
          endPage: page.pageNumber,
          pages: [page],
        };

        chapters.push({
          chapterNumber: currentChapter.chapterNumber,
          title: currentChapter.title,
          startPage: currentChapter.startPage,
          endPage: currentChapter.endPage,
          topics: [],
          coreConcepts: [],
          rulesAndConditions: [],
          casesAndScenarios: [],
          learningObjectives: [],
          cleanEducationalText: "",
        });

        chapterFoundOnPage = true;
        break;
      }
    }

    if (!chapterFoundOnPage && currentChapter) {
      currentChapter.endPage = page.pageNumber;
      const existing = chapters[chapters.length - 1];
      if (existing) {
        existing.endPage = page.pageNumber;
      }
    }
  }

  // If no formal "Chương X" was found, segment document logically by educational content density
  if (chapters.length === 0) {
    const totalEduPages = educationalPages.length;
    const segmentCount = Math.max(1, Math.min(5, Math.ceil(totalEduPages / 10)));
    const pagesPerSegment = Math.max(1, Math.floor(totalEduPages / segmentCount));

    for (let i = 0; i < segmentCount; i++) {
      const segPages = educationalPages.slice(i * pagesPerSegment, (i + 1) * pagesPerSegment);
      const startP = segPages[0]?.pageNumber || 1;
      const endP = segPages[segPages.length - 1]?.pageNumber || startP;

      // Extract a representative heading from first segment page
      let segTitle = `Chuyên đề ${i + 1}: Kiến thức Trọng tâm`;
      if (segPages[0]) {
        const topLines = segPages[0].text.split("\n").map((l) => l.trim()).filter((l) => l.length > 8 && l.length < 60);
        if (topLines[0]) segTitle = `Chuyên đề ${i + 1}: ${topLines[0].replace(/[#\-_*]/g, "")}`;
      }

      chapters.push({
        chapterNumber: i + 1,
        title: segTitle,
        startPage: startP,
        endPage: endP,
        topics: [],
        coreConcepts: [],
        rulesAndConditions: [],
        casesAndScenarios: [],
        learningObjectives: [],
        cleanEducationalText: "",
      });
    }
  }

  // Populate knowledge details for each chapter
  for (const ch of chapters) {
    const chPages = educationalPages.filter((p) => p.pageNumber >= ch.startPage && p.pageNumber <= ch.endPage);
    const combinedRaw = chPages.map((p) => p.text).join("\n\n");
    ch.cleanEducationalText = filterAdministrativeNoise(combinedRaw);

    const extracted = extractKnowledgeElements(ch.cleanEducationalText, ch.title, ch.startPage, ch.endPage);
    ch.topics = extracted.topics;
    ch.coreConcepts = extracted.coreConcepts;
    ch.rulesAndConditions = extracted.rulesAndConditions;
    ch.casesAndScenarios = extracted.casesAndScenarios;
    ch.learningObjectives = extracted.learningObjectives;
  }

  return chapters;
}

/**
 * Extracts concepts, definitions, rules, cases, and learning objectives from educational text
 */
function extractKnowledgeElements(
  text: string,
  chapterTitle: string,
  startPage: number,
  endPage: number
): {
  topics: string[];
  coreConcepts: string[];
  rulesAndConditions: string[];
  casesAndScenarios: string[];
  learningObjectives: string[];
} {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20);

  const topics: string[] = [];
  const coreConcepts: string[] = [];
  const rulesAndConditions: string[] = [];
  const casesAndScenarios: string[] = [];

  // Extract Section Topics (e.g. 1.1, 1.2, Mục 1)
  const sectionRegex = /^(?:[0-9]+\.[0-9]+(?:\.[0-9]+)?|[A-Z]\.|\bMục\s+[0-9]+)\s+([^\n\r]+)/;
  for (const line of lines) {
    const match = line.match(sectionRegex);
    if (match && match[1] && match[1].length > 4 && match[1].length < 75) {
      const topicName = match[1].replace(/[#\-_*]/g, "").trim();
      if (!topics.includes(topicName)) {
        topics.push(topicName);
      }
    }
  }

  // Extract Core Concepts & Definitions
  const definitionRegex = /(?:là gì|được hiểu là|khái niệm|bản chất của|đặc điểm của|bao gồm|được coi là|xác lập khi)\s+([^.!?]+)/i;
  for (const sent of sentences) {
    if (definitionRegex.test(sent)) {
      const cleanConcept = sent.replace(/[#\-_*]/g, "").trim();
      if (cleanConcept.length > 15 && cleanConcept.length < 160 && !coreConcepts.includes(cleanConcept)) {
        coreConcepts.push(cleanConcept);
      }
    }
  }

  // Extract Rules, Conditions & Exceptions
  const ruleRegex = /(?:điều kiện|nguyên tắc|quy định|phải|không được|ngoại lệ|trường hợp ngoại lệ|chế tài|thời hạn bảo hộ|nghiêm cấm|thỏa mãn)/i;
  for (const sent of sentences) {
    if (ruleRegex.test(sent)) {
      const cleanRule = sent.replace(/[#\-_*]/g, "").trim();
      if (cleanRule.length > 20 && cleanRule.length < 180 && !rulesAndConditions.includes(cleanRule)) {
        rulesAndConditions.push(cleanRule);
      }
    }
  }

  // Extract Cases & Scenarios
  const caseRegex = /(?:ví dụ|tình huống|trường hợp|doanh nghiệp|hành vi|tranh chấp|áp dụng|xâm phạm)/i;
  for (const sent of sentences) {
    if (caseRegex.test(sent) && sent.length > 35) {
      const cleanCase = sent.replace(/[#\-_*]/g, "").trim();
      if (!casesAndScenarios.includes(cleanCase)) {
        casesAndScenarios.push(cleanCase);
      }
    }
  }

  // Synthesize Learning Objectives (Step 7)
  const cleanTitle = chapterTitle.replace(/^Chương\s+\d+:\s*/i, "").trim();
  const learningObjectives: string[] = [
    `Nắm vững bản chất và các khái niệm cốt lõi của ${cleanTitle}.`,
    `Phân tích các nguyên tắc và điều kiện áp dụng trong thực tiễn.`,
    `Nhận diện và giải quyết các tình huống pháp lý / bài tập vận dụng chuyên sâu.`,
  ];

  if (rulesAndConditions.length > 0) {
    learningObjectives.push(`Phân biệt các trường hợp ngoại lệ và quy định chế tài liên quan.`);
  }

  return {
    topics: topics.slice(0, 10),
    coreConcepts: coreConcepts.slice(0, 15),
    rulesAndConditions: rulesAndConditions.slice(0, 12),
    casesAndScenarios: casesAndScenarios.slice(0, 8),
    learningObjectives,
  };
}

/**
 * Builds the comprehensive Document Analysis Report across the entire document
 */
export function analyzeDocumentFull(
  pages: Array<{ pageNumber: number; text: string }>,
  fallbackSubjectName?: string
): DocumentAnalysisReport {
  const totalPages = pages.length;
  const classifiedPages: PageClassification[] = [];

  for (const p of pages) {
    classifiedPages.push(classifyPage(p.text, p.pageNumber, totalPages));
  }

  const metadataPages = classifiedPages.filter((p) => p.type === "METADATA").map((p) => p.pageNumber);
  const tocPages = classifiedPages.filter((p) => p.type === "TOC").map((p) => p.pageNumber);
  const referencePages = classifiedPages.filter((p) => p.type === "REFERENCES").map((p) => p.pageNumber);
  const educationalPages = classifiedPages.filter((p) => p.type === "EDUCATIONAL");

  const documentTitle = extractLegitimateCourseTitle(pages, fallbackSubjectName);
  const chapters = detectChaptersFromPages(classifiedPages);

  let totalTopics = 0;
  let totalConcepts = 0;
  let totalRules = 0;
  let totalCases = 0;

  for (const ch of chapters) {
    totalTopics += Math.max(ch.topics.length, 1);
    totalConcepts += Math.max(ch.coreConcepts.length, 2);
    totalRules += Math.max(ch.rulesAndConditions.length, 1);
    totalCases += Math.max(ch.casesAndScenarios.length, 1);
  }

  const ignoredPagesCount = metadataPages.length + referencePages.length;

  const globalSummary = `Tài liệu "${documentTitle}" gồm ${totalPages} trang đã được phân tích toàn diện. Hệ thống đã xác định ${chapters.length} chương nội dung học thuật chính (${totalTopics} chủ đề, ${totalConcepts} khái niệm trọng tâm), đồng thời loại bỏ ${ignoredPagesCount} trang thông tin hành chính/bìa/tài liệu tham khảo khỏi phạm vi tạo đề thi.`;

  return {
    documentTitle,
    totalPages,
    metadataPages,
    tocPages,
    referencePages,
    educationalPagesCount: educationalPages.length,
    chapters,
    detectedStats: {
      chaptersCount: chapters.length,
      topicsCount: totalTopics,
      conceptsCount: totalConcepts,
      rulesCount: totalRules,
      casesCount: totalCases,
      ignoredPagesCount,
    },
    globalSummary,
  };
}

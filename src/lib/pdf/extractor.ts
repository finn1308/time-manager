import crypto from "crypto";
import { PDFParse } from "pdf-parse";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface PDFExtractionResult {
  fullText: string;
  cleanedText: string;
  pageCount: number;
  pages: ExtractedPage[];
  contentHash: string;
  headings: string[];
}

/**
 * Extracts and cleans text from a PDF buffer using pdf-parse v2
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const pageCount = textResult.total || textResult.pages?.length || 1;

    const pages: ExtractedPage[] = [];
    const fullTextParts: string[] = [];

    if (textResult.pages && Array.isArray(textResult.pages)) {
      for (let i = 0; i < textResult.pages.length; i++) {
        const pageObj = textResult.pages[i];
        const pageNum = pageObj.num || i + 1;
        const rawPageText = pageObj.text || "";
        const cleanPageText = cleanText(rawPageText);

        pages.push({
          pageNumber: pageNum,
          text: cleanPageText,
        });

        if (cleanPageText.trim()) {
          fullTextParts.push(`--- [Trang ${pageNum}] ---\n${cleanPageText}`);
        }
      }
    } else {
      const singleText = cleanText(textResult.text || "");
      pages.push({ pageNumber: 1, text: singleText });
      fullTextParts.push(singleText);
    }

    const fullText = fullTextParts.join("\n\n");
    const cleanedText = cleanText(fullText);

    // Compute SHA-256 hash of the content for deduplication and caching
    const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Detect structural headings from the text
    const headings = extractHeadings(cleanedText);

    return {
      fullText,
      cleanedText,
      pageCount,
      pages,
      contentHash,
      headings,
    };
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Cleans extracted PDF text by normalizing spaces, removing non-printable chars,
 * and tidying line breaks while preserving paragraphs.
 */
export function cleanText(raw: string): string {
  if (!raw) return "";

  return raw
    // Normalize unicode spaces
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    // Remove null and control characters except \n and \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize repetitive newlines (more than 2 consecutive -> 2)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // Replace multiple spaces/tabs with single space
    .replace(/[ \t]{2,}/g, " ")
    // Trim each line
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

/**
 * Detects chapter/section headings from text lines
 */
function extractHeadings(text: string): string[] {
  const lines = text.split("\n");
  const headings: string[] = [];

  const headingRegex = /^(chương\s+\d+|phần\s+\d+|bài\s+\d+|chapter\s+\d+|section\s+\d+|[I|V|X]+\.\s+|[0-9]+\.[0-9]+|\b[A-Z0-9\s]{4,30}\b)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 3 && trimmed.length < 90) {
      if (headingRegex.test(trimmed)) {
        headings.push(trimmed);
      }
    }
  }

  // Deduplicate and return top headings
  return Array.from(new Set(headings)).slice(0, 30);
}

/**
 * Splits long text into chunks of approximately maxTokens (approx 4 chars per token)
 * while preserving page references for citation accuracy.
 */
export function chunkTextWithPageRef(
  pages: ExtractedPage[],
  maxCharsPerChunk = 4000
): Array<{ chunkIndex: number; startPage: number; endPage: number; text: string }> {
  const chunks: Array<{ chunkIndex: number; startPage: number; endPage: number; text: string }> = [];

  let currentChunk = "";
  let startPage = pages[0]?.pageNumber || 1;
  let endPage = startPage;
  let chunkIdx = 0;

  for (const page of pages) {
    const pageSnippet = `[Trang ${page.pageNumber}]\n${page.text}\n\n`;

    if (currentChunk.length + pageSnippet.length > maxCharsPerChunk && currentChunk.length > 0) {
      chunks.push({
        chunkIndex: chunkIdx++,
        startPage,
        endPage,
        text: currentChunk.trim(),
      });
      currentChunk = pageSnippet;
      startPage = page.pageNumber;
      endPage = page.pageNumber;
    } else {
      currentChunk += pageSnippet;
      endPage = page.pageNumber;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex: chunkIdx,
      startPage,
      endPage,
      text: currentChunk.trim(),
    });
  }

  return chunks;
}

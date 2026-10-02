import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromPDF, cleanText } from "@/lib/pdf/extractor";
import { analyzeDocumentFull } from "@/lib/ai/document-analyzer";
import { parseDocumentTextToPages } from "@/lib/ai/learning-generator";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handle JSON text paste
    if (contentType.includes("application/json")) {
      const { text, title, subjectId } = await req.json();

      if (!text || text.trim().length < 20) {
        return NextResponse.json(
          { error: "Nội dung văn bản quá ngắn (yêu cầu tối thiểu 20 ký tự)" },
          { status: 400 }
        );
      }

      let subjectName: string | undefined;
      if (subjectId) {
        const sub = await prisma.subject.findFirst({
          where: { id: subjectId, userId: user.id },
          select: { name: true },
        });
        if (sub) subjectName = sub.name;
      }

      const cleaned = cleanText(text);
      const contentHash = crypto.createHash("sha256").update(cleaned).digest("hex");
      const docTitle = title?.trim() || subjectName || "Tài liệu học tập tự nhập";

      const doc = await prisma.document.create({
        data: {
          userId: user.id,
          subjectId: subjectId || null,
          filename: docTitle,
          fileSize: Buffer.byteLength(cleaned, "utf8"),
          fileType: "text/plain",
          extractedText: cleaned,
          pageCount: 1,
          contentHash,
          status: "READY",
        },
      });

      const pages = parseDocumentTextToPages(cleaned);
      const analysisReport = analyzeDocumentFull(pages, subjectName || docTitle);

      return NextResponse.json({
        success: true,
        documentId: doc.id,
        filename: doc.filename,
        fileType: doc.fileType,
        pageCount: analysisReport.totalPages,
        characterCount: cleaned.length,
        analysisReport,
        sampleText: cleaned.slice(0, 300) + "...",
      });
    }

    // 2. Handle Multipart Form Data (PDF or text file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const subjectId = formData.get("subjectId") as string | null;

      if (!file) {
        return NextResponse.json({ error: "Vui lòng chọn file tải lên" }, { status: 400 });
      }

      let subjectName: string | undefined;
      if (subjectId) {
        const sub = await prisma.subject.findFirst({
          where: { id: subjectId, userId: user.id },
          select: { name: true },
        });
        if (sub) subjectName = sub.name;
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name || "tailieu.pdf";
      const fileSize = file.size;

      let extractedText = "";
      let pageCount = 1;
      let contentHash = "";
      let headings: string[] = [];

      if (fileName.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
        try {
          const pdfResult = await extractTextFromPDF(fileBuffer);
          extractedText = pdfResult.fullText;
          pageCount = pdfResult.pageCount;
          contentHash = pdfResult.contentHash;
          headings = pdfResult.headings;
        } catch (pdfErr: any) {
          console.error("PDF Parsing error:", pdfErr);
          return NextResponse.json(
            { error: `Không thể đọc nội dung file PDF: ${pdfErr.message || "File bị mã hóa hoặc lỗi định dạng"}` },
            { status: 400 }
          );
        }
      } else {
        // Plain text / markdown file
        extractedText = cleanText(fileBuffer.toString("utf8"));
        pageCount = 1;
        contentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      }

      if (!extractedText || extractedText.trim().length < 20) {
        return NextResponse.json(
          { error: "Không tìm thấy nội dung văn bản có thể đọc được trong tài liệu tải lên." },
          { status: 400 }
        );
      }

      const doc = await prisma.document.create({
        data: {
          userId: user.id,
          subjectId: subjectId || null,
          filename: fileName,
          fileSize,
          fileType: file.type || "application/pdf",
          extractedText,
          pageCount,
          contentHash,
          status: "READY",
        },
      });

      // Perform full document structure analysis across all pages
      const pages = parseDocumentTextToPages(extractedText);
      const analysisReport = analyzeDocumentFull(pages, subjectName);

      return NextResponse.json({
        success: true,
        documentId: doc.id,
        filename: doc.filename,
        fileType: doc.fileType,
        pageCount: analysisReport.totalPages,
        characterCount: extractedText.length,
        headings,
        analysisReport,
        sampleText: extractedText.slice(0, 300) + "...",
      });
    }

    return NextResponse.json({ error: "Định dạng request không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    console.error("Document upload API error:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý tài liệu" }, { status: 500 });
  }
}

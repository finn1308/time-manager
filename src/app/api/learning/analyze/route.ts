import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeDocumentFull } from "@/lib/ai/document-analyzer";
import { parseDocumentTextToPages } from "@/lib/ai/learning-generator";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId, customText, subjectId } = await req.json();

    let text = customText?.trim() || "";
    let subjectName: string | undefined;

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId: user.id },
      });
      if (subject) {
        subjectName = subject.name;
        if (!text && subject.description) {
          text = `Môn học: ${subject.name}\n${subject.description}`;
        }
      }
    }

    if (documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: documentId, userId: user.id },
      });
      if (doc && doc.extractedText) {
        text = doc.extractedText;
      }
    }

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp tài liệu học tập để phân tích." },
        { status: 400 }
      );
    }

    const pages = parseDocumentTextToPages(text);
    const report = analyzeDocumentFull(pages, subjectName);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error("Analyze document error:", err);
    return NextResponse.json({ error: err.message || "Lỗi phân tích tài liệu" }, { status: 500 });
  }
}

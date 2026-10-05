import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSyllabusDeterministic } from "@/lib/ai/syllabus-parser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, semesterId } = await req.json();

    if (!text || text.trim().length < 30) {
      return NextResponse.json(
        { error: "Nội dung đề cương (syllabus) quá ngắn để phân tích" },
        { status: 400 }
      );
    }

    const parsedData = parseSyllabusDeterministic(text);

    // Save as a draft import
    const record = await prisma.syllabusImport.create({
      data: {
        userId: user.id,
        rawText: text,
        parsedDataJson: JSON.stringify(parsedData),
        status: "PARSED",
      },
    });

    return NextResponse.json({
      success: true,
      importId: record.id,
      parsedData,
    });
  } catch (err: any) {
    console.error("Error parsing syllabus:", err);
    return NextResponse.json({ error: err.message || "Lỗi bóc tách đề cương" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordMistake, resolveOrUpdateMistake, getMistakeStats } from "@/lib/mistakes/mistake-engine";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const errorType = searchParams.get("errorType");
  const isResolvedParam = searchParams.get("isResolved");
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 30));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const whereClause: any = { userId: user.id };

  if (subjectId && subjectId !== "ALL") {
    whereClause.subjectId = subjectId;
  }
  if (errorType && errorType !== "ALL") {
    whereClause.errorType = errorType;
  }
  if (isResolvedParam !== null && isResolvedParam !== undefined && isResolvedParam !== "") {
    whereClause.isResolved = isResolvedParam === "true";
  }
  if (search) {
    whereClause.OR = [
      { question: { contains: search, mode: "insensitive" } },
      { concept: { contains: search, mode: "insensitive" } },
      { topic: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [mistakes, totalCount, stats] = await Promise.all([
      prisma.mistakeRecord.findMany({
        where: whereClause,
        include: {
          subject: { select: { id: true, name: true, color: true, code: true } },
        },
        orderBy: [{ isResolved: "asc" }, { nextReviewDate: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.mistakeRecord.count({ where: whereClause }),
      getMistakeStats(user.id),
    ]);

    return NextResponse.json({
      success: true,
      mistakes,
      totalCount,
      stats,
    });
  } catch (err: any) {
    console.error("Error fetching mistakes:", err);
    return NextResponse.json({ error: err.message || "Lỗi tải ngân hàng lỗi sai" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      subjectId,
      sourceType,
      sourceId,
      question,
      correctAnswer,
      userAnswer,
      concept,
      topic,
      errorType,
      difficulty,
      explanation,
    } = body;

    if (!question || !correctAnswer || !userAnswer) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp câu hỏi, đáp án đúng và câu trả lời của bạn" },
        { status: 400 }
      );
    }

    const mistake = await recordMistake({
      userId: user.id,
      subjectId,
      sourceType: sourceType || "PRACTICE",
      sourceId,
      question,
      correctAnswer,
      userAnswer,
      concept,
      topic,
      errorType,
      difficulty,
      explanation,
    });

    return NextResponse.json({ success: true, mistake });
  } catch (err: any) {
    console.error("Error creating mistake record:", err);
    return NextResponse.json({ error: err.message || "Lỗi ghi nhận lỗi sai" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mistakeId, isCorrect, rating, isResolved } = body;

    if (!mistakeId) {
      return NextResponse.json({ error: "Thiếu ID lỗi sai" }, { status: 400 });
    }

    if (isResolved !== undefined) {
      const updated = await prisma.mistakeRecord.update({
        where: { id: mistakeId, userId: user.id },
        data: { isResolved: Boolean(isResolved), lastReviewedAt: new Date() },
      });
      return NextResponse.json({ success: true, mistake: updated });
    }

    const updated = await resolveOrUpdateMistake(mistakeId, user.id, Boolean(isCorrect), rating);
    return NextResponse.json({ success: true, mistake: updated });
  } catch (err: any) {
    console.error("Error updating mistake record:", err);
    return NextResponse.json({ error: err.message || "Lỗi cập nhật lỗi sai" }, { status: 500 });
  }
}

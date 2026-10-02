import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;

  try {
    const { questionId, selectedAnswer } = await req.json();

    if (!questionId || typeof selectedAnswer !== "number") {
      return NextResponse.json({ error: "Thiếu thông tin câu hỏi hoặc đáp án đã chọn" }, { status: 400 });
    }

    const question = await prisma.quizQuestion.findFirst({
      where: { id: questionId, quizId },
    });

    if (!question) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi tương ứng trong bài Quiz" }, { status: 404 });
    }

    const isCorrect = question.correctAnswer === selectedAnswer;
    const xpEarned = isCorrect ? 10 : 0;

    return NextResponse.json({
      success: true,
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      correctAnswer: question.correctAnswer,
      rationale: question.rationale,
      sourceReference: question.sourceReference || undefined,
      sourcePage: question.sourcePage || undefined,
      xpEarned,
    });
  } catch (err: any) {
    console.error("Submit single answer error:", err);
    return NextResponse.json({ error: "Lỗi kiểm tra đáp án" }, { status: 500 });
  }
}

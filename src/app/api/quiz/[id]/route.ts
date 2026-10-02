import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "PRACTICE"; // PRACTICE or EXAM

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        stage: {
          select: {
            id: true,
            dayNumber: true,
            title: true,
            xpReward: true,
            roadmapId: true,
          },
        },
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            hint: mode === "PRACTICE", // Only include hint in practice mode
            difficulty: true,
            questionType: true,
            topic: true,
            sourceReference: true,
            sourcePage: true,
            // SECURITY: correctAnswer and rationale are NEVER exposed upfront!
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Không tìm thấy bài Quiz" }, { status: 404 });
    }

    // Parse options from JSON string
    const questions = quiz.questions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = [q.options];
      }
      return {
        ...q,
        options: parsedOptions,
      };
    });

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        questionCount: quiz.questionCount,
        mode,
        stage: quiz.stage,
        subject: quiz.subject,
        questions,
      },
    });
  } catch (err: any) {
    console.error("Fetch quiz error:", err);
    return NextResponse.json({ error: "Lỗi tải bài Quiz" }, { status: 500 });
  }
}

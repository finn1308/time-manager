import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AdaptiveLearningService } from "@/lib/learning/adaptive-service";
import { z } from "zod";

const NextQuestionSchema = z.object({
  wordSetId: z.string().optional(),
  courseId: z.string().optional(),
  recentlyShownIds: z.array(z.string()).optional(),
  forceType: z
    .enum(["RECOGNITION", "RECALL", "SENTENCE_COMPLETION", "LISTENING", "SPELLING"])
    .optional(),
  minimumReviewGap: z.number().min(0).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = NextQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const question = await AdaptiveLearningService.getNextQuestion({
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error: any) {
    console.error("Error in /api/learning/next-question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate next question" },
      { status: 500 }
    );
  }
}

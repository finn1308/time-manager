import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AdaptiveLearningService } from "@/lib/learning/adaptive-service";
import { z } from "zod";

const RecordEventSchema = z.object({
  vocabularyId: z.string().min(1, "vocabularyId is required"),
  isCorrect: z.boolean(),
  responseTimeSeconds: z.number().min(0).max(300).default(3.0),
  questionType: z.enum([
    "RECOGNITION",
    "RECALL",
    "SENTENCE_COMPLETION",
    "LISTENING",
    "SPELLING",
  ]),
  answer: z.string().optional(),
  eventType: z
    .enum([
      "VIEW",
      "ANSWER_CORRECT",
      "ANSWER_INCORRECT",
      "SKIPPED",
      "FLASHCARD_REVIEW",
      "QUIZ_COMPLETED",
      "MANUAL_MARK_KNOWN",
      "MANUAL_MARK_UNKNOWN",
    ])
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = RecordEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await AdaptiveLearningService.recordLearningEvent({
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in /api/learning/events:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record learning event" },
      { status: 500 }
    );
  }
}

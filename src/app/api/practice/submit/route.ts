import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, skillId, score, total, durationSeconds } = body;

    if (!subjectId || !skillId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const accuracy = Math.round((score / total) * 100);

    // Save study session
    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId,
        actualStart: new Date(Date.now() - durationSeconds * 1000),
        actualEnd: new Date(),
        actualDurationSeconds: durationSeconds,
        productivityScore: accuracy, // Can use accuracy as productivity score
        source: "PRACTICE_SESSION",
        notes: `Practice: ${skillId.charAt(0).toUpperCase() + skillId.slice(1)} (${score}/${total})`,
      }
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("[PRACTICE_SUBMIT_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

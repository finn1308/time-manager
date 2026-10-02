import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { detectMissedSessions, generateRecoveryProposals } from "@/lib/scheduling/reschedule-engine";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { missedSessions, totalMissedMinutes } = await detectMissedSessions(user.id);
    const { optionA, optionB } = await generateRecoveryProposals(user.id, missedSessions);

    return NextResponse.json({
      success: true,
      missedCount: missedSessions.length,
      totalMissedHours: Math.round((totalMissedMinutes / 60) * 10) / 10,
      missedSessions,
      optionA,
      optionB,
    });
  } catch (err: any) {
    console.error("Detect missed sessions error:", err);
    return NextResponse.json({ error: "Lỗi quét các phiên học bị lỡ" }, { status: 500 });
  }
}

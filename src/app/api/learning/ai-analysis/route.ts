import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LearningAnalysisService } from "@/lib/learning/ai/analysis-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reportData = await LearningAnalysisService.getUserLearningReport(user.id, false);
    return NextResponse.json({
      success: true,
      ...reportData,
    });
  } catch (error: any) {
    console.error("Error in GET /api/learning/ai-analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch AI learning report" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body.forceRefresh);

    const reportData = await LearningAnalysisService.getUserLearningReport(user.id, forceRefresh);
    return NextResponse.json({
      success: true,
      ...reportData,
    });
  } catch (error: any) {
    console.error("Error in POST /api/learning/ai-analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI analysis" },
      { status: 500 }
    );
  }
}

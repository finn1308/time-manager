import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AdaptiveLearningService } from "@/lib/learning/adaptive-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analytics = await AdaptiveLearningService.getAnalyticsDashboard(user.id);
    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error("Error in /api/learning/analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch learning analytics" },
      { status: 500 }
    );
  }
}

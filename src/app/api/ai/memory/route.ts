import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLearningMemory, synthesizeAndSaveLearningMemory } from "@/lib/ai/learning-memory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memory = await getUserLearningMemory(user.id);
    return NextResponse.json({ success: true, profile: memory });
  } catch (err: any) {
    console.error("Error fetching learning profile:", err);
    return NextResponse.json({ error: err.message || "Lỗi tải hồ sơ học tập" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      overallLevel,
      preferredDurationMins,
      preferredTimeOfDay,
      strengths,
      weaknesses,
      action,
    } = body;

    if (action === "RECALCULATE") {
      const refreshed = await synthesizeAndSaveLearningMemory(user.id);
      const memory = await getUserLearningMemory(user.id);
      return NextResponse.json({ success: true, message: "Đã tổng hợp lại hồ sơ nhận thức", profile: memory });
    }

    const updated = await prisma.userLearningMemory.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        overallLevel: overallLevel || "INTERMEDIATE",
        preferredDurationMins: preferredDurationMins ? Number(preferredDurationMins) : 45,
        preferredTimeOfDay: preferredTimeOfDay || "EVENING",
        strengthsJson: strengths ? JSON.stringify(strengths) : "[]",
        weaknessesJson: weaknesses ? JSON.stringify(weaknesses) : "[]",
      },
      update: {
        ...(overallLevel && { overallLevel }),
        ...(preferredDurationMins && { preferredDurationMins: Number(preferredDurationMins) }),
        ...(preferredTimeOfDay && { preferredTimeOfDay }),
        ...(strengths && { strengthsJson: JSON.stringify(strengths) }),
        ...(weaknesses && { weaknessesJson: JSON.stringify(weaknesses) }),
      },
    });

    const memory = await getUserLearningMemory(user.id);
    return NextResponse.json({ success: true, profile: memory });
  } catch (err: any) {
    console.error("Error updating learning profile:", err);
    return NextResponse.json({ error: err.message || "Lỗi cập nhật hồ sơ học tập" }, { status: 500 });
  }
}

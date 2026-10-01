import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let aiPreferences = await prisma.aiPreferences.findUnique({
    where: { userId: user.id },
  });

  if (!aiPreferences) {
    aiPreferences = await prisma.aiPreferences.create({
      data: {
        userId: user.id,
        preferredStudyDuration: 90,
        preferredBreakDuration: 15,
        preferredStudyDays: "1,2,3,4,5,6,0",
        preferredTimeRanges: "14:00-17:00,19:00-22:30",
        maxDailyStudyHours: 6.0,
      },
    });
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ aiPreferences, userSettings });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      preferredStudyDuration,
      preferredBreakDuration,
      preferredStudyDays,
      preferredTimeRanges,
      maxDailyStudyHours,
    } = body;

    const aiPreferences = await prisma.aiPreferences.upsert({
      where: { userId: user.id },
      update: {
        preferredStudyDuration: preferredStudyDuration !== undefined ? parseInt(preferredStudyDuration, 10) : undefined,
        preferredBreakDuration: preferredBreakDuration !== undefined ? parseInt(preferredBreakDuration, 10) : undefined,
        preferredStudyDays: preferredStudyDays !== undefined ? preferredStudyDays : undefined,
        preferredTimeRanges: preferredTimeRanges !== undefined ? preferredTimeRanges : undefined,
        maxDailyStudyHours: maxDailyStudyHours !== undefined ? parseFloat(maxDailyStudyHours) : undefined,
      },
      create: {
        userId: user.id,
        preferredStudyDuration: parseInt(preferredStudyDuration, 10) || 90,
        preferredBreakDuration: parseInt(preferredBreakDuration, 10) || 15,
        preferredStudyDays: preferredStudyDays || "1,2,3,4,5,6,0",
        preferredTimeRanges: preferredTimeRanges || "14:00-17:00,19:00-22:30",
        maxDailyStudyHours: parseFloat(maxDailyStudyHours) || 6.0,
      },
    });

    return NextResponse.json({ success: true, aiPreferences });
  } catch (err: any) {
    console.error("Update AI preferences error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật tùy chọn AI" }, { status: 500 });
  }
}

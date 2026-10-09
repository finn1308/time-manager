import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: user.id,
        timezone: "Asia/Ho_Chi_Minh",
        weeklyStudyBudgetHours: 20.0,
      },
    });
  }

  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      weeklyStudyBudgetHours,
      notificationsEnabled,
      examMode,
      autoDayClosureEnabled,
      autoRolloverTasksEnabled,
    } = await req.json();

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...(weeklyStudyBudgetHours !== undefined ? { weeklyStudyBudgetHours: parseFloat(weeklyStudyBudgetHours) } : {}),
        ...(notificationsEnabled !== undefined ? { notificationsEnabled: Boolean(notificationsEnabled) } : {}),
        ...(examMode !== undefined ? { examMode: Boolean(examMode) } : {}),
        ...(autoDayClosureEnabled !== undefined ? { autoDayClosureEnabled: Boolean(autoDayClosureEnabled) } : {}),
        ...(autoRolloverTasksEnabled !== undefined ? { autoRolloverTasksEnabled: Boolean(autoRolloverTasksEnabled) } : {}),
      },
      create: {
        userId: user.id,
        weeklyStudyBudgetHours: weeklyStudyBudgetHours ? parseFloat(weeklyStudyBudgetHours) : 20.0,
        notificationsEnabled: notificationsEnabled !== undefined ? Boolean(notificationsEnabled) : true,
        examMode: examMode !== undefined ? Boolean(examMode) : false,
        autoDayClosureEnabled: autoDayClosureEnabled !== undefined ? Boolean(autoDayClosureEnabled) : false,
        autoRolloverTasksEnabled: autoRolloverTasksEnabled !== undefined ? Boolean(autoRolloverTasksEnabled) : false,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error("Error updating user settings:", err);
    return NextResponse.json({ error: "Lỗi cập nhật cài đặt" }, { status: 500 });
  }
}

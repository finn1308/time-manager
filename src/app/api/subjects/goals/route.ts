import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { subjectId, targetHours, title, description, deadline, status } = await req.json();

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        subjectId,
        title: title || "Mục tiêu môn học",
        description: description || null,
        targetHours: targetHours ? parseFloat(targetHours) : 10.0,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi lưu mục tiêu" }, { status: 500 });
  }
}

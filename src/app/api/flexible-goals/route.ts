import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDailyFlexibleGoals } from "@/lib/flexible-goals/service";
import { getDateKeyVN } from "@/lib/date-utils";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("date") || getDateKeyVN(new Date());

  try {
    const goals = await getDailyFlexibleGoals(user.id, dateKey);
    return NextResponse.json({ goals, dateKey });
  } catch (err: any) {
    console.error("GET /api/flexible-goals error:", err);
    return NextResponse.json(
      { error: "Lỗi tải danh sách mục tiêu linh hoạt: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      subjectId,
      skillId,
      targetMinutes,
      startDate,
      endDate,
      activeDays,
      preferredPeriod,
      deadline,
    } = body;

    // 1. Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên môn học hoặc mục tiêu linh hoạt" },
        { status: 400 }
      );
    }

    const duration = parseInt(targetMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { error: "Thời lượng mục tiêu hàng ngày phải lớn hơn 0 phút" },
        { status: 400 }
      );
    }

    // 2. Validate Subject ownership if provided
    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId: user.id },
      });
      if (!subject) {
        return NextResponse.json({ error: "Môn học không tồn tại" }, { status: 400 });
      }
    }

    // 3. Validate Skill ownership if provided
    if (skillId) {
      const skill = await prisma.skill.findFirst({
        where: { id: skillId, userId: user.id },
      });
      if (!skill) {
        return NextResponse.json({ error: "Kỹ năng (Skill) không tồn tại" }, { status: 400 });
      }
    }

    // 4. Normalize active days string (e.g. "1,2,3,4,5")
    let activeDaysStr = "1,2,3,4,5";
    if (Array.isArray(activeDays)) {
      activeDaysStr = activeDays.join(",");
    } else if (typeof activeDays === "string" && activeDays.trim()) {
      activeDaysStr = activeDays.trim();
    }

    // 5. Parse dates
    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedEnd = endDate ? new Date(endDate) : null;
    const parsedDeadline = deadline ? new Date(deadline) : null;

    const goal = await prisma.flexibleStudyGoal.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        subjectId: subjectId || null,
        skillId: skillId || null,
        targetMinutes: duration,
        startDate: parsedStart,
        endDate: parsedEnd,
        activeDays: activeDaysStr,
        preferredPeriod: preferredPeriod || "ANY",
        deadline: parsedDeadline,
        status: "ACTIVE",
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        skill: { select: { id: true, name: true, category: true } },
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (err: any) {
    console.error("POST /api/flexible-goals error:", err);
    return NextResponse.json(
      { error: "Lỗi tạo mục tiêu linh hoạt: " + err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      subjectId,
      skillId,
      targetMinutes,
      startDate,
      endDate,
      activeDays,
      preferredPeriod,
      deadline,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID mục tiêu" }, { status: 400 });
    }

    const existing = await prisma.flexibleStudyGoal.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Mục tiêu không tồn tại" }, { status: 404 });
    }

    let activeDaysStr = existing.activeDays;
    if (Array.isArray(activeDays)) {
      activeDaysStr = activeDays.join(",");
    } else if (typeof activeDays === "string" && activeDays.trim()) {
      activeDaysStr = activeDays.trim();
    }

    const updated = await prisma.flexibleStudyGoal.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        subjectId: subjectId !== undefined ? subjectId || null : undefined,
        skillId: skillId !== undefined ? skillId || null : undefined,
        targetMinutes: targetMinutes !== undefined ? parseInt(targetMinutes, 10) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        activeDays: activeDaysStr,
        preferredPeriod: preferredPeriod || undefined,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
        status: status || undefined,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        skill: { select: { id: true, name: true, category: true } },
      },
    });

    return NextResponse.json({ success: true, goal: updated });
  } catch (err: any) {
    console.error("PUT /api/flexible-goals error:", err);
    return NextResponse.json(
      { error: "Lỗi cập nhật mục tiêu linh hoạt: " + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID mục tiêu" }, { status: 400 });
    }

    const existing = await prisma.flexibleStudyGoal.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Mục tiêu không tồn tại" }, { status: 404 });
    }

    // Soft delete / archive to ensure historical study sessions and daily progress remain intact
    await prisma.flexibleStudyGoal.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true, message: "Đã lưu trữ mục tiêu học tập linh hoạt." });
  } catch (err: any) {
    console.error("DELETE /api/flexible-goals error:", err);
    return NextResponse.json(
      { error: "Lỗi xóa mục tiêu: " + err.message },
      { status: 500 }
    );
  }
}

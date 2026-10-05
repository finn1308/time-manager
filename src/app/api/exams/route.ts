import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateExamStrategy } from "@/lib/exams/exam-engine";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exams = await prisma.examPreparation.findMany({
      where: { userId: user.id },
      include: {
        subject: { select: { id: true, name: true, color: true, code: true } },
      },
      orderBy: [{ status: "asc" }, { examDate: "asc" }],
    });

    // Augment with dynamic strategy
    const enrichedExams = await Promise.all(
      exams.map(async (exam) => {
        const [totalMistakes, resolvedMistakes] = await Promise.all([
          prisma.mistakeRecord.count({
            where: { userId: user.id, ...(exam.subjectId ? { subjectId: exam.subjectId } : {}) },
          }),
          prisma.mistakeRecord.count({
            where: { userId: user.id, isResolved: true, ...(exam.subjectId ? { subjectId: exam.subjectId } : {}) },
          }),
        ]);

        const strategy = calculateExamStrategy({
          examDate: exam.examDate,
          targetScore: exam.targetScore,
          currentScore: exam.currentScore,
          availableStudyHours: exam.availableStudyHours,
          currentPhase: exam.currentPhase,
          weakTopicsCount: 0,
          resolvedMistakesCount: resolvedMistakes,
          totalMistakesCount: totalMistakes,
        });

        return {
          ...exam,
          strategy,
        };
      })
    );

    return NextResponse.json({ success: true, exams: enrichedExams });
  } catch (err: any) {
    console.error("Error fetching exams:", err);
    return NextResponse.json({ error: err.message || "Lỗi tải danh sách kỳ thi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      subjectId,
      examDate,
      targetScore = 8.5,
      currentScore = 5.0,
      availableStudyHours = 40.0,
      weakTopics = [],
    } = body;

    if (!title || !examDate) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên kỳ thi và ngày thi" },
        { status: 400 }
      );
    }

    const exam = await prisma.examPreparation.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title,
        examDate: new Date(examDate),
        targetScore: Number(targetScore) || 8.5,
        currentScore: Number(currentScore) || 5.0,
        availableStudyHours: Number(availableStudyHours) || 40.0,
        currentPhase: "FOUNDATION",
        weakTopicsJson: JSON.stringify(weakTopics),
        readinessScore: 20.0,
        status: "ACTIVE",
        riskLevel: "MODERATE",
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    // Also create calendar event for exam
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: `🎯 Kỳ thi: ${title}`,
        description: `Kỳ thi mục tiêu điểm số: ${targetScore}`,
        startTime: new Date(examDate),
        endTime: new Date(new Date(examDate).getTime() + 2 * 60 * 60 * 1000),
        type: "EXAM",
        isLocked: true,
      },
    });

    return NextResponse.json({ success: true, exam });
  } catch (err: any) {
    console.error("Error creating exam:", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo kỳ thi" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, currentPhase, currentScore, targetScore, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID kỳ thi" }, { status: 400 });
    }

    const updated = await prisma.examPreparation.update({
      where: { id, userId: user.id },
      data: {
        ...(currentPhase && { currentPhase }),
        ...(currentScore !== undefined && { currentScore: Number(currentScore) }),
        ...(targetScore !== undefined && { targetScore: Number(targetScore) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, exam: updated });
  } catch (err: any) {
    console.error("Error updating exam:", err);
    return NextResponse.json({ error: err.message || "Lỗi cập nhật kỳ thi" }, { status: 500 });
  }
}

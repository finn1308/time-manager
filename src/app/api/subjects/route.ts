import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { convertGrade10To4 } from "@/lib/academic/gpa-calculator";

// In-memory cache for subjects queries (30s TTL per user query)
const subjectsServerCache = new Map<string, { data: any; expiresAt: number }>();
const SUBJECTS_CACHE_TTL_MS = 30_000;

export function invalidateSubjectsServerCache(userId?: string) {
  if (userId) {
    for (const key of subjectsServerCache.keys()) {
      if (key.startsWith(userId)) {
        subjectsServerCache.delete(key);
      }
    }
  } else {
    subjectsServerCache.clear();
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get("semesterId");
  const academicStatus = searchParams.get("status");
  const isMinimal = searchParams.get("minimal") === "true";

  const cacheKey = `${user.id}:${semesterId || "all"}:${academicStatus || "all"}:${isMinimal}`;
  const cached = subjectsServerCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ subjects: cached.data });
  }

  const whereClause: any = { userId: user.id };
  if (semesterId) whereClause.semesterId = semesterId;
  if (academicStatus) whereClause.status = academicStatus;

  let subjects;
  if (isMinimal) {
    subjects = await prisma.subject.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        priority: true,
        targetHours: true,
        status: true,
        isArchived: true,
      },
      orderBy: [{ isArchived: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  } else {
    subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        semester: {
          select: {
            id: true,
            name: true,
            type: true,
            academicYear: {
              select: {
                id: true,
                name: true,
                yearNumber: true,
              },
            },
          },
        },
        goals: {
          include: {
            milestoneRecords: true,
          },
        },
        tasks: {
          where: { isCompleted: false },
          take: 10,
        },
        studySessions: {
          orderBy: { actualStart: "desc" },
          take: 5,
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: [{ isArchived: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  }

  subjectsServerCache.set(cacheKey, { data: subjects, expiresAt: Date.now() + SUBJECTS_CACHE_TTL_MS });

  return NextResponse.json({ subjects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name,
      code,
      color,
      description,
      targetHours,
      priority,
      targetScore,
      deadline,
      difficulty,
      estimatedWorkload,
      semesterId,
      credits,
      lecturer,
      classroom,
      syllabus,
      status,
      midtermScore,
      finalScore,
      courseGrade,
      gradeWeightJson,
      attendanceCount,
      totalSessions,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên môn học không được để trống" }, { status: 400 });
    }

    // Auto-calculate letterGrade and gradePoints if courseGrade is given
    let calculatedLetter: string | null = null;
    let calculatedPoints: number | null = null;
    if (courseGrade !== undefined && courseGrade !== null && !isNaN(Number(courseGrade))) {
      const conv = convertGrade10To4(Number(courseGrade));
      calculatedLetter = conv.letter;
      calculatedPoints = conv.points4;
    }

    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name: name.trim(),
        code: code?.trim() || null,
        color: color || "#2d6a4f",
        description: description?.trim() || null,
        targetHours: targetHours ? parseFloat(targetHours) : null,
        priority: priority ? parseInt(priority, 10) : 3,
        targetScore: targetScore?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        difficulty: difficulty || "MEDIUM",
        estimatedWorkload: estimatedWorkload ? parseFloat(estimatedWorkload) : null,
        isArchived: false,
        // Academic extensions
        semesterId: semesterId || null,
        credits: credits !== undefined ? parseInt(credits, 10) : 3,
        lecturer: lecturer?.trim() || null,
        classroom: classroom?.trim() || null,
        syllabus: syllabus?.trim() || null,
        status: status || "ACTIVE",
        midtermScore: midtermScore !== undefined && midtermScore !== null ? parseFloat(midtermScore) : null,
        finalScore: finalScore !== undefined && finalScore !== null ? parseFloat(finalScore) : null,
        courseGrade: courseGrade !== undefined && courseGrade !== null ? parseFloat(courseGrade) : null,
        letterGrade: calculatedLetter,
        gradePoints: calculatedPoints,
        gradeWeightJson: gradeWeightJson || null,
        attendanceCount: attendanceCount !== undefined ? parseInt(attendanceCount, 10) : 0,
        totalSessions: totalSessions !== undefined ? parseInt(totalSessions, 10) : 15,
      },
      include: {
        semester: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "SUBJECT",
        entityId: subject.id,
        action: "CREATE",
        detailsJson: JSON.stringify({ name: subject.name, credits: subject.credits, semesterId }),
      },
    });

    invalidateSubjectsServerCache(user.id);
    return NextResponse.json({ success: true, subject });
  } catch (err: any) {
    console.error("Error creating subject:", err);
    return NextResponse.json({ error: "Lỗi tạo môn học: " + err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      name,
      code,
      color,
      description,
      targetHours,
      priority,
      targetScore,
      deadline,
      difficulty,
      estimatedWorkload,
      isArchived,
      semesterId,
      credits,
      lecturer,
      classroom,
      syllabus,
      status,
      midtermScore,
      finalScore,
      courseGrade,
      letterGrade,
      gradePoints,
      gradeWeightJson,
      attendanceCount,
      totalSessions,
    } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID môn học" }, { status: 400 });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (targetHours !== undefined) updateData.targetHours = targetHours ? parseFloat(targetHours) : null;
    if (priority !== undefined) updateData.priority = parseInt(priority, 10);
    if (targetScore !== undefined) updateData.targetScore = targetScore?.trim() || null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (estimatedWorkload !== undefined) updateData.estimatedWorkload = estimatedWorkload ? parseFloat(estimatedWorkload) : null;
    if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);

    // Academic updates
    if (semesterId !== undefined) updateData.semesterId = semesterId || null;
    if (credits !== undefined) updateData.credits = parseInt(credits, 10);
    if (lecturer !== undefined) updateData.lecturer = lecturer?.trim() || null;
    if (classroom !== undefined) updateData.classroom = classroom?.trim() || null;
    if (syllabus !== undefined) updateData.syllabus = syllabus?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (midtermScore !== undefined) updateData.midtermScore = midtermScore !== null ? parseFloat(midtermScore) : null;
    if (finalScore !== undefined) updateData.finalScore = finalScore !== null ? parseFloat(finalScore) : null;

    if (courseGrade !== undefined) {
      if (courseGrade !== null && !isNaN(Number(courseGrade))) {
        const gradeVal = parseFloat(courseGrade);
        updateData.courseGrade = gradeVal;
        const conv = convertGrade10To4(gradeVal);
        updateData.letterGrade = letterGrade || conv.letter;
        updateData.gradePoints = gradePoints !== undefined && gradePoints !== null ? parseFloat(gradePoints) : conv.points4;
      } else {
        updateData.courseGrade = null;
        updateData.letterGrade = null;
        updateData.gradePoints = null;
      }
    } else {
      if (letterGrade !== undefined) updateData.letterGrade = letterGrade;
      if (gradePoints !== undefined) updateData.gradePoints = gradePoints !== null ? parseFloat(gradePoints) : null;
    }

    if (gradeWeightJson !== undefined) updateData.gradeWeightJson = gradeWeightJson;
    if (attendanceCount !== undefined) updateData.attendanceCount = parseInt(attendanceCount, 10);
    if (totalSessions !== undefined) updateData.totalSessions = parseInt(totalSessions, 10);

    const subject = await prisma.subject.update({
      where: { id, userId: user.id },
      data: updateData,
      include: {
        semester: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "SUBJECT",
        entityId: subject.id,
        action: "UPDATE",
        detailsJson: JSON.stringify({ name: subject.name, status: subject.status, courseGrade: subject.courseGrade }),
      },
    });

    invalidateSubjectsServerCache(user.id);
    return NextResponse.json({ success: true, subject });
  } catch (err: any) {
    console.error("Error updating subject:", err);
    return NextResponse.json({ error: "Lỗi cập nhật môn học: " + err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID môn học" }, { status: 400 });

  const subject = await prisma.subject.findFirst({
    where: { id, userId: user.id },
  });

  if (!subject) {
    return NextResponse.json({ error: "Môn học không tồn tại" }, { status: 404 });
  }

  // Audit before deletion
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      entityType: "SUBJECT",
      entityId: id,
      action: "DELETE",
      detailsJson: JSON.stringify({ name: subject.name, code: subject.code }),
    },
  });

  await prisma.subject.delete({
    where: { id, userId: user.id },
  });

  invalidateSubjectsServerCache(user.id);
  return NextResponse.json({ success: true });
}

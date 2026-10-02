import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateSemesterGpa, convertGrade10To4 } from "@/lib/academic/gpa-calculator";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      semesterId,
      action = "COMPLETE", // COMPLETE, ARCHIVE, REOPEN
      createNextSemester = false,
      nextSemesterName,
      nextSemesterType = "SPRING",
      nextAcademicYearId,
      nextStartDate,
      nextEndDate,
    } = body;

    if (!semesterId) {
      return NextResponse.json({ error: "Thiếu ID học kỳ" }, { status: 400 });
    }

    const targetSemester = await prisma.semester.findFirst({
      where: { id: semesterId, userId: user.id },
      include: {
        academicYear: true,
        subjects: true,
      },
    });

    if (!targetSemester) {
      return NextResponse.json({ error: "Không tìm thấy học kỳ hoặc bạn không có quyền truy cập" }, { status: 404 });
    }

    // Step 1: Handle Subjects for this semester
    // If completing the semester, finalize uncompleted courses and ensure letter/points are calculated
    const updatedSubjects: any[] = [];
    for (const sub of targetSemester.subjects) {
      let letter = sub.letterGrade;
      let points = sub.gradePoints;

      if ((letter === null || points === null) && sub.courseGrade !== null) {
        const conv = convertGrade10To4(sub.courseGrade);
        letter = conv.letter;
        points = conv.points4;
      }

      const newStatus = action === "COMPLETE" && sub.status === "ACTIVE" ? "COMPLETED" : sub.status;

      if (letter !== sub.letterGrade || points !== sub.gradePoints || newStatus !== sub.status) {
        const updated = await prisma.subject.update({
          where: { id: sub.id },
          data: {
            letterGrade: letter,
            gradePoints: points,
            status: newStatus,
          },
        });
        updatedSubjects.push(updated);
      } else {
        updatedSubjects.push(sub);
      }
    }

    // Step 2: Calculate Semester GPA & Credits
    const gpaStats = calculateSemesterGpa(
      updatedSubjects.map((s) => ({
        id: s.id,
        name: s.name,
        credits: s.credits,
        courseGrade: s.courseGrade,
        gradePoints: s.gradePoints,
        letterGrade: s.letterGrade,
        status: s.status,
      }))
    );

    const newSemesterStatus = action === "ARCHIVE" ? "ARCHIVED" : action === "COMPLETE" ? "COMPLETED" : "ACTIVE";

    const updatedSemester = await prisma.semester.update({
      where: { id: targetSemester.id },
      data: {
        status: newSemesterStatus,
        gpa10: gpaStats.gpa10,
        gpa4: gpaStats.gpa4,
        totalCredits: gpaStats.totalCredits,
        earnedCredits: gpaStats.earnedCredits,
      },
      include: {
        academicYear: true,
        subjects: true,
      },
    });

    // Step 3: Compute Cumulative GPA & Credits for the DegreeProgram across all completed semesters
    const allCompletedSemesters = await prisma.semester.findMany({
      where: {
        userId: user.id,
        status: { in: ["COMPLETED", "ARCHIVED"] },
      },
      include: {
        subjects: true,
      },
    });

    let cumulativeEarnedCredits = 0;
    let cumulativeWeightedPoints4 = 0;
    let cumulativeGradedCredits = 0;

    for (const sem of allCompletedSemesters) {
      for (const sub of sem.subjects) {
        const credits = sub.credits || 0;
        if (sub.gradePoints !== null && sub.gradePoints !== undefined) {
          if (sub.gradePoints > 0) {
            cumulativeEarnedCredits += credits;
          }
          cumulativeWeightedPoints4 += sub.gradePoints * credits;
          cumulativeGradedCredits += credits;
        }
      }
    }

    const cumulativeGpa4 =
      cumulativeGradedCredits > 0
        ? Math.round((cumulativeWeightedPoints4 / cumulativeGradedCredits) * 100) / 100
        : 0;

    const degreeProgram = await prisma.degreeProgram.upsert({
      where: { userId: user.id },
      update: {
        currentCredits: cumulativeEarnedCredits,
        currentGpa: cumulativeGpa4,
      },
      create: {
        userId: user.id,
        currentCredits: cumulativeEarnedCredits,
        currentGpa: cumulativeGpa4,
        totalCreditsRequired: 130,
        targetGpa: 3.6,
      },
    });

    // Step 4: Optionally create next semester seamlessly
    let createdNextSemester = null;
    if (createNextSemester && nextSemesterName?.trim()) {
      const yearId = nextAcademicYearId || targetSemester.academicYearId;
      const start = nextStartDate ? new Date(nextStartDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const end = nextEndDate ? new Date(nextEndDate) : new Date(start.getTime() + 120 * 24 * 3600 * 1000);

      createdNextSemester = await prisma.semester.create({
        data: {
          userId: user.id,
          academicYearId: yearId,
          name: nextSemesterName.trim(),
          type: nextSemesterType,
          startDate: start,
          endDate: end,
          status: "ACTIVE",
        },
      });
    }

    // Step 5: Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "SEMESTER",
        entityId: targetSemester.id,
        action: action === "COMPLETE" ? "TRANSITION" : action,
        detailsJson: JSON.stringify({
          semesterName: targetSemester.name,
          gpa4: gpaStats.gpa4,
          earnedCredits: gpaStats.earnedCredits,
          cumulativeGpa4,
          cumulativeEarnedCredits,
          createdNextSemesterId: createdNextSemester?.id || null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      semester: updatedSemester,
      stats: gpaStats,
      degreeProgram,
      nextSemester: createdNextSemester,
    });
  } catch (error: any) {
    console.error("POST /api/academic/semester-transition error:", error);
    return NextResponse.json(
      { error: "Lỗi kết chuyển học kỳ: " + error.message },
      { status: 500 }
    );
  }
}

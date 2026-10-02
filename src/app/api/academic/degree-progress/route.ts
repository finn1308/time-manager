import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getGraduationHonors } from "@/lib/academic/gpa-calculator";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Get or create DegreeProgram
    let degree = await prisma.degreeProgram.findUnique({
      where: { userId: user.id },
    });

    if (!degree) {
      degree = await prisma.degreeProgram.create({
        data: {
          userId: user.id,
          major: "Công nghệ Thông tin",
          faculty: "Khoa Công nghệ Thông tin",
          university: "Đại học Quốc gia",
          totalCreditsRequired: 130,
          targetGpa: 3.6,
        },
      });
    }

    // 2. Fetch all academic years with semesters and subjects
    const academicYears = await prisma.academicYear.findMany({
      where: { userId: user.id },
      include: {
        semesters: {
          include: {
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
                credits: true,
                status: true,
                courseGrade: true,
                letterGrade: true,
                gradePoints: true,
              },
            },
          },
          orderBy: { startDate: "asc" },
        },
      },
      orderBy: { yearNumber: "asc" },
    });

    // 3. Compute 4-year metrics
    let totalEarnedCredits = 0;
    let totalPlannedCredits = 0;
    let totalInProgressCredits = 0;
    let cumulativeWeightedPoints4 = 0;
    let cumulativeGradedCredits = 0;

    let completedCoursesCount = 0;
    let inProgressCoursesCount = 0;
    let plannedCoursesCount = 0;

    const yearSummaries = academicYears.map((year) => {
      let yearTotalCredits = 0;
      let yearEarnedCredits = 0;
      let yearWeightedPoints = 0;
      let yearGradedCredits = 0;

      const semesterSummaries = year.semesters.map((sem) => {
        let semTotalCredits = 0;
        let semEarnedCredits = 0;
        let semWeightedPoints = 0;
        let semGradedCredits = 0;

        for (const sub of sem.subjects) {
          const credits = sub.credits || 0;
          semTotalCredits += credits;

          if (sub.status === "COMPLETED") {
            completedCoursesCount++;
            if (sub.gradePoints !== null && sub.gradePoints > 0) {
              semEarnedCredits += credits;
              semWeightedPoints += sub.gradePoints * credits;
              semGradedCredits += credits;
            }
          } else if (sub.status === "ACTIVE") {
            inProgressCoursesCount++;
            totalInProgressCredits += credits;
          } else if (sub.status === "PLANNED") {
            plannedCoursesCount++;
            totalPlannedCredits += credits;
          }
        }

        yearTotalCredits += semTotalCredits;
        yearEarnedCredits += semEarnedCredits;
        yearWeightedPoints += semWeightedPoints;
        yearGradedCredits += semGradedCredits;

        const semGpa = semGradedCredits > 0 ? Math.round((semWeightedPoints / semGradedCredits) * 100) / 100 : sem.gpa4 || 0;

        return {
          id: sem.id,
          name: sem.name,
          type: sem.type,
          status: sem.status,
          totalCredits: semTotalCredits,
          earnedCredits: semEarnedCredits,
          gpa4: semGpa,
          coursesCount: sem.subjects.length,
        };
      });

      totalEarnedCredits += yearEarnedCredits;
      cumulativeWeightedPoints4 += yearWeightedPoints;
      cumulativeGradedCredits += yearGradedCredits;

      const yearGpa = yearGradedCredits > 0 ? Math.round((yearWeightedPoints / yearGradedCredits) * 100) / 100 : 0;

      return {
        id: year.id,
        yearNumber: year.yearNumber,
        name: year.name,
        status: year.status,
        totalCredits: yearTotalCredits,
        earnedCredits: yearEarnedCredits,
        gpa4: yearGpa,
        semesters: semesterSummaries,
      };
    });

    const cumulativeGpa4 =
      cumulativeGradedCredits > 0
        ? Math.round((cumulativeWeightedPoints4 / cumulativeGradedCredits) * 100) / 100
        : degree.currentGpa;

    const remainingCredits = Math.max(0, degree.totalCreditsRequired - totalEarnedCredits);
    const progressPercent = Math.min(100, Math.round((totalEarnedCredits / degree.totalCreditsRequired) * 100));
    const honorsClassification = getGraduationHonors(cumulativeGpa4);

    // Keep degree synced
    if (degree.currentCredits !== totalEarnedCredits || degree.currentGpa !== cumulativeGpa4) {
      degree = await prisma.degreeProgram.update({
        where: { id: degree.id },
        data: {
          currentCredits: totalEarnedCredits,
          currentGpa: cumulativeGpa4,
        },
      });
    }

    return NextResponse.json({
      success: true,
      degree: {
        id: degree.id,
        major: degree.major,
        faculty: degree.faculty,
        university: degree.university,
        totalCreditsRequired: degree.totalCreditsRequired,
        earnedCredits: totalEarnedCredits,
        remainingCredits,
        progressPercent,
        inProgressCredits: totalInProgressCredits,
        plannedCredits: totalPlannedCredits,
        currentGpa: cumulativeGpa4,
        targetGpa: degree.targetGpa,
        graduationYear: degree.graduationYear,
        honorsClassification,
        status: degree.status,
      },
      stats: {
        completedCoursesCount,
        inProgressCoursesCount,
        plannedCoursesCount,
        totalCoursesCount: completedCoursesCount + inProgressCoursesCount + plannedCoursesCount,
      },
      yearSummaries,
    });
  } catch (error: any) {
    console.error("GET /api/academic/degree-progress error:", error);
    return NextResponse.json(
      { error: "Lỗi tải tiến độ tốt nghiệp: " + error.message },
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
      major,
      faculty,
      university,
      totalCreditsRequired,
      targetGpa,
      graduationYear,
      status,
    } = body;

    const updateData: any = {};
    if (major !== undefined) updateData.major = major.trim();
    if (faculty !== undefined) updateData.faculty = faculty.trim();
    if (university !== undefined) updateData.university = university.trim();
    if (totalCreditsRequired !== undefined) updateData.totalCreditsRequired = Math.max(1, parseInt(totalCreditsRequired, 10));
    if (targetGpa !== undefined) updateData.targetGpa = Math.max(0, Math.min(4.0, parseFloat(targetGpa)));
    if (graduationYear !== undefined) updateData.graduationYear = graduationYear ? parseInt(graduationYear, 10) : null;
    if (status !== undefined) updateData.status = status;

    const degree = await prisma.degreeProgram.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        major: major || "Công nghệ Thông tin",
        faculty: faculty || "Khoa CNTT",
        university: university || "Đại học",
        totalCreditsRequired: totalCreditsRequired ? parseInt(totalCreditsRequired, 10) : 130,
        targetGpa: targetGpa ? parseFloat(targetGpa) : 3.6,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      },
    });

    return NextResponse.json({ success: true, degree });
  } catch (error: any) {
    console.error("PUT /api/academic/degree-progress error:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật chương trình đào tạo: " + error.message },
      { status: 500 }
    );
  }
}

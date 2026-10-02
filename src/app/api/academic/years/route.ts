import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let years = await prisma.academicYear.findMany({
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

    // Auto-seed Year 1 and Year 2 if user has no academic years configured yet
    if (years.length === 0) {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Create Year 1
      const year1 = await prisma.academicYear.create({
        data: {
          userId: user.id,
          yearNumber: 1,
          name: `Năm 1 (${currentYear} - ${currentYear + 1})`,
          startDate: new Date(Date.UTC(currentYear, 8, 1)), // Sep 1
          endDate: new Date(Date.UTC(currentYear + 1, 5, 30)), // Jun 30
          status: "ACTIVE",
          semesters: {
            create: [
              {
                userId: user.id,
                name: "Học kỳ 1",
                type: "FALL",
                startDate: new Date(Date.UTC(currentYear, 8, 1)),
                endDate: new Date(Date.UTC(currentYear + 1, 0, 15)),
                status: "ACTIVE",
              },
              {
                userId: user.id,
                name: "Học kỳ 2",
                type: "SPRING",
                startDate: new Date(Date.UTC(currentYear + 1, 1, 1)),
                endDate: new Date(Date.UTC(currentYear + 1, 5, 30)),
                status: "PLANNED",
              },
            ],
          },
        },
        include: {
          semesters: {
            include: { subjects: true },
          },
        },
      });

      // Create DegreeProgram profile if not exists
      await prisma.degreeProgram.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          major: "Công nghệ Thông tin",
          university: "Đại học Bách Khoa",
          totalCreditsRequired: 130,
          targetGpa: 3.6,
        },
      });

      years = [year1];
    }

    return NextResponse.json({ success: true, years });
  } catch (error: any) {
    console.error("GET /api/academic/years error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách năm học: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { yearNumber, name, startDate, endDate, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên năm học không được để trống" }, { status: 400 });
    }

    const num = Number(yearNumber);
    if (isNaN(num) || num < 1 || num > 10) {
      return NextResponse.json({ error: "Thứ tự năm học phải từ 1 đến 10" }, { status: 400 });
    }

    const existing = await prisma.academicYear.findFirst({
      where: { userId: user.id, yearNumber: num },
    });
    if (existing) {
      return NextResponse.json({ error: `Năm học số ${num} đã tồn tại trong hồ sơ của bạn` }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 300 * 24 * 3600 * 1000);

    const newYear = await prisma.academicYear.create({
      data: {
        userId: user.id,
        yearNumber: num,
        name: name.trim(),
        startDate: start,
        endDate: end,
        status: status || "ACTIVE",
        semesters: {
          create: [
            {
              userId: user.id,
              name: "Học kỳ 1",
              type: "FALL",
              startDate: start,
              endDate: new Date(start.getTime() + 135 * 24 * 3600 * 1000),
              status: "ACTIVE",
            },
            {
              userId: user.id,
              name: "Học kỳ 2",
              type: "SPRING",
              startDate: new Date(start.getTime() + 150 * 24 * 3600 * 1000),
              endDate: end,
              status: "PLANNED",
            },
          ],
        },
      },
      include: {
        semesters: {
          include: { subjects: true },
        },
      },
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "ACADEMIC_YEAR",
        entityId: newYear.id,
        action: "CREATE",
        detailsJson: JSON.stringify({ name: newYear.name, yearNumber: newYear.yearNumber }),
      },
    });

    return NextResponse.json({ success: true, year: newYear });
  } catch (error: any) {
    console.error("POST /api/academic/years error:", error);
    return NextResponse.json({ error: "Lỗi tạo năm học: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, startDate, endDate, status } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID năm học" }, { status: 400 });

    const existing = await prisma.academicYear.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Năm học không tồn tại" }, { status: 404 });

    const updated = await prisma.academicYear.update({
      where: { id: existing.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status !== undefined ? status : undefined,
      },
      include: {
        semesters: {
          include: { subjects: true },
        },
      },
    });

    return NextResponse.json({ success: true, year: updated });
  } catch (error: any) {
    console.error("PUT /api/academic/years error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật năm học: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID năm học" }, { status: 400 });

  try {
    const existing = await prisma.academicYear.findFirst({
      where: { id, userId: user.id },
      include: {
        semesters: {
          include: { subjects: true },
        },
      },
    });
    if (!existing) return NextResponse.json({ error: "Năm học không tồn tại" }, { status: 404 });

    // Safety check: Don't delete if there are active subjects unless user explicitly requests
    const subjectCount = existing.semesters.reduce((acc, s) => acc + s.subjects.length, 0);
    if (subjectCount > 0) {
      // Archive instead of delete to preserve historical data
      await prisma.academicYear.update({
        where: { id: existing.id },
        data: { status: "ARCHIVED" },
      });
      return NextResponse.json({
        success: true,
        message: `Năm học có ${subjectCount} môn học đã được chuyển sang trạng thái Lưu trữ (ARCHIVED) để bảo toàn dữ liệu.`,
      });
    }

    await prisma.academicYear.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa năm học thành công" });
  } catch (error: any) {
    console.error("DELETE /api/academic/years error:", error);
    return NextResponse.json({ error: "Lỗi xóa năm học: " + error.message }, { status: 500 });
  }
}

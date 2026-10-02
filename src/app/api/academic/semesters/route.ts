import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const academicYearId = searchParams.get("academicYearId");
  const status = searchParams.get("status");

  try {
    const where: any = { userId: user.id };
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;

    const semesters = await prisma.semester.findMany({
      where,
      include: {
        academicYear: {
          select: { id: true, yearNumber: true, name: true },
        },
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
            lecturer: true,
            classroom: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ success: true, semesters });
  } catch (error: any) {
    console.error("GET /api/academic/semesters error:", error);
    return NextResponse.json({ error: "Lỗi tải học kỳ: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { academicYearId, name, type, startDate, endDate, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên học kỳ không được để trống" }, { status: 400 });
    }
    if (!academicYearId) {
      return NextResponse.json({ error: "Vui lòng chọn Năm học liên kết" }, { status: 400 });
    }

    const year = await prisma.academicYear.findFirst({
      where: { id: academicYearId, userId: user.id },
    });
    if (!year) {
      return NextResponse.json({ error: "Năm học không tồn tại hoặc không thuộc quyền sở hữu của bạn" }, { status: 404 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 120 * 24 * 3600 * 1000);

    const semester = await prisma.semester.create({
      data: {
        userId: user.id,
        academicYearId,
        name: name.trim(),
        type: type || "FALL",
        startDate: start,
        endDate: end,
        status: status || "ACTIVE",
      },
      include: {
        academicYear: true,
        subjects: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "SEMESTER",
        entityId: semester.id,
        action: "CREATE",
        detailsJson: JSON.stringify({ name: semester.name, yearId: academicYearId }),
      },
    });

    return NextResponse.json({ success: true, semester });
  } catch (error: any) {
    console.error("POST /api/academic/semesters error:", error);
    return NextResponse.json({ error: "Lỗi tạo học kỳ: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, type, startDate, endDate, status } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID học kỳ" }, { status: 400 });

    const existing = await prisma.semester.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Học kỳ không tồn tại" }, { status: 404 });

    const updated = await prisma.semester.update({
      where: { id: existing.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        type: type !== undefined ? type : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status !== undefined ? status : undefined,
      },
      include: {
        academicYear: true,
        subjects: true,
      },
    });

    return NextResponse.json({ success: true, semester: updated });
  } catch (error: any) {
    console.error("PUT /api/academic/semesters error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật học kỳ: " + error.message }, { status: 500 });
  }
}

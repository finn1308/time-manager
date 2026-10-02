import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  try {
    const where: any = { userId: user.id };
    if (status) where.status = status;
    if (type) where.type = type;

    const applications = await prisma.careerApplication.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error("GET /api/career/applications error:", error);
    return NextResponse.json({ error: "Lỗi tải đơn ứng tuyển: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      company,
      role,
      location,
      type = "INTERNSHIP",
      status = "APPLIED",
      appliedDate,
      deadline,
      salary,
      notes,
      jobUrl,
      resumeUrl,
    } = body;

    if (!company?.trim()) {
      return NextResponse.json({ error: "Tên công ty không được để trống" }, { status: 400 });
    }
    if (!role?.trim()) {
      return NextResponse.json({ error: "Vị trí ứng tuyển không được để trống" }, { status: 400 });
    }

    const application = await prisma.careerApplication.create({
      data: {
        userId: user.id,
        company: company.trim(),
        role: role.trim(),
        location: location?.trim() || null,
        type,
        status,
        appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
        deadline: deadline ? new Date(deadline) : null,
        salary: salary?.trim() || null,
        notes: notes?.trim() || null,
        jobUrl: jobUrl?.trim() || null,
        resumeUrl: resumeUrl?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "CAREER_APPLICATION",
        entityId: application.id,
        action: "CREATE",
        detailsJson: JSON.stringify({ company: application.company, role: application.role, status: application.status }),
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error("POST /api/career/applications error:", error);
    return NextResponse.json({ error: "Lỗi tạo đơn ứng tuyển: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      company,
      role,
      location,
      type,
      status,
      appliedDate,
      deadline,
      salary,
      notes,
      jobUrl,
      resumeUrl,
    } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID đơn ứng tuyển" }, { status: 400 });

    const application = await prisma.careerApplication.update({
      where: { id, userId: user.id },
      data: {
        ...(company && { company: company.trim() }),
        ...(role && { role: role.trim() }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(type && { type }),
        ...(status && { status }),
        ...(appliedDate !== undefined && { appliedDate: appliedDate ? new Date(appliedDate) : null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(salary !== undefined && { salary: salary?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(jobUrl !== undefined && { jobUrl: jobUrl?.trim() || null }),
        ...(resumeUrl !== undefined && { resumeUrl: resumeUrl?.trim() || null }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "CAREER_APPLICATION",
        entityId: application.id,
        action: "UPDATE",
        detailsJson: JSON.stringify({ company: application.company, status: application.status }),
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error("PUT /api/career/applications error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật đơn ứng tuyển: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID đơn ứng tuyển" }, { status: 400 });

  try {
    await prisma.careerApplication.delete({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/career/applications error:", error);
    return NextResponse.json({ error: "Lỗi xóa đơn ứng tuyển: " + error.message }, { status: 500 });
  }
}

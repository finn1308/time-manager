import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const subjectId = searchParams.get("subjectId");

  try {
    const where: any = { userId: user.id };
    if (status) where.status = status;
    if (subjectId) where.subjectId = subjectId;

    const projects = await prisma.project.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
                level: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("GET /api/career/projects error:", error);
    return NextResponse.json({ error: "Lỗi tải dự án: " + error.message }, { status: 500 });
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
      repositoryUrl,
      demoUrl,
      technologies,
      status = "IN_PROGRESS",
      startDate,
      endDate,
      subjectId,
      skillIds = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Tiêu đề dự án không được để trống" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        repositoryUrl: repositoryUrl?.trim() || null,
        demoUrl: demoUrl?.trim() || null,
        technologies: technologies?.trim() || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        subjectId: subjectId || null,
        skills: {
          create: skillIds.map((skillId: string) => ({
            skill: { connect: { id: skillId } },
          })),
        },
      },
      include: {
        subject: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "PROJECT",
        entityId: project.id,
        action: "CREATE",
        detailsJson: JSON.stringify({ title: project.title, status: project.status }),
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("POST /api/career/projects error:", error);
    return NextResponse.json({ error: "Lỗi tạo dự án: " + error.message }, { status: 500 });
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
      repositoryUrl,
      demoUrl,
      technologies,
      status,
      startDate,
      endDate,
      subjectId,
      skillIds,
    } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID dự án" }, { status: 400 });

    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Dự án không tồn tại" }, { status: 404 });
    }

    // Update skill relations if skillIds is provided
    if (skillIds && Array.isArray(skillIds)) {
      await prisma.projectSkill.deleteMany({
        where: { projectId: id },
      });

      if (skillIds.length > 0) {
        await prisma.projectSkill.createMany({
          data: skillIds.map((skillId: string) => ({
            projectId: id,
            skillId,
          })),
        });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(repositoryUrl !== undefined && { repositoryUrl: repositoryUrl?.trim() || null }),
        ...(demoUrl !== undefined && { demoUrl: demoUrl?.trim() || null }),
        ...(technologies !== undefined && { technologies: technologies?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(subjectId !== undefined && { subjectId: subjectId || null }),
      },
      include: {
        subject: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("PUT /api/career/projects error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật dự án: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID dự án" }, { status: 400 });

  try {
    await prisma.project.delete({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/career/projects error:", error);
    return NextResponse.json({ error: "Lỗi xóa dự án: " + error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const skills = await prisma.skill.findMany({
      where: { userId: user.id },
      include: {
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, skills });
  } catch (error: any) {
    console.error("GET /api/career/skills error:", error);
    return NextResponse.json({ error: "Lỗi tải kỹ năng: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, category = "TECH", level = "INTERMEDIATE", description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên kỹ năng không được để trống" }, { status: 400 });
    }

    const skill = await prisma.skill.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: name.trim(),
        },
      },
      update: {
        category,
        level,
        description: description?.trim() || null,
      },
      create: {
        userId: user.id,
        name: name.trim(),
        category,
        level,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error: any) {
    console.error("POST /api/career/skills error:", error);
    return NextResponse.json({ error: "Lỗi tạo kỹ năng: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, category, level, description } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID kỹ năng" }, { status: 400 });

    const skill = await prisma.skill.update({
      where: { id, userId: user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category }),
        ...(level && { level }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error: any) {
    console.error("PUT /api/career/skills error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật kỹ năng: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID kỹ năng" }, { status: 400 });

  try {
    await prisma.skill.delete({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/career/skills error:", error);
    return NextResponse.json({ error: "Lỗi xóa kỹ năng: " + error.message }, { status: 500 });
  }
}

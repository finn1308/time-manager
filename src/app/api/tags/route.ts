import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            noteTags: true,
            taskTags: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (err: any) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách nhãn" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, color = "#2d6a4f" } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Tên nhãn không được để trống" }, { status: 400 });
    }

    const cleanName = name.trim().replace(/^#/, "");

    const tag = await prisma.tag.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: cleanName,
        },
      },
      update: { color },
      create: {
        userId: user.id,
        name: cleanName,
        color,
      },
    });

    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/tags error:", err);
    return NextResponse.json({ error: "Lỗi tạo nhãn" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Thiếu ID nhãn" }, { status: 400 });

    await prisma.tag.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/tags error:", err);
    return NextResponse.json({ error: "Lỗi xóa nhãn" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let calendarEventId = searchParams.get("calendarEventId");
  const subjectId = searchParams.get("subjectId");

  if (calendarEventId && calendarEventId.includes("_")) {
    calendarEventId = calendarEventId.split("_")[0];
  }

  const whereClause: any = { userId: user.id };
  if (calendarEventId) whereClause.calendarEventId = calendarEventId;
  if (subjectId) whereClause.subjectId = subjectId;

  const notes = await prisma.studyNote.findMany({
    where: whereClause,
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content, calendarEventId, subjectId, isPinned } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Nội dung ghi chú không được để trống" }, { status: 400 });
    }

    let cleanEventId = calendarEventId;
    if (cleanEventId && cleanEventId.includes("_")) {
      cleanEventId = cleanEventId.split("_")[0];
    }

    const note = await prisma.studyNote.create({
      data: {
        userId: user.id,
        calendarEventId: cleanEventId || null,
        subjectId: subjectId || null,
        content: content.trim(),
        isPinned: !!isPinned,
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    console.error("Create note error:", err);
    return NextResponse.json({ error: "Lỗi lưu ghi chú: " + (err.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, content, isPinned } = await req.json();

    if (!id) return NextResponse.json({ error: "Thiếu ID ghi chú" }, { status: 400 });

    const existing = await prisma.studyNote.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ghi chú không tồn tại" }, { status: 404 });
    }

    const updated = await prisma.studyNote.update({
      where: { id },
      data: {
        content: content !== undefined ? content.trim() : undefined,
        isPinned: isPinned !== undefined ? !!isPinned : undefined,
      },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (err: any) {
    console.error("Update note error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật ghi chú" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Thiếu ID ghi chú" }, { status: 400 });

  try {
    const existing = await prisma.studyNote.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ghi chú không tồn tại hoặc đã bị xóa" }, { status: 404 });
    }

    await prisma.studyNote.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete note error:", err);
    return NextResponse.json({ error: "Lỗi xóa ghi chú" }, { status: 500 });
  }
}

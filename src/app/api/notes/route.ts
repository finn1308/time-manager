import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let calendarEventId = searchParams.get("calendarEventId");
  const subjectId = searchParams.get("subjectId");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  // Legacy support for Calendar Event Study Notes
  if (calendarEventId) {
    if (calendarEventId.includes("_")) {
      calendarEventId = calendarEventId.split("_")[0];
    }
    const whereClause: any = { userId: user.id, calendarEventId };
    if (subjectId) whereClause.subjectId = subjectId;

    const notes = await prisma.studyNote.findMany({
      where: whereClause,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ notes });
  }

  // Full Notion-style Knowledge Notes
  try {
    const whereClause: any = { userId: user.id };

    if (subjectId && subjectId !== "ALL") {
      whereClause.subjectId = subjectId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tag && tag !== "ALL") {
      whereClause.tags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
        goal: {
          select: { id: true, title: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
        document: {
          select: { id: true, filename: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ notes });
  } catch (err: any) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json({ error: "Lỗi tải ghi chú" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      content = "",
      calendarEventId,
      subjectId,
      goalId,
      taskId,
      documentId,
      isPinned = false,
      tagNames = [],
    } = body;

    // Legacy calendar event note
    if (calendarEventId) {
      let cleanEventId = calendarEventId;
      if (cleanEventId.includes("_")) {
        cleanEventId = cleanEventId.split("_")[0];
      }

      const studyNote = await prisma.studyNote.create({
        data: {
          userId: user.id,
          calendarEventId: cleanEventId || null,
          subjectId: subjectId || null,
          content: content.trim(),
          isPinned: !!isPinned,
        },
      });

      return NextResponse.json({ success: true, note: studyNote });
    }

    // Full Notion-style Note
    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: title?.trim() || "Ghi chú mới",
        content: content || "",
        subjectId: subjectId || null,
        goalId: goalId || null,
        taskId: taskId || null,
        documentId: documentId || null,
        isPinned: !!isPinned,
      },
      include: {
        subject: true,
        goal: true,
        task: true,
        document: true,
        tags: { include: { tag: true } },
      },
    });

    // Handle tags if provided
    if (Array.isArray(tagNames) && tagNames.length > 0) {
      for (const tName of tagNames) {
        const cleanName = tName.trim().replace(/^#/, "");
        if (!cleanName) continue;

        let tag = await prisma.tag.findUnique({
          where: { userId_name: { userId: user.id, name: cleanName } },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { userId: user.id, name: cleanName },
          });
        }

        await prisma.noteTag.create({
          data: { noteId: note.id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (err: any) {
    console.error("Create note error:", err);
    return NextResponse.json({ error: "Lỗi lưu ghi chú: " + (err.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, title, content, isPinned, isArchived, subjectId, goalId, taskId, documentId, tagNames } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID ghi chú" }, { status: 400 });

    // Check studyNote first (legacy)
    const existingStudyNote = await prisma.studyNote.findFirst({
      where: { id, userId: user.id },
    });

    if (existingStudyNote) {
      const updated = await prisma.studyNote.update({
        where: { id },
        data: {
          content: content !== undefined ? content.trim() : undefined,
          isPinned: isPinned !== undefined ? !!isPinned : undefined,
        },
      });
      return NextResponse.json({ success: true, note: updated });
    }

    // Check Notion-style note
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Ghi chú không tồn tại" }, { status: 404 });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        content: content !== undefined ? content : undefined,
        isPinned: isPinned !== undefined ? !!isPinned : undefined,
        isArchived: isArchived !== undefined ? !!isArchived : undefined,
        subjectId: subjectId !== undefined ? subjectId || null : undefined,
        goalId: goalId !== undefined ? goalId || null : undefined,
        taskId: taskId !== undefined ? taskId || null : undefined,
        documentId: documentId !== undefined ? documentId || null : undefined,
      },
      include: {
        subject: true,
        goal: true,
        task: true,
        document: true,
        tags: { include: { tag: true } },
      },
    });

    // Update tags if provided
    if (Array.isArray(tagNames)) {
      await prisma.noteTag.deleteMany({ where: { noteId: id } });
      for (const tName of tagNames) {
        const cleanName = tName.trim().replace(/^#/, "");
        if (!cleanName) continue;

        let tag = await prisma.tag.findUnique({
          where: { userId_name: { userId: user.id, name: cleanName } },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { userId: user.id, name: cleanName },
          });
        }

        await prisma.noteTag.create({
          data: { noteId: id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, note: updatedNote });
  } catch (err: any) {
    console.error("Update note error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật ghi chú" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Thiếu ID ghi chú" }, { status: 400 });

    // Try deleting studyNote
    const studyNote = await prisma.studyNote.findFirst({
      where: { id, userId: user.id },
    });

    if (studyNote) {
      await prisma.studyNote.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Đã xóa ghi chú lịch" });
    }

    // Try deleting Notion Note
    const note = await prisma.note.findFirst({
      where: { id, userId: user.id },
    });

    if (note) {
      await prisma.note.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Đã xóa ghi chú" });
    }

    return NextResponse.json({ error: "Không tìm thấy ghi chú" }, { status: 404 });
  } catch (err: any) {
    console.error("Delete note error:", err);
    return NextResponse.json({ error: "Lỗi xóa ghi chú" }, { status: 500 });
  }
}

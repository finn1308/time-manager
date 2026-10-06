import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();

    if (!payload || !payload.data) {
      return NextResponse.json(
        { error: "Tệp sao lưu không đúng định dạng chuẩn của ChronoMind" },
        { status: 400 }
      );
    }

    const { subjects, notes, tasks, flashcardDecks, mistakes, assignments, exams } = payload.data;
    const restoredSummary = {
      subjectsCount: 0,
      notesCount: 0,
      tasksCount: 0,
      mistakesCount: 0,
      assignmentsCount: 0,
      examsCount: 0,
    };

    // 1. Restore Subjects
    if (Array.isArray(subjects)) {
      for (const s of subjects) {
        if (!s.name) continue;
        await prisma.subject.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            userId: user.id,
            name: s.name,
            code: s.code || null,
            color: s.color || "#408257",
            description: s.description || null,
            credits: Number(s.credits) || 3,
            lecturer: s.lecturer || null,
          },
          update: {
            name: s.name,
            code: s.code || null,
            color: s.color || "#408257",
          },
        });
        restoredSummary.subjectsCount++;
      }
    }

    // 2. Restore Notes
    if (Array.isArray(notes)) {
      for (const n of notes) {
        if (!n.title) continue;
        await prisma.note.upsert({
          where: { id: n.id },
          create: {
            id: n.id,
            userId: user.id,
            title: n.title,
            content: n.content || "",
            isPinned: Boolean(n.isPinned),
          },
          update: {
            title: n.title,
            content: n.content || "",
            isPinned: Boolean(n.isPinned),
          },
        });
        restoredSummary.notesCount++;
      }
    }

    // 3. Restore Tasks
    if (Array.isArray(tasks)) {
      for (const t of tasks) {
        if (!t.title) continue;
        await prisma.task.upsert({
          where: { id: t.id },
          create: {
            id: t.id,
            userId: user.id,
            title: t.title,
            priority: t.priority || "MEDIUM",
            status: t.status || "TODO",
            deadline: t.deadline ? new Date(t.deadline) : null,
          },
          update: {
            title: t.title,
            status: t.status || "TODO",
          },
        });
        restoredSummary.tasksCount++;
      }
    }

    // 4. Restore Mistakes
    if (Array.isArray(mistakes)) {
      for (const m of mistakes) {
        if (!m.question || !m.correctAnswer) continue;
        await prisma.mistakeRecord.upsert({
          where: { id: m.id },
          create: {
            id: m.id,
            userId: user.id,
            question: m.question,
            correctAnswer: m.correctAnswer,
            userAnswer: m.userAnswer || "",
            concept: m.concept || null,
            errorType: m.errorType || "KNOWLEDGE_GAP",
            isResolved: Boolean(m.isResolved),
            sourceType: m.sourceType || "PRACTICE",
          },
          update: {
            isResolved: Boolean(m.isResolved),
          },
        });
        restoredSummary.mistakesCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Khôi phục dữ liệu sao lưu thành công!",
      restoredSummary,
    });
  } catch (err: any) {
    console.error("Error restoring backup:", err);
    return NextResponse.json({ error: err.message || "Lỗi khôi phục tệp sao lưu" }, { status: 500 });
  }
}

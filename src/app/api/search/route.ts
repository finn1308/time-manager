import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query || query.length < 2) {
    return NextResponse.json({
      tasks: [],
      notes: [],
      subjects: [],
      goals: [],
      events: [],
      flashcards: [],
      tags: [],
    });
  }

  try {
    const [
      tasks,
      notes,
      subjects,
      goals,
      events,
      flashcards,
      tags,
      mistakes,
      assignments,
      exams,
      knowledgeNodes,
      vocabWords,
    ] = await Promise.all([
      // 1. Search Tasks
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 5,
      }),

      // 2. Search Notes
      prisma.note.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 5,
      }),

      // 3. Search Subjects
      prisma.subject.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),

      // 4. Search Goals
      prisma.goal.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),

      // 5. Search Calendar Events
      prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
          title: { contains: query, mode: "insensitive" },
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 5,
      }),

      // 6. Search Flashcards
      prisma.flashcard.findMany({
        where: {
          deck: { userId: user.id },
          OR: [
            { front: { contains: query, mode: "insensitive" } },
            { back: { contains: query, mode: "insensitive" } },
            { topic: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          deck: { select: { id: true, title: true } },
        },
        take: 5,
      }),

      // 7. Search Tags
      prisma.tag.findMany({
        where: {
          userId: user.id,
          name: { contains: query.replace(/^#/, ""), mode: "insensitive" },
        },
        include: {
          _count: {
            select: { noteTags: true, taskTags: true },
          },
        },
        take: 5,
      }),

      // 8. Search Mistakes (Mistake Bank)
      prisma.mistakeRecord.findMany({
        where: {
          userId: user.id,
          OR: [
            { question: { contains: query, mode: "insensitive" } },
            { concept: { contains: query, mode: "insensitive" } },
            { topic: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 4,
      }),

      // 9. Search Assignments
      prisma.assignment.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 4,
      }),

      // 10. Search Exams
      prisma.examPreparation.findMany({
        where: {
          userId: user.id,
          title: { contains: query, mode: "insensitive" },
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 4,
      }),

      // 11. Search Knowledge Nodes
      prisma.knowledgeNode.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { chapter: { contains: query, mode: "insensitive" } },
            { topic: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          subject: { select: { name: true, color: true } },
        },
        take: 4,
      }),

      // 12. Search Vocabulary Words
      prisma.vocabWord.findMany({
        where: {
          OR: [
            { term: { contains: query, mode: "insensitive" } },
            { meaning: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 4,
      }),
    ]);

    const results = [
      ...tasks.map((t) => ({ id: t.id, type: "TASK", title: t.title, subtitle: t.subject?.name, badge: t.priority, url: "/tasks" })),
      ...notes.map((n) => ({ id: n.id, type: "NOTE", title: n.title, subtitle: n.subject?.name, badge: "Ghi chú", url: "/notes" })),
      ...subjects.map((s) => ({ id: s.id, type: "SUBJECT", title: s.name, subtitle: s.code || undefined, badge: "Môn học", url: "/subjects" })),
      ...goals.map((g) => ({ id: g.id, type: "GOAL", title: g.title, subtitle: "Mục tiêu", badge: g.status, url: "/goals" })),
      ...events.map((e) => ({ id: e.id, type: "EVENT", title: e.title, subtitle: e.subject?.name, badge: "Lịch học", url: "/calendar" })),
      ...flashcards.map((f) => ({ id: f.id, type: "CARD", title: f.front, subtitle: f.back, badge: f.deck?.title, url: "/flashcards" })),
      ...mistakes.map((m) => ({ id: m.id, type: "MISTAKE", title: m.question, subtitle: `ĐA: ${m.correctAnswer}`, badge: "Lỗi sai", url: "/practice/mistakes" })),
      ...assignments.map((a) => ({ id: a.id, type: "ASSIGNMENT", title: a.title, subtitle: a.subject?.name, badge: "Bài tập / Đồ án", url: "/academic/assignments" })),
      ...exams.map((ex) => ({ id: ex.id, type: "EXAM", title: ex.title, subtitle: ex.subject?.name, badge: "Kỳ thi", url: "/exams" })),
      ...knowledgeNodes.map((kn) => ({ id: kn.id, type: "CONCEPT", title: kn.title, subtitle: kn.subject?.name, badge: kn.chapter || "Chuyên đề", url: "/academic/knowledge-graph" })),
      ...vocabWords.map((vw) => ({ id: vw.id, type: "VOCAB", title: vw.term, subtitle: vw.meaning, badge: "Luyện tập", url: "/practice" })),
    ];

    return NextResponse.json({
      results,
      tasks,
      notes,
      subjects,
      goals,
      events,
      flashcards,
      tags,
      mistakes,
      assignments,
      exams,
      knowledgeNodes,
      vocabWords,
    });
  } catch (err: any) {
    console.error("GET /api/search error:", err);
    return NextResponse.json({ error: "Lỗi tìm kiếm toàn cục" }, { status: 500 });
  }
}

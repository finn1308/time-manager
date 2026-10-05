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
    const [tasks, notes, subjects, goals, events, flashcards, tags] = await Promise.all([
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

    return NextResponse.json({
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

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json"; // "json" | "csv"
  const moduleName = searchParams.get("module") || "ALL";

  try {
    const [
      subjects,
      notes,
      tasks,
      calendarEvents,
      flashcardDecks,
      mistakes,
      assignments,
      exams,
      knowledgeNodes,
      habits,
      academicYears,
      degreeProgram,
      learningMemory,
    ] = await Promise.all([
      prisma.subject.findMany({ where: { userId: user.id } }),
      prisma.note.findMany({ where: { userId: user.id } }),
      prisma.task.findMany({ where: { userId: user.id } }),
      prisma.calendarEvent.findMany({ where: { userId: user.id } }),
      prisma.flashcardDeck.findMany({
        where: { userId: user.id },
        include: { flashcards: true },
      }),
      prisma.mistakeRecord.findMany({ where: { userId: user.id } }),
      prisma.assignment.findMany({ where: { userId: user.id } }),
      prisma.examPreparation.findMany({ where: { userId: user.id } }),
      prisma.knowledgeNode.findMany({ where: { userId: user.id } }),
      prisma.habit.findMany({ where: { userId: user.id }, include: { habitLogs: true } }),
      prisma.academicYear.findMany({
        where: { userId: user.id },
        include: { semesters: true },
      }),
      prisma.degreeProgram.findFirst({ where: { userId: user.id } }),
      prisma.userLearningMemory.findUnique({ where: { userId: user.id } }),
    ]);

    const exportPayload = {
      exportVersion: "2.0.0",
      platform: "LUYENTU & ChronoMind 4-Year Learning OS",
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      data: {
        subjects,
        notes,
        tasks,
        calendarEvents,
        flashcardDecks,
        mistakes,
        assignments,
        exams,
        knowledgeNodes,
        habits,
        academicYears,
        degreeProgram,
        learningMemory,
      },
    };

    // Record the backup creation
    await prisma.backupRecord.create({
      data: {
        userId: user.id,
        version: "2.0.0",
        sizeBytes: Buffer.byteLength(JSON.stringify(exportPayload), "utf8"),
        modulesIncluded: moduleName,
      },
    });

    if (format === "csv" && moduleName === "TASKS") {
      const csvHeader = "ID,Title,Priority,Status,Deadline,EstimatedMinutes\n";
      const csvRows = tasks
        .map(
          (t) =>
            `"${t.id}","${t.title.replace(/"/g, '""')}","${t.priority}","${t.status}","${
              t.deadline ? t.deadline.toISOString() : ""
            }",${t.estimatedMinutes}`
        )
        .join("\n");

      return new Response(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="luyentu-tasks-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(exportPayload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="luyentu-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    console.error("Error exporting backup:", err);
    return NextResponse.json({ error: err.message || "Lỗi xuất dữ liệu sao lưu" }, { status: 500 });
  }
}

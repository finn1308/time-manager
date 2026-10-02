import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDateKeyVN } from "@/lib/date-utils";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const entity = searchParams.get("entity") || "all";
    const dateStr = getDateKeyVN(new Date());

    if (format === "json") {
      // Export full JSON database dump for user
      const [
        subjects,
        goals,
        tasks,
        calendarEvents,
        studySessions,
        notes,
        habits,
        flashcardDecks,
      ] = await Promise.all([
        prisma.subject.findMany({ where: { userId: user.id } }),
        prisma.goal.findMany({
          where: { userId: user.id },
          include: { milestoneRecords: true },
        }),
        prisma.task.findMany({
          where: { userId: user.id },
          include: { dependencies: true },
        }),
        prisma.calendarEvent.findMany({ where: { userId: user.id } }),
        prisma.studySession.findMany({ where: { userId: user.id } }),
        prisma.note.findMany({
          where: { userId: user.id },
          include: { tags: { include: { tag: true } } },
        }),
        prisma.habit.findMany({
          where: { userId: user.id },
          include: { habitLogs: true },
        }),
        prisma.flashcardDeck.findMany({
          where: { userId: user.id },
          include: { cards: true },
        }),
      ]);

      const backupData = {
        version: "1.0",
        app: "ChronoMind",
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        data: {
          subjects,
          goals,
          tasks,
          calendarEvents,
          studySessions,
          notes,
          habits,
          flashcardDecks,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      return new NextResponse(jsonStr, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="chronomind-backup-${dateStr}.json"`,
        },
      });
    } else if (format === "csv") {
      if (entity === "events") {
        const events = await prisma.calendarEvent.findMany({
          where: { userId: user.id },
          include: { subject: true },
          orderBy: { startTime: "desc" },
        });

        const rows = [
          ["ID", "Tiêu đề", "Môn học", "Loại", "Bắt đầu", "Kết thúc", "Đã khóa"].join(","),
        ];

        for (const ev of events) {
          rows.push(
            [
              escapeCSV(ev.id),
              escapeCSV(ev.title),
              escapeCSV(ev.subject?.name || "Chung"),
              escapeCSV(ev.type),
              escapeCSV(ev.startTime.toISOString()),
              escapeCSV(ev.endTime.toISOString()),
              escapeCSV(ev.isLocked ? "Có" : "Không"),
            ].join(",")
          );
        }

        return new NextResponse("\uFEFF" + rows.join("\r\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="chronomind-events-${dateStr}.csv"`,
          },
        });
      } else if (entity === "sessions") {
        const sessions = await prisma.studySession.findMany({
          where: { userId: user.id },
          include: { subject: true },
          orderBy: { actualStart: "desc" },
        });

        const rows = [
          ["ID", "Môn học", "Bắt đầu", "Kết thúc", "Thời lượng (phút)", "Đánh giá năng suất", "Trạng thái", "Ghi chú"].join(","),
        ];

        for (const s of sessions) {
          rows.push(
            [
              escapeCSV(s.id),
              escapeCSV(s.subject?.name || "Chung"),
              escapeCSV(s.actualStart.toISOString()),
              escapeCSV(s.actualEnd.toISOString()),
              escapeCSV(Math.round(s.actualDurationSeconds / 60)),
              escapeCSV(s.productivityScore || 5),
              escapeCSV(s.status),
              escapeCSV(s.notes || ""),
            ].join(",")
          );
        }

        return new NextResponse("\uFEFF" + rows.join("\r\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="chronomind-sessions-${dateStr}.csv"`,
          },
        });
      } else if (entity === "tasks") {
        const tasks = await prisma.task.findMany({
          where: { userId: user.id },
          include: { subject: true },
          orderBy: { createdAt: "desc" },
        });

        const rows = [
          ["ID", "Tiêu đề", "Môn học", "Trạng thái", "Độ ưu tiên", "Dự kiến (phút)", "Hạn chót"].join(","),
        ];

        for (const t of tasks) {
          rows.push(
            [
              escapeCSV(t.id),
              escapeCSV(t.title),
              escapeCSV(t.subject?.name || "Chung"),
              escapeCSV(t.status),
              escapeCSV(t.priority),
              escapeCSV(t.estimatedMinutes),
              escapeCSV(t.deadline ? t.deadline.toISOString() : ""),
            ].join(",")
          );
        }

        return new NextResponse("\uFEFF" + rows.join("\r\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="chronomind-tasks-${dateStr}.csv"`,
          },
        });
      } else if (entity === "notes") {
        const notes = await prisma.note.findMany({
          where: { userId: user.id },
          include: { subject: true },
          orderBy: { updatedAt: "desc" },
        });

        const rows = [
          ["ID", "Tiêu đề", "Môn học", "Ngày tạo", "Ngày sửa", "Nội dung tóm tắt"].join(","),
        ];

        for (const n of notes) {
          const preview = n.content.slice(0, 100).replace(/\n/g, " ");
          rows.push(
            [
              escapeCSV(n.id),
              escapeCSV(n.title),
              escapeCSV(n.subject?.name || "Chung"),
              escapeCSV(n.createdAt.toISOString()),
              escapeCSV(n.updatedAt.toISOString()),
              escapeCSV(preview),
            ].join(",")
          );
        }

        return new NextResponse("\uFEFF" + rows.join("\r\n"), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="chronomind-notes-${dateStr}.csv"`,
          },
        });
      }
    }

    return NextResponse.json({ error: "Định dạng không được hỗ trợ" }, { status: 400 });
  } catch (error: any) {
    console.error("GET /api/export error:", error);
    return NextResponse.json({ error: error.message || "Lỗi xuất dữ liệu" }, { status: 500 });
  }
}

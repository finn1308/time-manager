import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    if (!body || !body.data) {
      return NextResponse.json({ error: "File sao lưu không hợp lệ. Thiếu trường 'data'." }, { status: 400 });
    }

    const { subjects = [], tasks = [], notes = [], habits = [], calendarEvents = [] } = body.data;

    let importedSubjectsCount = 0;
    let importedTasksCount = 0;
    let importedNotesCount = 0;
    let importedHabitsCount = 0;
    let importedEventsCount = 0;

    // 1. Import Subjects (upsert by name)
    const subjectIdMapping: Record<string, string> = {};
    for (const sub of subjects) {
      if (!sub.name) continue;
      const existing = await prisma.subject.findFirst({
        where: { userId: user.id, name: sub.name.trim() },
      });

      if (existing) {
        subjectIdMapping[sub.id] = existing.id;
      } else {
        const created = await prisma.subject.create({
          data: {
            userId: user.id,
            name: sub.name.trim(),
            code: sub.code || null,
            color: sub.color || "#2d6a4f",
            targetHours: sub.targetHours || 0,
            completedHours: sub.completedHours || 0,
            priority: sub.priority || 2,
          },
        });
        subjectIdMapping[sub.id] = created.id;
        importedSubjectsCount++;
      }
    }

    // 2. Import Tasks
    for (const t of tasks) {
      if (!t.title) continue;
      const mappedSubjectId = t.subjectId ? subjectIdMapping[t.subjectId] || null : null;
      await prisma.task.create({
        data: {
          userId: user.id,
          title: t.title,
          description: t.description || null,
          priority: t.priority || "MEDIUM",
          status: t.status || "INBOX",
          estimatedMinutes: t.estimatedMinutes || 60,
          deadline: t.deadline ? new Date(t.deadline) : null,
          subjectId: mappedSubjectId,
        },
      });
      importedTasksCount++;
    }

    // 3. Import Notes
    for (const n of notes) {
      if (!n.title) continue;
      const mappedSubjectId = n.subjectId ? subjectIdMapping[n.subjectId] || null : null;
      await prisma.note.create({
        data: {
          userId: user.id,
          title: n.title,
          content: n.content || "",
          subjectId: mappedSubjectId,
        },
      });
      importedNotesCount++;
    }

    // 4. Import Habits
    for (const h of habits) {
      if (!h.title) continue;
      const mappedSubjectId = h.subjectId ? subjectIdMapping[h.subjectId] || null : null;
      await prisma.habit.create({
        data: {
          userId: user.id,
          title: h.title,
          description: h.description || null,
          frequency: h.frequency || "DAILY",
          targetDays: h.targetDays || "1,2,3,4,5,6,0",
          color: h.color || "#2d6a4f",
          subjectId: mappedSubjectId,
        },
      });
      importedHabitsCount++;
    }

    // 5. Import Calendar Events
    for (const ev of calendarEvents) {
      if (!ev.title || !ev.startTime || !ev.endTime) continue;
      const mappedSubjectId = ev.subjectId ? subjectIdMapping[ev.subjectId] || null : null;
      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: ev.title,
          description: ev.description || null,
          startTime: new Date(ev.startTime),
          endTime: new Date(ev.endTime),
          type: ev.type || "SELF_STUDY",
          subjectId: mappedSubjectId,
        },
      });
      importedEventsCount++;
    }

    return NextResponse.json({
      success: true,
      message: "Khôi phục dữ liệu sao lưu thành công!",
      imported: {
        subjects: importedSubjectsCount,
        tasks: importedTasksCount,
        notes: importedNotesCount,
        habits: importedHabitsCount,
        events: importedEventsCount,
      },
    });
  } catch (error: any) {
    console.error("POST /api/import error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khôi phục dữ liệu" }, { status: 500 });
  }
}

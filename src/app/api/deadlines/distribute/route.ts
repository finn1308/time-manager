import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { distributeDeadlineToSessions } from "@/lib/deadline-engine";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      title,
      deadlineDate,
      estimatedMinutes,
      subjectId,
      taskId,
      goalId,
      sessionDurationMins,
      bufferDays,
      commit, // boolean: true to write to DB, false for preview
    } = await req.json();

    if (!title?.trim() || !deadlineDate) {
      return NextResponse.json(
        { error: "Thiếu thông tin tiêu đề hoặc thời hạn deadline" },
        { status: 400 }
      );
    }

    // 1. Fetch user study preferences
    const preferences = await prisma.userStudyPreferences.findUnique({
      where: { userId: user.id },
    });

    // 2. Fetch existing calendar events between now and deadline to prevent collisions
    const now = new Date();
    const deadline = new Date(deadlineDate);

    const existingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        startTime: { gte: now },
        endTime: { lte: deadline },
        isCancelled: false,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // 3. Run distribution algorithm
    const result = distributeDeadlineToSessions({
      title: title.trim(),
      deadlineDate: deadline,
      estimatedMinutes: estimatedMinutes || 60,
      subjectId: subjectId || null,
      taskId: taskId || null,
      goalId: goalId || null,
      sessionDurationMins: sessionDurationMins ? parseInt(sessionDurationMins, 10) : undefined,
      bufferDays: bufferDays !== undefined ? parseInt(bufferDays, 10) : undefined,
      preferences: preferences
        ? {
            maxSessionDurationMins: preferences.maxSessionDurationMins,
            pomodoroDurationMins: preferences.pomodoroDurationMins,
            preferredStudyHours: preferences.preferredStudyHours,
            unwantedStudyHours: preferences.unwantedStudyHours,
            restDays: preferences.restDays,
            timePreference: preferences.timePreference,
          }
        : undefined,
      existingEvents,
    });

    // 4. If preview mode only, return generated plan
    if (!commit) {
      return NextResponse.json({
        success: true,
        preview: true,
        summary: result.summary,
        totalSessions: result.sessionCount,
        sessions: result.sessions,
        bufferDaysApplied: result.bufferDaysApplied,
      });
    }

    // 5. Commit mode: Create CalendarEvents and StudySessions in a transaction
    const createdEvents = await prisma.$transaction(async (tx) => {
      const events = [];

      for (const s of result.sessions) {
        // Create CalendarEvent
        const event = await tx.calendarEvent.create({
          data: {
            userId: user.id,
            subjectId: s.subjectId || null,
            taskId: s.taskId || null,
            title: s.title,
            description: `Tự động phân bổ chống dồn bài trước deadline (${new Date(deadlineDate).toLocaleDateString("vi-VN")})`,
            startTime: s.startTime,
            endTime: s.endTime,
            timezone: "Asia/Ho_Chi_Minh",
            type: "STUDY",
            isAiGenerated: true,
          },
        });

        // Create paired StudySession in PLANNED state
        await tx.studySession.create({
          data: {
            userId: user.id,
            subjectId: s.subjectId || null,
            taskId: s.taskId || null,
            goalId: s.goalId || null,
            calendarEventId: event.id,
            plannedDurationSeconds: s.durationMinutes * 60,
            status: "PLANNED",
          },
        });

        events.push(event);
      }

      // If tied to a task, update task's scheduled range and mark as IN_PROGRESS or TODO
      if (taskId) {
        await tx.task.update({
          where: { id: taskId },
          data: {
            scheduledStartTime: result.sessions[0]?.startTime,
            scheduledEndTime: result.sessions[result.sessions.length - 1]?.endTime,
            status: "IN_PROGRESS",
          },
        });
      }

      return events;
    });

    return NextResponse.json({
      success: true,
      commit: true,
      count: createdEvents.length,
      summary: result.summary,
      message: `Đã đưa thành công ${createdEvents.length} phiên học vào Lịch học của bạn!`,
    });
  } catch (err: any) {
    console.error("Distribution commit error:", err);
    return NextResponse.json({ error: "Lỗi phân bổ phiên học deadline" }, { status: 500 });
  }
}

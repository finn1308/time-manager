import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VIETNAM_TIMEZONE, getDateKeyVN } from "@/lib/date-utils";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addMilliseconds } from "date-fns";
import { invalidateCalendarServerCache } from "../route";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      eventId,
      completed,
      customActualMinutes,
      notes,
      productivityScore,
      originalId,
      exceptionDate,
    } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });
    }

    const isComplete = Boolean(completed);

    // 1. Resolve Target Event (handling single occurrences of recurring series)
    const isRecurringOccurrence = eventId.includes("_") || Boolean(originalId && exceptionDate);
    const cleanId = eventId.includes("_") ? eventId.split("_")[0] : eventId;
    const cleanOriginalId = originalId
      ? (originalId.includes("_") ? originalId.split("_")[0] : originalId)
      : cleanId;

    let targetDateKey = exceptionDate;
    if (!targetDateKey && eventId.includes("_")) {
      targetDateKey = eventId.split("_")[1];
    }

    let targetEvent: any = null;

    if (isRecurringOccurrence && cleanOriginalId && targetDateKey) {
      // Find if an exception record already exists for this occurrence
      targetEvent = await prisma.calendarEvent.findFirst({
        where: {
          parentId: cleanOriginalId,
          exceptionDate: targetDateKey,
          userId: user.id,
        },
        include: { subject: true },
      });

      if (!targetEvent) {
        // Need master event to generate exception
        const master = await prisma.calendarEvent.findFirst({
          where: { id: cleanOriginalId, userId: user.id },
          include: { subject: true },
        });

        if (!master) {
          return NextResponse.json({ error: "Không tìm thấy sự kiện gốc" }, { status: 404 });
        }

        if (!isComplete) {
          // If trying to uncomplete a dynamic instance that doesn't even exist yet, it is already uncompleted
          return NextResponse.json({
            success: true,
            completed: false,
            message: "Sự kiện chưa được đánh dấu đã học",
          });
        }

        // Calculate occurrence start and end for that specific date in Vietnam time
        const durationMs = master.endTime.getTime() - master.startTime.getTime();
        const [year, month, day] = targetDateKey.split("-").map(Number);
        const startZoned = toZonedTime(master.startTime, VIETNAM_TIMEZONE);
        const occVNString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(startZoned.getHours()).padStart(2, "0")}:${String(startZoned.getMinutes()).padStart(2, "0")}:00`;
        const realStartUTC = fromZonedTime(occVNString, VIETNAM_TIMEZONE);
        const realEndUTC = addMilliseconds(realStartUTC, durationMs);

        // Create exception record
        targetEvent = await prisma.calendarEvent.create({
          data: {
            userId: user.id,
            parentId: cleanOriginalId,
            exceptionDate: targetDateKey,
            isException: true,
            title: master.title,
            description: master.description,
            location: master.location,
            subjectId: master.subjectId,
            taskId: master.taskId,
            goalId: master.goalId,
            startTime: realStartUTC,
            endTime: realEndUTC,
            timezone: master.timezone,
            type: master.type,
            isLocked: master.isLocked,
            isFlexible: master.isFlexible,
            trackStudyTime: master.trackStudyTime,
            completed: false,
          },
          include: { subject: true },
        });
      }
    } else {
      // Direct single event
      targetEvent = await prisma.calendarEvent.findFirst({
        where: { id: cleanId, userId: user.id },
        include: { subject: true },
      });
    }

    if (!targetEvent) {
      return NextResponse.json({ error: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    // 2. Compute Planned & Actual Duration
    const plannedMinutes = Math.max(
      1,
      Math.round((new Date(targetEvent.endTime).getTime() - new Date(targetEvent.startTime).getTime()) / 60000)
    );
    const actualMinutes =
      typeof customActualMinutes === "number" && customActualMinutes > 0
        ? Math.round(customActualMinutes)
        : plannedMinutes;
    const actualSeconds = actualMinutes * 60;

    // 3. Check if study-trackable (has subjectId or study type)
    const isStudyEvent = Boolean(targetEvent.subjectId);

    // 4. Execute Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      if (isComplete) {
        // --- COMPLETE EVENT (☐ -> ☑) ---
        // a. Update CalendarEvent
        const updatedEvent = await tx.calendarEvent.update({
          where: { id: targetEvent.id },
          data: {
            completed: true,
            completedAt: new Date(),
            plannedDurationMinutes: plannedMinutes,
            actualDurationMinutes: actualMinutes,
          },
          include: { subject: true, studySessions: true },
        });

        let session = null;
        if (isStudyEvent) {
          // b. Create or Update StudySession (idempotent: prevent duplicate records)
          const existingSession = await tx.studySession.findFirst({
            where: {
              calendarEventId: targetEvent.id,
              userId: user.id,
            },
          });

          if (existingSession) {
            session = await tx.studySession.update({
              where: { id: existingSession.id },
              data: {
                actualDurationSeconds: actualSeconds,
                actualEnd: new Date(targetEvent.startTime.getTime() + actualSeconds * 1000),
                status: "COMPLETED",
                source: "CALENDAR_CHECKBOX",
                notes: notes?.trim() || existingSession.notes,
                productivityScore: productivityScore || existingSession.productivityScore,
              },
            });
          } else {
            session = await tx.studySession.create({
              data: {
                userId: user.id,
                subjectId: targetEvent.subjectId!,
                calendarEventId: targetEvent.id,
                taskId: targetEvent.taskId || null,
                goalId: targetEvent.goalId || null,
                plannedStart: targetEvent.startTime,
                plannedEnd: targetEvent.endTime,
                actualStart: targetEvent.startTime,
                actualEnd: new Date(targetEvent.startTime.getTime() + actualSeconds * 1000),
                plannedDurationSeconds: plannedMinutes * 60,
                actualDurationSeconds: actualSeconds,
                status: "COMPLETED",
                source: "CALENDAR_CHECKBOX",
                notes: notes?.trim() || null,
                productivityScore: productivityScore || null,
              },
            });
          }

          // c. Mathematically synchronize Subject.completedHours from actual StudySessions
          const totalAgg = await tx.studySession.aggregate({
            where: {
              subjectId: targetEvent.subjectId!,
              userId: user.id,
              status: "COMPLETED",
            },
            _sum: { actualDurationSeconds: true },
          });

          const totalHours = Math.round(((totalAgg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
          await tx.subject.update({
            where: { id: targetEvent.subjectId! },
            data: { completedHours: totalHours },
          });
        }

        return {
          event: updatedEvent,
          session,
          actualMinutes,
          plannedMinutes,
          completed: true,
        };
      } else {
        // --- UNCOMPLETE EVENT (☑ -> ☐) ---
        // a. Update CalendarEvent
        const updatedEvent = await tx.calendarEvent.update({
          where: { id: targetEvent.id },
          data: {
            completed: false,
            completedAt: null,
            actualDurationMinutes: null,
          },
          include: { subject: true },
        });

        // b. Remove associated StudySessions for this calendar event
        await tx.studySession.deleteMany({
          where: {
            calendarEventId: targetEvent.id,
            userId: user.id,
          },
        });

        // c. Recalculate Subject.completedHours
        if (isStudyEvent) {
          const totalAgg = await tx.studySession.aggregate({
            where: {
              subjectId: targetEvent.subjectId!,
              userId: user.id,
              status: "COMPLETED",
            },
            _sum: { actualDurationSeconds: true },
          });

          const totalHours = Math.round(((totalAgg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
          await tx.subject.update({
            where: { id: targetEvent.subjectId! },
            data: { completedHours: totalHours },
          });
        }

        return {
          event: updatedEvent,
          session: null,
          actualMinutes: 0,
          plannedMinutes,
          completed: false,
        };
      }
    });

    // 5. Award XP if newly completed
    if (isComplete && isStudyEvent) {
      try {
        const { awardUserXp } = await import("@/lib/gamification/engine");
        await awardUserXp(
          user.id,
          Math.max(10, actualMinutes),
          `Hoàn thành môn ${targetEvent.subject?.name || targetEvent.title} (${actualMinutes} phút)`
        );
      } catch (e) {
        console.warn("XP award error:", e);
      }
    }

    invalidateCalendarServerCache(user.id);

    return NextResponse.json({
      success: true,
      completed: result.completed,
      event: result.event,
      session: result.session,
      actualMinutes: result.actualMinutes,
      plannedMinutes: result.plannedMinutes,
    });
  } catch (err: any) {
    console.error("Toggle event complete error:", err);
    return NextResponse.json(
      { error: "Lỗi cập nhật trạng thái học: " + (err?.message || "Vui lòng thử lại") },
      { status: 500 }
    );
  }
}

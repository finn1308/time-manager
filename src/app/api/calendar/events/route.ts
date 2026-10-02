import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";
import { parseISO, subMonths, addMonths } from "date-fns";
import { ALL_EVENT_TYPES, isSelfStudyEvent } from "@/lib/calendar/event-types";
import { getDateKeyVN } from "@/lib/date-utils";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const now = new Date();
  const rangeStart = startStr ? parseISO(startStr) : subMonths(now, 2);
  const rangeEnd = endStr ? parseISO(endStr) : addMonths(now, 6);

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    include: {
      subject: true,
      goal: {
        select: {
          id: true,
          title: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
        },
      },
      studySessions: {
        select: {
          id: true,
          actualStart: true,
          actualEnd: true,
          actualDurationSeconds: true,
          status: true,
        },
      },
      resources: true,
      studyNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const expanded = expandRecurringEvents(events, rangeStart, rangeEnd);

  return NextResponse.json({ events: expanded });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      location,
      subjectId,
      taskId,
      goalId,
      startTime,
      endTime,
      type,
      isLocked,
      isFlexible,
      trackStudyTime,
      seriesId,
      timezone,
      recurrence,
      recurrenceRule,
      recurrenceEnd,
    } = body;

    // 1. Validate Title
    if (!title?.trim()) {
      return NextResponse.json({ error: "Tiêu đề sự kiện không được để trống" }, { status: 400 });
    }

    // 2. Validate Dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Định dạng thời gian không hợp lệ" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    // 3. Validate Event Type
    const normalizedType = type ? type.toUpperCase() : "OTHER";
    const validTypes = ["SCHOOL", "SELF_STUDY", "PERSONAL", "EXAM", "DEADLINE", "OTHER", "STUDY", "MEETING", "BLOCKED"];
    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json({ error: "Loại sự kiện không hợp lệ" }, { status: 400 });
    }

    // 4. Validate Subject Ownership
    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId: user.id },
      });
      if (!subject) {
        return NextResponse.json({ error: "Môn học không tồn tại hoặc không thuộc quyền sở hữu của bạn" }, { status: 400 });
      }
    }

    // 5. Validate Task Ownership
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId: user.id },
      });
      if (!task) {
        return NextResponse.json({ error: "Nhiệm vụ không tồn tại hoặc không thuộc quyền sở hữu của bạn" }, { status: 400 });
      }
    }

    // 5b. Validate Goal Ownership
    if (goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId: user.id },
      });
      if (!goal) {
        return NextResponse.json({ error: "Mục tiêu không tồn tại hoặc không thuộc quyền sở hữu của bạn" }, { status: 400 });
      }
    }

    // 6. Conflict Detection (Unless it's a DEADLINE milestone)
    if (normalizedType !== "DEADLINE") {
      const existingEvents = await prisma.calendarEvent.findMany({
        where: { userId: user.id, isCancelled: false },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          title: true,
          isLocked: true,
          recurrence: true,
          recurrenceRule: true,
          parentId: true,
          isException: true,
          isCancelled: true,
        },
      });

      const expandedEvents = expandRecurringEvents(existingEvents as any, start, end);

      const timeSlots = expandedEvents.map((e: any) => ({
        start: e.startTime,
        end: e.endTime,
        title: e.title,
        isLocked: e.isLocked,
      }));

      const rules = await prisma.availabilityRule.findMany({
        where: { userId: user.id },
        select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
      });

      const conflictResult = detectSlotConflict(start, end, timeSlots, rules);
      if (conflictResult.hasConflict) {
        return NextResponse.json(
          { error: conflictResult.reason || "Trùng lịch với sự kiện hoặc khung giờ bận khác" },
          { status: 400 }
        );
      }
    }

    // 7. Create Event
    const finalTrackStudyTime = trackStudyTime !== undefined
      ? Boolean(trackStudyTime)
      : (normalizedType === "SELF_STUDY" || normalizedType === "STUDY");
    const finalIsFlexible = isFlexible !== undefined
      ? Boolean(isFlexible)
      : (normalizedType === "PERSONAL");

    const event = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        subjectId: subjectId || null,
        taskId: taskId || null,
        goalId: goalId || null,
        startTime: start,
        endTime: end,
        type: normalizedType,
        isLocked: !!isLocked,
        isFlexible: finalIsFlexible,
        trackStudyTime: finalTrackStudyTime,
        seriesId: seriesId || null,
        timezone: timezone || "Asia/Ho_Chi_Minh",
        isAiGenerated: false,
        recurrence: recurrence || "NONE",
        recurrenceRule: recurrenceRule || null,
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      },
      include: {
        subject: true,
        task: true,
        goal: true,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Create calendar event error:", err);
    return NextResponse.json({ error: "Lỗi khi tạo sự kiện lịch: " + (err?.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      location,
      subjectId,
      taskId,
      goalId,
      startTime,
      endTime,
      type,
      isLocked,
      isFlexible,
      trackStudyTime,
      seriesId,
      recurrence,
      recurrenceRule,
      recurrenceEnd,
      originalId,
      exceptionDate,
      updateMode,
    } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });

    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    if (start && end && end <= start) {
      return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
    }

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId: user.id },
      });
      if (!subject) {
        return NextResponse.json({ error: "Môn học không hợp lệ" }, { status: 400 });
      }
    }

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId: user.id },
      });
      if (!task) {
        return NextResponse.json({ error: "Nhiệm vụ không hợp lệ" }, { status: 400 });
      }
    }

    const cleanId = id.includes("_") ? id.split("_")[0] : id;
    const cleanOriginalId = originalId
      ? (originalId.includes("_") ? originalId.split("_")[0] : originalId)
      : cleanId;

    let targetDateKey = exceptionDate;
    if (!targetDateKey && id.includes("_")) {
      targetDateKey = id.split("_")[1];
    }

    // Single occurrence edit of a recurring event
    if (updateMode === "SINGLE" && cleanOriginalId && (id !== cleanOriginalId || targetDateKey)) {
      const existingEx = await prisma.calendarEvent.findFirst({
        where: {
          parentId: cleanOriginalId,
          exceptionDate: targetDateKey,
          userId: user.id,
        },
      });

      if (existingEx) {
        const updatedEx = await prisma.calendarEvent.update({
          where: { id: existingEx.id },
          data: {
            title: title !== undefined ? title.trim() : undefined,
            description: description !== undefined ? description?.trim() || null : undefined,
            location: location !== undefined ? location?.trim() || null : undefined,
            subjectId: subjectId !== undefined ? subjectId || null : undefined,
            taskId: taskId !== undefined ? taskId || null : undefined,
            goalId: goalId !== undefined ? goalId || null : undefined,
            startTime: start,
            endTime: end,
            type: type !== undefined ? type : undefined,
            isLocked: isLocked !== undefined ? !!isLocked : undefined,
            isFlexible: isFlexible !== undefined ? !!isFlexible : undefined,
            trackStudyTime: trackStudyTime !== undefined ? !!trackStudyTime : undefined,
            isCancelled: false,
          },
          include: { subject: true, task: true, goal: true },
        });
        return NextResponse.json({ success: true, event: updatedEx });
      }

      const exceptionEvent = await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: title?.trim() || "Sự kiện",
          description: description !== undefined ? description?.trim() || null : null,
          location: location !== undefined ? location?.trim() || null : null,
          subjectId: subjectId || null,
          taskId: taskId || null,
          goalId: goalId || null,
          startTime: start!,
          endTime: end!,
          type: type || "OTHER",
          isLocked: isLocked !== undefined ? !!isLocked : false,
          isFlexible: isFlexible !== undefined ? !!isFlexible : (type === "PERSONAL"),
          trackStudyTime: trackStudyTime !== undefined ? !!trackStudyTime : (type === "SELF_STUDY" || type === "STUDY"),
          timezone: "Asia/Ho_Chi_Minh",
          parentId: cleanOriginalId,
          exceptionDate: targetDateKey,
          isException: true,
          isCancelled: false,
        },
        include: { subject: true, task: true, goal: true },
      });
      return NextResponse.json({ success: true, event: exceptionEvent });
    }

    const targetId = updateMode === "ALL" && cleanOriginalId ? cleanOriginalId : cleanId;

    const event = await prisma.calendarEvent.update({
      where: { id: targetId, userId: user.id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        location: location !== undefined ? location?.trim() || null : undefined,
        subjectId: subjectId !== undefined ? subjectId || null : undefined,
        taskId: taskId !== undefined ? taskId || null : undefined,
        goalId: goalId !== undefined ? goalId || null : undefined,
        startTime: start,
        endTime: end,
        type: type !== undefined ? type : undefined,
        isLocked: isLocked !== undefined ? !!isLocked : undefined,
        isFlexible: isFlexible !== undefined ? !!isFlexible : undefined,
        trackStudyTime: trackStudyTime !== undefined ? !!trackStudyTime : undefined,
        seriesId: seriesId !== undefined ? seriesId : undefined,
        recurrence: recurrence !== undefined ? recurrence : undefined,
        recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : undefined,
        recurrenceEnd: recurrenceEnd !== undefined ? (recurrenceEnd ? new Date(recurrenceEnd) : null) : undefined,
      },
      include: {
        subject: true,
        task: true,
        goal: true,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Update calendar event error:", err);
    return NextResponse.json({ error: "Lỗi cập nhật sự kiện: " + (err?.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const originalId = searchParams.get("originalId");
  let exceptionDate = searchParams.get("exceptionDate");
  const deleteMode = searchParams.get("deleteMode") || "SINGLE"; // SINGLE, ALL, FUTURE

  if (!id) return NextResponse.json({ error: "Thiếu ID sự kiện" }, { status: 400 });

  try {
    const cleanId = id.includes("_") ? id.split("_")[0] : id;
    const cleanOriginalId = originalId
      ? (originalId.includes("_") ? originalId.split("_")[0] : originalId)
      : cleanId;

    if (!exceptionDate && id.includes("_")) {
      exceptionDate = id.split("_")[1];
    }

    // 1. Find the target master event
    let targetEvent = await prisma.calendarEvent.findFirst({
      where: { id: cleanOriginalId, userId: user.id },
    });

    if (!targetEvent && cleanId !== cleanOriginalId) {
      targetEvent = await prisma.calendarEvent.findFirst({
        where: { id: cleanId, userId: user.id },
      });
    }

    if (!targetEvent) {
      targetEvent = await prisma.calendarEvent.findFirst({
        where: { id, userId: user.id },
      });
    }

    if (!targetEvent) {
      return NextResponse.json({ success: true, message: "Sự kiện đã bị xóa hoặc không tồn tại" });
    }

    const isRecurring = Boolean(targetEvent.recurrence && targetEvent.recurrence !== "NONE");

    // Case 1: Delete only this single occurrence of a recurring series
    if (deleteMode === "SINGLE" && isRecurring) {
      const targetDateKey = exceptionDate || getDateKeyVN(targetEvent.startTime);

      const existingEx = await prisma.calendarEvent.findFirst({
        where: {
          parentId: targetEvent.id,
          exceptionDate: targetDateKey,
          userId: user.id,
        },
      });

      if (existingEx) {
        await prisma.calendarEvent.update({
          where: { id: existingEx.id },
          data: { isCancelled: true },
        });
      } else {
        await prisma.calendarEvent.create({
          data: {
            userId: user.id,
            title: "Cancelled occurrence",
            startTime: targetEvent.startTime,
            endTime: targetEvent.endTime,
            type: targetEvent.type,
            parentId: targetEvent.id,
            exceptionDate: targetDateKey,
            isException: true,
            isCancelled: true,
          },
        });
      }
      return NextResponse.json({ success: true, message: "Đã xóa lịch cho ngày này thành công (các ngày khác vẫn giữ nguyên)" });
    }

    // Case 2: Delete from this occurrence onwards (deleteMode === "FUTURE")
    if (deleteMode === "FUTURE" && isRecurring) {
      const targetDateKey = exceptionDate || getDateKeyVN(targetEvent.startTime);
      const [year, month, day] = targetDateKey.split("-").map(Number);
      // Cut off recurrence at the start of this date
      const cutoffDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

      await prisma.calendarEvent.update({
        where: { id: targetEvent.id },
        data: {
          recurrenceEnd: cutoffDate,
        },
      });

      // Also cancel or clean up any exception records on or after this cutoff
      await prisma.calendarEvent.updateMany({
        where: {
          parentId: targetEvent.id,
          exceptionDate: { gte: targetDateKey },
        },
        data: { isCancelled: true },
      });

      return NextResponse.json({ success: true, message: "Đã kết thúc chuỗi sự kiện từ ngày này trở đi" });
    }

    // Case 3: Delete exception record if it's already an exception
    if (targetEvent.isException) {
      await prisma.calendarEvent.update({
        where: { id: targetEvent.id },
        data: { isCancelled: true },
      });
      return NextResponse.json({ success: true, message: "Đã hủy lịch sự kiện" });
    }

    // Case 4: Delete master event and all its occurrences (deleteMode === "ALL" or non-recurring single event)
    // Note: Due to onDelete: SetNull on StudySession, any completed study sessions remain completely intact.
    await prisma.calendarEvent.delete({
      where: { id: targetEvent.id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa toàn bộ chuỗi sự kiện thành công" });
  } catch (error: any) {
    console.error("Delete calendar event error:", error);
    return NextResponse.json({ error: "Lỗi xóa sự kiện: " + (error?.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { detectSlotConflict } from "@/lib/scheduling/conflict-detector";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";
import { parseISO, subMonths, addMonths } from "date-fns";
import { ALL_EVENT_TYPES, isSelfStudyEvent } from "@/lib/calendar/event-types";
import { getDateKeyVN } from "@/lib/date-utils";

// In-memory cache for calendar events (20s TTL per user query)
const calendarServerCache = new Map<string, { data: any; expiresAt: number }>();
const CALENDAR_CACHE_TTL_MS = 20_000;

export function invalidateCalendarServerCache(userId?: string) {
  if (userId) {
    for (const key of calendarServerCache.keys()) {
      if (key.startsWith(userId)) {
        calendarServerCache.delete(key);
      }
    }
  } else {
    calendarServerCache.clear();
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const now = new Date();
  const rangeStart = startStr ? parseISO(startStr) : subMonths(now, 2);
  const rangeEnd = endStr ? parseISO(endStr) : addMonths(now, 6);

  const cacheKey = `${user.id}:${startStr || "default"}:${endStr || "default"}`;
  const cached = calendarServerCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ events: cached.data });
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: user.id,
      OR: [
        { recurrence: { not: "NONE" } },
        {
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
        },
      ],
    },
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
      resources: {
        select: {
          id: true,
          title: true,
          type: true,
          url: true,
        },
      },
      studyNotes: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      flexibleGoal: {
        select: {
          id: true,
          title: true,
          targetMinutes: true,
          activeDays: true,
          preferredPeriod: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const expanded = expandRecurringEvents(events, rangeStart, rangeEnd);
  calendarServerCache.set(cacheKey, { data: expanded, expiresAt: Date.now() + CALENDAR_CACHE_TTL_MS });

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
      schedules,
      isAllDay,
      plannedDurationMinutes,
      schedulingMode, // "FIXED" | "FLEXIBLE"
      skillId,
      targetMinutes,
      startDate,
      endDate,
      activeDays,
      preferredPeriod,
      deadline,
    } = body;

    // 1. Validate Title
    if (!title?.trim()) {
      return NextResponse.json({ error: "Tiêu đề không được để trống" }, { status: 400 });
    }

    // 1b. Support Flexible Daily Goal creation directly without required times
    if (schedulingMode === "FLEXIBLE") {
      if (subjectId) {
        const subject = await prisma.subject.findFirst({
          where: { id: subjectId, userId: user.id },
        });
        if (!subject) {
          return NextResponse.json({ error: "Môn học không tồn tại" }, { status: 400 });
        }
      }

      if (skillId) {
        const skill = await prisma.skill.findFirst({
          where: { id: skillId, userId: user.id },
        });
        if (!skill) {
          return NextResponse.json({ error: "Kỹ năng không tồn tại" }, { status: 400 });
        }
      }

      const parsedActiveDays = Array.isArray(activeDays)
        ? activeDays.join(",")
        : typeof activeDays === "string" && activeDays.trim().length > 0
        ? activeDays
        : "1,2,3,4,5";

      const targetMins = Math.max(
        5,
        parseInt(String(targetMinutes || plannedDurationMinutes || 30), 10) || 30
      );

      const startD = startDate ? new Date(startDate) : (startTime ? new Date(startTime) : new Date());
      const endD = endDate ? new Date(endDate) : (recurrenceEnd ? new Date(recurrenceEnd) : null);
      const deadlineD = deadline ? new Date(deadline) : null;

      const flexibleGoal = await prisma.flexibleStudyGoal.create({
        data: {
          userId: user.id,
          title: title.trim(),
          description: description?.trim() || null,
          subjectId: subjectId || null,
          skillId: skillId || null,
          targetMinutes: targetMins,
          startDate: startD,
          endDate: endD,
          activeDays: parsedActiveDays,
          preferredPeriod: preferredPeriod || "ANY_TIME",
          deadline: deadlineD,
          status: "ACTIVE",
        },
        include: {
          subject: true,
          skill: true,
        },
      });

      invalidateCalendarServerCache(user.id);
      return NextResponse.json({ success: true, flexibleGoal, schedulingMode: "FLEXIBLE" });
    }

    // 2. Validate Dates for FIXED Schedule (Only if not using schedules array)
    let start: Date | undefined;
    let end: Date | undefined;
    if (!schedules || schedules.length === 0) {
      start = new Date(startTime);
      end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: "Định dạng thời gian không hợp lệ" }, { status: 400 });
      }

      if (end <= start) {
        return NextResponse.json({ error: "Thời gian kết thúc phải sau thời gian bắt đầu" }, { status: 400 });
      }
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

      const expandedEvents = expandRecurringEvents(existingEvents as any, 
        schedules && schedules.length > 0 ? new Date(schedules[0].startTime) : start!, 
        schedules && schedules.length > 0 ? new Date(schedules[schedules.length - 1].endTime) : end!
      );

      const existingTimeSlots = expandedEvents.map((e: any) => ({
        start: e.startTime,
        end: e.endTime,
        title: e.title,
        isLocked: e.isLocked,
      }));

      const rules = await prisma.availabilityRule.findMany({
        where: { userId: user.id },
        select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
      });

      if (schedules && schedules.length > 0) {
        for (const sch of schedules) {
          const schStart = new Date(sch.startTime);
          const schEnd = new Date(sch.endTime);
          const conflictResult = detectSlotConflict(schStart, schEnd, existingTimeSlots, rules);
          if (conflictResult.hasConflict) {
            return NextResponse.json(
              { error: conflictResult.reason || `Trùng lịch: ${title} (${schStart.getHours()}h-${schEnd.getHours()}h)` },
              { status: 400 }
            );
          }
        }
      } else {
        const conflictResult = detectSlotConflict(start!, end!, existingTimeSlots, rules);
        if (conflictResult.hasConflict) {
          return NextResponse.json(
            { error: conflictResult.reason || "Trùng lịch với sự kiện hoặc khung giờ bận khác" },
            { status: 400 }
          );
        }
      }
    }

    const isStudySchedule = normalizedType === "SCHOOL" || normalizedType === "SELF_STUDY" || normalizedType === "STUDY" || Boolean(subjectId);
    const finalTrackStudyTime = trackStudyTime !== undefined
      ? Boolean(trackStudyTime)
      : isStudySchedule;
    const finalIsFlexible = isFlexible !== undefined
      ? Boolean(isFlexible)
      : (normalizedType === "PERSONAL");

    const baseData = {
      userId: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      subjectId: subjectId || null,
      skillId: skillId || null,
      taskId: taskId || null,
      goalId: goalId || null,
      completed: false,
      type: normalizedType,
      isLocked: !!isLocked,
      isFlexible: finalIsFlexible,
      trackStudyTime: finalTrackStudyTime,
      timezone: timezone || "Asia/Ho_Chi_Minh",
      isAiGenerated: false,
      isAllDay: !!isAllDay,
      schedulingMode: "FIXED",
      preferredPeriod: preferredPeriod || null,
      flexibleGoalId: body.flexibleGoalId || null,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
    };

    let calculatedDuration = 60;
    if (isAllDay && plannedDurationMinutes) {
      calculatedDuration = plannedDurationMinutes;
    } else if (start && end) {
      calculatedDuration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    }

    if (schedules && schedules.length > 0) {
      const generatedSeriesId = seriesId || crypto.randomUUID();
      const events = await Promise.all(schedules.map((sch: any) => {
        const schStart = new Date(sch.startTime);
        const schEnd = new Date(sch.endTime);
        return prisma.calendarEvent.create({
          data: {
            ...baseData,
            startTime: schStart,
            endTime: schEnd,
            plannedDurationMinutes: Math.max(1, Math.round((schEnd.getTime() - schStart.getTime()) / 60000)),
            seriesId: generatedSeriesId,
            recurrence: recurrence || "NONE",
            recurrenceRule: sch.recurrenceRule || null,
          },
          include: { subject: true, task: true, goal: true },
        });
      }));

      invalidateCalendarServerCache(user.id);
      return NextResponse.json({ success: true, event: events[0], events });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        ...baseData,
        startTime: start!,
        endTime: end!,
        plannedDurationMinutes: calculatedDuration,
        seriesId: seriesId || null,
        recurrence: recurrence || "NONE",
        recurrenceRule: recurrenceRule || null,
      },
      include: { subject: true, task: true, goal: true },
    });

    invalidateCalendarServerCache(user.id);
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
      isAllDay,
      plannedDurationMinutes,
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

    // Check if the original event is actually recurring
    let isOriginalEventRecurring = false;
    if (cleanOriginalId) {
      const originalEvent = await prisma.calendarEvent.findUnique({ where: { id: cleanOriginalId } });
      isOriginalEventRecurring = Boolean(originalEvent && originalEvent.recurrence && originalEvent.recurrence !== "NONE");
    }

    // Single occurrence edit of a recurring event
    if (updateMode === "SINGLE" && isOriginalEventRecurring && cleanOriginalId && (id !== cleanOriginalId || targetDateKey)) {
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
            plannedDurationMinutes: isAllDay ? plannedDurationMinutes : (start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000)) : undefined),
            type: type !== undefined ? type : undefined,
            isLocked: isLocked !== undefined ? !!isLocked : undefined,
            isFlexible: isFlexible !== undefined ? !!isFlexible : undefined,
            isAllDay: isAllDay !== undefined ? !!isAllDay : undefined,
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
          plannedDurationMinutes: isAllDay ? plannedDurationMinutes : (start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000)) : 60),
          completed: false,
          type: type || "OTHER",
          isLocked: isLocked !== undefined ? !!isLocked : false,
          isFlexible: isFlexible !== undefined ? !!isFlexible : (type === "PERSONAL"),
          isAllDay: !!isAllDay,
          trackStudyTime: trackStudyTime !== undefined
            ? !!trackStudyTime
            : (type === "SCHOOL" || type === "SELF_STUDY" || type === "STUDY" || Boolean(subjectId)),
          timezone: "Asia/Ho_Chi_Minh",
          parentId: cleanOriginalId,
          exceptionDate: targetDateKey,
          isException: true,
          isCancelled: false,
        },
        include: { subject: true, task: true, goal: true },
      });
      invalidateCalendarServerCache(user.id);
      return NextResponse.json({ success: true, event: exceptionEvent });
    }

    const targetId = updateMode === "ALL" && cleanOriginalId ? cleanOriginalId : cleanId;

    if (updateMode === "SERIES") {
      const targetEvent = await prisma.calendarEvent.findFirst({ where: { id: targetId, userId: user.id } });
      if (targetEvent?.seriesId) {
        // Update all master events in the series with shared attributes
        await prisma.calendarEvent.updateMany({
          where: { seriesId: targetEvent.seriesId, userId: user.id },
          data: {
            title: title !== undefined ? title.trim() : undefined,
            description: description !== undefined ? description?.trim() || null : undefined,
            location: location !== undefined ? location?.trim() || null : undefined,
            subjectId: subjectId !== undefined ? subjectId || null : undefined,
            taskId: taskId !== undefined ? taskId || null : undefined,
            goalId: goalId !== undefined ? goalId || null : undefined,
            type: type !== undefined ? type : undefined,
            isLocked: isLocked !== undefined ? !!isLocked : undefined,
            isFlexible: isFlexible !== undefined ? !!isFlexible : undefined,
            isAllDay: isAllDay !== undefined ? !!isAllDay : undefined,
            trackStudyTime: trackStudyTime !== undefined ? !!trackStudyTime : undefined,
            recurrenceEnd: recurrenceEnd !== undefined ? (recurrenceEnd ? new Date(recurrenceEnd) : null) : undefined,
          }
        });
        
        // Need to return one event to satisfy the API response
        const updatedEvent = await prisma.calendarEvent.findFirst({ where: { id: targetId }, include: { subject: true, task: true, goal: true } });
        invalidateCalendarServerCache(user.id);
        return NextResponse.json({ success: true, event: updatedEvent });
      }
    }

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
        plannedDurationMinutes: isAllDay ? plannedDurationMinutes : (start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000)) : undefined),
        type: type !== undefined ? type : undefined,
        isLocked: isLocked !== undefined ? !!isLocked : undefined,
        isFlexible: isFlexible !== undefined ? !!isFlexible : undefined,
        isAllDay: isAllDay !== undefined ? !!isAllDay : undefined,
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

    invalidateCalendarServerCache(user.id);
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
    // Case 5: Delete entire grouped series (deleteMode === "SERIES")
    let targetEvents = [targetEvent];
    if (deleteMode === "SERIES" && targetEvent.seriesId) {
      targetEvents = await prisma.calendarEvent.findMany({
        where: { seriesId: targetEvent.seriesId, userId: user.id },
      });
    }

    const affectedSubjectIds = new Set<string>();

    for (const evt of targetEvents) {
      const linkedSessions = await prisma.studySession.findMany({
        where: {
          calendarEventId: evt.id,
          userId: user.id,
        },
      });

      for (const s of linkedSessions) {
        if (s.subjectId) affectedSubjectIds.add(s.subjectId);
        if (s.source === "CALENDAR_CHECKBOX") {
          await prisma.studySession.delete({ where: { id: s.id } });
        } else {
          // Retain PIP_TIMER records with historical trace note
          await prisma.studySession.update({
            where: { id: s.id },
            data: {
              calendarEventId: null,
              notes: (s.notes ? s.notes + " | " : "") + `[Lịch đã xóa: ${evt.title}]`,
            },
          });
        }
      }
    }

    for (const subId of Array.from(affectedSubjectIds)) {
      const agg = await prisma.studySession.aggregate({
        where: { subjectId: subId, userId: user.id, status: "COMPLETED" },
        _sum: { actualDurationSeconds: true },
      });
      const totalHours = Math.round(((agg._sum.actualDurationSeconds || 0) / 3600) * 10) / 10;
      await prisma.subject.update({
        where: { id: subId },
        data: { completedHours: totalHours },
      });
    }

    const eventIdsToDelete = targetEvents.map(e => e.id);
    await prisma.calendarEvent.deleteMany({
      where: { id: { in: eventIdsToDelete }, userId: user.id },
    });

    invalidateCalendarServerCache(user.id);
    return NextResponse.json({ success: true, message: deleteMode === "SERIES" ? "Đã xóa toàn bộ nhóm lịch thành công" : "Đã xóa toàn bộ chuỗi sự kiện thành công" });
  } catch (error: any) {
    console.error("Delete calendar event error:", error);
    return NextResponse.json({ error: "Lỗi xóa sự kiện: " + (error?.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

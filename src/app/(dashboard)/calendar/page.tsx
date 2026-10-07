import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expandRecurringEvents } from "@/lib/scheduling/recurrence";
import { parseISO, subMonths, addMonths } from "date-fns";
import { CalendarClient } from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const rangeStart = subMonths(now, 2);
  const rangeEnd = addMonths(now, 6);

  // 1. Fetch Calendar Events
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
    },
    orderBy: { startTime: "asc" },
  });

  const expandedEvents = expandRecurringEvents(events, rangeStart, rangeEnd);

  // 2. Fetch Blocked Slots
  const rules = await prisma.availabilityRule.findMany({
    where: { userId: user.id },
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  
  const blockedSlots = rules
    .filter((r) => !r.isAvailable)
    .map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      start: r.startTime,
      end: r.endTime,
      title: "Khung giờ bận",
    }));

  // 3. Fetch Subjects
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    orderBy: { priority: "desc" },
    select: {
      id: true,
      name: true,
      color: true,
      priority: true,
    },
  });

  return (
    <CalendarClient
      initialEvents={expandedEvents}
      initialBlockedSlots={blockedSlots}
      initialSubjects={subjects}
    />
  );
}

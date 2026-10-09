import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, setHours, setMinutes } from "date-fns";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id: params.id },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            units: {
              orderBy: { order: "asc" },
              include: {
                tasks: {
                  where: { status: "PENDING" },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!skill || skill.userId !== user.id) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Collect all pending tasks
    const pendingTasks = [];
    for (const phase of skill.phases) {
      for (const unit of phase.units) {
        for (const task of unit.tasks) {
          pendingTasks.push({ ...task, phaseId: phase.id, unitId: unit.id });
        }
      }
    }

    if (pendingTasks.length === 0) {
      return NextResponse.json({ message: "No pending tasks to schedule." });
    }

    // Very basic scheduling: Distribute tasks into next 7 days, 1-2 hours per day
    let currentDate = new Date();
    currentDate = setHours(setMinutes(currentDate, 0), 19); // start at 19:00 PM each day
    
    let currentDayMinutes = 0;
    const maxMinutesPerDay = (skill.weeklyHoursCommitment / 7) * 60 || 60; // default 60 min

    for (const task of pendingTasks) {
      if (currentDayMinutes + task.plannedMinutes > maxMinutesPerDay) {
        currentDate = addDays(currentDate, 1);
        currentDate = setHours(setMinutes(currentDate, 0), 19);
        currentDayMinutes = 0;
      }

      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate.getTime() + task.plannedMinutes * 60000);

      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: `[${skill.name}] ${task.name}`,
          description: task.description || "",
          startTime,
          endTime,
          isCompleted: false,
          skillId: skill.id,
          skillTaskId: task.id,
          eventType: "LEARNING",
        },
      });

      currentDate = endTime;
      currentDayMinutes += task.plannedMinutes;
    }

    return NextResponse.json({ success: true, count: pendingTasks.length });
  } catch (error: any) {
    console.error("Error scheduling tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

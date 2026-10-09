import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAdaptiveTasks } from "@/lib/ai/skill-analyzer";

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
          include: {
            units: {
              include: {
                tasks: { where: { status: "COMPLETED" } }
              }
            }
          }
        },
        studySessions: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!skill || skill.userId !== user.id) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const completedTasks = skill.phases.flatMap(p => p.units.flatMap(u => u.tasks));
    if (completedTasks.length === 0 && skill.studySessions.length === 0) {
      return NextResponse.json({ message: "Not enough data for adaptive learning yet. Complete some tasks first." }, { status: 400 });
    }

    const adaptation = await generateAdaptiveTasks(skill.name, skill.targetLevel || "Intermediate", completedTasks, skill.studySessions);
    
    // Create an "Adaptive Review" phase or unit if not exists, or just append to the last unit.
    if (!adaptation.tasks || adaptation.tasks.length === 0) {
      return NextResponse.json({ message: "No new tasks recommended at this time.", reasoning: adaptation.reasoning });
    }

    let phase = await prisma.skillPhase.findFirst({
      where: { skillId: skill.id, name: "Adaptive Review & Drill" }
    });

    if (!phase) {
      phase = await prisma.skillPhase.create({
        data: {
          skillId: skill.id,
          name: "Adaptive Review & Drill",
          description: "Các bài tập được AI tạo tự động dựa trên kết quả học tập để khắc phục điểm yếu.",
          order: 999
        }
      });
    }

    let unit = await prisma.skillUnit.findFirst({
      where: { phaseId: phase.id }
    });

    if (!unit) {
      unit = await prisma.skillUnit.create({
        data: {
          phaseId: phase.id,
          name: "Targeted Practice",
          order: 1
        }
      });
    }

    // Insert new tasks
    for (const t of adaptation.tasks) {
      await prisma.skillTask.create({
        data: {
          unitId: unit.id,
          name: t.name,
          description: t.description,
          taskType: t.taskType || "DRILL",
          plannedMinutes: t.plannedMinutes || 30,
          order: 999
        }
      });
    }

    return NextResponse.json({ success: true, reasoning: adaptation.reasoning, addedTasks: adaptation.tasks.length });
  } catch (error: any) {
    console.error("Error in adaptive learning:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

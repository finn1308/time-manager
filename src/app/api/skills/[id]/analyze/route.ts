import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSkillRoadmap } from "@/lib/ai/skill-analyzer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill || skill.userId !== user.id) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const roadmapData = await generateSkillRoadmap(skill.id, user.id);

    // Save Knowledge Map and Strategy
    await prisma.skill.update({
      where: { id: skill.id },
      data: {
        knowledgeMap: roadmapData.knowledgeMap,
        learningStrategy: roadmapData.learningStrategy,
      },
    });

    // Save Phases, Units, Tasks
    let orderPhase = 0;
    for (const phase of roadmapData.phases) {
      const createdPhase = await prisma.skillPhase.create({
        data: {
          skillId: skill.id,
          name: phase.name,
          description: phase.description || null,
          plannedHours: phase.plannedHours || 0,
          order: orderPhase++,
        },
      });

      let orderUnit = 0;
      for (const unit of phase.units || []) {
        const createdUnit = await prisma.skillUnit.create({
          data: {
            phaseId: createdPhase.id,
            name: unit.name,
            description: unit.description || null,
            plannedMinutes: unit.plannedMinutes || 0,
            order: orderUnit++,
          },
        });

        let orderTask = 0;
        for (const task of unit.tasks || []) {
          await prisma.skillTask.create({
            data: {
              unitId: createdUnit.id,
              name: task.name,
              description: task.description || null,
              taskType: task.taskType || "PRACTICE",
              plannedMinutes: task.plannedMinutes || 30,
              order: orderTask++,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error generating skill roadmap:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

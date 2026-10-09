import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RoadmapView } from "@/components/skills/roadmap-view";

export const metadata = {
  title: "Skill Roadmap",
};

export default async function SkillRoadmapPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!skill || skill.userId !== user.id) {
    redirect("/skills");
  }

  return (
    <div className="flex-1 bg-[#f8fbf8] dark:bg-[#132217] overflow-y-auto">
      <RoadmapView initialSkill={skill} />
    </div>
  );
}

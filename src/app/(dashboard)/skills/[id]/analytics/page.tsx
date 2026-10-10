import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SkillAnalytics } from "@/components/skills/skill-analytics";

export const metadata = {
  title: "Skill Analytics",
};

export default async function SkillAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const skill = await prisma.skill.findUnique({
    where: { id: id },
    include: {
      phases: {
        include: {
          units: {
            include: {
              tasks: true,
            },
          },
        },
      },
      studySessions: {
        where: { status: "COMPLETED" },
        orderBy: { actualEnd: "desc" },
      },
    },
  });

  if (!skill || skill.userId !== user.id) {
    redirect("/skills");
  }

  return (
    <div className="flex-1 bg-[var(--bg-muted)] overflow-y-auto">
      <SkillAnalytics initialSkill={skill} />
    </div>
  );
}

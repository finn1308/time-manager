import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SkillDetails } from "@/components/skills/skill-details";

export const metadata = {
  title: "Skill Details",
};

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const skill = await prisma.skill.findUnique({
    where: { id: id },
    include: {
      resources: true,
      phases: {
        include: {
          units: {
            include: {
              tasks: true,
            },
          },
        },
      },
      studySessions: true,
    },
  });

  if (!skill || skill.userId !== user.id) {
    redirect("/skills");
  }

  return (
    <div className="flex-1 bg-[var(--bg-muted)] overflow-y-auto">
      <SkillDetails initialSkill={skill} />
    </div>
  );
}

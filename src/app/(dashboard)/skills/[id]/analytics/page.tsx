import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SkillAnalytics } from "@/components/skills/skill-analytics";

export const metadata = {
  title: "Skill Analytics",
};

export default async function SkillAnalyticsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
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
    <div className="flex-1 bg-[#f8fbf8] dark:bg-[#132217] overflow-y-auto">
      <SkillAnalytics initialSkill={skill} />
    </div>
  );
}

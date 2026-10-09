import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SkillDetails } from "@/components/skills/skill-details";

export const metadata = {
  title: "Skill Details",
};

export default async function SkillPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
  });

  if (!skill || skill.userId !== user.id) {
    redirect("/skills");
  }

  return (
    <div className="flex-1 bg-[#f8fbf8] dark:bg-[#132217] overflow-y-auto">
      <SkillDetails initialSkill={skill} />
    </div>
  );
}

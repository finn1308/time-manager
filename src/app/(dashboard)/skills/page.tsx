import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SkillsDashboard } from "@/components/skills/skills-dashboard";

export const metadata = {
  title: "Skills Learning",
};

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const skills = await prisma.skill.findMany({
    where: { userId: user.id },
    include: {
      phases: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex-1 bg-[#f8fbf8] dark:bg-[#132217] overflow-y-auto">
      <SkillsDashboard initialSkills={skills} />
    </div>
  );
}

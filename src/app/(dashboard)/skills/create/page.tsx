import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateSkillForm } from "@/components/skills/create-skill-form";

export const metadata = {
  title: "Create Skill",
};

export default async function CreateSkillPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 bg-[var(--bg-muted)] overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
        <CreateSkillForm />
      </div>
    </div>
  );
}

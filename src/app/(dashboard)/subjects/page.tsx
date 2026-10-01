import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubjectTable } from "@/components/subjects/subject-table";
import { BookOpen } from "lucide-react";

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      goals: true,
      studySessions: true,
    },
    orderBy: { priority: "desc" },
  });

  const formattedSubjects = subjects.map((sub) => {
    const totalActualSeconds = sub.studySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
    const totalMinutes = Math.round(totalActualSeconds / 60);

    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      color: sub.color,
      description: sub.description,
      targetHours: sub.targetHours,
      completedHours: Math.round((totalActualSeconds / 3600) * 10) / 10,
      priority: sub.priority,
      studyGoals: sub.goals.map((g) => ({
        id: g.id,
        targetHours: g.targetHours,
        priority: sub.priority,
        isAutoAlloc: true,
        notes: g.description,
        startDate: g.createdAt.toISOString(),
        endDate: g.deadline ? g.deadline.toISOString() : "",
      })),
      totalLoggedMinutes: totalMinutes,
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
          <BookOpen className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Quản lý Môn học & Chỉ tiêu</span>
        </h1>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
          Thiết lập số giờ mục tiêu và mức độ ưu tiên để AI tự động phân bổ lịch học phù hợp.
        </p>
      </div>

      <SubjectTable subjects={formattedSubjects} />
    </div>
  );
}

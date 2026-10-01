import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/notion/page-header";
import { SubjectTable } from "@/components/subjects/subject-table";

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      studyGoals: true,
      studyLogs: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedSubjects = subjects.map((sub) => {
    const totalMinutes = sub.studyLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      color: sub.color,
      description: sub.description,
      studyGoals: sub.studyGoals.map((g) => ({
        id: g.id,
        targetHours: g.targetHours,
        priority: g.priority,
        isAutoAlloc: g.isAutoAlloc,
        notes: g.notes,
        startDate: g.startDate.toISOString(),
        endDate: g.endDate.toISOString(),
      })),
      totalLoggedMinutes: totalMinutes,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📚"
        title="Quản lý Môn học & Mục tiêu"
        description="Thiết lập chỉ tiêu số giờ cần học cho từng môn. Cho phép tự nhập mục tiêu thủ công hoặc kích hoạt AI tự động phân bổ đồng đều."
      />

      <SubjectTable subjects={formattedSubjects} />
    </div>
  );
}

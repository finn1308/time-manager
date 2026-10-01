import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/notion/page-header";
import { BlockedSlotsTable } from "@/components/blocked-slots/blocked-slots-table";

export default async function BlockedSlotsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const slots = await prisma.blockedSlot.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "asc" },
  });

  const formattedSlots = slots.map((s) => ({
    id: s.id,
    title: s.title,
    startTime: s.startTime,
    endTime: s.endTime,
    dayOfWeek: s.dayOfWeek,
    specificDate: s.specificDate ? s.specificDate.toISOString() : null,
    isRecurring: s.isRecurring,
    isLocked: s.isLocked,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🔒"
        title="Khung giờ bị khóa / Lịch bận cố định"
        description="Đăng ký các khoảng thời gian như Giờ ngủ đêm, Giờ học chính khóa hoặc Lịch tập thể thao. AI sẽ đọc danh sách này và tuyệt đối KHÔNG BAO GIỜ xếp lịch học đè vào."
      />

      <BlockedSlotsTable slots={formattedSlots} />
    </div>
  );
}

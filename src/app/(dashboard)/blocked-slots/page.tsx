import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BlockedSlotsTable } from "@/components/blocked-slots/blocked-slots-table";
import { Lock } from "lucide-react";

export default async function BlockedSlotsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rules = await prisma.availabilityRule.findMany({
    where: { userId: user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const formattedSlots = rules.map((r) => ({
    id: r.id,
    title: r.title,
    startTime: r.startTime,
    endTime: r.endTime,
    dayOfWeek: r.dayOfWeek,
    specificDate: null,
    isRecurring: true,
    isLocked: !r.isAvailable,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
          <Lock className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Khung giờ bị khóa / Giờ nghỉ ngơi (Availability Rules)</span>
        </h1>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
          Đăng ký các khoảng thời gian như Giờ ngủ đêm, Lịch học trường. AI và Scheduler tuyệt đối KHÔNG BAO GIỜ xếp lịch học đè vào.
        </p>
      </div>

      <BlockedSlotsTable slots={formattedSlots} />
    </div>
  );
}

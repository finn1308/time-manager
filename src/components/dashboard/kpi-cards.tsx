import React from "react";
import { Card, CardContent } from "../ui/card";
import { Clock, Target, Flame, TrendingUp } from "lucide-react";

interface KpiCardsProps {
  actualHours: number;
  plannedHours: number;
  completionRate: number;
  streakDays: number;
}

export function KpiCards({
  actualHours,
  plannedHours,
  completionRate,
  streakDays,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Thực tế đã học",
      value: `${actualHours.toFixed(1)} giờ`,
      description: "Được ghi nhận chính xác qua Timer",
      icon: Clock,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Kế hoạch đã lập",
      value: `${plannedHours.toFixed(1)} giờ`,
      description: "Tổng các buổi học trên Lịch tuần",
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: `${completionRate}%`,
      description: "So sánh Planned vs Actual",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      title: "Chuỗi học liên tục",
      value: `${streakDays} ngày`,
      description: "Duy trì kỷ luật học hằng ngày",
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card key={i} className="hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#787774] dark:text-[#9b9a97]">
                  {c.title}
                </span>
                <div className={`p-2 rounded-lg ${c.bg} ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold font-mono tracking-tight text-[#171717] dark:text-white">
                  {c.value}
                </div>
                <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
                  {c.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

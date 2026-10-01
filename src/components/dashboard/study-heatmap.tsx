import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { formatVN } from "@/lib/date-utils";

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  minutes: number;
}

interface StudyHeatmapProps {
  days: HeatmapDay[];
}

export function StudyHeatmap({ days }: StudyHeatmapProps) {
  const getColorClass = (minutes: number) => {
    if (minutes === 0) return "bg-[#f1f1ef] dark:bg-[#282828] border-transparent";
    if (minutes < 60) return "bg-emerald-200 dark:bg-emerald-950 border-emerald-300";
    if (minutes < 120) return "bg-emerald-300 dark:bg-emerald-800 border-emerald-400";
    if (minutes < 240) return "bg-emerald-500 dark:bg-emerald-600 border-emerald-600";
    return "bg-emerald-600 dark:bg-emerald-500 border-emerald-700";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu đồ nhiệt năng suất (Productivity Heatmap)</CardTitle>
        <CardDescription>
          Mức độ tập trung theo từng ngày trong tháng. Ô màu càng đậm tương ứng với thời lượng học càng nhiều.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-1.5 items-center">
          {days.map((d, i) => {
            const hours = (d.minutes / 60).toFixed(1);
            return (
              <div
                key={i}
                title={`${formatVN(d.date, "dd/MM/yyyy")}: ${hours} giờ học (${d.minutes} phút)`}
                className={`w-6 h-6 rounded-md border transition-all cursor-pointer hover:scale-110 ${getColorClass(
                  d.minutes
                )}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end space-x-2 text-[11px] text-[#787774] mt-4 pt-2 border-t border-[#e9e9e7] dark:border-[#2e2e2e]">
          <span>Ít</span>
          <div className="w-3 h-3 rounded bg-[#f1f1ef] dark:bg-[#282828]" />
          <div className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-950" />
          <div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-800" />
          <div className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-600" />
          <div className="w-3 h-3 rounded bg-emerald-600 dark:bg-emerald-500" />
          <span>Nhiều</span>
        </div>
      </CardContent>
    </Card>
  );
}

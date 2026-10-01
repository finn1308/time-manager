import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { formatVN } from "@/lib/date-utils";

interface HeatmapDay {
  date: string;
  minutes: number;
}

interface StudyHeatmapProps {
  days: HeatmapDay[];
}

export function StudyHeatmap({ days }: StudyHeatmapProps) {
  const getColorClass = (minutes: number) => {
    if (minutes === 0) return "bg-slate-100 dark:bg-slate-800 border-transparent";
    if (minutes < 60) return "bg-emerald-200 dark:bg-emerald-950 border-emerald-300";
    if (minutes < 120) return "bg-emerald-300 dark:bg-emerald-800 border-emerald-400";
    if (minutes < 240) return "bg-emerald-500 dark:bg-emerald-600 border-emerald-600 shadow-xs";
    return "bg-emerald-600 dark:bg-emerald-500 border-emerald-700 shadow-xs";
  };

  return (
    <Card className="rounded-[28px]">
      <CardHeader>
        <CardTitle className="text-base">Biểu đồ nhiệt năng suất (Productivity Heatmap)</CardTitle>
        <CardDescription>
          Mức độ tập trung theo từng ngày trong tháng. Ô màu càng đậm tương ứng với thời lượng học càng nhiều.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-wrap gap-2 items-center">
          {days.map((d, i) => {
            const hours = (d.minutes / 60).toFixed(1);
            return (
              <div
                key={i}
                title={`${formatVN(d.date, "dd/MM/yyyy")}: ${hours} giờ học (${d.minutes} phút)`}
                className={`w-7 h-7 rounded-[9px] border transition-all cursor-pointer hover:scale-115 ${getColorClass(
                  d.minutes
                )}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end space-x-2 text-[11px] font-semibold text-slate-500 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span>Ít</span>
          <div className="w-3.5 h-3.5 rounded-[5px] bg-slate-100 dark:bg-slate-800" />
          <div className="w-3.5 h-3.5 rounded-[5px] bg-emerald-200 dark:bg-emerald-950" />
          <div className="w-3.5 h-3.5 rounded-[5px] bg-emerald-300 dark:bg-emerald-800" />
          <div className="w-3.5 h-3.5 rounded-[5px] bg-emerald-500 dark:bg-emerald-600" />
          <div className="w-3.5 h-3.5 rounded-[5px] bg-emerald-600 dark:bg-emerald-500" />
          <span>Nhiều</span>
        </div>
      </CardContent>
    </Card>
  );
}

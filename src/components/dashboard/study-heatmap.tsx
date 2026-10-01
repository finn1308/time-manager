"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Clock, BookOpen, ChevronRight, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addDays,
} from "date-fns";
import { vi } from "date-fns/locale";

// Configurable constants for 5 activity levels
export const HEATMAP_CONFIG = {
  THRESHOLDS: {
    LEVEL_1_MAX: 30, // 0 - 30m
    LEVEL_2_MAX: 60, // 30 - 60m
    LEVEL_3_MAX: 120, // 60 - 120m
  },
  COLORS: {
    LEVEL_0: "bg-[#eef5f0] dark:bg-[#1a2f22] border-[#dbe7dd] dark:border-[#263d2e]",
    LEVEL_1: "bg-[#d8ebe0] dark:bg-[#21432f] border-[#b7d8c3] dark:border-[#2f5e43]",
    LEVEL_2: "bg-[#9cd1b1] dark:bg-[#2b583f] border-[#74c69d] dark:border-[#3c7857]",
    LEVEL_3: "bg-[#52b788] dark:bg-[#387654] border-[#40916c] text-white",
    LEVEL_4: "bg-[#2d6a4f] dark:bg-[#52b788] border-[#1b4332] text-white shadow-2xs",
  },
};

export function getHeatmapLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= HEATMAP_CONFIG.THRESHOLDS.LEVEL_1_MAX) return 1;
  if (minutes <= HEATMAP_CONFIG.THRESHOLDS.LEVEL_2_MAX) return 2;
  if (minutes <= HEATMAP_CONFIG.THRESHOLDS.LEVEL_3_MAX) return 3;
  return 4;
}

export function getHeatmapColorClass(minutes: number): string {
  const level = getHeatmapLevel(minutes);
  switch (level) {
    case 1:
      return HEATMAP_CONFIG.COLORS.LEVEL_1;
    case 2:
      return HEATMAP_CONFIG.COLORS.LEVEL_2;
    case 3:
      return HEATMAP_CONFIG.COLORS.LEVEL_3;
    case 4:
      return HEATMAP_CONFIG.COLORS.LEVEL_4;
    default:
      return HEATMAP_CONFIG.COLORS.LEVEL_0;
  }
}

interface HeatmapDayData {
  date: string;
  actualMinutes: number;
  plannedMinutes: number;
  sessionsCount: number;
  subjects: Array<{ id: string; name: string; color: string; minutes: number }>;
  sessions: Array<{
    id: string;
    title: string;
    subjectName: string;
    subjectColor: string;
    actualMinutes: number;
    startTime: string;
    endTime: string;
    notes: string | null;
  }>;
  completionPercent: number;
}

interface StudyHeatmapProps {
  days?: Array<{ date: string; minutes: number }>;
  initialDays?: Array<{ date: string; minutes: number }>;
  subjects?: Array<{ id: string; name: string; color: string }>;
}

export function StudyHeatmap({ initialDays = [], days = [], subjects = [] }: StudyHeatmapProps) {
  const [range, setRange] = useState<string>("12m");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [heatData, setHeatData] = useState<Record<string, HeatmapDayData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDayData | null>(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState<HeatmapDayData | null>(null);

  // Fetch aggregated data from server
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          range,
          ...(selectedSubjectId !== "all" ? { subjectId: selectedSubjectId } : {}),
        });
        const res = await fetch(`/api/heatmap?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to load heatmap data");
        const json = await res.json();
        if (isMounted) {
          const map: Record<string, HeatmapDayData> = {};
          for (const d of json.days || []) {
            map[d.date] = d;
          }
          setHeatData(map);
        }
      } catch (err) {
        console.error("Heatmap load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [range, selectedSubjectId]);

  // Generate calendar grid dates based on range
  const gridWeeks = useMemo(() => {
    const today = new Date();
    let numDays = 365;
    if (range === "3m") numDays = 90;
    if (range === "6m") numDays = 180;

    const start = startOfWeek(subDays(today, numDays), { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start, end });

    // Group into weeks of 7 days
    const weeks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    return weeks;
  }, [range]);

  // Compute month label positions
  const monthLabels = useMemo(() => {
    const labels: Array<{ monthName: string; weekIndex: number }> = [];
    let lastMonth = -1;

    gridWeeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const m = firstDay.getMonth();
        if (m !== lastMonth) {
          labels.push({
            monthName: format(firstDay, "MMM", { locale: vi }),
            weekIndex,
          });
          lastMonth = m;
        }
      }
    });

    return labels;
  }, [gridWeeks]);

  const formatHoursMins = (minutes: number) => {
    if (minutes <= 0) return "0 phút";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} phút`;
    if (m === 0) return `${h} giờ`;
    return `${h}h ${m}m`;
  };

  return (
    <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow overflow-hidden">
      {/* Header with Title and Filters */}
      <CardHeader className="p-6 pb-4 border-b border-[#dbe7dd]/60 dark:border-[#263d2e]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2d6a4f] dark:bg-[#52b788]" />
              <CardTitle className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Study Activity (Biểu đồ hoạt động học tập)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
              Phản ánh 100% thời gian học thực tế qua Study Timer. Nhấp vào bất kỳ ngày nào để xem chi tiết buổi học.
            </CardDescription>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Subject Filter */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-8 rounded-full border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] px-3 text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            {/* Time Range Filter */}
            <div className="inline-flex rounded-full p-0.5 bg-[#eef5f0] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e]">
              {[
                { label: "3 tháng", value: "3m" },
                { label: "6 tháng", value: "6m" },
                { label: "12 tháng", value: "12m" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setRange(btn.value)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                    range === btn.value
                      ? "bg-[#2d6a4f] text-white shadow-2xs"
                      : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-max">
            {/* Month Headers */}
            <div className="flex text-[10px] font-bold text-[#73927d] dark:text-[#8ba393] mb-2 pl-7 relative h-4">
              {monthLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  className="absolute uppercase tracking-wider"
                  style={{ left: `${lbl.weekIndex * 15 + 28}px` }}
                >
                  {lbl.monthName}
                </div>
              ))}
            </div>

            {/* Grid with Weekday Labels on Left */}
            <div className="flex space-x-1.5 items-start">
              {/* Day of Week Labels */}
              <div className="flex flex-col space-y-1 text-[9px] font-bold text-[#73927d] dark:text-[#8ba393] pt-0.5 pr-1 select-none">
                <span className="h-3 leading-3">T2</span>
                <span className="h-3 leading-3 opacity-0">T3</span>
                <span className="h-3 leading-3">T4</span>
                <span className="h-3 leading-3 opacity-0">T5</span>
                <span className="h-3 leading-3">T6</span>
                <span className="h-3 leading-3 opacity-0">T7</span>
                <span className="h-3 leading-3">CN</span>
              </div>

              {/* Columns of Weeks */}
              <div className="flex space-x-1">
                {gridWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col space-y-1">
                    {week.map((dayDate) => {
                      const dateStr = format(dayDate, "yyyy-MM-dd");
                      const dayInfo = heatData[dateStr];
                      const minutes = dayInfo?.actualMinutes || 0;
                      const colorClass = getHeatmapColorClass(minutes);

                      return (
                        <div
                          key={dateStr}
                          onClick={() => {
                            setSelectedDayDetail(
                              dayInfo || {
                                date: dateStr,
                                actualMinutes: 0,
                                plannedMinutes: 0,
                                sessionsCount: 0,
                                subjects: [],
                                sessions: [],
                                completionPercent: 0,
                              }
                            );
                          }}
                          onMouseEnter={() =>
                            setHoveredDay(
                              dayInfo || {
                                date: dateStr,
                                actualMinutes: 0,
                                plannedMinutes: 0,
                                sessionsCount: 0,
                                subjects: [],
                                sessions: [],
                                completionPercent: 0,
                              }
                            )
                          }
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-3 h-3 rounded-[3.5px] border cursor-pointer transition-transform hover:scale-135 hover:z-10 relative ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Tooltip / Status Display */}
        <div className="min-h-[28px] mt-4 flex items-center justify-between text-xs font-medium text-[#526b5c] dark:text-[#a3bda9] border-t border-[#dbe7dd]/60 dark:border-[#263d2e] pt-3">
          <div>
            {hoveredDay ? (
              <span className="flex items-center space-x-2">
                <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  {format(new Date(hoveredDay.date), "dd MMMM yyyy", { locale: vi })}:
                </span>
                <span>
                  {hoveredDay.actualMinutes > 0 ? (
                    <strong className="text-[#2d6a4f] dark:text-[#52b788]">
                      {formatHoursMins(hoveredDay.actualMinutes)} ({hoveredDay.sessionsCount} buổi học)
                    </strong>
                  ) : (
                    <span>0 phút học</span>
                  )}
                </span>
                {hoveredDay.subjects.length > 0 && (
                  <span className="text-[#73927d] dark:text-[#8ba393]">
                    • {hoveredDay.subjects.map((s) => s.name).join(", ")}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[#8ba393]">
                Di chuột vào ô để xem thông tin • Nhấp để mở chi tiết buổi học ngày đó
              </span>
            )}
          </div>

          {/* Legend: Ít -> Nhiều */}
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold shrink-0">
            <span>Ít</span>
            <div className={`w-3 h-3 rounded-[3px] border ${HEATMAP_CONFIG.COLORS.LEVEL_0}`} title="0 phút" />
            <div className={`w-3 h-3 rounded-[3px] border ${HEATMAP_CONFIG.COLORS.LEVEL_1}`} title="1 - 30 phút" />
            <div className={`w-3 h-3 rounded-[3px] border ${HEATMAP_CONFIG.COLORS.LEVEL_2}`} title="31 - 60 phút" />
            <div className={`w-3 h-3 rounded-[3px] border ${HEATMAP_CONFIG.COLORS.LEVEL_3}`} title="61 - 120 phút" />
            <div className={`w-3 h-3 rounded-[3px] border ${HEATMAP_CONFIG.COLORS.LEVEL_4}`} title="Trên 120 phút" />
            <span>Nhiều</span>
          </div>
        </div>
      </CardContent>

      {/* Day Intelligence Modal (Section 24 & 27) */}
      {selectedDayDetail && (
        <Dialog open={!!selectedDayDetail} onOpenChange={(open) => !open && setSelectedDayDetail(null)}>
          <DialogContent onClose={() => setSelectedDayDetail(null)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#2d6a4f] dark:text-[#52b788] mb-1">
                <Calendar className="w-4 h-4" />
                <span>Day Intelligence • Nhật ký chi tiết</span>
              </div>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                {format(new Date(selectedDayDetail.date), "EEEE, dd MMMM yyyy", { locale: vi })}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Thống kê chi tiết toàn bộ thời gian học và các phiên học tập trong ngày.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] text-center">
                  <div className="text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9] uppercase">
                    Thực tế học
                  </div>
                  <div className="text-base font-black text-[#2d6a4f] dark:text-[#52b788] mt-0.5">
                    {formatHoursMins(selectedDayDetail.actualMinutes)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] text-center">
                  <div className="text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9] uppercase">
                    Kế hoạch
                  </div>
                  <div className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2] mt-0.5">
                    {formatHoursMins(selectedDayDetail.plannedMinutes)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] text-center">
                  <div className="text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9] uppercase">
                    Hoàn thành
                  </div>
                  <div className="text-base font-bold text-[#2d6a4f] dark:text-[#52b788] mt-0.5">
                    {selectedDayDetail.completionPercent}%
                  </div>
                </div>
              </div>

              {/* Subject Breakdown */}
              {selectedDayDetail.subjects.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-2">
                    Phân bổ môn học trong ngày
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDayDetail.subjects.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#f4f8f5] dark:bg-[#142318]"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sub.color || "#2d6a4f" }}
                          />
                          <span className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">{sub.name}</span>
                        </div>
                        <span className="font-bold text-[#2d6a4f] dark:text-[#52b788]">
                          {formatHoursMins(sub.minutes)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions List */}
              <div>
                <h4 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-2 flex items-center justify-between">
                  <span>Danh sách phiên học ({selectedDayDetail.sessions.length})</span>
                </h4>
                {selectedDayDetail.sessions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedDayDetail.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-2.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fcfdfc] dark:bg-[#122015] text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[#192e22] dark:text-[#f0f7f2] truncate">{sess.title}</span>
                          <span className="font-bold text-[#2d6a4f] dark:text-[#52b788] shrink-0 ml-2">
                            {formatHoursMins(sess.actualMinutes)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {sess.startTime} - {sess.endTime}
                            </span>
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {sess.subjectName}
                          </Badge>
                        </div>
                        {sess.notes && (
                          <p className="text-[11px] text-[#73927d] dark:text-[#8ba393] italic mt-1 bg-white/60 dark:bg-black/20 p-1.5 rounded-lg">
                            "{sess.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[#526b5c] dark:text-[#a3bda9] border border-dashed border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl">
                    Chưa có phiên học nào được ghi nhận trong ngày này.
                  </div>
                )}
              </div>

              {/* View on Calendar Button */}
              <div className="pt-2 flex justify-end">
                <Link href={`/calendar?date=${selectedDayDetail.date}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-[#dbe7dd] text-[#2d6a4f] hover:bg-[#d8ebe0] font-semibold text-xs h-10 space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Xem ngày này trên Lịch học (Calendar)</span>
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

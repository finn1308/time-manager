"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/notion/page-header";
import { WeekView } from "@/components/calendar/week-view";
import { MonthView } from "@/components/calendar/month-view";
import { Calendar as CalendarIcon, Grid, ListFilter } from "lucide-react";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [events, setEvents] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resEvents, resSlots, resSubs] = await Promise.all([
          fetch("/api/calendar/events").then((r) => r.json()),
          fetch("/api/blocked-slots").then((r) => r.json()),
          fetch("/api/subjects").then((r) => r.json()),
        ]);

        if (resEvents.events) setEvents(resEvents.events);
        if (resSlots.slots) setBlockedSlots(resSlots.slots);
        if (resSubs.subjects) setSubjects(resSubs.subjects);
      } catch (err) {
        console.error("Failed to load calendar data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📅"
        title="Lịch học & Phân bổ thời gian"
        description="Theo dõi lịch học theo tuần và tháng với múi giờ Việt Nam. AI tự động đọc các khung giờ bận và tuyệt đối tránh va chạm."
        actions={
          <div className="flex items-center space-x-1 p-1 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] text-xs">
            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === "week"
                  ? "bg-[#2383e2] text-white shadow-xs"
                  : "text-[#787774] hover:text-[#171717] dark:hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Chế độ Tuần</span>
            </button>

            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === "month"
                  ? "bg-[#2383e2] text-white shadow-xs"
                  : "text-[#787774] hover:text-[#171717] dark:hover:text-white"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Chế độ Tháng</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-20 text-xs text-[#9b9a97]">
          Đang tải dữ liệu lịch học...
        </div>
      ) : (
        <>
          {viewMode === "week" ? (
            <WeekView initialEvents={events} blockedSlots={blockedSlots} subjects={subjects} />
          ) : (
            <MonthView initialEvents={events} subjects={subjects} />
          )}
        </>
      )}
    </div>
  );
}

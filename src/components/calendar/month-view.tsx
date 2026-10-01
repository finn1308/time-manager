"use client";

import React, { useState } from "react";
import { formatVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { EventModal } from "./event-modal";

interface MonthViewProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    eventType: string;
    isCompleted: boolean;
    subject: {
      id: string;
      name: string;
      code: string | null;
      color: string;
    } | null;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string;
  }>;
}

export function MonthView({ initialEvents, subjects }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const todayVN = toZonedTime(new Date(), VIETNAM_TIMEZONE);
  const dayNamesVN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const selectedDayEvents = initialEvents.filter((ev) =>
    isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), selectedDay)
  );

  return (
    <div className="flex flex-col space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-[#202020] p-3.5 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="text-xs font-semibold"
          >
            Tháng này
          </Button>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#787774] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#787774] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="font-semibold text-sm text-[#171717] dark:text-white px-2">
            {formatVN(currentMonth, "MMMM yyyy")}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEventModalOpen(true)}
          className="space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm sự kiện</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Month Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-[#202020] p-4 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e]">
          {/* Header Row */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-[#787774] dark:text-[#9b9a97]">
            {dayNamesVN.map((name, i) => (
              <div key={i} className="py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, index) => {
              const isCurrentMonth = isSameMonth(d, monthStart);
              const isToday = isSameDay(d, todayVN);
              const isSelected = isSameDay(d, selectedDay);

              const eventsOnDay = initialEvents.filter((ev) =>
                isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), d)
              );

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDay(d)}
                  className={`min-h-[75px] p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                      : isToday
                      ? "border-blue-300 dark:border-blue-700 bg-white dark:bg-[#222]"
                      : isCurrentMonth
                      ? "border-transparent hover:border-[#e9e9e7] dark:hover:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#1a1a1a]"
                      : "border-transparent opacity-40 bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday ? "bg-blue-600 text-white font-bold" : "text-[#37352f] dark:text-[#d4d4d4]"
                      }`}
                    >
                      {formatVN(d, "d")}
                    </span>
                    {eventsOnDay.length > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold">
                        {eventsOnDay.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event Pills */}
                  <div className="space-y-1">
                    {eventsOnDay.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate text-[9px] px-1 py-0.5 rounded font-medium text-white truncate"
                        style={{ backgroundColor: ev.subject?.color || "#3b82f6" }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {eventsOnDay.length > 2 && (
                      <div className="text-[9px] text-[#787774] pl-1 font-medium">
                        +{eventsOnDay.length - 2} buổi khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="bg-white dark:bg-[#202020] p-4 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] flex flex-col">
          <h3 className="font-semibold text-sm text-[#171717] dark:text-white pb-3 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
            Chi tiết ngày: {formatVN(selectedDay, "dd/MM/yyyy")}
          </h3>

          <div className="py-3 flex-1 overflow-y-auto space-y-2.5 max-h-96">
            {selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#1c1c1c] text-xs"
                style={{ borderLeftColor: ev.subject?.color || "#3b82f6", borderLeftWidth: "3px" }}
              >
                <div className="font-semibold text-[#171717] dark:text-white">{ev.title}</div>
                <div className="font-mono text-[10px] text-[#787774] mt-1">
                  {formatVN(ev.startTime, "HH:mm")} - {formatVN(ev.endTime, "HH:mm")}
                </div>
              </div>
            ))}

            {selectedDayEvents.length === 0 && (
              <p className="text-xs text-[#9b9a97] text-center py-8">
                Không có buổi học nào vào ngày này.
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEventModalOpen(true)}
            className="w-full mt-2"
          >
            Thêm buổi học cho ngày này
          </Button>
        </div>
      </div>

      {isEventModalOpen && (
        <EventModal
          open={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          subjects={subjects}
          defaultDate={selectedDay.toISOString().split("T")[0]}
        />
      )}
    </div>
  );
}

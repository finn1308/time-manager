"use client";

import React, { useState } from "react";
import { formatVN, getDateKeyVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { EventModal } from "./event-modal";

interface MonthViewProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    type?: string;
    isLocked?: boolean;
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
  onEventsChange?: () => void;
}

export function MonthView({ initialEvents = [], subjects = [], onEventsChange }: MonthViewProps) {
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

  const todayKeyVN = getDateKeyVN(new Date());
  const selectedDayKey = getDateKeyVN(selectedDay);
  const dayNamesVN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const selectedDayEvents = initialEvents.filter(
    (ev) => getDateKeyVN(ev.startTime) === selectedDayKey
  );

  return (
    <div className="flex flex-col space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-[#17261c] p-3.5 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
        <div className="flex items-center space-x-2">
          <Button
            variant="pill"
            size="sm"
            onClick={() => {
              const now = new Date();
              setCurrentMonth(now);
              setSelectedDay(now);
            }}
            className="text-xs font-bold"
          >
            Tháng này
          </Button>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2] px-2">
            Tháng {formatVN(currentMonth, "MM/yyyy")}
          </span>
        </div>

        <Button
          variant="pill"
          size="sm"
          onClick={() => setIsEventModalOpen(true)}
          className="space-x-1.5 font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm sự kiện</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Month Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-[#17261c] p-4 rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
          {/* Header Row */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-[#526b5c] dark:text-[#a3bda9]">
            {dayNamesVN.map((name, i) => (
              <div key={i} className="py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, index) => {
              const dKey = getDateKeyVN(d);
              const isCurrentMonth = isSameMonth(d, monthStart);
              const isToday = dKey === todayKeyVN;
              const isSelected = dKey === selectedDayKey;

              const eventsOnDay = initialEvents.filter(
                (ev) => getDateKeyVN(ev.startTime) === dKey
              );

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDay(d)}
                  className={`min-h-[85px] p-2 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#2d6a4f] bg-[#d8ebe0]/30 dark:bg-[#1d3827]/40 ring-1 ring-[#2d6a4f]"
                      : isToday
                      ? "border-[#52b788] bg-white dark:bg-[#142318]"
                      : isCurrentMonth
                      ? "border-transparent hover:border-[#dbe7dd] bg-[#f8fbf8] dark:bg-[#132217]"
                      : "border-transparent opacity-30 bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                        isToday
                          ? "bg-[#2d6a4f] text-white"
                          : "text-[#192e22] dark:text-[#f0f7f2]"
                      }`}
                    >
                      {formatVN(d, "d")}
                    </span>
                    {eventsOnDay.length > 0 && (
                      <span className="text-[10px] text-[#2d6a4f] dark:text-[#52b788] font-bold">
                        {eventsOnDay.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event Pills */}
                  <div className="space-y-1">
                    {eventsOnDay.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white truncate shadow-2xs"
                        style={{ backgroundColor: ev.subject?.color || "#2d6a4f" }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {eventsOnDay.length > 2 && (
                      <div className="text-[9px] text-[#526b5c] dark:text-[#a3bda9] pl-1 font-semibold">
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
        <div className="bg-white dark:bg-[#17261c] p-5 rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#192e22] dark:text-[#f0f7f2] pb-3 border-b border-[#dbe7dd]/80 dark:border-[#263d2e] flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Ngày: {formatVN(selectedDay, "EEEE, dd/MM/yyyy")}</span>
            </h3>

            <div className="py-3 overflow-y-auto space-y-2 max-h-96">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs"
                  style={{ borderLeftColor: ev.subject?.color || "#2d6a4f", borderLeftWidth: "4px" }}
                >
                  <div className="font-bold text-[#192e22] dark:text-[#f0f7f2]">{ev.title}</div>
                  <div className="font-mono text-[10px] text-[#73927d] mt-1">
                    {formatVN(new Date(ev.startTime), "HH:mm")} - {formatVN(new Date(ev.endTime), "HH:mm")}
                  </div>
                </div>
              ))}

              {selectedDayEvents.length === 0 && (
                <p className="text-xs text-[#8ba393] text-center py-10">
                  Không có buổi học nào vào ngày này.
                </p>
              )}
            </div>
          </div>

          <Button
            variant="pill"
            size="sm"
            onClick={() => setIsEventModalOpen(true)}
            className="w-full mt-3 font-semibold"
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
          defaultDate={selectedDayKey}
          onSuccess={onEventsChange}
        />
      )}
    </div>
  );
}

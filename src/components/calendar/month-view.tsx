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
import { ChevronLeft, ChevronRight, Plus, Calendar, Trash2, FolderOpen } from "lucide-react";
import { EventModal } from "./event-modal";
import { useRouter } from "next/navigation";
import { getEventTypeConfig } from "@/lib/calendar/event-types";

interface MonthViewProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    type?: string;
    isLocked?: boolean;
    recurrence?: string;
    recurrenceRule?: string | null;
    originalId?: string;
    resources?: any[];
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
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

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

  const handleQuickDelete = async (e: React.MouseEvent, ev: any) => {
    e.stopPropagation();
    const isRecurring = Boolean(ev.recurrence && ev.recurrence !== "NONE");
    if (isRecurring) {
      setEditingEvent(ev);
      setIsEventModalOpen(true);
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa lịch "${ev.title}" không?`)) return;

    try {
      const cleanId = ev.id.includes("_") ? ev.id.split("_")[0] : ev.id;
      const res = await fetch(`/api/calendar/events?id=${cleanId}&deleteMode=SINGLE`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa lịch");
      }
      if (onEventsChange) onEventsChange();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa lịch");
    }
  };

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
          onClick={() => {
            setEditingEvent(null);
            setIsEventModalOpen(true);
          }}
          className="space-x-1.5 font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo lịch mới</span>
        </Button>
      </div>

      {/* Grid Layout: Calendar + Side Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Month Matrix */}
        <div className="lg:col-span-3 bg-white dark:bg-[#17261c] p-4 rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
          {/* Day Name Header */}
          <div className="grid grid-cols-7 mb-2 border-b border-[#dbe7dd]/60 dark:border-[#263d2e] pb-2 text-center">
            {dayNamesVN.map((name) => (
              <div
                key={name}
                className="text-[11px] font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9]"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((d) => {
              const dKey = getDateKeyVN(d);
              const isSelected = dKey === selectedDayKey;
              const isToday = dKey === todayKeyVN;
              const isCurrentMonth = isSameMonth(d, currentMonth);

              // Events for this day
              const dayEvs = initialEvents.filter(
                (ev) => getDateKeyVN(ev.startTime) === dKey
              );

              return (
                <div
                  key={dKey}
                  onClick={() => setSelectedDay(d)}
                  className={`min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#52b788] bg-[#d8ebe0]/30 dark:bg-[#1d3827]/40 ring-2 ring-[#52b788]/20"
                      : isToday
                      ? "border-[#52b788]/60 bg-[#edf7f0]/40 dark:bg-[#16271c]"
                      : isCurrentMonth
                      ? "border-[#dbe7dd]/60 dark:border-[#263d2e]/80 hover:bg-[#f6faf7] dark:hover:bg-[#1a2d21]"
                      : "border-transparent opacity-40 bg-gray-50/50 dark:bg-black/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        isToday
                          ? "bg-[#2d6a4f] text-white"
                          : "text-[#192e22] dark:text-[#f0f7f2]"
                      }`}
                    >
                      {formatVN(d, "d")}
                    </span>

                    {dayEvs.length > 0 && (
                      <span className="text-[10px] font-mono font-semibold px-1 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#203c2a] dark:text-[#a3bda9]">
                        {dayEvs.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event Pills Preview */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvs.slice(0, 2).map((ev) => {
                      const typeCfg = getEventTypeConfig(ev.type);
                      return (
                        <div
                          key={ev.id}
                          className="truncate text-[9px] font-medium px-1.5 py-0.5 rounded-md border border-[#dbe7dd]/80 dark:border-[#263d2e]"
                          style={{
                            backgroundColor: typeCfg.badgeBg,
                            color: typeCfg.badgeText,
                          }}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvs.length > 2 && (
                      <div className="text-[8px] text-[#73927d] pl-1">
                        +{dayEvs.length - 2} buổi khác
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
              {selectedDayEvents.map((ev) => {
                const typeCfg = getEventTypeConfig(ev.type);
                const TypeIcon = typeCfg.icon;
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setEditingEvent(ev);
                      setIsEventModalOpen(true);
                    }}
                    className="p-3 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs hover:border-[#52b788] transition-all cursor-pointer group"
                    style={{ borderLeftColor: typeCfg.borderLeftColor || ev.subject?.color || "#2d6a4f", borderLeftWidth: "4px" }}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span
                        className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md"
                        style={{ backgroundColor: typeCfg.badgeBg, color: typeCfg.badgeText }}
                      >
                        <TypeIcon className="w-2.5 h-2.5 shrink-0" />
                        <span>{typeCfg.label}</span>
                      </span>
                      {ev.subject && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded-md text-white"
                          style={{ backgroundColor: ev.subject.color || "#2d6a4f" }}
                        >
                          {ev.subject.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-[#192e22] dark:text-[#f0f7f2] flex-1">
                        {ev.title}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleQuickDelete(e, ev)}
                        title="Xóa lịch này"
                        className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-rose-600 p-1 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-[#73927d] mt-1">
                      {formatVN(new Date(ev.startTime), "HH:mm")} - {formatVN(new Date(ev.endTime), "HH:mm")}
                    </div>
                  </div>
                );
              })}

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
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="w-full mt-3 font-semibold"
          >
            Thêm buổi học cho ngày này
          </Button>
        </div>
      </div>

      {isEventModalOpen && (
        <EventModal
          open={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          subjects={subjects}
          defaultDate={selectedDayKey}
          editingEvent={editingEvent}
          onSuccess={onEventsChange}
        />
      )}
    </div>
  );
}

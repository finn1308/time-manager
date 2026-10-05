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
import { ChevronLeft, ChevronRight, Plus, Calendar, Trash2, FolderOpen, MapPin, CheckCircle2, Clock } from "lucide-react";
import { EventModal } from "./event-modal";
import { useRouter } from "next/navigation";
import { getEventTypeConfig } from "@/lib/calendar/event-types";
import { EventCompleteCheckbox } from "./event-complete-checkbox";
import { EventQuickModal } from "./event-quick-modal";
import { formatMinutesVN } from "@/lib/date-utils";

interface MonthViewProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    location?: string | null;
    startTime: string;
    endTime: string;
    type?: string;
    isLocked?: boolean;
    recurrence?: string;
    recurrenceRule?: string | null;
    originalId?: string;
    completed?: boolean;
    completedAt?: string | null;
    actualDurationMinutes?: number | null;
    plannedDurationMinutes?: number | null;
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
  const [selectedQuickEvent, setSelectedQuickEvent] = useState<any | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Calculate Monthly Study Progress
  const monthStartKey = getDateKeyVN(monthStart);
  const monthEndKey = getDateKeyVN(monthEnd);

  const currentMonthEvents = initialEvents.filter((ev) => {
    const dKey = getDateKeyVN(ev.startTime);
    return dKey >= monthStartKey && dKey <= monthEndKey;
  });

  const monthPlannedMins = currentMonthEvents
    .filter((ev) => ev.subject && (ev.type === "SELF_STUDY" || ev.type === "STUDY"))
    .reduce((acc, ev) => {
      const p = ev.plannedDurationMinutes || Math.max(1, Math.round((new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000));
      return acc + p;
    }, 0);

  const monthActualMins = currentMonthEvents
    .filter((ev) => ev.subject && ev.completed)
    .reduce((acc, ev) => {
      const p = ev.plannedDurationMinutes || Math.max(1, Math.round((new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000));
      return acc + (ev.actualDurationMinutes ?? p);
    }, 0);

  const monthProgressPct = monthPlannedMins > 0 ? Math.min(100, Math.round((monthActualMins / monthPlannedMins) * 100)) : (monthActualMins > 0 ? 100 : 0);

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
      <div className="flex items-center justify-between bg-white dark:bg-[#17261c] p-3.5 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
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
          <span className="font-bold text-xs sm:text-sm text-[#192e22] dark:text-[#f0f7f2] px-1 sm:px-2">
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
        <div className="lg:col-span-3 bg-white dark:bg-[#17261c] p-3 sm:p-4 rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
          {/* Day Name Header */}
          <div className="grid grid-cols-7 mb-2 border-b border-[#dbe7dd]/60 dark:border-[#263d2e] pb-2 text-center">
            {dayNamesVN.map((name) => (
              <div
                key={name}
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9]"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
                  className={`min-h-[52px] sm:min-h-[90px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
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
                      className={`text-[11px] sm:text-xs font-bold inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full ${
                        isToday
                          ? "bg-[#2d6a4f] text-white"
                          : "text-[#192e22] dark:text-[#f0f7f2]"
                      }`}
                    >
                      {formatVN(d, "d")}
                    </span>

                    {dayEvs.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-1 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#203c2a] dark:text-[#a3bda9]">
                        {dayEvs.length}
                      </span>
                    )}
                  </div>

                  {/* Event Indicators: Dots on mobile, pills on sm+ */}
                  <div className="mt-1">
                    {/* Mobile Dots */}
                    <div className="flex sm:hidden items-center justify-center gap-0.5 flex-wrap">
                      {dayEvs.slice(0, 3).map((ev) => {
                        const typeCfg = getEventTypeConfig(ev.type);
                        return (
                          <span
                            key={ev.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: typeCfg.badgeText || "#2d6a4f" }}
                          />
                        );
                      })}
                      {dayEvs.length > 3 && (
                        <span className="text-[7px] text-[#73927d] leading-none">+</span>
                      )}
                    </div>

                    {/* Desktop / Tablet Pills */}
                    <div className="hidden sm:block space-y-1 overflow-hidden">
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
                    onClick={() => setSelectedQuickEvent(ev)}
                    className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer group ${
                      ev.completed
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-2xs"
                        : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#52b788]"
                    }`}
                    style={{ borderLeftColor: typeCfg.borderLeftColor || ev.subject?.color || "#2d6a4f", borderLeftWidth: "4px" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md"
                          style={{ backgroundColor: typeCfg.badgeBg, color: typeCfg.badgeText }}
                        >
                          <TypeIcon className="w-2.5 h-2.5 shrink-0" />
                          <span>{typeCfg.shortLabel || typeCfg.label}</span>
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

                      <div className="flex items-center space-x-1 shrink-0">
                        <EventCompleteCheckbox
                          eventId={ev.id}
                          isCompleted={Boolean(ev.completed)}
                          actualDurationMinutes={ev.actualDurationMinutes}
                          plannedDurationMinutes={ev.plannedDurationMinutes}
                          size="sm"
                          onToggled={() => {
                            if (onEventsChange) onEventsChange();
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleQuickDelete(e, ev)}
                          title="Xóa lịch này"
                          className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-rose-600 p-1 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Completed Tag if completed */}
                    {ev.completed && (
                      <div className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Đã học {formatMinutesVN(ev.actualDurationMinutes || Math.max(1, Math.round((new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000)))}</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="font-bold text-[#192e22] dark:text-[#f0f7f2] flex-1">
                        {ev.title}
                      </div>
                    </div>

                    {(ev as any).location && (
                      <div className="flex items-center space-x-1 text-[10px] text-[#526b5c] dark:text-[#a3bda9] mt-1 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-[#2d6a4f] dark:text-[#52b788]" />
                        <span className="truncate">{(ev as any).location}</span>
                      </div>
                    )}

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

      {/* Monthly Planned vs Actual Statistics Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs text-xs">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
          <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Tiến độ học trong tháng ({formatVN(currentMonth, "MM/yyyy")}):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <span className="text-[#526b5c] dark:text-[#a3bda9]">Kế hoạch: </span>
            <strong className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
              {formatMinutesVN(monthPlannedMins)}
            </strong>
          </div>
          <span className="text-[#dbe7dd] dark:text-[#263d2e]">•</span>
          <div>
            <span className="text-[#526b5c] dark:text-[#a3bda9]">Đã học thực tế: </span>
            <strong className="font-bold text-[#2d6a4f] dark:text-[#52b788]">
              {formatMinutesVN(monthActualMins)}
            </strong>
          </div>
          <span className="text-[#dbe7dd] dark:text-[#263d2e]">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[#526b5c] dark:text-[#a3bda9]">Đạt: </span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1f3828] dark:text-[#74c69d]">
              {monthProgressPct}%
            </span>
          </div>
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

      {/* Quick Action Modal on Event Click */}
      {selectedQuickEvent && (
        <EventQuickModal
          open={!!selectedQuickEvent}
          event={selectedQuickEvent}
          onClose={() => setSelectedQuickEvent(null)}
          onOpenEditModal={(evToEdit) => {
            setEditingEvent({
              ...evToEdit,
              originalId: evToEdit.originalId || evToEdit.id,
            });
            setIsEventModalOpen(true);
          }}
          onDeleted={() => {
            if (onEventsChange) onEventsChange();
          }}
          onUpdated={() => {
            if (onEventsChange) onEventsChange();
          }}
        />
      )}
    </div>
  );
}

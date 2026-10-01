"use client";

import React, { useState } from "react";
import { formatVN, getWeekDaysInVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { addWeeks, subWeeks, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Plus, Lock, Play, CheckCircle } from "lucide-react";
import { EventModal } from "./event-modal";
import { AiSchedulePreviewModal } from "./ai-schedule-preview-modal";
import { usePipTimer } from "../timer/pip-timer-provider";

interface WeekViewProps {
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
  blockedSlots: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number | null;
    specificDate: string | null;
    isLocked: boolean;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string;
  }>;
}

export function WeekView({ initialEvents, blockedSlots, subjects }: WeekViewProps) {
  const [currentWeekRef, setCurrentWeekRef] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const { startTimer } = usePipTimer();

  const weekDays = getWeekDaysInVN(currentWeekRef);
  const todayVN = toZonedTime(new Date(), VIETNAM_TIMEZONE);

  const dayNamesVN = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

  return (
    <div className="flex flex-col space-y-4">
      {/* Calendar Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#202020] p-3.5 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekRef(new Date())}
            className="text-xs font-semibold"
          >
            Hôm nay
          </Button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentWeekRef(subWeeks(currentWeekRef, 1))}
              className="p-1.5 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#787774] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekRef(addWeeks(currentWeekRef, 1))}
              className="p-1.5 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#787774] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-semibold text-sm text-[#171717] dark:text-white px-2">
            Tuần: {formatVN(weekDays[0], "dd/MM")} - {formatVN(weekDays[6], "dd/MM/yyyy")}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white space-x-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tự động lập lịch</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sự kiện</span>
          </Button>
        </div>
      </div>

      {/* Week Grid (7 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day, dayIndex) => {
          const isToday = isSameDay(day, todayVN);
          const dayOfWeekNumber = (dayIndex + 1) % 7; // 1 (Mon) -> 6 (Sat), 0 (Sun)

          // Events on this day
          const dayEvents = initialEvents.filter((ev) =>
            isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), day)
          );

          // Blocked slots applying to this day
          const dayBlockedSlots = blockedSlots.filter((bs) => {
            if (bs.dayOfWeek !== null && bs.dayOfWeek !== undefined) {
              return bs.dayOfWeek === dayOfWeekNumber;
            }
            if (bs.specificDate) {
              return isSameDay(toZonedTime(new Date(bs.specificDate), VIETNAM_TIMEZONE), day);
            }
            return false;
          });

          return (
            <div
              key={dayIndex}
              className={`flex flex-col rounded-xl border transition-all ${
                isToday
                  ? "border-blue-400 dark:border-blue-600 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs"
                  : "border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020]"
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b text-center ${
                  isToday
                    ? "border-blue-200 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-950/30"
                    : "border-[#e9e9e7] dark:border-[#2e2e2e]"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#787774] dark:text-[#9b9a97]">
                  {dayNamesVN[dayIndex]}
                </p>
                <div
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-1 ${
                    isToday
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-[#37352f] dark:text-[#f0f0f0]"
                  }`}
                >
                  {formatVN(day, "d")}
                </div>
              </div>

              {/* Day Body: Events & Blocked Slots */}
              <div className="p-2 space-y-2 flex-1 min-h-[360px]">
                {/* Blocked Slots (Locked) */}
                {dayBlockedSlots.map((bs) => (
                  <div
                    key={bs.id}
                    className="p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 blocked-slot-pattern text-xs select-none"
                  >
                    <div className="flex items-center justify-between text-[#787774] dark:text-[#a0a0a0]">
                      <div className="flex items-center space-x-1.5 truncate">
                        <Lock className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-500" />
                        <span className="font-medium truncate">{bs.title}</span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-[#9b9a97] mt-0.5">
                      {bs.startTime} - {bs.endTime} (Khóa)
                    </p>
                  </div>
                ))}

                {/* Study Events */}
                {dayEvents.map((ev) => {
                  const subjectColor = ev.subject?.color || "#3b82f6";
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setEditingEvent({
                          id: ev.id,
                          title: ev.title,
                          description: ev.description,
                          subjectId: ev.subject?.id || null,
                          startTime: ev.startTime,
                          endTime: ev.endTime,
                          eventType: ev.eventType,
                        });
                        setIsEventModalOpen(true);
                      }}
                      className="group relative p-2.5 rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer text-xs"
                      style={{ borderLeftColor: subjectColor, borderLeftWidth: "4px" }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-[#171717] dark:text-white line-clamp-2">
                          {ev.title}
                        </span>
                        {ev.isCompleted && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#e9e9e7]/60 dark:border-[#2e2e2e]/60">
                        <span className="font-mono text-[10px] text-[#787774] dark:text-[#9b9a97]">
                          {formatVN(ev.startTime, "HH:mm")} - {formatVN(ev.endTime, "HH:mm")}
                        </span>

                        {ev.subject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startTimer(
                                {
                                  id: ev.subject!.id,
                                  name: ev.subject!.name,
                                  code: ev.subject!.code,
                                  color: ev.subject!.color,
                                },
                                ev.id
                              );
                            }}
                            title="Bắt đầu học ngay môn này"
                            className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer transition-colors"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {dayEvents.length === 0 && dayBlockedSlots.length === 0 && (
                  <div className="text-center py-10 text-[11px] text-[#9b9a97]">
                    Trống lịch
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {isEventModalOpen && (
        <EventModal
          open={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          subjects={subjects}
          editingEvent={editingEvent}
        />
      )}

      {isAiModalOpen && (
        <AiSchedulePreviewModal
          open={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          subjects={subjects}
        />
      )}
    </div>
  );
}

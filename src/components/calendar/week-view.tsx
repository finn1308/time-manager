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
      {/* Calendar Navigation Bar (Rounded-2xl pill bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200/80 dark:border-slate-800 soft-card-shadow">
        <div className="flex items-center space-x-2.5">
          <Button
            variant="pill"
            size="sm"
            onClick={() => setCurrentWeekRef(new Date())}
            className="text-xs font-bold"
          >
            Hôm nay
          </Button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentWeekRef(subWeeks(currentWeekRef, 1))}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekRef(addWeeks(currentWeekRef, 1))}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-bold text-sm text-slate-900 dark:text-white px-2">
            Tuần: {formatVN(weekDays[0], "dd/MM")} - {formatVN(weekDays[6], "dd/MM/yyyy")}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="amber"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tự động lập lịch</span>
          </Button>

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
            <span>Thêm sự kiện</span>
          </Button>
        </div>
      </div>

      {/* Week Grid (7 columns with rounded-[24px] cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
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
              className={`flex flex-col rounded-[24px] border transition-all soft-card-shadow ${
                isToday
                  ? "border-blue-400 dark:border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-400/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3.5 border-b text-center rounded-t-[24px] ${
                  isToday
                    ? "border-blue-200 dark:border-blue-800/60 bg-blue-100/50 dark:bg-blue-950/40"
                    : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {dayNamesVN[dayIndex]}
                </p>
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black mt-1 ${
                    isToday
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-800 dark:text-white"
                  }`}
                >
                  {formatVN(day, "d")}
                </div>
              </div>

              {/* Day Body: Events & Blocked Slots */}
              <div className="p-2.5 space-y-2.5 flex-1 min-h-[360px]">
                {/* Blocked Slots (Locked) */}
                {dayBlockedSlots.map((bs) => (
                  <div
                    key={bs.id}
                    className="p-2.5 rounded-[16px] border border-dashed border-slate-300 dark:border-slate-700 blocked-slot-pattern text-xs select-none"
                  >
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <div className="flex items-center space-x-1.5 truncate">
                        <Lock className="w-3 h-3 shrink-0 text-amber-500" />
                        <span className="font-bold truncate">{bs.title}</span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
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
                      className="group relative p-3 rounded-[16px] border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer text-xs"
                      style={{ borderLeftColor: subjectColor, borderLeftWidth: "4px" }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-2">
                          {ev.title}
                        </span>
                        {ev.isCompleted && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="font-mono text-[10px] font-medium text-slate-500">
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
                            className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Play className="w-2.5 h-2.5 fill-current ml-0.2" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {dayEvents.length === 0 && dayBlockedSlots.length === 0 && (
                  <div className="text-center py-12 text-[11px] text-slate-400 font-medium">
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

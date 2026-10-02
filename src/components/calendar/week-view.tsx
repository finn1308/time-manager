"use client";

import React, { useState } from "react";
import {
  formatVN,
  getWeekDaysDetailedVN,
  getDateKeyVN,
  makeVNDate,
  VIETNAM_TIMEZONE,
} from "@/lib/date-utils";
import { addWeeks, subWeeks } from "date-fns";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Plus, Lock, Play } from "lucide-react";
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
    type?: string;
    isLocked?: boolean;
    isAiGenerated?: boolean;
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
    isAvailable?: boolean;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string;
  }>;
  onEventsChange?: () => void;
}

export function WeekView({
  initialEvents = [],
  blockedSlots = [],
  subjects = [],
  onEventsChange,
}: WeekViewProps) {
  const [currentWeekRef, setCurrentWeekRef] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(getDateKeyVN(new Date()));
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const { startTimer } = usePipTimer();

  const weekDays = getWeekDaysDetailedVN(currentWeekRef);

  // Drag and drop handlers to move events between days
  const handleDragStart = (e: React.DragEvent, eventItem: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(eventItem));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnDay = async (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const eventItem = JSON.parse(raw);

      // Keep exact hour and minute in Vietnam timezone, only change calendar date
      const startHM = formatVN(eventItem.startTime, "HH:mm");
      const endHM = formatVN(eventItem.endTime, "HH:mm");
      const newStart = makeVNDate(targetDateKey, startHM);
      const newEnd = makeVNDate(targetDateKey, endHM);

      const res = await fetch("/api/calendar/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventItem.id,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Không thể di chuyển lịch");
        return;
      }

      if (onEventsChange) onEventsChange();
    } catch (err: any) {
      console.error("Drop error:", err);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Calendar Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#17261c] p-4 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
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
              className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekRef(addWeeks(currentWeekRef, 1))}
              className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2] px-2">
            Tuần: {weekDays[0].dayOfMonth}/{weekDays[0].monthStr} – {weekDays[6].dayOfMonth}/{weekDays[6].monthStr}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl space-x-1.5 shadow-2xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tự động lập lịch</span>
          </Button>

          <Button
            variant="pill"
            size="sm"
            onClick={() => {
              setEditingEvent(null);
              setModalDefaultDate(getDateKeyVN(new Date()));
              setIsEventModalOpen(true);
            }}
            className="space-x-1.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sự kiện</span>
          </Button>
        </div>
      </div>

      {/* Week Grid (7 columns: Thứ 2 -> Chủ Nhật strictly aligned to Vietnam timezone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
        {weekDays.map((day) => {
          // Strictly match events by Vietnam calendar date key
          const dayEvents = initialEvents.filter(
            (ev) => getDateKeyVN(ev.startTime) === day.dateKey
          );

          // Blocked slots matching dayOfWeek (0 = Sun, 1 = Mon ... 6 = Sat)
          const dayBlockedSlots = blockedSlots.filter((bs) => {
            if (bs.dayOfWeek !== null && bs.dayOfWeek !== undefined) {
              return bs.dayOfWeek === day.dayOfWeek;
            }
            return false;
          });

          return (
            <div
              key={day.dateKey}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnDay(e, day.dateKey)}
              className={`flex flex-col rounded-[24px] border transition-all soft-card-shadow ${
                day.isToday
                  ? "border-[#52b788] bg-[#d8ebe0]/20 dark:bg-[#1d3827]/20 ring-2 ring-[#52b788]/20"
                  : "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]"
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b text-center rounded-t-[24px] relative ${
                  day.isToday
                    ? "border-[#b7d8c3] bg-[#d8ebe0]/50 dark:bg-[#1d3827]/40"
                    : "border-[#dbe7dd]/80 dark:border-[#263d2e]"
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9]">
                    {day.dayName}
                  </span>
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setModalDefaultDate(day.dateKey);
                      setIsEventModalOpen(true);
                    }}
                    title={`Thêm lịch cho ${day.dayName}`}
                    className="p-1 rounded-full text-[#73927d] hover:text-[#1b4332] hover:bg-[#d8ebe0] cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mt-1 ${
                    day.isToday
                      ? "bg-[#2d6a4f] text-white shadow-2xs"
                      : "text-[#192e22] dark:text-[#f0f7f2]"
                  }`}
                >
                  {day.dayOfMonth}
                </div>
              </div>

              {/* Day Body: Events & Blocked Slots */}
              <div className="p-2.5 space-y-2 flex-1 min-h-[360px]">
                {/* Blocked Slots (Locked) */}
                {dayBlockedSlots.map((bs) => (
                  <div
                    key={bs.id}
                    className="p-2 rounded-[14px] border border-dashed border-[#dbe7dd] dark:border-[#263d2e] blocked-slot-pattern text-xs select-none"
                  >
                    <div className="flex items-center space-x-1.5 text-[#526b5c] dark:text-[#a3bda9]">
                      <Lock className="w-3 h-3 shrink-0 text-[#a3a86c]" />
                      <span className="font-bold truncate text-[11px]">{bs.title}</span>
                    </div>
                    <p className="font-mono text-[10px] text-[#73927d] mt-0.5">
                      {bs.startTime} - {bs.endTime} (Khóa)
                    </p>
                  </div>
                ))}

                {/* Study Events */}
                {dayEvents.map((ev) => {
                  const subjectColor = ev.subject?.color || "#2d6a4f";
                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev)}
                      onClick={() => {
                        setEditingEvent({
                          id: ev.id,
                          title: ev.title,
                          description: ev.description,
                          subjectId: ev.subject?.id || null,
                          startTime: ev.startTime,
                          endTime: ev.endTime,
                          type: ev.type,
                          isLocked: ev.isLocked,
                        });
                        setIsEventModalOpen(true);
                      }}
                      className="group relative p-2.5 rounded-[16px] border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882] hover:shadow-2xs transition-all cursor-pointer text-xs"
                      style={{ borderLeftColor: subjectColor, borderLeftWidth: "4px" }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] line-clamp-2 text-[11px]">
                          {ev.title}
                        </span>
                        {ev.isLocked && (
                          <Lock className="w-3 h-3 text-[#a3a86c] shrink-0 ml-1" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#dbe7dd]/60 dark:border-[#263d2e]">
                        <span className="font-mono text-[10px] font-medium text-[#73927d]">
                          {formatVN(new Date(ev.startTime), "HH:mm")} - {formatVN(new Date(ev.endTime), "HH:mm")}
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
                            className="p-1 rounded-full bg-[#d8ebe0] text-[#1b4332] hover:bg-[#b7d8c3] cursor-pointer transition-colors shadow-2xs"
                          >
                            <Play className="w-2.5 h-2.5 fill-current ml-0.2" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {dayEvents.length === 0 && dayBlockedSlots.length === 0 && (
                  <div className="text-center py-12 text-[11px] text-[#8ba393] font-medium">
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
          defaultDate={modalDefaultDate}
          editingEvent={editingEvent}
          onSuccess={onEventsChange}
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

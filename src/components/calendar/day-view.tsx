"use client";

import React, { useState } from "react";
import { formatVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { addDays, subDays, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, Plus, Lock, Play, CheckCircle, Clock } from "lucide-react";
import { EventModal } from "./event-modal";
import { usePipTimer } from "../timer/pip-timer-provider";

interface DayViewProps {
  initialEvents: any[];
  blockedSlots: any[];
  subjects: any[];
}

export function DayView({ initialEvents = [], blockedSlots = [], subjects = [] }: DayViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const { startTimer } = usePipTimer();

  const todayVN = toZonedTime(new Date(), VIETNAM_TIMEZONE);
  const currentDayVN = toZonedTime(currentDate, VIETNAM_TIMEZONE);
  const dayOfWeekNumber = (currentDate.getDay() + 6) % 7; // Monday = 1, etc.

  // Events on this specific day
  const dayEvents = initialEvents.filter((ev) =>
    isSameDay(toZonedTime(new Date(ev.startTime), VIETNAM_TIMEZONE), currentDate)
  );

  // Blocked slots applying to this day
  const dayBlockedSlots = blockedSlots.filter((bs) => {
    if (bs.dayOfWeek !== null && bs.dayOfWeek !== undefined) {
      return bs.dayOfWeek === dayOfWeekNumber;
    }
    return false;
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#17261c] p-4 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
        <div className="flex items-center space-x-2.5">
          <Button
            variant="pill"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-bold"
          >
            Hôm nay
          </Button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 1))}
              className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
              className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2] px-2">
            {formatVN(currentDate, "EEEE, dd/MM/yyyy")}
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
          <span>Thêm sự kiện ngày này</span>
        </Button>
      </div>

      {/* Main Day Content */}
      <div className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 soft-card-shadow space-y-4">
        <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Lịch trình chi tiết trong ngày ({dayEvents.length} buổi học, {dayBlockedSlots.length} khung giờ bận)</span>
        </h3>

        {/* Blocked slots */}
        {dayBlockedSlots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#a3a86c]">
              Khung giờ bị khóa / Nghỉ ngơi:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dayBlockedSlots.map((bs) => (
                <div
                  key={bs.id}
                  className="p-3 rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e] blocked-slot-pattern text-xs select-none"
                >
                  <div className="flex items-center space-x-1.5 font-bold text-[#526b5c] dark:text-[#a3bda9]">
                    <Lock className="w-3.5 h-3.5 text-[#a3a86c]" />
                    <span>{bs.title}</span>
                  </div>
                  <p className="font-mono text-[11px] text-[#73927d] mt-1">
                    {bs.startTime} - {bs.endTime} (AI tuyệt đối tránh khung giờ này)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Events */}
        <div className="space-y-3 pt-2">
          {dayEvents.map((ev) => {
            const subjectColor = ev.subject?.color || "#2d6a4f";
            return (
              <div
                key={ev.id}
                onClick={() => {
                  setEditingEvent(ev);
                  setIsEventModalOpen(true);
                }}
                className="p-4 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderLeftColor: subjectColor, borderLeftWidth: "4px" }}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                      {ev.title}
                    </span>
                    {ev.isLocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#edf0dc] text-[#595e2b]">
                        Đã khóa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
                    {ev.subject && (
                      <span className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                        {ev.subject.name}
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-mono font-medium">
                      {formatVN(ev.startTime, "HH:mm")} - {formatVN(ev.endTime, "HH:mm")}
                    </span>
                  </div>
                </div>

                {ev.subject && (
                  <Button
                    size="sm"
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
                    className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl text-xs space-x-1 font-semibold self-end sm:self-center"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Bắt đầu học</span>
                  </Button>
                )}
              </div>
            );
          })}

          {dayEvents.length === 0 && (
            <div className="text-center py-12 text-xs text-[#526b5c] dark:text-[#a3bda9] bg-[#f8fbf8] dark:bg-[#142318] rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e]">
              Không có sự kiện hoặc lịch học nào trong ngày này.
            </div>
          )}
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
          editingEvent={editingEvent}
        />
      )}
    </div>
  );
}

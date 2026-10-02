"use client";

import React, { useState } from "react";
import {
  formatVN,
  getDateKeyVN,
  getDayNameVN,
  getDayOfWeekVN,
  makeVNDate,
  DAY_PERIODS,
  PeriodKey,
  calculateEventPeriodAllocation,
  formatMinutesVN,
  formatHoursVN,
  VIETNAM_TIMEZONE,
} from "@/lib/date-utils";
import { addDays, subDays, parseISO } from "date-fns";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Play,
  Pause,
  Square,
  Clock,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { EventModal } from "./event-modal";
import { usePipTimer } from "../timer/pip-timer-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { getEventTypeConfig, canStartStudyTimer, isSelfStudyEvent, isSchoolEvent, isPersonalEvent } from "@/lib/calendar/event-types";

interface DayViewProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    location?: string | null;
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
    studySessions?: Array<{
      id: string;
      actualDurationSeconds: number;
    }>;
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

export function DayView({
  initialEvents = [],
  blockedSlots = [],
  subjects = [],
  onEventsChange,
}: DayViewProps) {
  const [currentDateKey, setCurrentDateKey] = useState<string>(getDateKeyVN(new Date()));
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [modalDefaultStartTime, setModalDefaultStartTime] = useState<string>("08:00");
  const [modalDefaultEndTime, setModalDefaultEndTime] = useState<string>("09:30");

  // Session detail modal state (Requirement 12)
  const [selectedSessionEvent, setSelectedSessionEvent] = useState<any | null>(null);

  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    isRunning,
    isPaused,
    scheduleEventId,
    secondsElapsed,
    formatTime,
  } = usePipTimer();

  const todayKeyVN = getDateKeyVN(new Date());
  const currentDateObj = parseISO(currentDateKey);
  const isToday = currentDateKey === todayKeyVN;
  const dayNameVN = getDayNameVN(currentDateObj);
  const dayOfWeekNumber = getDayOfWeekVN(currentDateObj);

  // 1. Filter events on this specific date in Vietnam timezone
  const dayEvents = initialEvents.filter(
    (ev) => getDateKeyVN(ev.startTime) === currentDateKey
  );

  // 2. Filter blocked slots for this day of week
  const dayBlockedSlots = blockedSlots.filter((bs) => {
    if (bs.dayOfWeek !== null && bs.dayOfWeek !== undefined) {
      return bs.dayOfWeek === dayOfWeekNumber;
    }
    return false;
  });

  // 3. Calculate Overall Daily Stats separated by Event Types (Requirements 13 & 14)
  let totalScheduledMinutes = 0;
  let schoolMinutes = 0;
  let personalMinutes = 0;
  let selfStudyPlannedMinutes = 0;
  let selfStudyActualMinutes = 0;

  // Track stats for each of the 4 periods
  const periodStats: Record<PeriodKey, { plannedMinutes: number; actualMinutes: number }> = {
    morning: { plannedMinutes: 0, actualMinutes: 0 },
    noon: { plannedMinutes: 0, actualMinutes: 0 },
    afternoon: { plannedMinutes: 0, actualMinutes: 0 },
    evening: { plannedMinutes: 0, actualMinutes: 0 },
  };

  // Group events by primary period
  const periodEvents: Record<PeriodKey, any[]> = {
    morning: [],
    noon: [],
    afternoon: [],
    evening: [],
  };

  dayEvents.forEach((ev) => {
    const allocation = calculateEventPeriodAllocation(ev.startTime, ev.endTime);
    const evActualSeconds = ev.studySessions?.reduce((sum, s) => sum + s.actualDurationSeconds, 0) || 0;
    const evActualMinutes = Math.round(evActualSeconds / 60);

    totalScheduledMinutes += allocation.totalMinutes;

    if (isSchoolEvent(ev.type)) {
      schoolMinutes += allocation.totalMinutes;
    } else if (isPersonalEvent(ev.type)) {
      personalMinutes += allocation.totalMinutes;
    } else if (isSelfStudyEvent(ev.type)) {
      selfStudyPlannedMinutes += allocation.totalMinutes;
      selfStudyActualMinutes += evActualMinutes;
    }

    // Distribute planned minutes across periods for self-study
    (Object.keys(allocation.periods) as PeriodKey[]).forEach((pKey) => {
      if (isSelfStudyEvent(ev.type)) {
        periodStats[pKey].plannedMinutes += allocation.periods[pKey];
      }
    });

    if (isSelfStudyEvent(ev.type)) {
      periodStats[allocation.primaryPeriod].actualMinutes += evActualMinutes;
    }

    // Place into period event list
    periodEvents[allocation.primaryPeriod].push({
      ...ev,
      allocation,
      actualMinutes: evActualMinutes,
      plannedMinutes: allocation.totalMinutes,
      remainingMinutes: Math.max(0, allocation.totalMinutes - evActualMinutes),
    });
  });

  const selfStudyRemainingMinutes = Math.max(0, selfStudyPlannedMinutes - selfStudyActualMinutes);
  const progressPercent =
    selfStudyPlannedMinutes > 0
      ? Math.min(100, Math.round((selfStudyActualMinutes / selfStudyPlannedMinutes) * 100))
      : selfStudyActualMinutes > 0
      ? 100
      : 0;

  // Move event to another period (e.g. Morning to Evening)
  const handleMovePeriod = async (eventId: string, targetPeriodKey: PeriodKey) => {
    const targetPeriod = DAY_PERIODS.find((p) => p.key === targetPeriodKey);
    if (!targetPeriod) return;

    const ev = dayEvents.find((e) => e.id === eventId);
    if (!ev) return;

    const durationMins = Math.round(
      (new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()) / 60000
    );

    const newStart = makeVNDate(currentDateKey, targetPeriod.defaultStart);
    const newEnd = new Date(newStart.getTime() + durationMins * 60000);

    try {
      const res = await fetch("/api/calendar/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Không thể chuyển buổi học");
        return;
      }

      if (onEventsChange) onEventsChange();
    } catch (err: any) {
      alert("Lỗi chuyển buổi: " + err.message);
    }
  };

  // Drag and drop between periods
  const handleDragStart = (e: React.DragEvent, eventItem: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(eventItem));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnPeriod = async (e: React.DragEvent, targetPeriodKey: PeriodKey) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const eventItem = JSON.parse(raw);
      await handleMovePeriod(eventItem.id, targetPeriodKey);
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  // Check if a specific event is currently active in the PIP timer
  const isEventActiveTimer = (eventId: string) => {
    return scheduleEventId === eventId && (isRunning || isPaused);
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#17261c] p-4 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
        <div className="flex items-center space-x-2.5">
          <Button
            variant="pill"
            size="sm"
            onClick={() => setCurrentDateKey(todayKeyVN)}
            className="text-xs font-bold"
          >
            Hôm nay
          </Button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                const prev = subDays(currentDateObj, 1);
                setCurrentDateKey(getDateKeyVN(prev));
              }}
              className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const next = addDays(currentDateObj, 1);
                setCurrentDateKey(getDateKeyVN(next));
              }}
              className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2 px-2">
            <Calendar className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span className="font-bold text-base text-[#192e22] dark:text-[#f0f7f2]">
              {dayNameVN}, {formatVN(currentDateObj, "dd/MM/yyyy")}
            </span>
            {isToday && (
              <Badge variant="green" className="text-[10px] font-semibold py-0.5">
                Hôm nay
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="pill"
          size="sm"
          onClick={() => {
            setEditingEvent(null);
            setModalDefaultStartTime("08:00");
            setModalDefaultEndTime("09:30");
            setIsEventModalOpen(true);
          }}
          className="space-x-1.5 font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm lịch học</span>
        </Button>
      </div>

      {/* Daily Overview Card (Requirements 8 & 13) */}
      <div className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 soft-card-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#526b5c] dark:text-[#a3bda9] uppercase tracking-wider">
              <span>Tổng quan ngày</span>
              <span>•</span>
              <span className="text-[#2d6a4f] dark:text-[#52b788]">{dayNameVN}, {formatVN(currentDateObj, "dd/MM")}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mt-2">
              <div>
                <span className="text-xs text-[#73927d] dark:text-[#8ba393]">Tự học (Thực tế): </span>
                <strong className="text-xl font-bold text-[#2d6a4f] dark:text-[#52b788]">
                  {formatMinutesVN(selfStudyActualMinutes)}
                </strong>
                {selfStudyPlannedMinutes > 0 && (
                  <span className="text-xs text-[#73927d] ml-1">/ {formatMinutesVN(selfStudyPlannedMinutes)}</span>
                )}
              </div>
              <span className="text-[#dbe7dd] dark:text-[#263d2e]">|</span>
              <div>
                <span className="text-xs text-[#73927d] dark:text-[#8ba393]">🏫 Đi học trường: </span>
                <strong className="text-sm font-bold text-sky-700 dark:text-sky-400">
                  {formatMinutesVN(schoolMinutes)}
                </strong>
              </div>
              <span className="text-[#dbe7dd] dark:text-[#263d2e]">|</span>
              <div>
                <span className="text-xs text-[#73927d] dark:text-[#8ba393]">🎮 Cá nhân / Đi chơi: </span>
                <strong className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {formatMinutesVN(personalMinutes)}
                </strong>
              </div>
              <span className="text-[#dbe7dd] dark:text-[#263d2e]">|</span>
              <div>
                <span className="text-xs text-[#73927d] dark:text-[#8ba393]">📅 Tổng lịch: </span>
                <strong className="text-sm font-bold text-[#526b5c] dark:text-[#a3bda9]">
                  {formatMinutesVN(totalScheduledMinutes)}
                </strong>
              </div>
            </div>
          </div>

          {/* Overall Day Progress */}
          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[#526b5c] dark:text-[#a3bda9]">Tiến độ học thực tế</span>
              <span className="text-[#2d6a4f] dark:text-[#52b788]">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#eef5f0] dark:bg-[#1d3024] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2d6a4f] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Periods Mini Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#dbe7dd]/60 dark:border-[#263d2e]">
          {DAY_PERIODS.map((period) => {
            const stats = periodStats[period.key];
            return (
              <div
                key={period.key}
                className="p-2.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e] text-xs"
              >
                <div className="flex items-center space-x-1.5 font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  <span>{period.emoji}</span>
                  <span>{period.label}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-1 font-mono">
                  <span>Pl: <strong>{formatMinutesVN(stats.plannedMinutes)}</strong></span>
                  <span>Act: <strong className="text-[#2d6a4f] dark:text-[#52b788]">{formatMinutesVN(stats.actualMinutes)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Slots Banner (if any on this day) */}
      {dayBlockedSlots.length > 0 && (
        <div className="p-3.5 rounded-2xl border border-dashed border-[#e0c98f] bg-[#fbf9f1] dark:bg-[#201d14] text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-[#7d682e] dark:text-[#edd38c]">
            <Lock className="w-3.5 h-3.5" />
            <span>Khung giờ bị khóa / bận cố định trong {dayNameVN}:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {dayBlockedSlots.map((bs) => (
              <span
                key={bs.id}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#17261c] border border-[#edd38c] font-mono text-[11px] text-[#7d682e] dark:text-[#edd38c]"
              >
                {bs.title}: {bs.startTime} – {bs.endTime} (Khóa)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4 Periods Main Cards (Requirements 7, 8, 9, 14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DAY_PERIODS.map((period) => {
          const events = periodEvents[period.key];
          const stats = periodStats[period.key];

          return (
            <div
              key={period.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnPeriod(e, period.key)}
              className="flex flex-col rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-5 soft-card-shadow transition-all"
            >
              {/* Period Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#dbe7dd]/80 dark:border-[#263d2e]">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{period.emoji}</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                      BUỔI {period.label.toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-[#73927d] dark:text-[#8ba393] font-mono">
                      {period.nominalRange}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                    Kế hoạch: {formatMinutesVN(stats.plannedMinutes)}
                  </div>
                  <div className="text-[11px] font-bold text-[#2d6a4f] dark:text-[#52b788]">
                    Đã học: {formatMinutesVN(stats.actualMinutes)}
                  </div>
                </div>
              </div>

              {/* Event List in this period */}
              <div className="space-y-3 py-3 flex-1 min-h-[160px]">
                {events.map((ev) => {
                  const subjectColor = ev.subject?.color || "#2d6a4f";
                  const isTimerActive = isEventActiveTimer(ev.id);
                  const typeCfg = getEventTypeConfig(ev.type);
                  const TypeIcon = typeCfg.icon;

                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev)}
                      onClick={() => setSelectedSessionEvent(ev)}
                      className={`group relative p-3.5 rounded-[20px] border transition-all cursor-pointer select-none ${
                        isTimerActive
                          ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] ring-2 ring-[#2d6a4f]/30"
                          : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882] hover:shadow-2xs"
                      }`}
                      style={{ borderLeftColor: typeCfg.borderLeftColor || subjectColor, borderLeftWidth: "5px" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          {/* Type badge */}
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: typeCfg.badgeBg, color: typeCfg.badgeText }}
                            >
                              <TypeIcon className="w-2.5 h-2.5 shrink-0" />
                              <span>{typeCfg.shortLabel || typeCfg.label}</span>
                            </span>
                            {ev.isLocked && (
                              <Lock className="w-3 h-3 text-[#a3a86c] shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2] line-clamp-1">
                              {ev.title}
                            </span>
                          </div>

                          {(ev as any).location && (
                            <div className="flex items-center space-x-1 text-[10px] text-[#526b5c] dark:text-[#a3bda9]">
                              <MapPin className="w-2.5 h-2.5 shrink-0 text-[#2d6a4f] dark:text-[#52b788]" />
                              <span className="truncate">{(ev as any).location}</span>
                            </div>
                          )}

                          {ev.subject && (
                            <Badge
                              variant="green"
                              className="text-[10px] font-medium py-0"
                              style={{
                                backgroundColor: `${subjectColor}15`,
                                color: subjectColor,
                                borderColor: `${subjectColor}40`,
                              }}
                            >
                              {ev.subject.code ? `[${ev.subject.code}] ` : ""}
                              {ev.subject.name}
                            </Badge>
                          )}
                        </div>

                        {/* Quick Timer Trigger - ONLY for SELF_STUDY */}
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          {isTimerActive ? (
                            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#2d6a4f] text-white text-[10px] font-mono animate-pulse">
                              <span>⏱ {formatTime(secondsElapsed)}</span>
                              {isRunning && !isPaused ? (
                                <button
                                  onClick={pauseTimer}
                                  title="Tạm dừng"
                                  className="p-1 rounded-full hover:bg-white/20 cursor-pointer"
                                >
                                  <Pause className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={resumeTimer}
                                  title="Tiếp tục"
                                  className="p-1 rounded-full hover:bg-white/20 cursor-pointer"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                </button>
                              )}
                              <button
                                onClick={stopTimer}
                                title="Kết thúc phiên"
                                className="p-1 rounded-full hover:bg-white/20 cursor-pointer"
                              >
                                <Square className="w-2.5 h-2.5 fill-current" />
                              </button>
                            </div>
                          ) : (
                            canStartStudyTimer(ev.type) && ev.subject && (
                              <button
                                onClick={() =>
                                  startTimer(
                                    {
                                      id: ev.subject!.id,
                                      name: ev.subject!.name,
                                      code: ev.subject!.code,
                                      color: ev.subject!.color,
                                    },
                                    ev.id
                                  )
                                }
                                title="Bắt đầu tự học phiên này"
                                className="p-1.5 rounded-full bg-[#d8ebe0] text-[#1b4332] hover:bg-[#b7d8c3] cursor-pointer transition-colors shadow-2xs"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.2" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Time Details & Progress */}
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-[#73927d] dark:text-[#8ba393] mt-2.5 pt-2 border-t border-[#dbe7dd]/60 dark:border-[#263d2e]">
                        <span className="font-mono font-medium">
                          {formatVN(new Date(ev.startTime), "HH:mm")} – {formatVN(new Date(ev.endTime), "HH:mm")}
                        </span>

                        <div className="flex items-center space-x-2">
                          <span>Kế hoạch: <strong>{formatMinutesVN(ev.plannedMinutes)}</strong></span>
                          <span>•</span>
                          <span>Đã học: <strong className="text-[#2d6a4f] dark:text-[#52b788]">{formatMinutesVN(ev.actualMinutes)}</strong></span>
                          {ev.remainingMinutes > 0 && (
                            <>
                              <span>•</span>
                              <span>Còn: <strong className="text-[#b87474]">{formatMinutesVN(ev.remainingMinutes)}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cross-period badge if event spans over boundaries */}
                      {ev.allocation.crossesPeriods && (
                        <div className="mt-1.5 text-[9px] font-semibold text-[#8a7238] dark:text-[#dfc384] bg-[#fbf6e7] dark:bg-[#231e13] px-2 py-0.5 rounded-lg inline-block">
                          ⚡ Lịch vắt buổi: {ev.allocation.breakdownSummary}
                        </div>
                      )}
                    </div>
                  );
                })}

                {events.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <p className="text-xs text-[#8ba393] font-medium">
                      Chưa có lịch học {period.label.toLowerCase()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEvent(null);
                        setModalDefaultStartTime(period.defaultStart);
                        setModalDefaultEndTime(period.defaultEnd);
                        setIsEventModalOpen(true);
                      }}
                      className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs h-8 space-x-1 font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Thêm lịch {period.label}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Period Footer: Add button if has events */}
              {events.length > 0 && (
                <div className="pt-2 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] flex justify-end">
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setModalDefaultStartTime(period.defaultStart);
                      setModalDefaultEndTime(period.defaultEnd);
                      setIsEventModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#2d6a4f] dark:text-[#52b788] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm môn {period.label}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Session Details / PIP Control Modal (Requirement 12) */}
      {selectedSessionEvent && (
        <Dialog open={!!selectedSessionEvent} onOpenChange={(open) => !open && setSelectedSessionEvent(null)}>
          <DialogContent onClose={() => setSelectedSessionEvent(null)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#2d6a4f] dark:text-[#52b788] mb-1">
                <Clock className="w-4 h-4" />
                <span>Chi tiết phiên học & Điều khiển Timer</span>
              </div>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                {selectedSessionEvent.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Thông tin phiên học và điều khiển bộ đếm giờ thực tế PIP.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Subject Badge & Time */}
              <div className="p-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#526b5c] dark:text-[#a3bda9]">Môn học:</span>
                  <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    {selectedSessionEvent.subject?.name || "(Chung)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#526b5c] dark:text-[#a3bda9]">Khung giờ:</span>
                  <span className="font-mono font-bold text-[#2d6a4f] dark:text-[#52b788]">
                    {formatVN(new Date(selectedSessionEvent.startTime), "HH:mm")} – {formatVN(new Date(selectedSessionEvent.endTime), "HH:mm")}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] text-center">
                  <div>
                    <div className="text-[10px] text-[#73927d]">Kế hoạch (Planned)</div>
                    <div className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                      {formatMinutesVN(selectedSessionEvent.plannedMinutes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#73927d]">Thực tế (Actual)</div>
                    <div className="font-bold text-sm text-[#2d6a4f] dark:text-[#52b788]">
                      {formatMinutesVN(selectedSessionEvent.actualMinutes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#73927d]">Còn lại (Remaining)</div>
                    <div className="font-bold text-sm text-[#b87474] dark:text-[#f3a4a4]">
                      {formatMinutesVN(selectedSessionEvent.remainingMinutes)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Info for Non-SelfStudy Events */}
              {!canStartStudyTimer(selectedSessionEvent.type) && (
                <div className="p-4 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{getEventTypeConfig(selectedSessionEvent.type).emoji}</span>
                    <span className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">
                      {getEventTypeConfig(selectedSessionEvent.type).label}
                    </span>
                  </div>
                  {selectedSessionEvent.location && (
                    <div className="flex items-center space-x-1.5 text-xs text-[#526b5c] dark:text-[#a3bda9]">
                      <MapPin className="w-3.5 h-3.5 text-[#2d6a4f]" />
                      <span>Địa điểm: <strong>{selectedSessionEvent.location}</strong></span>
                    </div>
                  )}
                  <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                    {isSchoolEvent(selectedSessionEvent.type)
                      ? "Lịch đi học cố định tại trường. Không tạo Study Session và không tính giờ tự học."
                      : isPersonalEvent(selectedSessionEvent.type)
                      ? "Hoạt động cá nhân / đi chơi. AI xem đây là thời gian bận và không xếp lịch học."
                      : selectedSessionEvent.type === "EXAM"
                      ? "Lịch thi cử quan trọng. AI xem đây là mốc ưu tiên để xếp lịch ôn tập trước ngày thi."
                      : "Sự kiện được hiển thị trên Calendar."}
                  </p>
                </div>
              )}

              {/* Timer Control Bar inside Modal - ONLY for SELF_STUDY */}
              {canStartStudyTimer(selectedSessionEvent.type) && (
                <div className="p-4 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">PIP Floating Timer:</span>
                    {isEventActiveTimer(selectedSessionEvent.id) ? (
                      <Badge variant="green" className="animate-pulse">
                        Đang chạy: {formatTime(secondsElapsed)}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-[#73927d]">Chưa kích hoạt</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEventActiveTimer(selectedSessionEvent.id) ? (
                      <Button
                        onClick={() => {
                          if (selectedSessionEvent.subject) {
                            startTimer(
                              {
                                id: selectedSessionEvent.subject.id,
                                name: selectedSessionEvent.subject.name,
                                code: selectedSessionEvent.subject.code,
                                color: selectedSessionEvent.subject.color,
                              },
                              selectedSessionEvent.id
                            );
                          }
                        }}
                        className="flex-1 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs space-x-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>▶ Start (Bắt đầu học)</span>
                      </Button>
                    ) : (
                      <>
                        {isRunning && !isPaused ? (
                          <Button
                            onClick={pauseTimer}
                            variant="outline"
                            className="flex-1 rounded-2xl border-[#dbe7dd] text-xs font-semibold space-x-1"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>⏸ Pause (Tạm dừng)</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={resumeTimer}
                            className="flex-1 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold space-x-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>▶ Resume (Tiếp tục)</span>
                          </Button>
                        )}

                        <Button
                          onClick={() => {
                            stopTimer();
                            setSelectedSessionEvent(null);
                          }}
                          variant="destructive"
                          className="rounded-2xl text-xs font-semibold space-x-1 px-4"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>⏹ Finish</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Change Period Dropdown Selector */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#526b5c] dark:text-[#a3bda9]">Chuyển sang buổi khác:</span>
                <div className="flex items-center space-x-1">
                  {DAY_PERIODS.map((p) => (
                    <button
                      key={p.key}
                      onClick={async () => {
                        await handleMovePeriod(selectedSessionEvent.id, p.key);
                        setSelectedSessionEvent(null);
                      }}
                      title={`Chuyển sang Buổi ${p.label}`}
                      className="px-2.5 py-1 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[11px] font-semibold text-[#192e22] dark:text-[#f0f7f2] cursor-pointer transition-colors"
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingEvent(selectedSessionEvent);
                  setSelectedSessionEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="rounded-2xl border-[#dbe7dd] text-xs font-semibold text-[#526b5c]"
              >
                Chỉnh sửa chi tiết
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSessionEvent(null)}
                className="rounded-2xl text-xs"
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Event Modal for Creating / Editing */}
      {isEventModalOpen && (
        <EventModal
          open={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          subjects={subjects}
          defaultDate={currentDateKey}
          defaultStartTime={modalDefaultStartTime}
          defaultEndTime={modalDefaultEndTime}
          editingEvent={editingEvent}
          onSuccess={onEventsChange}
        />
      )}
    </div>
  );
}

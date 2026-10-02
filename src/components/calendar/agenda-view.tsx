"use client";

import React, { useState, useMemo } from "react";
import { format, isToday, isTomorrow, isYesterday, addDays, differenceInMinutes, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  Trash2,
  Edit2,
  Plus,
  ExternalLink,
  Video,
  FileText,
  Lock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VIETNAM_TIMEZONE, formatVN } from "@/lib/date-utils";
import { getEventTypeConfig, ALL_EVENT_TYPES, CalendarEventType } from "@/lib/calendar/event-types";
import { usePipTimer } from "@/components/timer/pip-timer-provider";
import { EventModal } from "./event-modal";

interface AgendaViewProps {
  initialEvents?: any[];
  subjects?: Array<{ id: string; name: string; code: string | null; color: string }>;
  onEventsChange?: () => void;
}

export function AgendaView({
  initialEvents = [],
  subjects = [],
  onEventsChange,
}: AgendaViewProps) {
  const [timeRangeDays, setTimeRangeDays] = useState<number>(14);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const { startTimer } = usePipTimer();

  // Quick resize handler (+/- 15 or 30 minutes)
  const handleQuickResize = async (e: React.MouseEvent, ev: any, deltaMinutes: number) => {
    e.stopPropagation();
    try {
      const currentStart = new Date(ev.startTime);
      const currentEnd = new Date(ev.endTime);
      const currentDuration = differenceInMinutes(currentEnd, currentStart);
      const newDuration = Math.max(15, currentDuration + deltaMinutes);
      const newEnd = new Date(currentStart.getTime() + newDuration * 60 * 1000);

      const res = await fetch("/api/calendar/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ev.id.includes("_") ? ev.id.split("_")[0] : ev.id,
          startTime: currentStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });

      if (res.ok && onEventsChange) {
        onEventsChange();
      }
    } catch (err) {
      console.error("Resize error:", err);
    }
  };

  // Quick delete handler
  const handleDeleteEvent = async (e: React.MouseEvent, ev: any) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa lịch "${ev.title}"?`)) return;

    try {
      const cleanId = ev.id.includes("_") ? ev.id.split("_")[0] : ev.id;
      const res = await fetch(`/api/calendar/events?id=${cleanId}&deleteMode=SINGLE`, {
        method: "DELETE",
      });
      if (res.ok && onEventsChange) {
        onEventsChange();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const cutoffDate = timeRangeDays > 0 ? addDays(now, timeRangeDays) : null;

    // Filter by date range and type
    const filtered = initialEvents.filter((ev) => {
      const evDate = new Date(ev.startTime);
      // Filter out past events older than 1 day
      if (evDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) return false;
      if (cutoffDate && evDate > cutoffDate) return false;

      if (selectedTypeFilter !== "ALL") {
        const evType = (ev.type || "STUDY").toUpperCase();
        if (evType !== selectedTypeFilter) return false;
      }

      return true;
    });

    // Sort chronologically
    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Group into date map
    const groups: { [dateKey: string]: { date: Date; dateLabel: string; isToday: boolean; events: any[] } } = {};

    filtered.forEach((ev) => {
      const dateKey = formatInTimeZone(new Date(ev.startTime), VIETNAM_TIMEZONE, "yyyy-MM-dd");
      const evDate = new Date(ev.startTime);

      if (!groups[dateKey]) {
        let dateLabel = formatInTimeZone(evDate, VIETNAM_TIMEZONE, "EEEE, dd/MM/yyyy");
        if (isToday(evDate)) dateLabel = `Hôm nay – ${formatInTimeZone(evDate, VIETNAM_TIMEZONE, "EEEE, dd/MM")}`;
        else if (isTomorrow(evDate)) dateLabel = `Ngày mai – ${formatInTimeZone(evDate, VIETNAM_TIMEZONE, "EEEE, dd/MM")}`;
        else if (isYesterday(evDate)) dateLabel = `Hôm qua – ${formatInTimeZone(evDate, VIETNAM_TIMEZONE, "EEEE, dd/MM")}`;

        groups[dateKey] = {
          date: evDate,
          dateLabel,
          isToday: isToday(evDate),
          events: [],
        };
      }

      groups[dateKey].events.push(ev);
    });

    return Object.values(groups);
  }, [initialEvents, timeRangeDays, selectedTypeFilter]);

  const totalFilteredCount = groupedEvents.reduce((acc, g) => acc + g.events.length, 0);

  return (
    <div className="space-y-5">
      {/* Agenda Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#17261c] p-4 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] soft-card-shadow">
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons */}
          <div className="flex items-center space-x-1 p-1 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-xs">
            <button
              onClick={() => setTimeRangeDays(7)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                timeRangeDays === 7 ? "bg-[#2d6a4f] text-white shadow-2xs" : "text-[#526b5c] dark:text-[#a3bda9]"
              }`}
            >
              7 ngày tới
            </button>
            <button
              onClick={() => setTimeRangeDays(14)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                timeRangeDays === 14 ? "bg-[#2d6a4f] text-white shadow-2xs" : "text-[#526b5c] dark:text-[#a3bda9]"
              }`}
            >
              14 ngày tới
            </button>
            <button
              onClick={() => setTimeRangeDays(30)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                timeRangeDays === 30 ? "bg-[#2d6a4f] text-white shadow-2xs" : "text-[#526b5c] dark:text-[#a3bda9]"
              }`}
            >
              30 ngày tới
            </button>
            <button
              onClick={() => setTimeRangeDays(0)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                timeRangeDays === 0 ? "bg-[#2d6a4f] text-white shadow-2xs" : "text-[#526b5c] dark:text-[#a3bda9]"
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#142318] text-xs text-[#192e22] dark:text-[#f0f7f2] font-medium outline-none"
          >
            <option value="ALL">Tất cả loại sự kiện</option>
            {ALL_EVENT_TYPES.map((t) => {
              const cfg = getEventTypeConfig(t);
              return (
                <option key={t} value={t}>
                  {cfg.label} ({t})
                </option>
              );
            })}
          </select>
        </div>

        <Button
          onClick={() => {
            setEditingEvent(null);
            setModalDefaultDate(format(new Date(), "yyyy-MM-dd"));
            setIsEventModalOpen(true);
          }}
          size="sm"
          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs font-semibold h-9 px-4 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm sự kiện mới</span>
        </Button>
      </div>

      {/* Agenda Event Groups */}
      {groupedEvents.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#17261c] rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e]">
          <CalendarIcon className="w-10 h-10 text-[#73927d] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Không có lịch trình nào trong khoảng thời gian này
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1 max-w-sm mx-auto">
            Hãy nhấn "+ Thêm sự kiện mới" hoặc dùng công cụ AI Xếp Lịch Tự Động để lập kế hoạch ôn tập.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((group) => (
            <div key={group.dateLabel} className="space-y-2.5">
              {/* Date Header Sticky Bar */}
              <div className="flex items-center justify-between sticky top-0 z-10 bg-[#f4f7f4]/90 dark:bg-[#0f1912]/90 backdrop-blur-md py-2 px-1 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      group.isToday ? "text-[#2d6a4f] dark:text-[#52b788]" : "text-[#192e22] dark:text-[#f0f7f2]"
                    }`}
                  >
                    {group.dateLabel}
                  </span>
                  {group.isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2d6a4f] text-white">
                      Hôm nay
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#73927d] dark:text-[#8ba393] font-medium">
                  {group.events.length} sự kiện
                </span>
              </div>

              {/* Event Cards for this Day */}
              <div className="space-y-2">
                {group.events.map((ev) => {
                  const typeCfg = getEventTypeConfig(ev.type);
                  const Icon = typeCfg.icon;
                  const durationMins = differenceInMinutes(new Date(ev.endTime), new Date(ev.startTime));
                  const startTimeFormatted = formatVN(ev.startTime, "HH:mm");
                  const endTimeFormatted = formatVN(ev.endTime, "HH:mm");

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setEditingEvent(ev);
                        setIsEventModalOpen(true);
                      }}
                      className="group relative p-3.5 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:border-[#74a882] hover:shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{ borderLeftColor: typeCfg.borderLeftColor, borderLeftWidth: "4.5px" }}
                    >
                      {/* Left: Time & Type & Subject */}
                      <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                        {/* Time Column */}
                        <div className="shrink-0 text-left w-24">
                          <div className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                            {startTimeFormatted} – {endTimeFormatted}
                          </div>
                          <div className="text-[10px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-[#2d6a4f] dark:text-[#52b788]" />
                            <span>{durationMins} phút</span>
                          </div>
                        </div>

                        {/* Title & Badges */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Type Badge */}
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1"
                              style={{ backgroundColor: typeCfg.badgeBg, color: typeCfg.badgeText }}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{typeCfg.label}</span>
                            </span>

                            {/* Subject Badge */}
                            {ev.subject && (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white truncate max-w-[150px]"
                                style={{ backgroundColor: ev.subject.color || "#2d6a4f" }}
                              >
                                {ev.subject.name}
                              </span>
                            )}

                            {ev.isLocked && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] flex items-center space-x-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Khóa</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                            {ev.title}
                          </h4>

                          {ev.description && (
                            <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] line-clamp-1">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        {/* Play Timer Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (ev.subject) {
                              startTimer(ev.subject);
                            }
                          }}
                          title="Bắt đầu học ngay với PIP Timer"
                          className="p-1.5 rounded-xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] hover:bg-[#2d6a4f] hover:text-white transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Quick Resize +/- 15m */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickResize(e, ev, -15)}
                          title="Giảm 15 phút"
                          className="px-2 py-1 rounded-lg border border-[#dbe7dd] dark:border-[#263d2e] text-[10px] font-bold text-[#526b5c] hover:bg-[#eef5f0] transition-colors cursor-pointer"
                        >
                          -15m
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleQuickResize(e, ev, 15)}
                          title="Tăng 15 phút"
                          className="px-2 py-1 rounded-lg border border-[#dbe7dd] dark:border-[#263d2e] text-[10px] font-bold text-[#2d6a4f] hover:bg-[#eef5f0] transition-colors cursor-pointer"
                        >
                          +15m
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsEventModalOpen(true);
                          }}
                          title="Chỉnh sửa chi tiết"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEvent(e, ev)}
                          title="Xóa sự kiện"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit / Create Event */}
      <EventModal
        open={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        subjects={subjects}
        defaultDate={modalDefaultDate}
        editingEvent={editingEvent}
        onSuccess={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
          if (onEventsChange) onEventsChange();
        }}
      />
    </div>
  );
}

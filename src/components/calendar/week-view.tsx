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
import { ChevronLeft, ChevronRight, Sparkles, Plus, Lock, Play, Trash2, Video, FolderOpen, FileText, MapPin } from "lucide-react";
import { EventModal } from "./event-modal";
import { AiSchedulePreviewModal } from "./ai-schedule-preview-modal";
import { usePipTimer } from "../timer/pip-timer-provider";
import { AiResourceReminderBanner } from "../study/ai-resource-reminder-banner";
import { useRouter } from "next/navigation";
import { getEventTypeConfig, canStartStudyTimer } from "@/lib/calendar/event-types";

interface WeekViewProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description: string | null;
    location?: string | null;
    startTime: string;
    endTime: string;
    type?: string;
    isLocked?: boolean;
    isAiGenerated?: boolean;
    recurrence?: string;
    recurrenceRule?: string | null;
    originalId?: string;
    resources?: Array<{
      id: string;
      title: string;
      type: string;
      subType?: string | null;
      url: string;
    }>;
    studyNotes?: Array<{
      id: string;
      content: string;
      isPinned: boolean;
    }>;
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
  const router = useRouter();
  const [currentWeekRef, setCurrentWeekRef] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"schedule" | "resources">("schedule");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(getDateKeyVN(new Date()));
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const { startTimer } = usePipTimer();

  const weekDays = getWeekDaysDetailedVN(currentWeekRef);

  // Quick delete directly from card
  const handleQuickDelete = async (e: React.MouseEvent, ev: any) => {
    e.stopPropagation();
    const isRecurring = Boolean(ev.recurrence && ev.recurrence !== "NONE");

    if (isRecurring) {
      setEditingEvent({
        id: ev.id,
        originalId: ev.originalId || ev.id,
        title: ev.title,
        description: ev.description,
        subjectId: ev.subject?.id || null,
        startTime: ev.startTime,
        endTime: ev.endTime,
        type: ev.type,
        isLocked: ev.isLocked,
        recurrence: ev.recurrence,
        recurrenceRule: ev.recurrenceRule,
      });
      setModalInitialTab("schedule");
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
        throw new Error(data.error || "Không thể xóa sự kiện");
      }
      if (onEventsChange) onEventsChange();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa lịch học");
    }
  };

  // Open resource manager directly
  const handleOpenResources = (calendarEventId: string, title: string, subjectName: string) => {
    const cleanId = calendarEventId.includes("_") ? calendarEventId.split("_")[0] : calendarEventId;
    const ev = initialEvents.find((e) => (e.id.includes("_") ? e.id.split("_")[0] : e.id) === cleanId);
    if (ev) {
      setEditingEvent(ev);
    } else {
      setEditingEvent({
        id: calendarEventId,
        title,
        subject: { name: subjectName, id: "", code: null, color: "#2d6a4f" },
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
    }
    setModalInitialTab("resources");
    setIsEventModalOpen(true);
  };

  // Quick resize event duration (+/- delta minutes)
  const handleQuickResize = async (e: React.MouseEvent, ev: any, deltaMinutes: number) => {
    e.stopPropagation();
    try {
      const currentStart = new Date(ev.startTime);
      const currentEnd = new Date(ev.endTime);
      const currentDuration = Math.round((currentEnd.getTime() - currentStart.getTime()) / 60000);
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
      {/* AI Proactive Reminder Banner */}
      <AiResourceReminderBanner onOpenResourceManager={handleOpenResources} />

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

          <span className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
            {weekDays[0].fullFormatted} – {weekDays[6].fullFormatted}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsAiModalOpen(true)}
            size="sm"
            className="bg-linear-to-r from-[#2d6a4f] to-[#40916c] hover:opacity-90 text-white rounded-full font-semibold text-xs shadow-2xs cursor-pointer flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d8ebe0]" />
            <span>AI Xếp Lịch Tự Động</span>
          </Button>

          <Button
            onClick={() => {
              setEditingEvent(null);
              setModalDefaultDate(getDateKeyVN(new Date()));
              setModalInitialTab("schedule");
              setIsEventModalOpen(true);
            }}
            size="sm"
            variant="outline"
            className="rounded-full text-xs font-semibold cursor-pointer border-[#b7d8c3] text-[#1b4332] dark:text-[#74c69d]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Thêm Lịch</span>
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          // Filter events for this day strictly by dateKey in VN timezone
          const dayEvents = initialEvents.filter((ev) => {
            const evStartVN = getDateKeyVN(ev.startTime);
            return evStartVN === day.dateKey;
          });

          // Blocked slots for this day of week
          const dayBlockedSlots = blockedSlots.filter(
            (bs) => bs.dayOfWeek === day.dayOfWeek
          );

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
                      setModalInitialTab("schedule");
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
                  const resourceCount = ev.resources?.length || 0;
                  const hasMeeting = ev.resources?.some(
                    (r) => r.type === "MEETING" || ["ZOOM", "MEET", "TEAMS"].includes(r.subType || "")
                  );

                  const typeCfg = getEventTypeConfig(ev.type);
                  const TypeIcon = typeCfg.icon;

                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev)}
                      onClick={() => {
                        setEditingEvent({
                          id: ev.id,
                          originalId: (ev as any).originalId,
                          title: ev.title,
                          description: ev.description,
                          location: (ev as any).location,
                          subjectId: ev.subject?.id || null,
                          startTime: ev.startTime,
                          endTime: ev.endTime,
                          type: ev.type,
                          isLocked: ev.isLocked,
                          recurrence: (ev as any).recurrence,
                          recurrenceRule: (ev as any).recurrenceRule,
                        });
                        setModalInitialTab("schedule");
                        setIsEventModalOpen(true);
                      }}
                      className="group relative p-2.5 rounded-[16px] border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882] hover:shadow-2xs transition-all cursor-pointer text-xs"
                      style={{ borderLeftColor: typeCfg.borderLeftColor || subjectColor, borderLeftWidth: "4px" }}
                    >
                      {/* Event Type & Lock header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: typeCfg.badgeBg, color: typeCfg.badgeText }}
                        >
                          <TypeIcon className="w-2.5 h-2.5 shrink-0" />
                          <span>{typeCfg.shortLabel || typeCfg.label}</span>
                        </span>

                        <div className="flex items-center space-x-1 shrink-0">
                          {ev.isLocked && (
                            <Lock className="w-3 h-3 text-[#a3a86c]" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleQuickDelete(e, ev)}
                            title="Xóa lịch này"
                            className="opacity-70 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Title on Card */}
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] line-clamp-2 text-[11px] flex-1">
                          {ev.title}
                        </span>
                      </div>

                      {/* Location Badge if available */}
                      {(ev as any).location && (
                        <div className="flex items-center space-x-1 text-[10px] text-[#526b5c] dark:text-[#a3bda9] mt-1 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0 text-[#2d6a4f] dark:text-[#52b788]" />
                          <span className="truncate">{(ev as any).location}</span>
                        </div>
                      )}

                      {/* Resource Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {hasMeeting && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              const meet = ev.resources?.find(
                                (r) => r.type === "MEETING" || ["ZOOM", "MEET", "TEAMS"].includes(r.subType || "")
                              );
                              if (meet?.url) window.open(meet.url, "_blank");
                            }}
                            title="Mở phòng học trực tuyến"
                            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold hover:bg-emerald-200 transition-colors"
                          >
                            <Video className="w-2.5 h-2.5" />
                            <span>Meeting</span>
                          </span>
                        )}

                        {resourceCount > 0 ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent({
                                id: ev.id,
                                originalId: (ev as any).originalId,
                                title: ev.title,
                                description: ev.description,
                                subjectId: ev.subject?.id || null,
                                startTime: ev.startTime,
                                endTime: ev.endTime,
                                type: ev.type,
                                isLocked: ev.isLocked,
                                recurrence: (ev as any).recurrence,
                                recurrenceRule: (ev as any).recurrenceRule,
                              });
                              setModalInitialTab("resources");
                              setIsEventModalOpen(true);
                            }}
                            title="Xem tài liệu & link buổi học"
                            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-[#d8ebe0] dark:bg-[#1c3826] text-[#1b4332] dark:text-[#a3bda9] text-[10px] font-medium hover:bg-[#b7d8c3] transition-colors"
                          >
                            <FolderOpen className="w-2.5 h-2.5" />
                            <span>{resourceCount} files</span>
                          </span>
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent({
                                id: ev.id,
                                originalId: (ev as any).originalId,
                                title: ev.title,
                                description: ev.description,
                                subjectId: ev.subject?.id || null,
                                startTime: ev.startTime,
                                endTime: ev.endTime,
                                type: ev.type,
                                isLocked: ev.isLocked,
                                recurrence: (ev as any).recurrence,
                                recurrenceRule: (ev as any).recurrenceRule,
                              });
                              setModalInitialTab("resources");
                              setIsEventModalOpen(true);
                            }}
                            title="Thêm tài liệu hoặc Zoom vào buổi học này"
                            className="inline-flex items-center space-x-0.5 px-1 py-0.5 rounded-md border border-dashed border-[#b7d8c3] text-[#526b5c] dark:text-[#a3bda9] text-[9px] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-colors"
                          >
                            <Plus className="w-2 h-2" />
                            <span>Resource</span>
                          </span>
                        )}
                      </div>

                      {/* Time and Quick Start Study Timer */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#dbe7dd]/60 dark:border-[#263d2e]">
                        <span className="font-mono text-[10px] font-medium text-[#73927d]">
                          {formatVN(new Date(ev.startTime), "HH:mm")} - {formatVN(new Date(ev.endTime), "HH:mm")}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => handleQuickResize(e, ev, -15)}
                            title="Giảm 15 phút"
                            className="opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-[9px] font-bold text-[#526b5c] hover:bg-[#eef5f0] transition-opacity cursor-pointer border border-[#dbe7dd]/60"
                          >
                            -15m
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleQuickResize(e, ev, 15)}
                            title="Tăng 15 phút"
                            className="opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-[9px] font-bold text-[#2d6a4f] hover:bg-[#eef5f0] transition-opacity cursor-pointer border border-[#dbe7dd]/60"
                          >
                            +15m
                          </button>

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
      <EventModal
        open={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        subjects={subjects}
        defaultDate={modalDefaultDate}
        editingEvent={editingEvent}
        initialTab={modalInitialTab}
        onSuccess={() => {
          if (onEventsChange) onEventsChange();
        }}
      />

      <AiSchedulePreviewModal
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        subjects={subjects}
        onSuccess={() => {
          if (onEventsChange) onEventsChange();
        }}
      />
    </div>
  );
}

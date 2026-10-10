"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
  MapPin,
  Sparkles,
  Sliders,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatVN, formatMinutesVN } from "@/lib/date-utils";
import { canStartStudyTimer, getEventTypeConfig } from "@/lib/calendar/event-types";
import { usePipTimer } from "../timer/pip-timer-provider";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
export interface EventQuickModalData {
  id: string;
  originalId?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string | Date;
  endTime: string | Date;
  type?: string;
  isLocked?: boolean;
  isAiGenerated?: boolean;
  recurrence?: string;
  recurrenceRule?: string | null;
  completed?: boolean;
  completedAt?: string | Date | null;
  actualDurationMinutes?: number | null;
  plannedDurationMinutes?: number | null;
  subject?: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
  resources?: any[];
  studyNotes?: any[];
}

interface EventQuickModalProps {
  event: EventQuickModalData | null;
  open: boolean;
  onClose: () => void;
  onOpenEditModal: (event: EventQuickModalData) => void;
  onDeleted?: (eventId: string) => void;
  onUpdated?: (updatedEvent: any) => void;
}

export function EventQuickModal({
  event,
  open,
  onClose,
  onOpenEditModal,
  onDeleted,
  onUpdated,
}: EventQuickModalProps) {
  const router = useRouter();
  const { startTimer } = usePipTimer();

  const [loading, setLoading] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number>(0);

  if (!event) return null;

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const plannedMins =
    event.plannedDurationMinutes || Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const isCompleted = Boolean(event.completed);
  const actualMins = isCompleted ? (event.actualDurationMinutes ?? plannedMins) : 0;

  const now = new Date();
  const isPast = end < now;
  const typeCfg = getEventTypeConfig(event.type);
  const TypeIcon = typeCfg.icon;

  // Determine Visual Status
  let statusBadge = {
    label: "Dự kiến",
    colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
    dotClass: "bg-amber-500",
  };

  if (isCompleted) {
    statusBadge = {
      label: "Đã hoàn thành",
      colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
      dotClass: "bg-emerald-500",
    };
  } else if (isPast) {
    statusBadge = {
      label: "Chưa hoàn thành / Quá giờ",
      colorClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300",
      dotClass: "bg-rose-500",
    };
  }

  const handleToggleComplete = async (overrideMinutes?: number) => {
    if (loading) return;
    setLoading(true);

    const nextCompleted = !isCompleted;
    const targetMins = overrideMinutes !== undefined ? overrideMinutes : (customMinutes > 0 ? customMinutes : plannedMins);

    try {
      const res = await fetch("/api/calendar/events/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          completed: nextCompleted,
          customActualMinutes: nextCompleted ? targetMins : undefined,
          originalId: event.originalId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật trạng thái");

      if (onUpdated) {
        onUpdated({
          ...event,
          completed: data.completed,
          actualDurationMinutes: data.actualMinutes,
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("chronomind-study-updated", {
            detail: {
              eventId: event.id,
              completed: data.completed,
              actualMinutes: data.actualMinutes,
            },
          })
        );
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = () => {
    if (!canStartStudyTimer(event.type) || !event.subject) {
      toast("Chỉ lịch học có môn học mới có thể bấm giờ học!");
      return;
    }

    const cleanId = event.id.includes("_") ? event.id.split("_")[0] : event.id;
    startTimer(
      {
        id: event.subject.id,
        name: event.subject.name,
        code: event.subject.code,
        color: event.subject.color,
      },
      cleanId
    );
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lịch "${event.title}" không?`)) return;
    setLoading(true);

    try {
      const cleanId = event.id.includes("_") ? event.id.split("_")[0] : event.id;
      const res = await fetch(`/api/calendar/events?id=${cleanId}&deleteMode=SINGLE`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa lịch");
      }

      if (onDeleted) onDeleted(event.id);
      router.refresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi xóa lịch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        onClose={onClose}
        className="max-w-md rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl space-y-4"
      >
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.colorClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dotClass}`} />
              <span>{statusBadge.label}</span>
            </span>

            <span
              className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: typeCfg.badgeBg, color: typeCfg.badgeText }}
            >
              <TypeIcon className="w-3 h-3" />
              <span>{typeCfg.label}</span>
            </span>
          </div>

          <DialogTitle className="text-xl font-bold text-[var(--text-ink)] pt-1">
            {event.title}
          </DialogTitle>

          {event.subject && (
            <div className="flex items-center space-x-2 pt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: event.subject.color || "#2d6a4f" }}
              />
              <span className="text-xs font-bold text-[var(--mint-dark)]">
                {event.subject.name}
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Time and Duration Card */}
        <div className="p-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-[var(--text-subtle)]">
              <Clock className="w-4 h-4 text-[var(--mint-dark)]" />
              <span>Khung giờ:</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-ink)]">
              {formatVN(start, "HH:mm")} – {formatVN(end, "HH:mm")} ({formatVN(start, "dd/MM/yyyy")})
            </span>
          </div>

          {event.location && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]/60 dark:border-[#263d2e]">
              <div className="flex items-center space-x-1.5 text-[var(--text-subtle)]">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Địa điểm:</span>
              </div>
              <span className="font-medium text-[var(--text-ink)] truncate max-w-[200px]">
                {event.location}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]/60 dark:border-[#263d2e] text-[var(--text-subtle)]enter">
            <div className="p-2 rounded-xl bg-white dark:bg-[#1a2d1f] border border-[var(--border)]/60 dark:border-[#263d2e]">
              <div className="text-[10px] text-[var(--text-muted)]">Kế hoạch (Planned)</div>
              <div className="font-bold text-[var(--text-subtle)]ase text-[var(--text-ink)]">
                {formatMinutesVN(plannedMins)}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-[#1a2d1f] border border-[var(--border)]/60 dark:border-[#263d2e]">
              <div className="text-[10px] text-[var(--text-muted)]">Thực tế (Actual)</div>
              <div className="font-bold text-[var(--text-subtle)]ase text-[var(--mint-dark)]">
                {isCompleted ? formatMinutesVN(actualMins) : "0 phút"}
              </div>
            </div>
          </div>
        </div>

        {/* Big Complete Action Button / Toggle */}
        <div className="space-y-2">
          <Button
            type="button"
            disabled={loading}
            onClick={() => handleToggleComplete()}
            className={`w-full h-12 text-sm font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all ${
              isCompleted
                ? "bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white shadow-md"
                : "bg-white dark:bg-[#192f20] border-2 border-[var(--mint)] text-[var(--mint-dark)] hover:bg-[var(--mint-soft)]"
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>✓ ĐÃ HỌC XONG (Nhấn để hủy)</span>
              </>
            ) : (
              <>
                <Circle className="w-5 h-5" />
                <span>ĐÁNH DẤU "ĐÃ HỌC" ({formatMinutesVN(plannedMins)})</span>
              </>
            )}
          </Button>

          {/* Option to modify actual study time */}
          <div className="flex items-center justify-between text-xs px-1 text-[var(--text-subtle)]">
            <button
              type="button"
              onClick={() => {
                setShowCustomDuration(!showCustomDuration);
                if (!customMinutes) setCustomMinutes(plannedMins);
              }}
              className="hover:underline flex items-center space-x-1 cursor-pointer font-medium text-[var(--mint-dark)]"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showCustomDuration ? "Ẩn tùy chỉnh giờ" : "Chỉnh thời gian thực tế"}</span>
            </button>

            {isCompleted && (
              <span className="text-[11px] text-[var(--text-muted)]">
                Đã ghi nhận: <strong>{formatMinutesVN(actualMins)}</strong>
              </span>
            )}
          </div>

          {showCustomDuration && (
            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-ink)]">
                  Số phút thực tế đã học:
                </span>
                <span className="font-mono text-xs font-bold text-[var(--mint-dark)]">
                  {formatMinutesVN(customMinutes || plannedMins)}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[-30, -15, 0, 15, 30].map((delta) => {
                  const targetVal = Math.max(5, plannedMins + delta);
                  return (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setCustomMinutes(targetVal)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        customMinutes === targetVal
                          ? "bg-[var(--mint)] text-white border-[var(--mint)]"
                          : "bg-white dark:bg-[#1a2d1f] text-[var(--text-subtle)] border-[var(--border)] hover:border-[var(--mint)]"
                      }`}
                    >
                      {delta === 0 ? "Mặc định" : delta > 0 ? `+${delta}m` : `${delta}m`}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Input
                  type="number"
                  min={1}
                  max={720}
                  value={customMinutes || plannedMins}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-8 text-xs font-mono rounded-xl"
                  placeholder="Nhập số phút..."
                />
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleToggleComplete(customMinutes)}
                  className="h-8 text-xs font-bold bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-xl shrink-0"
                >
                  Lưu số phút
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Timer, Edit, Delete */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/80 dark:border-[#263d2e]">
          {canStartStudyTimer(event.type) && event.subject && !isCompleted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartTimer}
              className="rounded-xl border-[var(--border)] text-[var(--mint-dark)] hover:bg-[var(--mint-bg)] space-x-1 font-bold text-xs h-9"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Bắt đầu Timer</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onOpenEditModal(event);
              }}
              className="rounded-xl border-[var(--border)] text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] space-x-1 font-semibold text-xs h-9"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 h-9"
              title="Xóa lịch này"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

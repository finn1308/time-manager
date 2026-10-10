"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  Clock,
  Play,
  CheckCircle2,
  Plus,
  Sparkles,
  CalendarPlus,
  BookOpen,
  GraduationCap,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePipTimer } from "@/components/timer/pip-timer-provider";
import { getDateKeyVN } from "@/lib/date-utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ComputedFlexibleGoalItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  skillId: string | null;
  targetMinutes: number;
  startDate: string;
  endDate: string | null;
  activeDays: number[];
  preferredPeriod: string;
  deadline: string | null;
  status: string;
  targetDateKey: string;
  isActiveOnDate: boolean;
  actualMinutes: number;
  remainingMinutes: number;
  isCompleted: boolean;
  completedAt: string | null;
  subject?: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
  skill?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

interface DailyFlexibleGoalsProps {
  targetDateKey?: string;
  onOpenCreateModal?: () => void;
  className?: string;
}

export function DailyFlexibleGoals({
  targetDateKey = getDateKeyVN(new Date()),
  onOpenCreateModal,
  className = "",
}: DailyFlexibleGoalsProps) {
  const { startTimer, isRunning, flexibleGoalId: activeGoalId } = usePipTimer();
  const [goals, setGoals] = useState<ComputedFlexibleGoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual slot scheduling modal state
  const [schedulingGoal, setSchedulingGoal] = useState<ComputedFlexibleGoalItem | null>(null);
  const [slotDate, setSlotDate] = useState<string>(targetDateKey);
  const [slotStartTime, setSlotStartTime] = useState<string>("14:00");
  const [slotEndTime, setSlotEndTime] = useState<string>("14:30");
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`/api/flexible-goals?date=${targetDateKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.goals) {
          setGoals(data.goals);
        }
      }
    } catch (e) {
      console.warn("Failed to load flexible goals:", e);
    } finally {
      setIsLoading(false);
    }
  }, [targetDateKey]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    const handleUpdated = () => {
      fetchGoals();
    };
    window.addEventListener("chronomind-study-updated", handleUpdated);
    return () => {
      window.removeEventListener("chronomind-study-updated", handleUpdated);
    };
  }, [fetchGoals]);

  const handleStartStudy = (goal: ComputedFlexibleGoalItem) => {
    const activeSub = goal.subject
      ? {
          id: goal.subject.id,
          name: goal.subject.name,
          code: goal.subject.code,
          color: goal.subject.color,
        }
      : goal.skill
      ? {
          id: goal.skill.id,
          name: goal.skill.name,
          code: null,
          color: "#2d6a4f",
        }
      : {
          id: "general",
          name: goal.title,
          code: null,
          color: "#2d6a4f",
        };

    const targetMinutesForSession = goal.remainingMinutes > 0 ? goal.remainingMinutes : goal.targetMinutes;

    startTimer(activeSub, {
      flexibleGoalId: goal.id,
      skillId: goal.skillId,
      mode: "POMODORO",
      targetMinutes: targetMinutesForSession,
    });

    toast.success(`Bắt đầu bấm giờ học: ${goal.title}`);
  };

  const handleOpenScheduleModal = (goal: ComputedFlexibleGoalItem) => {
    setSchedulingGoal(goal);
    setSlotDate(targetDateKey);
    // Suggest slot length based on remaining minutes or target
    const duration = goal.remainingMinutes > 0 ? goal.remainingMinutes : goal.targetMinutes;
    setSlotStartTime("14:00");
    const endMinutes = 14 * 60 + duration;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
    const endM = String(endMinutes % 60).padStart(2, "0");
    setSlotEndTime(`${endH}:${endM}`);
  };

  const handleConfirmScheduleSlot = async () => {
    if (!schedulingGoal) return;
    setIsScheduling(true);
    try {
      const res = await fetch("/api/flexible-goals/schedule-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flexibleGoalId: schedulingGoal.id,
          date: slotDate,
          startTime: slotStartTime,
          endTime: slotEndTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xếp lịch");
      }

      toast.success(`Đã xếp lịch "${schedulingGoal.title}" vào ngày ${slotDate}!`);
      setSchedulingGoal(null);
      window.dispatchEvent(new Event("chronomind-study-updated"));
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xếp lịch");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mục tiêu học "${title}" không? Lịch sử các buổi học trước đây vẫn sẽ được bảo lưu.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/flexible-goals?id=${goalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Đã xóa mục tiêu "${title}"`);
        window.dispatchEvent(new Event("chronomind-study-updated"));
        fetchGoals();
      } else {
        toast.error("Không thể xóa mục tiêu");
      }
    } catch {
      toast.error("Lỗi khi xóa mục tiêu");
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-[28px] border border-[var(--border)] bg-[var(--bg-muted)] animate-pulse ${className}`}>
        <div className="h-5 w-48 bg-[#dbe7dd] dark:bg-[#1f3426] rounded-xl mb-3" />
        <div className="h-16 bg-[var(--bg-surface)] rounded-2xl" />
      </div>
    );
  }

  // Active goals for selected date
  const activeTodayGoals = goals.filter((g) => g.isActiveOnDate);
  const completedCount = activeTodayGoals.filter((g) => g.isCompleted).length;

  return (
    <div className={`p-4 sm:p-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-2xl bg-[#eef5f0] dark:bg-[#1b3426] flex items-center justify-center text-[var(--mint-dark)]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm sm:text-[var(--text-subtle)]ase text-[var(--text-ink)]">
                Mục tiêu hôm nay
              </h3>
              <Badge className="bg-[#eef5f0] text-[var(--mint-dark)] dark:bg-[#1b3426] dark:text-[#52b788] border-none text-[10px] font-bold">
                {completedCount}/{activeTodayGoals.length} hoàn thành
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--text-subtle)]">
              Mục tiêu học linh hoạt theo ngày • Không gò bó giờ bắt đầu
            </p>
          </div>
        </div>

        {onOpenCreateModal && (
          <Button
            type="button"
            size="sm"
            onClick={onOpenCreateModal}
            className="rounded-2xl h-8 px-3 bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-semibold space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm mục tiêu</span>
          </Button>
        )}
      </div>

      {/* Goal List */}
      {activeTodayGoals.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[var(--bg-muted)] border border-dashed border-[var(--border)] text-[var(--text-subtle)]enter space-y-2">
          <Sparkles className="w-6 h-6 text-[#52b788] mx-auto opacity-70" />
          <p className="text-xs font-semibold text-[var(--text-ink)]">
            Hôm nay chưa có mục tiêu học linh hoạt nào
          </p>
          <p className="text-[11px] text-[var(--text-subtle)] max-w-sm mx-auto">
            Tạo mục tiêu hàng ngày (như Từ vựng tiếng Anh 30 phút, Luyện code 60 phút) để theo dõi tiến độ thực tế mà không cần chốt giờ cố định.
          </p>
          {onOpenCreateModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCreateModal}
              className="mt-2 rounded-xl border-[var(--mint)] text-[var(--mint-dark)] hover:bg-[#eef5f0] text-xs font-semibold cursor-pointer"
            >
              + Đặt mục tiêu học hôm nay
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeTodayGoals.map((goal) => {
            const isGoalActiveInTimer = isRunning && activeGoalId === goal.id;
            const progressPercent = Math.min(
              100,
              Math.round((goal.actualMinutes / goal.targetMinutes) * 100)
            );

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border transition-all ${
                  goal.isCompleted
                    ? "bg-[#f4faf5] dark:bg-[#15271a] border-[#b7d8c3] dark:border-[#263d2e]"
                    : isGoalActiveInTimer
                    ? "bg-[#eef5f0] dark:bg-[#1b3426] border-[var(--mint)] ring-2 ring-[#2d6a4f]/25"
                    : "bg-[#fbfdfb] dark:bg-[#142318] border-[var(--border)] hover:border-[#b7d8c3]"
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {goal.subject ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: goal.subject.color || "#2d6a4f" }}
                      />
                    ) : goal.skill ? (
                      <GraduationCap className="w-3.5 h-3.5 text-[#52b788] shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-[#52b788] shrink-0" />
                    )}

                    <div className="truncate">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-ink)] truncate">
                        {goal.title}
                      </h4>
                      <p className="text-[10px] text-[var(--text-subtle)] truncate">
                        {goal.subject?.name || (goal.skill ? `Kỹ năng: ${goal.skill.name}` : "Tự học linh hoạt")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {goal.isCompleted ? (
                      <Badge className="bg-[var(--mint)] text-white border-none text-[10px] font-bold space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Hoàn thành</span>
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-[var(--text-subtle)]">
                        {goal.remainingMinutes}m còn lại
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      className="p-1 text-[#8ba393] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Xóa mục tiêu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Stats */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--text-subtle)]">
                      Đã học:{" "}
                      <strong className="text-[var(--text-ink)] font-mono">
                        {goal.actualMinutes}
                      </strong>
                      /{goal.targetMinutes} phút
                    </span>
                    <span className="font-mono font-bold text-[var(--mint-dark)]">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-[#e3ece5] dark:bg-[#203627] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.isCompleted
                          ? "bg-gradient-to-r from-[#2d6a4f] to-[#52b788]"
                          : "bg-[var(--mint)]"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Preferred Period / Note Badge */}
                {goal.preferredPeriod && goal.preferredPeriod !== "ANY_TIME" && (
                  <div className="mt-2 text-[10px] text-[var(--text-subtle)] flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#52b788]" />
                    <span>
                      Khung giờ khuyên dùng:{" "}
                      {goal.preferredPeriod === "MORNING"
                        ? "Buổi sáng"
                        : goal.preferredPeriod === "AFTERNOON"
                        ? "Buổi chiều"
                        : "Buổi tối"}
                    </span>
                  </div>
                )}

                {/* Card Actions */}
                <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60 dark:border-[#263d2e]/60 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleStartStudy(goal)}
                    className={`rounded-xl text-xs font-bold h-8 px-3 space-x-1.5 cursor-pointer ${
                      isGoalActiveInTimer
                        ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                        : goal.isCompleted
                        ? "bg-white dark:bg-[#1b2b20] border border-[var(--mint)] text-[var(--mint-dark)] hover:bg-[#eef5f0]"
                        : "bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white"
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>
                      {isGoalActiveInTimer
                        ? "Đang bấm giờ..."
                        : goal.actualMinutes > 0 && !goal.isCompleted
                        ? "Tiếp tục học"
                        : goal.isCompleted
                        ? "Học thêm"
                        : "Bắt đầu học"}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenScheduleModal(goal)}
                    className="h-8 px-2.5 text-[11px] font-semibold text-[var(--text-subtle)] hover:text-[var(--mint-dark)] hover:bg-[#eef5f0] rounded-xl cursor-pointer"
                    title="Xếp vào một khung giờ cụ thể trên lịch"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 mr-1 text-[#52b788]" />
                    <span>Xếp vào lịch</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Convert / Schedule into Time Slot Modal */}
      {schedulingGoal && (
        <Dialog open={!!schedulingGoal} onOpenChange={(open) => !open && setSchedulingGoal(null)}>
          <DialogContent className="max-w-md rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--mint-dark)] mb-1">
                <CalendarPlus className="w-4 h-4" />
                <span>Xếp mục tiêu vào lịch cố định</span>
              </div>
              <DialogTitle className="text-[var(--text-subtle)]ase font-bold text-[var(--text-ink)]">
                Chọn khung giờ cho "{schedulingGoal.title}"
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--text-subtle)]">
                Chuyển mục tiêu thành sự kiện cố định trên lưới lịch. Tiến độ học sẽ vẫn được liên kết và không bị tính trùng hai lần.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1">
                  Ngày xếp lịch
                </label>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="rounded-2xl h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1">
                    Giờ bắt đầu
                  </label>
                  <Input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="rounded-2xl h-10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1">
                    Giờ kết thúc
                  </label>
                  <Input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="rounded-2xl h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSchedulingGoal(null)}
                className="rounded-2xl border-[var(--border)] text-xs"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleConfirmScheduleSlot}
                disabled={isScheduling}
                className="rounded-2xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-bold space-x-1.5"
              >
                <span>{isScheduling ? "Đang xếp lịch..." : "Xác nhận xếp lịch"}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

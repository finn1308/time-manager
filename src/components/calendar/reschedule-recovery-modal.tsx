"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Zap,
  Leaf,
  ArrowRight,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { RecoveryProposal, MissedSessionItem } from "@/lib/scheduling/reschedule-engine";

import { toast } from "sonner";
interface RescheduleRecoveryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RescheduleRecoveryModal({
  open,
  onClose,
  onSuccess,
}: RescheduleRecoveryModalProps) {
  const [loading, setLoading] = useState(true);
  const [missedCount, setMissedCount] = useState(0);
  const [totalMissedHours, setTotalMissedHours] = useState(0);
  const [missedSessions, setMissedSessions] = useState<MissedSessionItem[]>([]);
  const [optionA, setOptionA] = useState<RecoveryProposal | null>(null);
  const [optionB, setOptionB] = useState<RecoveryProposal | null>(null);

  // Today Reschedule state
  const [todayMode, setTodayMode] = useState<"TOMORROW" | "SPREAD_WEEK">("SPREAD_WEEK");
  const [isReschedulingToday, setIsReschedulingToday] = useState(false);
  const [isApplyingOption, setIsApplyingOption] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/reschedule/missed");
      const data = await res.json();

      if (data.success) {
        setMissedCount(data.missedCount);
        setTotalMissedHours(data.totalMissedHours);
        setMissedSessions(data.missedSessions || []);
        setOptionA(data.optionA || null);
        setOptionB(data.optionB || null);
      }
    } catch (err) {
      console.error("Error loading missed sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setAlertMessage(null);
      loadData();
    }
  }, [open]);

  // Handle "Đổi lịch học hôm nay"
  const handleRescheduleToday = async () => {
    setIsReschedulingToday(true);
    try {
      const res = await fetch("/api/ai/reschedule/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: todayMode }),
      });
      const data = await res.json();

      if (data.success) {
        setAlertMessage(data.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        toast.error(data.error || "Không thể dời lịch hôm nay");
      }
    } catch (err: any) {
      toast.error("Lỗi khi dời lịch hôm nay");
    } finally {
      setIsReschedulingToday(false);
    }
  };

  // Handle apply recovery option
  const handleApplyOption = async (proposal: RecoveryProposal) => {
    setIsApplyingOption(true);
    try {
      const missedSessionIds = missedSessions.map((s) => s.id);
      const res = await fetch("/api/ai/reschedule/apply-option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal,
          missedSessionIds,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setAlertMessage(data.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        toast.error(data.error || "Không thể áp dụng phương án");
      }
    } catch (err) {
      toast.error("Lỗi khi áp dụng phương án");
    } finally {
      setIsApplyingOption(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] text-xs font-bold w-fit mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
            <span>AI RESCHEDULER & CATCH-UP ENGINE</span>
          </div>
          <DialogTitle className="text-lg font-bold text-[var(--text-ink)]">
            Khôi phục phiên học bỏ lỡ & Đổi lịch linh hoạt
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-subtle)]">
            Hệ thống phát hiện các phiên bị gián đoạn và tính toán phương án học bù khoa học không dồn quá tải.
          </DialogDescription>
        </DialogHeader>

        {alertMessage && (
          <div className="p-3.5 rounded-2xl bg-[var(--mint)] text-white text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#a3bda9] shrink-0" />
            <span>{alertMessage}</span>
          </div>
        )}

        {/* SECTION 1: RESCHEDULE TODAY CARD */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[var(--mint-dark)]" />
              <h4 className="text-xs font-bold text-[var(--text-ink)]">
                Hôm nay có việc đột xuất?
              </h4>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              Dời các phiên còn lại hôm nay
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2 text-xs">
              <label className="text-[var(--text-subtle)]">Phương thức dời:</label>
              <select
                value={todayMode}
                onChange={(e) => setTodayMode(e.target.value as any)}
                className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-ink)] outline-none"
              >
                <option value="SPREAD_WEEK">Rải đều sang các ngày trong tuần (Tránh dồn)</option>
                <option value="TOMORROW">Dời tập trung sang ngày mai</option>
              </select>
            </div>

            <Button
              size="sm"
              disabled={isReschedulingToday}
              onClick={handleRescheduleToday}
              className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-xl text-xs font-semibold h-8 px-3 flex items-center space-x-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isReschedulingToday ? "Đang dời lịch..." : "Đổi lịch học hôm nay"}</span>
            </Button>
          </div>
        </div>

        {/* SECTION 2: MISSED SESSIONS ALERT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-ink)]">
              Phiên học bị lỡ gần đây:
            </span>
            <span className="font-semibold text-[#d97706]">
              {missedCount} buổi ({totalMissedHours}h)
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-[var(--text-subtle)]enter text-xs text-[#526b5c] animate-pulse">
              Đang phân tích các phiên học bị lỡ và tìm slot trống...
            </div>
          ) : missedCount === 0 ? (
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-subtle)]enter text-xs text-[var(--mint-dark)] flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tuyệt vời! Bạn không có buổi học nào bị bỏ lỡ trong 7 ngày qua.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option A vs Option B Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OPTION A */}
                {optionA && (
                  <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-[#fffdfa] dark:bg-[#1f1910] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                        <Zap className="w-4 h-4" />
                        <span>{optionA.title}</span>
                      </div>
                      <p className="text-[11px] text-[#73927d] dark:text-[#a3bda9] mt-1 leading-relaxed">
                        {optionA.subtitle}
                      </p>

                      <div className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-900/40 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                          {optionA.sessions.length} buổi đề xuất ({optionA.totalHours}h)
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {optionA.sessions.map((s, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-white dark:bg-[#142318] border border-amber-200/60 dark:border-amber-900/30 text-[11px]"
                            >
                              <div className="font-semibold text-[var(--text-ink)] truncate">
                                {s.title}
                              </div>
                              <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                                {s.formattedTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={isApplyingOption}
                      onClick={() => handleApplyOption(optionA)}
                      className="w-full bg-[#d97706] hover:bg-[#b45309] text-white rounded-xl text-xs font-semibold h-8 cursor-pointer shadow-2xs mt-2"
                    >
                      <span>Áp dụng Phương án A</span>
                    </Button>
                  </div>
                )}

                {/* OPTION B */}
                {optionB && (
                  <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-[#fbfdfb] dark:bg-[#121f16] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-2 text-[var(--mint-dark)] font-bold text-xs">
                        <Leaf className="w-4 h-4" />
                        <span>{optionB.title}</span>
                      </div>
                      <p className="text-[11px] text-[#73927d] dark:text-[#a3bda9] mt-1 leading-relaxed">
                        {optionB.subtitle}
                      </p>

                      <div className="mt-3 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mint-dark)]">
                          {optionB.sessions.length} buổi chia nhỏ ({optionB.totalHours}h)
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {optionB.sessions.map((s, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-white dark:bg-[#142318] border border-emerald-200/60 dark:border-emerald-900/30 text-[11px]"
                            >
                              <div className="font-semibold text-[var(--text-ink)] truncate">
                                {s.title}
                              </div>
                              <div className="text-[10px] text-[var(--mint-dark)] mt-0.5">
                                {s.formattedTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={isApplyingOption}
                      onClick={() => handleApplyOption(optionB)}
                      className="w-full bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-xl text-xs font-semibold h-8 cursor-pointer shadow-2xs mt-2"
                    >
                      <span>Áp dụng Phương án B (Khuyên dùng)</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-[var(--border)]/60 dark:border-[#263d2e]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl border-[var(--border)] text-xs"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

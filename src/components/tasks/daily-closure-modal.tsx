"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { formatDateDisplay, getNextDayKey } from "@/lib/tasks/smart-todo";
import { toast } from "sonner";

interface DailyClosureModalProps {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    uncompletedTasks: number;
    completionRate: number;
  };
  uncompletedTasks: Array<{
    id: string;
    title: string;
    priority?: string;
    subject?: { name: string; color: string } | null;
  }>;
  onSuccess: () => void;
  isAlreadyClosed?: boolean;
  closedAt?: string | null;
}

export function DailyClosureModal({
  open,
  onClose,
  dateKey,
  stats,
  uncompletedTasks,
  onSuccess,
  isAlreadyClosed = false,
  closedAt,
}: DailyClosureModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const nextDateKey = getNextDayKey(dateKey);

  const formattedDate = formatDateDisplay(dateKey);
  const formattedNextDate = formatDateDisplay(nextDateKey);

  const handleConfirmClosure = async (rolloverToNextDay: boolean) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks/day-closure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey,
          rolloverToNextDay,
          targetDateKey: nextDateKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể chốt ngày");

      toast.success(
        rolloverToNextDay
          ? `Đã chốt ngày! Đã chuyển ${stats.uncompletedTasks} nhiệm vụ sang ${formattedNextDate}`
          : `Đã chốt ngày! Toàn bộ nhiệm vụ được lưu giữ ở ngày cũ.`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi chốt ngày");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !submitting && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#132217] p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
            <ShieldCheck className="w-4 h-4" />
            <span className="uppercase tracking-wider">TỔNG KẾT & CHỐT NGÀY KỶ LUẬT</span>
          </div>

          <DialogTitle className="text-xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
            {isAlreadyClosed ? "Kết quả ngày đã chốt" : "Chốt ngày làm việc"}
          </DialogTitle>

          <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
            Ngày đang tổng kết: <strong className="text-[#192e22] dark:text-[#f0f7f2]">{formattedDate}</strong>
            {closedAt && (
              <span className="block text-[11px] text-[#73927d] mt-0.5">
                Đã chốt lúc: {new Date(closedAt).toLocaleTimeString("vi-VN")} ngày {new Date(closedAt).toLocaleDateString("vi-VN")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress & Summary Bar */}
        <div className="my-3 p-4 rounded-2xl bg-[#f4f8f5] dark:bg-[#192e22]/50 border border-[#dbe7dd] dark:border-[#263d2e] space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#526b5c] dark:text-[#a3bda9]">Tiến độ hoàn thành:</span>
            <span className="text-[#1b4332] dark:text-[#86e2a8] font-bold text-sm">
              {stats.completedTasks}/{stats.totalTasks} ({stats.completionRate}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#dbe7dd] dark:bg-[#263d2e] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#2d6a4f] to-[#52b788] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, stats.completionRate))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2 rounded-xl bg-white dark:bg-[#132217] border border-[#dbe7dd]/60 dark:border-[#263d2e]">
              <div className="text-[10px] text-[#73927d]">Tổng số</div>
              <div className="font-bold text-[#192e22] dark:text-[#f0f7f2]">{stats.totalTasks}</div>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-[#132217] border border-[#dbe7dd]/60 dark:border-[#263d2e]">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Đã xong</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300">{stats.completedTasks}</div>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-[#132217] border border-[#dbe7dd]/60 dark:border-[#263d2e]">
              <div className="text-[10px] text-amber-600 dark:text-amber-400">Chưa xong</div>
              <div className="font-bold text-amber-700 dark:text-amber-300">{stats.uncompletedTasks}</div>
            </div>
          </div>
        </div>

        {/* Uncompleted Tasks Decision Section */}
        {stats.uncompletedTasks > 0 ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bạn có muốn chuyển nhiệm vụ chưa xong sang ngày mai?</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Bạn đã hoàn thành <strong>{stats.completedTasks}/{stats.totalTasks}</strong> nhiệm vụ. Bạn có muốn chuyển{" "}
                <strong>{stats.uncompletedTasks}</strong> nhiệm vụ chưa hoàn thành sang <strong>{formattedNextDate}</strong> không?
              </p>

              {/* List of uncompleted tasks preview */}
              <div className="pt-1.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {uncompletedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-[#132217]/80 text-xs border border-amber-200/60 dark:border-amber-900/40"
                  >
                    <span className="truncate font-medium text-[#192e22] dark:text-[#f0f7f2] text-[11px]">
                      {t.title}
                    </span>
                    {t.subject && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0 ml-2"
                        style={{ backgroundColor: t.subject.color || "#2d6a4f" }}
                      >
                        {t.subject.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#73927d] italic text-center">
              * Lịch sử ngày cũ vẫn giữ nguyên tỷ lệ {stats.completionRate}%, không bị ghi đè.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
              Xuất sắc! Đã hoàn thành 100% nhiệm vụ
            </h4>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Bạn không còn nhiệm vụ nào tồn đọng trong ngày này. Hãy chốt ngày để lưu giữ kỷ lục hoàn hảo này!
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {stats.uncompletedTasks > 0 ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => handleConfirmClosure(false)}
                className="w-full sm:w-auto flex-1 rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-xs font-semibold text-[#526b5c] hover:bg-[#f4f8f5]"
              >
                KHÔNG, GIỮ Ở NGÀY CŨ
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirmClosure(true)}
                className="w-full sm:w-auto flex-1 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm"
              >
                CÓ, CHUYỂN SANG NGÀY MAI
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="w-full sm:w-auto flex-1 rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-xs font-semibold"
              >
                Đóng
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirmClosure(false)}
                className="w-full sm:w-auto flex-1 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm"
              >
                {isAlreadyClosed ? "CẬP NHẬT CHỐT NGÀY" : "XÁC NHẬN CHỐT NGÀY"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Sparkles, AlertTriangle, CheckCircle2, ArrowRight, HelpCircle, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { addDays, parseISO } from "date-fns";
import { getDateKeyVN, getDayOfWeekVN, makeVNDate } from "@/lib/date-utils";

import { toast } from "sonner";
interface WhatIfSimulatorModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; color: string; targetHours?: number; completedHours?: number }>;
  weeklyBudgetHours?: number;
  weeklyActualHours?: number;
  onSuccess?: () => void;
}

export function WhatIfSimulatorModal({
  open,
  onClose,
  subjects,
  weeklyBudgetHours = 20,
  weeklyActualHours = 12,
  onSuccess,
}: WhatIfSimulatorModalProps) {
  const router = useRouter();

  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [additionalHours, setAdditionalHours] = useState("2");
  const [targetDayOfWeek, setTargetDayOfWeek] = useState("3"); // Wednesday
  const [timeSlot, setTimeSlot] = useState("evening"); // morning, afternoon, evening
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    hasConflict: boolean;
    conflictDetail: string | null;
    newWeeklyTotal: number;
    budgetPercent: number;
    affectedSubjectName: string;
    oldProgress: number;
    newProgress: number;
    suggestedTime: string;
  } | null>(null);

  const [isApplying, setIsApplying] = useState(false);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);

    const hours = parseFloat(additionalHours) || 2;
    const sub = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
    const targetH = sub?.targetHours || 10;
    const currentCompleted = sub?.completedHours || 0;

    const oldProg = targetH > 0 ? Math.round((currentCompleted / targetH) * 100) : 0;
    const newProg = targetH > 0 ? Math.min(100, Math.round(((currentCompleted + hours) / targetH) * 100)) : 0;

    const newWeekly = weeklyActualHours + hours;
    const budgetPct = Math.round((newWeekly / weeklyBudgetHours) * 100);

    // Simulated time text across the 4 periods
    const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const slotTimes: Record<string, string> = {
      morning: "08:30 - " + (8 + Math.floor(hours)) + ":" + ((hours % 1) * 60 === 0 ? "30" : "00"),
      noon: "12:30 - " + (12 + Math.floor(hours)) + ":" + ((hours % 1) * 60 === 0 ? "30" : "00"),
      afternoon: "14:30 - " + (14 + Math.floor(hours)) + ":" + ((hours % 1) * 60 === 0 ? "30" : "00"),
      evening: "19:30 - " + (19 + Math.floor(hours)) + ":" + ((hours % 1) * 60 === 0 ? "30" : "00"),
    };

    // Check if slot has conflict (e.g. if hours > 4 in evening, warn)
    const hasConflict = hours > 4 && timeSlot === "evening";

    setSimResult({
      hasConflict,
      conflictDetail: hasConflict ? "Cảnh báo: Học buổi tối quá 4 tiếng có thể gây quá tải giấc ngủ." : null,
      newWeeklyTotal: Math.round(newWeekly * 10) / 10,
      budgetPercent: budgetPct,
      affectedSubjectName: sub?.name || "Môn học",
      oldProgress: oldProg,
      newProgress: newProg,
      suggestedTime: `${dayNames[parseInt(targetDayOfWeek, 10)]}, ${slotTimes[timeSlot] || "19:30 - 21:30"}`,
    });

    setIsSimulating(false);
  };

  const handleApplyScenario = async () => {
    if (!simResult) return;
    setIsApplying(true);
    try {
      const todayKey = getDateKeyVN(new Date());
      const todayBase = parseISO(todayKey);
      const targetDow = parseInt(targetDayOfWeek, 10);
      const currentDow = getDayOfWeekVN(new Date());
      let diff = targetDow - currentDow;
      if (diff <= 0) diff += 7;
      const targetDateKey = getDateKeyVN(addDays(todayBase, diff));

      let startHM = "19:30";
      if (timeSlot === "morning") startHM = "08:30";
      else if (timeSlot === "noon") startHM = "12:30";
      else if (timeSlot === "afternoon") startHM = "14:30";

      const scheduledDate = makeVNDate(targetDateKey, startHM);
      const hours = parseFloat(additionalHours) || 2;
      const endDate = new Date(scheduledDate.getTime() + hours * 3600000);

      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Học môn ${simResult.affectedSubjectName}`,
          subjectId: selectedSubjectId,
          startTime: scheduledDate.toISOString(),
          endTime: endDate.toISOString(),
          type: "STUDY",
          timezone: "Asia/Ho_Chi_Minh",
        }),
      });

      if (!res.ok) throw new Error("Không thể lưu kịch bản");
      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi áp dụng kịch bản");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#2d6a4f] dark:text-[#52b788] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Kịch bản giả định (What-If Simulator)</span>
          </div>
          <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Thử nghiệm phân bổ thời gian trước khi lưu
          </DialogTitle>
          <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
            Khảo sát: "Nếu tôi thêm X giờ cho môn Y vào thứ Z thì sẽ ảnh hưởng thế nào đến deadline và ngân sách tuần?"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSimulate} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Môn học muốn thử
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fcfdfc] dark:bg-[#142318] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Số giờ thêm (Hours)
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={additionalHours}
                onChange={(e) => setAdditionalHours(e.target.value)}
                required
                className="rounded-2xl border-[#dbe7dd] focus:ring-[#2d6a4f] text-xs h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Vào ngày trong tuần
              </label>
              <select
                value={targetDayOfWeek}
                onChange={(e) => setTargetDayOfWeek(e.target.value)}
                className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fcfdfc] dark:bg-[#142318] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              >
                <option value="1">Thứ Hai</option>
                <option value="2">Thứ Ba</option>
                <option value="3">Thứ Tư</option>
                <option value="4">Thứ Năm</option>
                <option value="5">Thứ Sáu</option>
                <option value="6">Thứ Bảy</option>
                <option value="0">Chủ Nhật</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Khung giờ ưu tiên
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fcfdfc] dark:bg-[#142318] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              >
                <option value="morning">🌅 Buổi sáng (08:30)</option>
                <option value="noon">☀️ Buổi trưa (12:30)</option>
                <option value="afternoon">🌤️ Buổi chiều (14:30)</option>
                <option value="evening">🌙 Buổi tối (19:30)</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full rounded-2xl border-[#dbe7dd] text-[#2d6a4f] hover:bg-[#d8ebe0] font-semibold text-xs h-10 space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chạy mô phỏng kịch bản (Simulate)</span>
          </Button>
        </form>

        {/* Simulation Output Area */}
        {simResult && (
          <div className="mt-3 p-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Kết quả dự báo kịch bản:
              </span>
              <Badge variant={simResult.hasConflict ? "yellow" : "green"} className="text-[11px]">
                {simResult.hasConflict ? "Cần điều chỉnh" : "Khả thi 100%"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#111e14] border border-[#dbe7dd]/80 dark:border-[#263d2e]">
                <div className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">Tiến độ môn học</div>
                <div className="text-sm font-bold text-[#2d6a4f] dark:text-[#52b788] mt-0.5">
                  {simResult.oldProgress}% → {simResult.newProgress}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#111e14] border border-[#dbe7dd]/80 dark:border-[#263d2e]">
                <div className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">Ngân sách tuần</div>
                <div className="text-sm font-bold text-[#2d6a4f] dark:text-[#52b788] mt-0.5">
                  {simResult.newWeeklyTotal}h ({simResult.budgetPercent}%)
                </div>
              </div>
            </div>

            <div className="text-xs text-[#526b5c] dark:text-[#a3bda9] flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Thời gian đề xuất: <strong>{simResult.suggestedTime}</strong></span>
            </div>

            {simResult.conflictDetail && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {simResult.conflictDetail}
              </p>
            )}

            <Button
              type="button"
              onClick={handleApplyScenario}
              disabled={isApplying}
              className="w-full rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs h-10 mt-2 space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isApplying ? "Đang áp dụng..." : "Áp dụng kịch bản vào Lịch thật"}</span>
            </Button>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-2xl text-[#526b5c] text-xs"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

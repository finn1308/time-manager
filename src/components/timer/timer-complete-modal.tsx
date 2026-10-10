"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { ActiveSubject } from "./pip-timer-provider";
import { Star, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
interface TimerCompleteModalProps {
  subject: ActiveSubject;
  scheduleEventId: string | null;
  flexibleGoalId?: string | null;
  taskId?: string | null;
  seconds: number;
  open: boolean;
  onClose: () => void;
}

export function TimerCompleteModal({
  subject,
  scheduleEventId,
  flexibleGoalId,
  taskId,
  seconds,
  open,
  onClose,
}: TimerCompleteModalProps) {
  const router = useRouter();
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  const [productivityScore, setProductivityScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const isSkill = subject.color === "#2d6a4f" && !subject.code;
      const payload = {
        subjectId: isSkill ? undefined : subject.id,
        skillId: isSkill ? subject.id : undefined,
        flexibleGoalId: flexibleGoalId || undefined,
        calendarEventId: scheduleEventId,
        taskId: taskId || null,
        actualDurationSeconds: seconds,
        productivityScore,
        notes: notes.trim() || null,
      };

      if (!navigator.onLine) {
        // Save to offline storage
        const offlineData = JSON.parse(localStorage.getItem("offline_study_sessions") || "[]");
        offlineData.push({ ...payload, timestamp: Date.now() });
        localStorage.setItem("offline_study_sessions", JSON.stringify(offlineData));
        toast.success("Mất kết nối mạng. Đã lưu phiên học ngoại tuyến (Offline).");
        window.dispatchEvent(new Event("chronomind-study-updated"));
        onClose();
        return;
      }

      const res = await fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save study log");
      }

      toast.success("Đã ghi nhận thời gian học thành công!");
      window.dispatchEvent(new Event("chronomind-study-updated"));
      router.refresh();
      onClose();
    } catch (e) {
      console.error(e);
      const isSkill = subject.color === "#2d6a4f" && !subject.code;
      const payload = {
        subjectId: isSkill ? undefined : subject.id,
        skillId: isSkill ? subject.id : undefined,
        flexibleGoalId: flexibleGoalId || undefined,
        calendarEventId: scheduleEventId,
        taskId: taskId || null,
        actualDurationSeconds: seconds,
        productivityScore,
        notes: notes.trim() || null,
      };
      const offlineData = JSON.parse(localStorage.getItem("offline_study_sessions") || "[]");
      offlineData.push({ ...payload, timestamp: Date.now() });
      localStorage.setItem("offline_study_sessions", JSON.stringify(offlineData));
      toast.success("Đã xảy ra lỗi mạng. Đã lưu phiên học ngoại tuyến (Offline).");
      window.dispatchEvent(new Event("chronomind-study-updated"));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] text-xs font-bold w-fit mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
            <span>HOÀN THÀNH PHIÊN HỌC</span>
          </div>
          <DialogTitle>Ghi nhận thời gian: {subject.name}</DialogTitle>
          <DialogDescription>
            Phiên học đã kết thúc. Thời gian thực tế chính xác sẽ được lưu vào cơ sở dữ liệu và tích lũy vào môn học.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Duration Summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--mint-bg)] border border-[var(--border)]">
            <div className="flex items-center space-x-2.5 text-xs font-semibold text-[var(--text-subtle)]">
              <Clock className="w-4 h-4 text-[var(--mint-dark)]" />
              <span>Thời gian thực tế (Actual):</span>
            </div>
            <div className="font-mono text-base font-black text-[var(--text-ink)]">
              {minutes > 0 ? `${minutes} phút ` : ""}{remainderSeconds}s
            </div>
          </div>

          {/* Productivity Rating */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-2">
              Đánh giá năng suất (1 - 5 sao):
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setProductivityScore(star)}
                  className={`p-1.5 rounded-full transition-transform cursor-pointer hover:scale-110 ${
                    star <= productivityScore ? "text-amber-400" : "text-[#dbe7dd] dark:text-[#263d2e]"
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
              <span className="text-xs font-semibold text-[var(--text-subtle)] ml-2">
                {productivityScore === 5
                  ? "Rất tập trung 🔥"
                  : productivityScore >= 3
                  ? "Tốt 👍"
                  : "Chưa tập trung"}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
              Ghi chú phiên học:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã làm xong bài tập, hiểu rõ cấu trúc bài..."
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[var(--text-ink)]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-2xl">
            Bỏ qua
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu vào cơ sở dữ liệu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

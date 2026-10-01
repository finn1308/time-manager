"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { ActiveSubject } from "./pip-timer-provider";
import { Star, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface TimerCompleteModalProps {
  subject: ActiveSubject;
  scheduleEventId: string | null;
  seconds: number;
  open: boolean;
  onClose: () => void;
}

export function TimerCompleteModal({
  subject,
  scheduleEventId,
  seconds,
  open,
  onClose,
}: TimerCompleteModalProps) {
  const router = useRouter();
  const minutes = Math.max(1, Math.round(seconds / 60));
  const [productivityScore, setProductivityScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/timer/save-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          scheduleEventId,
          durationMinutes: minutes,
          productivityScore,
          notes: notes.trim() || null,
          source: "PIP_TIMER",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save study log");
      }

      router.refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Không thể lưu phiên học. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold w-fit mb-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>HOÀN THÀNH PHIÊN HỌC</span>
          </div>
          <DialogTitle>Ghi nhận tiến độ: {subject.name}</DialogTitle>
          <DialogDescription>
            Tuyệt vời! Bạn vừa hoàn thành một phiên tập trung học tập. Hãy lưu lại đánh giá để cập nhật báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Duration Summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-500">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Thời gian thực tế:</span>
            </div>
            <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
              {minutes} phút
            </div>
          </div>

          {/* Productivity Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Mức độ tập trung & Năng suất (1 - 5 sao):
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setProductivityScore(star)}
                  className={`p-2 rounded-full transition-transform cursor-pointer hover:scale-110 ${
                    star <= productivityScore ? "text-amber-400" : "text-slate-200 dark:text-slate-700"
                  }`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-500 ml-2">
                {productivityScore === 5
                  ? "Xuất sắc 🔥"
                  : productivityScore === 4
                  ? "Rất tốt ✨"
                  : productivityScore === 3
                  ? "Ổn định 👍"
                  : "Cần cải thiện"}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú nhanh / Thu hoạch sau buổi học:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã làm xong 3 bài tập về đồ thị, cần xem lại phần định lý Bayes..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Bỏ qua
          </Button>
          <Button variant="default" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu vào Dashboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

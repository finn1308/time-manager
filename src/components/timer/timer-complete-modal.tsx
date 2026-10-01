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
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Hoàn thành phiên học</span>
          </div>
          <DialogTitle>Ghi nhận tiến độ: {subject.name}</DialogTitle>
          <DialogDescription>
            Chúc mừng bạn vừa hoàn thành một phiên tập trung học tập! Hãy lưu lại đánh giá để cập nhật báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Duration Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#f7f6f3] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e]">
            <div className="flex items-center space-x-2 text-sm text-[#787774]">
              <Clock className="w-4 h-4" />
              <span>Thời gian thực tế:</span>
            </div>
            <div className="font-mono text-base font-bold text-[#37352f] dark:text-[#f0f0f0]">
              {minutes} phút
            </div>
          </div>

          {/* Productivity Rating */}
          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1.5">
              Mức độ tập trung & Năng suất (1 - 5 sao):
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setProductivityScore(star)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    star <= productivityScore ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
              <span className="text-xs font-medium text-[#787774] ml-2">
                {productivityScore === 5
                  ? "Xuất sắc"
                  : productivityScore === 4
                  ? "Tốt"
                  : productivityScore === 3
                  ? "Bình thường"
                  : "Cần cải thiện"}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1.5">
              Ghi chú nhanh / Thu hoạch sau buổi học:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã làm xong 3 bài tập về đồ thị, cần xem lại phần định lý Bayes..."
              className="w-full rounded-md border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] p-2.5 text-sm placeholder:text-[#9b9a97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
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

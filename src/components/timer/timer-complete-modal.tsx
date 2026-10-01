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
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  const [productivityScore, setProductivityScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          calendarEventId: scheduleEventId,
          actualDurationSeconds: seconds,
          productivityScore,
          notes: notes.trim() || null,
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
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#d8ebe0] text-[#1b4332] text-xs font-bold w-fit mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>HOÀN THÀNH PHIÊN HỌC</span>
          </div>
          <DialogTitle>Ghi nhận thời gian: {subject.name}</DialogTitle>
          <DialogDescription>
            Phiên học đã kết thúc. Thời gian thực tế chính xác sẽ được lưu vào cơ sở dữ liệu và tích lũy vào môn học.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Duration Summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#eef5f0] dark:bg-[#1d3024] border border-[#dbe7dd] dark:border-[#263d2e]">
            <div className="flex items-center space-x-2.5 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9]">
              <Clock className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
              <span>Thời gian thực tế (Actual):</span>
            </div>
            <div className="font-mono text-base font-black text-[#192e22] dark:text-[#f0f7f2]">
              {minutes > 0 ? `${minutes} phút ` : ""}{remainderSeconds}s
            </div>
          </div>

          {/* Productivity Rating */}
          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-2">
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
              <span className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] ml-2">
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
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
              Ghi chú phiên học:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã làm xong bài tập, hiểu rõ cấu trúc bài..."
              className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2]"
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
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu vào cơ sở dữ liệu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

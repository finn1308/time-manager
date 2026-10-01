"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null }>;
  editingGoal?: {
    id: string;
    subjectId: string;
    targetHours: number;
    startDate: string;
    endDate: string;
    isAutoAlloc: boolean;
    priority: number;
    notes: string | null;
  } | null;
}

export function GoalDialog({ open, onClose, subjects, editingGoal }: GoalDialogProps) {
  const router = useRouter();

  const [subjectId, setSubjectId] = useState(editingGoal ? editingGoal.subjectId : subjects[0]?.id || "");
  const [targetHours, setTargetHours] = useState(editingGoal ? editingGoal.targetHours.toString() : "20");
  const [priority, setPriority] = useState(editingGoal ? editingGoal.priority : 3);
  const [isAutoAlloc, setIsAutoAlloc] = useState(editingGoal ? editingGoal.isAutoAlloc : true);
  const [notes, setNotes] = useState(editingGoal ? editingGoal.notes || "" : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      setErrorMsg("Số giờ mục tiêu phải là số dương");
      setIsSubmitting(false);
      return;
    }

    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const res = await fetch("/api/subjects/goals", {
        method: editingGoal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGoal?.id,
          subjectId,
          targetHours: hours,
          priority: Number(priority),
          isAutoAlloc,
          notes: notes.trim() || null,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu mục tiêu");

      router.refresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingGoal ? "Chỉnh sửa mục tiêu môn học" : "Thiết lập mục tiêu số giờ học"}</DialogTitle>
          <DialogDescription>
            Đặt chỉ tiêu số giờ bạn muốn hoàn thành trong kỳ/tháng này và mức độ ưu tiên để AI phân bổ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-50 text-xs text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">Môn học *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-9 rounded-md border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              disabled={!!editingGoal}
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ""}
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#787774] mb-1">Số giờ mục tiêu *</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="500"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#787774] mb-1">Độ ưu tiên (1 - 5)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="w-full h-9 rounded-md border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                <option value={5}>5 (Cao nhất - Trọng tâm)</option>
                <option value={4}>4 (Cao)</option>
                <option value={3}>3 (Trung bình)</option>
                <option value={2}>2 (Thấp)</option>
                <option value={1}>1 (Tùy ý)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="isAutoAlloc"
              checked={isAutoAlloc}
              onChange={(e) => setIsAutoAlloc(e.target.checked)}
              className="rounded border-[#e9e9e7] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isAutoAlloc" className="text-xs font-medium text-[#37352f] dark:text-[#d4d4d4] cursor-pointer">
              Cho phép AI tự động phân bổ lịch học cho môn này
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">Ghi chú mục tiêu</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cần hoàn thành trước kỳ thi giữa kỳ ngày 25..."
              className="w-full rounded-md border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] p-2 text-sm placeholder:text-[#9b9a97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editingGoal ? "Cập nhật" : "Lưu mục tiêu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

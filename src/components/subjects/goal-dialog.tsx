"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code?: string | null }>;
  editingGoal?: {
    id: string;
    subjectId: string | null;
    title: string;
    description: string | null;
    targetHours: number;
    deadline: string | null;
    status: string;
  } | null;
}

export function GoalDialog({ open, onClose, subjects, editingGoal }: GoalDialogProps) {
  const router = useRouter();

  const [title, setTitle] = useState(editingGoal ? editingGoal.title : "");
  const [subjectId, setSubjectId] = useState(editingGoal ? editingGoal.subjectId || "" : subjects[0]?.id || "");
  const [targetHours, setTargetHours] = useState(editingGoal ? editingGoal.targetHours.toString() : "10");
  const [deadline, setDeadline] = useState(
    editingGoal?.deadline ? new Date(editingGoal.deadline).toISOString().split("T")[0] : ""
  );
  const [description, setDescription] = useState(editingGoal ? editingGoal.description || "" : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      setErrorMsg("Số giờ mục tiêu phải là số dương lớn hơn 0");
      setIsSubmitting(false);
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề mục tiêu");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/goals", {
        method: editingGoal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingGoal?.id,
          title: title.trim(),
          subjectId: subjectId || null,
          targetHours: hours,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          description: description.trim() || null,
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
      <DialogContent onClose={onClose} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
            {editingGoal ? "Chỉnh sửa mục tiêu học tập" : "Thêm mục tiêu học tập mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
            Đặt chỉ tiêu số giờ hoàn thành và thời hạn deadline để AI lập lịch khoa học.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#f7ebeb] text-xs font-medium text-[#b87474] border border-[#f0c4c4]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
              Tiêu đề mục tiêu *
            </label>
            <Input
              type="text"
              placeholder="VD: Ôn luyện 20 giờ Writing & Reading IELTS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-2xl border-[#dbe7dd] focus:ring-[#2d6a4f] text-xs h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Môn học gắn kèm
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fcfdfc] dark:bg-[#142318] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              >
                <option value="">(Không gắn môn cụ thể)</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code ? `[${sub.code}] ` : ""}
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Số giờ mục tiêu *
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="500"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                required
                className="rounded-2xl border-[#dbe7dd] focus:ring-[#2d6a4f] text-xs h-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
              Thời hạn hoàn thành (Deadline)
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-2xl border-[#dbe7dd] focus:ring-[#2d6a4f] text-xs h-10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
              Ghi chú chi tiết
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Tập trung vào giải đề Cambridge và ôn từ vựng band 7.0+..."
              className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fcfdfc] dark:bg-[#142318] p-3 text-xs text-[#192e22] dark:text-[#f0f7f2] placeholder:text-[#8ba393] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl border-[#dbe7dd] text-[#526b5c]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold"
            >
              {isSubmitting ? "Đang lưu..." : editingGoal ? "Cập nhật" : "Lưu mục tiêu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

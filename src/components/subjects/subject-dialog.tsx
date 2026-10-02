"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";

interface SubjectDialogProps {
  open: boolean;
  onClose: () => void;
  editingSubject?: {
    id: string;
    name: string;
    code: string | null;
    color: string;
    description: string | null;
    targetHours?: number | null;
    priority?: number;
    targetScore?: string | null;
    deadline?: string | Date | null;
    difficulty?: string;
    estimatedWorkload?: number | null;
    isArchived?: boolean;
  } | null;
  usedColors: string[];
}

const DIVERSE_PASTEL_PALETTE = [
  "#2d6a4f", // Deep Botanical Green
  "#82a3ff", // Pastel Blue
  "#87ceeb", // Pastel Sky
  "#b19cd9", // Pastel Purple
  "#e6e6fa", // Pastel Lavender
  "#ffb6c1", // Pastel Pink
  "#ffc0cb", // Pastel Rose
  "#ffdab9", // Pastel Peach
  "#fdfd96", // Pastel Yellow
  "#98ff98", // Pastel Mint
  "#e0ffff", // Pastel Cyan
  "#79d2c0", // Pastel Teal
  "#ff9999", // Pastel Red/Orange
];

export function SubjectDialog({ open, onClose, editingSubject, usedColors }: SubjectDialogProps) {
  const router = useRouter();

  const getUnusedColor = () => {
    const available = DIVERSE_PASTEL_PALETTE.filter((c) => !usedColors.includes(c));
    return available.length > 0
      ? available[0]
      : DIVERSE_PASTEL_PALETTE[Math.floor(Math.random() * DIVERSE_PASTEL_PALETTE.length)];
  };

  const [name, setName] = useState(editingSubject ? editingSubject.name : "");
  const [code, setCode] = useState(editingSubject ? editingSubject.code || "" : "");
  const [color, setColor] = useState(editingSubject ? editingSubject.color : getUnusedColor());
  const [targetHours, setTargetHours] = useState(editingSubject?.targetHours ? String(editingSubject.targetHours) : "");
  const [priority, setPriority] = useState(editingSubject?.priority ? String(editingSubject.priority) : "3");
  const [targetScore, setTargetScore] = useState(editingSubject?.targetScore || "");
  const [deadline, setDeadline] = useState(
    editingSubject?.deadline ? new Date(editingSubject.deadline).toISOString().split("T")[0] : ""
  );
  const [difficulty, setDifficulty] = useState(editingSubject?.difficulty || "MEDIUM");
  const [estimatedWorkload, setEstimatedWorkload] = useState(
    editingSubject?.estimatedWorkload ? String(editingSubject.estimatedWorkload) : ""
  );
  const [description, setDescription] = useState(editingSubject ? editingSubject.description || "" : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleColorSelect = (c: string) => {
    if (usedColors.includes(c) && (!editingSubject || editingSubject.color !== c)) {
      if (!confirm("Màu này đã được môn học khác sử dụng. Bạn có chắc muốn dùng lại màu này không?")) {
        return;
      }
    }
    setColor(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/subjects", {
        method: editingSubject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSubject?.id,
          name: name.trim(),
          code: code.trim() || null,
          color,
          targetHours: parseFloat(targetHours) || null,
          priority: parseInt(priority, 10) || 3,
          targetScore: targetScore.trim() || null,
          deadline: deadline || null,
          difficulty,
          estimatedWorkload: parseFloat(estimatedWorkload) || null,
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu môn học");

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
      <DialogContent onClose={onClose} className="max-w-md max-h-[90vh] overflow-y-auto rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{editingSubject ? "Chỉnh sửa môn học" : "Thêm môn học mới"}</DialogTitle>
          <DialogDescription>
            Thiết lập tên môn, mục tiêu điểm số, chỉ tiêu số giờ, độ khó và hạn chót.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#f7ebeb] text-xs text-[#8a3c3c] border border-[#e8c6c6]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
              Tên môn học *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: IELTS Academic, Giải tích 1..."
              required
              className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Mã môn
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="IELTS..."
                className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Chỉ tiêu (giờ/tuần)
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                placeholder="VD: 8"
                className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Độ ưu tiên (1-5)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="5">5 (Cao nhất)</option>
                <option value="4">4 (Cao)</option>
                <option value="3">3 (Trung bình)</option>
                <option value="2">2 (Thấp)</option>
                <option value="1">1 (Tối thiểu)</option>
              </select>
            </div>
          </div>

          {/* Target Score & Difficulty & Workload (Phần 6) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Mục tiêu điểm số
              </label>
              <Input
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                placeholder="VD: 6.5, A+, 9.0"
                className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Độ khó (Difficulty)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="EASY">Dễ (Easy)</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó (Hard)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Ước tính tải (giờ)
              </label>
              <Input
                type="number"
                step="1"
                min="1"
                value={estimatedWorkload}
                onChange={(e) => setEstimatedWorkload(e.target.value)}
                placeholder="VD: 50h"
                className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
              Thời hạn / Ngày thi môn học (Deadline)
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-2xl border-[#dbe7dd] h-10 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
              Màu đại diện (Pastel Palette)
            </label>
            <div className="flex flex-wrap gap-2">
              {DIVERSE_PASTEL_PALETTE.map((c) => {
                const isUsed = usedColors.includes(c) && (!editingSubject || editingSubject.color !== c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorSelect(c)}
                    title={isUsed ? "Đã sử dụng" : "Có sẵn"}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      color === c ? "ring-2 ring-offset-2 ring-[#2d6a4f] scale-110" : "hover:scale-105"
                    } ${isUsed ? "opacity-30 grayscale" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
              Mô tả / Đề cương
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú nội dung trọng tâm của môn học này..."
              className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-2xl text-xs">
              Hủy
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl font-semibold text-xs h-10 px-5"
            >
              {isSubmitting ? "Đang lưu..." : editingSubject ? "Cập nhật" : "Tạo môn học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

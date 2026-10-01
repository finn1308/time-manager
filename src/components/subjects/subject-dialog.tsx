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
  } | null;
}

const PASTEL_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

export function SubjectDialog({ open, onClose, editingSubject }: SubjectDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(editingSubject ? editingSubject.name : "");
  const [code, setCode] = useState(editingSubject ? editingSubject.code || "" : "");
  const [color, setColor] = useState(editingSubject ? editingSubject.color : PASTEL_COLORS[0]);
  const [description, setDescription] = useState(editingSubject ? editingSubject.description || "" : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSubject ? "Chỉnh sửa môn học" : "Thêm môn học mới"}</DialogTitle>
          <DialogDescription>
            Thiết lập tên môn, mã số và màu đại diện phong cách Notion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-50 text-xs text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">Tên môn học *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cấu trúc dữ liệu & Giải thuật"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">Mã môn (Tùy chọn)</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: CS102, ENG301..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1.5">Màu đại diện</label>
            <div className="flex items-center space-x-2">
              {PASTEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">Mô tả / Đề cương</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú nội dung trọng tâm của môn học này..."
              className="w-full rounded-md border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] p-2 text-sm placeholder:text-[#9b9a97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editingSubject ? "Cập nhật" : "Tạo môn học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

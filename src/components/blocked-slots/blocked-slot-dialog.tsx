"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

interface BlockedSlotDialogProps {
  open: boolean;
  onClose: () => void;
  editingSlot?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number | null;
    isLocked: boolean;
  } | null;
}

export function BlockedSlotDialog({ open, onClose, editingSlot }: BlockedSlotDialogProps) {
  const router = useRouter();

  const [title, setTitle] = useState(editingSlot ? editingSlot.title : "");
  const [startTime, setStartTime] = useState(editingSlot ? editingSlot.startTime : "23:30");
  const [endTime, setEndTime] = useState(editingSlot ? editingSlot.endTime : "06:30");
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    editingSlot?.dayOfWeek !== null && editingSlot?.dayOfWeek !== undefined
      ? editingSlot.dayOfWeek.toString()
      : "ALL"
  );
  const [isLocked, setIsLocked] = useState(editingSlot ? editingSlot.isLocked : true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const daysToCreate: number[] = dayOfWeek === "ALL" ? [0, 1, 2, 3, 4, 5, 6] : [parseInt(dayOfWeek, 10)];

      const res = await fetch("/api/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSlot?.id,
          title: title.trim(),
          startTime,
          endTime,
          dayOfWeek: dayOfWeek === "ALL" ? 1 : parseInt(dayOfWeek, 10),
          daysToCreate: editingSlot ? undefined : daysToCreate,
          isAvailable: !isLocked,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu khung giờ bận");

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
          <DialogTitle>{editingSlot ? "Chỉnh sửa khung giờ bận" : "Khóa khung giờ bận mới"}</DialogTitle>
          <DialogDescription>
            AI sẽ đọc và tuyệt đối không bao giờ chèn bất kỳ buổi học nào vào các khung giờ này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#f7ebeb] text-xs text-[#8a3c3c] border border-[#e8c6c6]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
              Mục đích / Tên khung giờ *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Giờ ngủ đêm, Đi học chính quy trên trường..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Bắt đầu *
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
                Kết thúc *
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1">
              Lặp lại vào thứ:
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full h-11 rounded-[16px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 py-1 text-xs text-[#192e22] dark:text-[#f0f7f2]"
            >
              <option value="ALL">Tất cả các ngày trong tuần (Hằng ngày)</option>
              <option value="1">Thứ Hai</option>
              <option value="2">Thứ Ba</option>
              <option value="3">Thứ Tư</option>
              <option value="4">Thứ Năm</option>
              <option value="5">Thứ Sáu</option>
              <option value="6">Thứ Bảy</option>
              <option value="0">Chủ Nhật</option>
            </select>
          </div>

          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e]">
            <input
              type="checkbox"
              id="isLockedCheck"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="rounded text-[#2d6a4f] focus:ring-[#52b788] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isLockedCheck" className="text-xs text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5 cursor-pointer select-none">
              <Lock className="w-3.5 h-3.5 text-[#a3a86c]" />
              <span className="font-semibold">Khóa cứng (Bắt buộc AI né 100%, không được phép gợi ý đè)</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-2xl">
              Hủy
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl font-semibold"
            >
              {isSubmitting ? "Đang lưu..." : editingSlot ? "Cập nhật" : "Khóa giờ bận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { formatVN, getDateKeyVN, makeVNDate } from "@/lib/date-utils";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null; color: string }>;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSuccess?: () => void;
  editingEvent?: {
    id: string;
    title: string;
    description?: string | null;
    subjectId?: string | null;
    startTime: string;
    endTime: string;
    type?: string;
    isLocked?: boolean;
  } | null;
}

export function EventModal({
  open,
  onClose,
  subjects = [],
  defaultDate = getDateKeyVN(new Date()),
  defaultStartTime = "08:00",
  defaultEndTime = "09:30",
  onSuccess,
  editingEvent,
}: EventModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState(editingEvent ? editingEvent.title : "");
  const [description, setDescription] = useState(editingEvent ? editingEvent.description || "" : "");
  const [subjectId, setSubjectId] = useState<string>(
    editingEvent ? editingEvent.subjectId || "" : subjects[0]?.id || ""
  );

  const [dateStr, setDateStr] = useState<string>(
    editingEvent
      ? formatVN(editingEvent.startTime, "yyyy-MM-dd")
      : defaultDate
  );

  const [startTimeStr, setStartTimeStr] = useState<string>(
    editingEvent
      ? formatVN(editingEvent.startTime, "HH:mm")
      : defaultStartTime
  );

  const [endTimeStr, setEndTimeStr] = useState<string>(
    editingEvent
      ? formatVN(editingEvent.endTime, "HH:mm")
      : defaultEndTime
  );

  const [isLocked, setIsLocked] = useState<boolean>(editingEvent ? !!editingEvent.isLocked : false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (!dateStr) {
        throw new Error("Vui lòng chọn ngày học");
      }
      if (!startTimeStr || !endTimeStr) {
        throw new Error("Vui lòng nhập giờ bắt đầu và kết thúc");
      }

      const startUTC = makeVNDate(dateStr, startTimeStr);
      const endUTC = makeVNDate(dateStr, endTimeStr);

      if (endUTC <= startUTC) {
        throw new Error("Giờ kết thúc phải sau giờ bắt đầu");
      }

      const payload = {
        id: editingEvent?.id,
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId || null,
        startTime: startUTC.toISOString(),
        endTime: endUTC.toISOString(),
        isLocked,
        timezone: "Asia/Ho_Chi_Minh",
      };

      const res = await fetch("/api/calendar/events", {
        method: editingEvent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu sự kiện");
      }

      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !confirm("Bạn có chắc muốn xóa lịch này không?")) return;
    try {
      setIsSubmitting(true);
      await fetch(`/api/calendar/events?id=${editingEvent.id}`, { method: "DELETE" });
      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } catch (e) {
      alert("Không thể xóa sự kiện");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
            {editingEvent ? "Chỉnh sửa lịch học" : "Tạo lịch học mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
            Múi giờ chuẩn: Asia/Ho_Chi_Minh. Kiểm tra xung đột tự động bảo đảm không trùng lịch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#f7ebeb] border border-[#e8c6c6] text-xs text-[#8a3c3c] font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
              Tiêu đề buổi học *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Làm bài tập Giải tích chương 3"
              className="rounded-2xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
              Môn học
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-11 rounded-[16px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-4 py-2 text-xs text-[#192e22] dark:text-[#f0f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
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

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                Ngày (VN) *
              </label>
              <Input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="rounded-2xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                Bắt đầu *
              </label>
              <Input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="rounded-2xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                Kết thúc *
              </label>
              <Input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="rounded-2xl"
                required
              />
            </div>
          </div>

          {/* Locked Checkbox */}
          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e]">
            <input
              type="checkbox"
              id="isLockedCheck"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-4 h-4 rounded text-[#2d6a4f] focus:ring-[#52b788] cursor-pointer"
            />
            <label htmlFor="isLockedCheck" className="text-xs text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5 cursor-pointer select-none">
              <Lock className="w-3.5 h-3.5 text-[#a3a86c]" />
              <span className="font-semibold">Khóa sự kiện này (AI tuyệt đối không được xếp lịch đè)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
              Ghi chú nội dung
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung cần ôn, bài tập hoặc tài liệu..."
              className="w-full rounded-[16px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2]"
            />
          </div>

          <DialogFooter className="flex justify-between items-center pt-2">
            {editingEvent ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                size="sm"
                className="font-semibold rounded-2xl"
              >
                Xóa lịch
              </Button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-2xl border-[#dbe7dd] text-xs">
                Hủy
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl font-semibold text-xs"
              >
                {isSubmitting ? "Đang lưu..." : editingEvent ? "Cập nhật" : "Tạo lịch"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

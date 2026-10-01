"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null; color: string }>;
  defaultDate?: string;
  defaultStartTime?: string;
  editingEvent?: {
    id: string;
    title: string;
    description?: string | null;
    subjectId?: string | null;
    startTime: string;
    endTime: string;
    eventType: string;
  } | null;
}

export function EventModal({
  open,
  onClose,
  subjects,
  defaultDate = new Date().toISOString().split("T")[0],
  defaultStartTime = "14:00",
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
      ? new Date(editingEvent.startTime).toLocaleDateString("en-CA")
      : defaultDate
  );
  const [startTimeStr, setStartTimeStr] = useState<string>(
    editingEvent
      ? new Date(editingEvent.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : defaultStartTime
  );
  const [endTimeStr, setEndTimeStr] = useState<string>(
    editingEvent
      ? new Date(editingEvent.endTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : "15:30"
  );
  const [eventType, setEventType] = useState(editingEvent ? editingEvent.eventType : "STUDY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload = {
        id: editingEvent?.id,
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId || null,
        startTime: `${dateStr}T${startTimeStr}:00+07:00`,
        endTime: `${dateStr}T${endTimeStr}:00+07:00`,
        eventType,
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
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Chỉnh sửa lịch học" : "Tạo lịch học mới"}</DialogTitle>
          <DialogDescription>
            Điền thông tin buổi học. Hệ thống sẽ tự động kiểm tra và tránh các khung giờ bận.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tiêu đề buổi học *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Làm bài tập Giải tích chương 3"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Môn học
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-11 rounded-[16px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày *
              </label>
              <Input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Bắt đầu *
              </label>
              <Input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kết thúc *
              </label>
              <Input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú mục tiêu
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung cần ôn, link tài liệu hoặc bài tập..."
              className="w-full rounded-[16px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <DialogFooter className="flex justify-between items-center">
            {editingEvent ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                size="sm"
                className="font-semibold"
              >
                Xóa lịch
              </Button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" variant="default" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editingEvent ? "Cập nhật" : "Tạo lịch"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Zap,
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  Target,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePipTimer } from "../timer/pip-timer-provider";

import { toast } from "sonner";
interface QuickCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickCaptureModal({ open, onClose, onSuccess }: QuickCaptureModalProps) {
  const router = useRouter();
  const { startTimer } = usePipTimer();

  const [activeTab, setActiveTab] = useState<"TASK" | "NOTE" | "EVENT" | "GOAL">("TASK");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Fields
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [deadline, setDeadline] = useState("");
  const [content, setContent] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setDeadline("");
      setStartTime("");
      setEndTime("");
      fetch("/api/subjects")
        .then((r) => r.json())
        .then((data) => {
          if (data.subjects) setSubjects(data.subjects);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (activeTab === "TASK") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            subjectId: subjectId || null,
            priority,
            estimatedMinutes,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            status: "INBOX",
          }),
        });
        if (!res.ok) throw new Error("Lỗi tạo task");
      } else if (activeTab === "NOTE") {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim() || "# " + title.trim(),
            subjectId: subjectId || null,
          }),
        });
        if (!res.ok) throw new Error("Lỗi tạo ghi chú");
      } else if (activeTab === "EVENT") {
        const start = startTime ? new Date(startTime) : new Date();
        const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60000);
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            subjectId: subjectId || null,
            type: "STUDY",
          }),
        });
        if (!res.ok) throw new Error("Lỗi tạo sự kiện");
      } else if (activeTab === "GOAL") {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            subjectId: subjectId || null,
            targetDate: deadline ? new Date(deadline).toISOString() : null,
          }),
        });
        if (!res.ok) throw new Error("Lỗi tạo mục tiêu");
      }

      onSuccess?.();
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo nhanh");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--mint-dark)] mb-1">
              <Zap className="w-4 h-4 fill-current" />
              <span>QUICK CAPTURE (TẠO NHANH TIỆN ÍCH)</span>
            </div>
            <DialogTitle className="text-lg font-bold text-[var(--text-ink)]">
              Ghi nhận nhanh mọi ý tưởng
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-subtle)]">
              Lưu trữ ngay lập tức mà không cần rời màn hình hiện tại.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Capture Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-[var(--mint-bg)] dark:bg-[#101c14] border border-[var(--border)] rounded-2xl text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("TASK")}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "TASK" ? "bg-[var(--mint)] text-white shadow-2xs" : "text-[var(--text-subtle)]"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("NOTE")}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "NOTE" ? "bg-[var(--mint)] text-white shadow-2xs" : "text-[var(--text-subtle)]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Note</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("EVENT")}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "EVENT" ? "bg-[var(--mint)] text-white shadow-2xs" : "text-[var(--text-subtle)]"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Lịch</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("GOAL")}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "GOAL" ? "bg-[var(--mint)] text-white shadow-2xs" : "text-[var(--text-subtle)]"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Goal</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
              Tiêu đề *
            </label>
            <Input
              required
              autoFocus
              placeholder={
                activeTab === "TASK"
                  ? "Nhập công việc cần làm..."
                  : activeTab === "NOTE"
                  ? "Tên trang ghi chú..."
                  : activeTab === "EVENT"
                  ? "Tên buổi học / sự kiện..."
                  : "Mục tiêu cần đạt..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border-[var(--border)] text-xs h-10"
            />
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
              Môn học liên quan
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-ink)]"
            >
              <option value="">(Không gắn môn cụ thể)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Specific Inputs */}
          {activeTab === "TASK" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-ink)]"
                >
                  <option value="LOW">Thấp (Low)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HIGH">Cao (High)</option>
                  <option value="URGENT">Khẩn cấp (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                  Hạn chót (Deadline)
                </label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="rounded-2xl border-[var(--border)] text-xs h-9"
                />
              </div>
            </div>
          )}

          {activeTab === "NOTE" && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                Nội dung nhanh
              </label>
              <textarea
                rows={3}
                placeholder="Ghi nhanh ý tưởng, gạch đầu dòng..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
              />
            </div>
          )}

          {activeTab === "EVENT" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                  Bắt đầu
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-2xl border-[var(--border)] text-xs h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                  Kết thúc
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-2xl border-[var(--border)] text-xs h-9"
                />
              </div>
            </div>
          )}

          {activeTab === "GOAL" && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-ink)] mb-1">
                Ngày mục tiêu cần đạt
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-2xl border-[var(--border)] text-xs h-9"
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-bold"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu ngay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

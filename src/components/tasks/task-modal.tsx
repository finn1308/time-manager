"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CheckSquare, Clock, Calendar, AlertCircle, Link as LinkIcon, Check } from "lucide-react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: any | null;
  subjects: any[];
  allTasks: any[];
}

export function TaskModal({
  open,
  onClose,
  onSuccess,
  taskToEdit,
  subjects,
  allTasks,
}: TaskModalProps) {
  const isEditing = Boolean(taskToEdit);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [status, setStatus] = useState<string>("INBOX");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [deadline, setDeadline] = useState<string>("");
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setSubjectId(taskToEdit.subjectId || "");
      setPriority(taskToEdit.priority || "MEDIUM");
      setStatus(taskToEdit.status || "INBOX");
      setEstimatedMinutes(taskToEdit.estimatedMinutes || 60);
      if (taskToEdit.deadline) {
        const d = new Date(taskToEdit.deadline);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDeadline(iso);
      } else {
        setDeadline("");
      }
      setSelectedPrereqIds(taskToEdit.dependencies?.map((dep: any) => dep.prerequisiteId) || []);
    } else {
      setTitle("");
      setDescription("");
      setSubjectId(subjects.length > 0 ? subjects[0].id : "");
      setPriority("MEDIUM");
      setStatus("INBOX");
      setEstimatedMinutes(60);
      setDeadline("");
      setSelectedPrereqIds([]);
    }
  }, [taskToEdit, subjects, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId || null,
        priority,
        status,
        estimatedMinutes,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        prerequisiteTaskIds: selectedPrereqIds,
      };

      const url = isEditing ? `/api/tasks/${taskToEdit.id}` : "/api/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Không thể lưu task");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Lỗi lưu task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePrereq = (tId: string) => {
    setSelectedPrereqIds((prev) =>
      prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
    );
  };

  // Filter tasks that can be prerequisites (cannot be itself)
  const availablePrereqs = allTasks.filter((t) => !taskToEdit || t.id !== taskToEdit.id);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] mb-1">
              <CheckSquare className="w-4 h-4" />
              <span>{isEditing ? "CHỈNH SỬA TASK" : "TẠO TASK MỚI"}</span>
            </div>
            <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              {isEditing ? "Cập nhật công việc học tập" : "Thêm công việc vào hệ thống"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
              Quản lý công việc chi tiết với độ ưu tiên, deadline và thiết lập quan hệ phụ thuộc.
            </DialogDescription>
          </DialogHeader>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
              Tiêu đề task *
            </label>
            <Input
              required
              placeholder="VD: Đọc chương 4 Giải tích, Làm bài tập 1-10..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border-[#dbe7dd] text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
              Ghi chú / Mô tả chi tiết
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm về tài liệu, trang sách, phương pháp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
            />
          </div>

          {/* Subject & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Môn học
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="">(Không gắn môn cụ thể)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="INBOX">📥 Inbox (Hộp thư đến)</option>
                <option value="TODO">📋 To Do (Cần làm)</option>
                <option value="IN_PROGRESS">⚡ In Progress (Đang thực hiện)</option>
                <option value="DONE">✅ Done (Đã hoàn thành)</option>
                <option value="CANCELLED">🚫 Cancelled (Đã hủy)</option>
              </select>
            </div>
          </div>

          {/* Priority & Estimated Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Độ ưu tiên
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "LOW", label: "Low", color: "bg-gray-100 text-gray-700" },
                  { id: "MEDIUM", label: "Med", color: "bg-emerald-100 text-emerald-800" },
                  { id: "HIGH", label: "High", color: "bg-amber-100 text-amber-800" },
                  { id: "URGENT", label: "Urg", color: "bg-rose-100 text-rose-800" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`py-1.5 rounded-xl text-center text-[10px] font-bold transition-all cursor-pointer ${
                      priority === p.id
                        ? "ring-2 ring-[#2d6a4f] shadow-2xs font-extrabold"
                        : "opacity-60 hover:opacity-100"
                    } ${p.color}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Dự kiến (phút)
              </label>
              <Input
                type="number"
                min={5}
                step={5}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 60)}
                className="rounded-2xl border-[#dbe7dd] text-xs"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
              Hạn chót (Deadline)
            </label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-2xl border-[#dbe7dd] text-xs"
            />
          </div>

          {/* Prerequisite Dependencies (DAG) */}
          <div className="pt-2 border-t border-[#dbe7dd]/70 dark:border-[#263d2e]">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#2d6a4f] dark:text-[#52b788]" />
              <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Task tiên quyết cần xong trước (Task Dependency)
              </label>
            </div>
            <p className="text-[11px] text-[#73927d] dark:text-[#8ba393] mb-2">
              Nếu chọn, task này sẽ bị khóa cho tới khi các task được chọn hoàn thành.
            </p>

            {availablePrereqs.length === 0 ? (
              <div className="text-[11px] text-[#73927d] italic">
                Chưa có task nào khác để thiết lập phụ thuộc.
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {availablePrereqs.map((t) => {
                  const isChecked = selectedPrereqIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => togglePrereq(t.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] font-semibold text-[#192e22] dark:text-[#f0f7f2]"
                          : "border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318] text-[#526b5c] dark:text-[#a3bda9]"
                      }`}
                    >
                      <span className="truncate pr-2">{t.title}</span>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {t.isCompleted && (
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Xong</span>
                        )}
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked
                              ? "bg-[#2d6a4f] border-[#2d6a4f] text-white"
                              : "border-[#dbe7dd]"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl border-[#dbe7dd] text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs"
            >
              {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

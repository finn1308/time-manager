"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Lock, Repeat } from "lucide-react";
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
    originalId?: string;
    title: string;
    description?: string | null;
    subjectId?: string | null;
    startTime: string | Date;
    endTime: string | Date;
    type?: string;
    isLocked?: boolean;
    recurrence?: string;
    recurrenceRule?: string | null;
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
  
  // Recurrence state
  const [recurrence, setRecurrence] = useState<string>(editingEvent?.recurrence || "NONE");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit/Delete mode (Single vs All)
  const [showEditModePrompt, setShowEditModePrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<"SAVE" | "DELETE" | null>(null);
  const [updateMode, setUpdateMode] = useState<"SINGLE" | "ALL">("SINGLE");

  const buildRRule = () => {
    if (recurrence === "NONE") return null;
    let rule = `FREQ=${recurrence}`;
    if (recurrence === "WEEKLY" && weeklyDays.length > 0) {
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const byDay = weeklyDays.map(d => days[d]).join(",");
      rule += `;BYDAY=${byDay}`;
    }
    if (recurrenceEndDate) {
      // UTC until
      const d = new Date(recurrenceEndDate);
      d.setUTCHours(23, 59, 59);
      rule += `;UNTIL=${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
    }
    return rule;
  };

  const handleSaveAction = async (mode: "SINGLE" | "ALL" = "SINGLE") => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (!dateStr) throw new Error("Vui lòng chọn ngày học");
      if (!startTimeStr || !endTimeStr) throw new Error("Vui lòng nhập giờ bắt đầu và kết thúc");

      const startUTC = makeVNDate(dateStr, startTimeStr);
      const endUTC = makeVNDate(dateStr, endTimeStr);

      if (endUTC <= startUTC) throw new Error("Giờ kết thúc phải sau giờ bắt đầu");

      const rrule = buildRRule();

      const payload = {
        id: editingEvent?.id,
        originalId: editingEvent?.originalId,
        exceptionDate: editingEvent ? formatVN(editingEvent.startTime, "yyyy-MM-dd") : undefined,
        updateMode: mode,
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId || null,
        startTime: startUTC.toISOString(),
        endTime: endUTC.toISOString(),
        isLocked,
        timezone: "Asia/Ho_Chi_Minh",
        recurrence,
        recurrenceRule: rrule,
        recurrenceEnd: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
      };

      const res = await fetch("/api/calendar/events", {
        method: editingEvent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu sự kiện");

      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
      setShowEditModePrompt(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent?.originalId && editingEvent.recurrence !== "NONE") {
      setPendingAction("SAVE");
      setShowEditModePrompt(true);
    } else {
      handleSaveAction("SINGLE");
    }
  };

  const executeDelete = async (mode: "SINGLE" | "ALL") => {
    try {
      setIsSubmitting(true);
      const id = editingEvent!.id;
      const isRecurring = editingEvent!.recurrence !== "NONE";
      const originalId = isRecurring ? (editingEvent!.originalId || id) : "";
      const exDate = isRecurring ? formatVN(editingEvent!.startTime, "yyyy-MM-dd") : "";
      
      let url = `/api/calendar/events?id=${id}&deleteMode=${mode}`;
      if (isRecurring && originalId && exDate) {
        url += `&originalId=${originalId}&exceptionDate=${exDate}`;
      }
      
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Không thể xóa sự kiện, vui lòng thử lại.");
      }
      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } catch (e: any) {
      alert(e.message || "Không thể xóa sự kiện");
    } finally {
      setIsSubmitting(false);
      setShowEditModePrompt(false);
    }
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    if (editingEvent.originalId && editingEvent.recurrence !== "NONE") {
      setPendingAction("DELETE");
      setShowEditModePrompt(true);
    } else {
      if (confirm("Bạn có chắc muốn xóa lịch này không?")) {
        executeDelete("SINGLE");
      }
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (weeklyDays.includes(dayIndex)) {
      setWeeklyDays(weeklyDays.filter(d => d !== dayIndex));
    } else {
      setWeeklyDays([...weeklyDays, dayIndex].sort());
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        
        {showEditModePrompt ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Thay đổi lịch lặp
              </DialogTitle>
              <DialogDescription className="text-sm">
                Sự kiện này thuộc một chuỗi lịch lặp. Bạn muốn áp dụng thay đổi cho:
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-2 mt-4">
              <Button onClick={() => pendingAction === "SAVE" ? handleSaveAction("SINGLE") : executeDelete("SINGLE")} variant="outline" className="justify-start h-12">
                Chỉ sự kiện này
              </Button>
              <Button onClick={() => pendingAction === "SAVE" ? handleSaveAction("ALL") : executeDelete("ALL")} variant="outline" className="justify-start h-12">
                Toàn bộ chuỗi sự kiện
              </Button>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={() => setShowEditModePrompt(false)}>Hủy</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                {editingEvent ? "Chỉnh sửa lịch học" : "Tạo lịch học mới"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Múi giờ chuẩn: Asia/Ho_Chi_Minh. Kiểm tra xung đột tự động.
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

              {/* Recurrence Setup */}
              <div className="p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e]">
                <label className="flex items-center text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-2">
                  <Repeat className="w-4 h-4 mr-1.5 text-[#52b788]" /> Lặp lại
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full h-10 mb-3 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                >
                  <option value="NONE">Không lặp</option>
                  <option value="DAILY">Hàng ngày</option>
                  <option value="WEEKLY">Hàng tuần</option>
                  <option value="MONTHLY">Hàng tháng</option>
                  <option value="YEARLY">Hàng năm</option>
                </select>

                {recurrence === "WEEKLY" && (
                  <div className="flex space-x-1.5 mb-3">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`flex-1 h-8 text-[10px] font-bold rounded-lg ${weeklyDays.includes(i) ? "bg-[#52b788] text-white" : "bg-white dark:bg-[#1e3023] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {recurrence !== "NONE" && (
                  <div>
                    <label className="block text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">Ngày kết thúc lặp (Tùy chọn)</label>
                    <Input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                )}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

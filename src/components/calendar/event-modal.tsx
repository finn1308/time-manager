"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Lock, Repeat, FolderOpen, Calendar as CalendarIcon } from "lucide-react";
import { formatVN, getDateKeyVN, makeVNDate } from "@/lib/date-utils";
import { ResourceManager } from "@/components/study/resource-manager";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null; color: string }>;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSuccess?: () => void;
  initialTab?: "schedule" | "resources";
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
  initialTab = "schedule",
  editingEvent,
}: EventModalProps) {
  const router = useRouter();

  const [activeModalTab, setActiveModalTab] = useState<"schedule" | "resources">("schedule");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(defaultDate);
  const [startTimeStr, setStartTimeStr] = useState<string>(defaultStartTime);
  const [endTimeStr, setEndTimeStr] = useState<string>(defaultEndTime);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  
  // Recurrence state
  const [recurrence, setRecurrence] = useState<string>("NONE");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit/Delete mode (Single vs All)
  const [showEditModePrompt, setShowEditModePrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<"SAVE" | "DELETE" | null>(null);

  // Sync state whenever editingEvent or open changes
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || "");
      setDescription(editingEvent.description || "");
      setSubjectId(editingEvent.subjectId || subjects[0]?.id || "");
      setDateStr(formatVN(editingEvent.startTime, "yyyy-MM-dd"));
      setStartTimeStr(formatVN(editingEvent.startTime, "HH:mm"));
      setEndTimeStr(formatVN(editingEvent.endTime, "HH:mm"));
      setIsLocked(!!editingEvent.isLocked);
      setRecurrence(editingEvent.recurrence && editingEvent.recurrence !== "NONE" ? editingEvent.recurrence : "NONE");
      setActiveModalTab(initialTab);
    } else {
      setTitle("");
      setDescription("");
      setSubjectId(subjects[0]?.id || "");
      setDateStr(defaultDate);
      setStartTimeStr(defaultStartTime);
      setEndTimeStr(defaultEndTime);
      setIsLocked(false);
      setRecurrence("NONE");
      setWeeklyDays([]);
      setRecurrenceEndDate("");
      setActiveModalTab("schedule");
    }
    setErrorMsg(null);
    setShowEditModePrompt(false);
    setPendingAction(null);
  }, [editingEvent, open, defaultDate, defaultStartTime, defaultEndTime, initialTab]);

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const buildRRule = () => {
    if (recurrence === "NONE") return null;
    let rule = `FREQ=${recurrence}`;
    if (recurrence === "WEEKLY" && weeklyDays.length > 0) {
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const byDay = weeklyDays.map(d => days[d]).join(",");
      rule += `;BYDAY=${byDay}`;
    }
    if (recurrenceEndDate) {
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
    const isRecurring = Boolean(editingEvent?.recurrence && editingEvent.recurrence !== "NONE");
    if (editingEvent?.originalId && isRecurring) {
      setPendingAction("SAVE");
      setShowEditModePrompt(true);
    } else {
      handleSaveAction("SINGLE");
    }
  };

  const executeDelete = async (mode: "SINGLE" | "ALL") => {
    try {
      setIsSubmitting(true);
      const isRecurring = Boolean(editingEvent?.recurrence && editingEvent.recurrence !== "NONE");
      const cleanId = editingEvent!.id.includes("_") ? editingEvent!.id.split("_")[0] : editingEvent!.id;
      const cleanOriginalId = editingEvent!.originalId
        ? (editingEvent!.originalId.includes("_") ? editingEvent!.originalId.split("_")[0] : editingEvent!.originalId)
        : cleanId;
      const exDate = getDateKeyVN(editingEvent!.startTime);
      
      let url = `/api/calendar/events?id=${cleanId}&deleteMode=${mode}`;
      if (isRecurring && cleanOriginalId && exDate) {
        url += `&originalId=${cleanOriginalId}&exceptionDate=${exDate}`;
      }
      
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa sự kiện, vui lòng thử lại.");
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
    const isRecurring = Boolean(editingEvent.recurrence && editingEvent.recurrence !== "NONE");
    if (isRecurring) {
      setPendingAction("DELETE");
      setShowEditModePrompt(true);
    } else {
      if (confirm("Bạn có chắc chắn muốn xóa lịch học này không?")) {
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
      <DialogContent onClose={onClose} className="max-w-xl rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        
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
              <Button onClick={() => pendingAction === "SAVE" ? handleSaveAction("SINGLE") : executeDelete("SINGLE")} variant="outline" className="justify-start h-12 rounded-2xl">
                Chỉ sự kiện này
              </Button>
              <Button onClick={() => pendingAction === "SAVE" ? handleSaveAction("ALL") : executeDelete("ALL")} variant="outline" className="justify-start h-12 rounded-2xl text-rose-600 hover:text-rose-700">
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
                {editingEvent ? "Chi tiết lịch học" : "Tạo lịch học mới"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Múi giờ chuẩn: Asia/Ho_Chi_Minh. Kiểm tra xung đột & gắn tài nguyên thông minh.
              </DialogDescription>
            </DialogHeader>

            {/* Mode Tabs if Editing Existing Event */}
            {editingEvent && (
              <div className="flex rounded-2xl bg-[#f0f6f2] dark:bg-[#15251b] p-1 border border-[#dbe7dd] dark:border-[#263d2e] my-3">
                <button
                  type="button"
                  onClick={() => setActiveModalTab("schedule")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                    activeModalTab === "schedule"
                      ? "bg-white dark:bg-[#1f3426] text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                      : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Cài đặt giờ & môn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab("resources")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                    activeModalTab === "resources"
                      ? "bg-white dark:bg-[#1f3426] text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                      : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#52b788]" />
                  <span>📚 Tài liệu & Ghi chú</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT: RESOURCES & NOTES */}
            {editingEvent && activeModalTab === "resources" ? (
              <div className="py-2">
                <ResourceManager
                  calendarEventId={editingEvent.id}
                  subjectId={editingEvent.subjectId || subjectId}
                  subjectName={selectedSubject?.name || "Môn học"}
                  sessionTitle={title || editingEvent.title}
                  timeFormatted={`${startTimeStr} - ${endTimeStr}`}
                  onRefreshCalendar={onSuccess}
                />
                <div className="flex justify-between items-center pt-4 border-t border-[#dbe7dd] dark:border-[#263d2e] mt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    size="sm"
                    className="font-semibold rounded-2xl"
                  >
                    Xóa lịch này
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="rounded-2xl border-[#dbe7dd] text-xs h-9"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              /* TAB CONTENT: SCHEDULE EDIT FORM */
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    Tiêu đề buổi học <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Ôn tập Unit 3 - Giải đề thi..."
                    className="rounded-2xl h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    Môn học
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                  >
                    <option value="">-- Không gắn môn (Lịch tự do) --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} {sub.code ? `(${sub.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                      Ngày học
                    </label>
                    <Input
                      type="date"
                      required
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="rounded-2xl h-10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                      Bắt đầu
                    </label>
                    <Input
                      type="time"
                      required
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="rounded-2xl h-10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                      Kết thúc
                    </label>
                    <Input
                      type="time"
                      required
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="rounded-2xl h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Recurrence Rule Picker */}
                <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#52b788]" />
                      <span>Lặp lại (Chu kỳ)</span>
                    </label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="h-8 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-2 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                    >
                      <option value="NONE">Không lặp (Một lần)</option>
                      <option value="DAILY">Hàng ngày</option>
                      <option value="WEEKLY">Hàng tuần</option>
                      <option value="MONTHLY">Hàng tháng</option>
                    </select>
                  </div>

                  {recurrence === "WEEKLY" && (
                    <div className="flex items-center justify-between gap-1 pt-1">
                      {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, i) => (
                        <button
                          key={label}
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
                    className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2]"
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
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

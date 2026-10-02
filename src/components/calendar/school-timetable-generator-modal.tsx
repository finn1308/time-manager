"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Trash2, GraduationCap, Calendar, Clock, MapPin, User, Sparkles, CheckCircle2 } from "lucide-react";
import { formatVN, getDateKeyVN, makeVNDate } from "@/lib/date-utils";
import { addWeeks, setDay, startOfWeek } from "date-fns";

export interface SchoolTimetableEntry {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  subjectId: string;
  customSubjectName: string;
  period: string; // e.g., "Tiết 1-3"
  startTime: string; // "07:00"
  endTime: string; // "09:15"
  room: string; // "Phòng A101"
  teacher: string; // "TS. Nguyễn Văn A"
}

interface SchoolTimetableGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null; color: string }>;
  onSuccess?: () => void;
}

const DAY_NAMES = [
  { day: 1, label: "Thứ Hai (T2)", code: "MO" },
  { day: 2, label: "Thứ Ba (T3)", code: "TU" },
  { day: 3, label: "Thứ Tư (T4)", code: "WE" },
  { day: 4, label: "Thứ Năm (T5)", code: "TH" },
  { day: 5, label: "Thứ Sáu (T6)", code: "FR" },
  { day: 6, label: "Thứ Bảy (T7)", code: "SA" },
  { day: 0, label: "Chủ Nhật (CN)", code: "SU" },
];

export function SchoolTimetableGeneratorModal({
  open,
  onClose,
  subjects = [],
  onSuccess,
}: SchoolTimetableGeneratorModalProps) {
  const [semesterStartDate, setSemesterStartDate] = useState<string>(() => {
    const now = new Date();
    // Default to the Monday of current week
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return getDateKeyVN(monday);
  });
  const [totalWeeks, setTotalWeeks] = useState<number>(15);

  const [entries, setEntries] = useState<SchoolTimetableEntry[]>([
    {
      id: "1",
      dayOfWeek: 1,
      subjectId: subjects[0]?.id || "",
      customSubjectName: "",
      period: "Tiết 1-3",
      startTime: "07:00",
      endTime: "09:15",
      room: "A101",
      teacher: "Giảng viên chính",
    },
    {
      id: "2",
      dayOfWeek: 3,
      subjectId: subjects[1]?.id || subjects[0]?.id || "",
      customSubjectName: "",
      period: "Tiết 4-6",
      startTime: "09:30",
      endTime: "11:45",
      room: "B204",
      teacher: "Giảng viên bộ môn",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleAddEntry = (dayOfWeek = 1) => {
    const newEntry: SchoolTimetableEntry = {
      id: Math.random().toString(36).substring(7),
      dayOfWeek,
      subjectId: subjects[0]?.id || "",
      customSubjectName: "",
      period: "Tiết học",
      startTime: "08:00",
      endTime: "09:30",
      room: "",
      teacher: "",
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateEntry = (id: string, updates: Partial<SchoolTimetableEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleGenerate = async () => {
    if (entries.length === 0) {
      setErrorMsg("Vui lòng thêm ít nhất một buổi học vào thời khóa biểu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessCount(null);

    try {
      const [startYear, startMonth, startDay] = semesterStartDate.split("-").map(Number);
      const baseSemesterStart = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0));
      const semesterEnd = addWeeks(baseSemesterStart, totalWeeks);

      let createdCount = 0;

      for (const entry of entries) {
        // Resolve subject name
        const matchedSub = subjects.find((s) => s.id === entry.subjectId);
        const title = matchedSub ? matchedSub.name : (entry.customSubjectName.trim() || "Môn học trên lớp");

        // Calculate first occurrence date for this day of week
        // dayOfWeek: 0 = Sun, 1 = Mon ...
        const firstDayOfWeekDate = setDay(baseSemesterStart, entry.dayOfWeek, { weekStartsOn: 1 });
        const firstDateKey = getDateKeyVN(firstDayOfWeekDate);

        const startUTC = makeVNDate(firstDateKey, entry.startTime);
        const endUTC = makeVNDate(firstDateKey, entry.endTime);

        const dayCode = DAY_NAMES.find((d) => d.day === entry.dayOfWeek)?.code || "MO";
        const recurrenceRule = `FREQ=WEEKLY;BYDAY=${dayCode}`;

        const payload = {
          title,
          description: `🏫 Lịch học chính quy | ${entry.period || "Tiết học"}${entry.teacher ? ` | GV: ${entry.teacher}` : ""}`,
          location: entry.room?.trim() || null,
          subjectId: matchedSub ? matchedSub.id : null,
          startTime: startUTC.toISOString(),
          endTime: endUTC.toISOString(),
          type: "SCHOOL",
          isLocked: true,
          isFlexible: false,
          trackStudyTime: false,
          timezone: "Asia/Ho_Chi_Minh",
          recurrence: "WEEKLY",
          recurrenceRule,
          recurrenceEnd: semesterEnd.toISOString(),
        };

        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Lỗi tạo lịch cho môn "${title}"`);
        }
        createdCount++;
      }

      setSuccessCount(createdCount);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccessCount(null);
      }, 1500);
    } catch (err: any) {
      console.error("Timetable generation error:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi tạo thời khóa biểu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-3xl rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#eef5f0] dark:bg-[#1b3426] flex items-center justify-center text-[#2d6a4f] dark:text-[#52b788]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Thời Khóa Biểu Trường Học (Timetable Generator)
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Nhập lịch học trên lớp một lần. Hệ thống tự động tạo chuỗi sự kiện SCHOOL lặp lại hàng tuần, khóa cứng giờ học (Hard Constraint) để AI không bao giờ xếp lịch tự học trùng lên.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {successCount !== null && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Đã tạo thành công {successCount} chuỗi môn học trong thời khóa biểu học kỳ! Đang tải lại lịch...</span>
          </div>
        )}

        {/* Global Settings: Semester Start Date & Number of Weeks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] my-3">
          <div>
            <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Tuần bắt đầu học kỳ</span>
            </label>
            <Input
              type="date"
              value={semesterStartDate}
              onChange={(e) => setSemesterStartDate(e.target.value)}
              className="rounded-2xl h-10 text-xs bg-white dark:bg-[#17261c]"
            />
            <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-1">
              Thường là ngày Thứ Hai của tuần học đầu tiên
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span>Thời lượng học kỳ (Số tuần lặp)</span>
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min={1}
                max={52}
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(Number(e.target.value) || 1)}
                className="rounded-2xl h-10 text-xs bg-white dark:bg-[#17261c] w-28"
              />
              <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] font-medium">tuần (15 tuần = 1 học kỳ)</span>
            </div>
          </div>
        </div>

        {/* Timetable Entries List */}
        <div className="space-y-3 my-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] uppercase tracking-wider">
              Danh sách các buổi học trong tuần ({entries.length} môn)
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddEntry(1)}
              className="h-8 rounded-xl border-[#dbe7dd] dark:border-[#263d2e] text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tiết học</span>
            </Button>
          </div>

          <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#15251b] space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#eef5f0] text-[#2d6a4f] dark:bg-[#1b3426] dark:text-[#74c69d]">
                    Môn #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEntry(entry.id)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xóa môn này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Day of Week */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
                      Thứ trong tuần
                    </label>
                    <select
                      value={entry.dayOfWeek}
                      onChange={(e) => handleUpdateEntry(entry.id, { dayOfWeek: Number(e.target.value) })}
                      className="w-full h-9 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#18281d] px-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                    >
                      {DAY_NAMES.map((d) => (
                        <option key={d.day} value={d.day}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
                      Môn học
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={entry.subjectId}
                        onChange={(e) => handleUpdateEntry(entry.id, { subjectId: e.target.value })}
                        className="flex-1 h-9 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#18281d] px-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                      >
                        <option value="">-- Môn học tự do --</option>
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} {sub.code ? `(${sub.code})` : ""}
                          </option>
                        ))}
                      </select>
                      {!entry.subjectId && (
                        <Input
                          placeholder="Nhập tên môn học..."
                          value={entry.customSubjectName}
                          onChange={(e) => handleUpdateEntry(entry.id, { customSubjectName: e.target.value })}
                          className="h-9 rounded-xl text-xs flex-1"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Period */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
                      Tiết học
                    </label>
                    <Input
                      placeholder="Tiết 1-3"
                      value={entry.period}
                      onChange={(e) => handleUpdateEntry(entry.id, { period: e.target.value })}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
                      Bắt đầu
                    </label>
                    <Input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => handleUpdateEntry(entry.id, { startTime: e.target.value })}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
                      Kết thúc
                    </label>
                    <Input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => handleUpdateEntry(entry.id, { endTime: e.target.value })}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>

                  {/* Room */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#52b788]" />
                      <span>Phòng học</span>
                    </label>
                    <Input
                      placeholder="A101"
                      value={entry.room}
                      onChange={(e) => handleUpdateEntry(entry.id, { room: e.target.value })}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Teacher / Instructor note */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-[#52b788]" />
                    <span>Giảng viên / Ghi chú buổi học</span>
                  </label>
                  <Input
                    placeholder="Tên giảng viên hoặc ghi chú mang tài liệu..."
                    value={entry.teacher}
                    onChange={(e) => handleUpdateEntry(entry.id, { teacher: e.target.value })}
                    className="h-8 rounded-xl text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center pt-3 border-t border-[#dbe7dd] dark:border-[#263d2e] mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border-[#dbe7dd] text-xs h-9"
          >
            Đóng
          </Button>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting || entries.length === 0}
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs font-bold space-x-1.5 h-10 px-5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isSubmitting ? "Đang tạo thời khóa biểu..." : "Tự động sinh chuỗi sự kiện học"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

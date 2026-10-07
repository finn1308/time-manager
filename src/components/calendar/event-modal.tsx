"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import {
  Lock,
  Repeat,
  FolderOpen,
  Calendar as CalendarIcon,
  MapPin,
  Play,
  Trash2,
  Clock,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Target,
  Sliders,
} from "lucide-react";
import { formatVN, getDateKeyVN, makeVNDate } from "@/lib/date-utils";
import { ResourceManager } from "@/components/study/resource-manager";
import {
  getEventTypeConfig,
  PRIMARY_EVENT_TYPES,
  CalendarEventType,
  canStartStudyTimer,
  isSelfStudyEvent,
  isSchoolEvent,
  isPersonalEvent,
} from "@/lib/calendar/event-types";
import { usePipTimer } from "../timer/pip-timer-provider";
import { EventCompleteCheckbox } from "./event-complete-checkbox";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null; color: string }>;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultType?: CalendarEventType;
  onSuccess?: () => void;
  initialTab?: "schedule" | "resources";
  editingEvent?: {
    id: string;
    originalId?: string;
    title: string;
    description?: string | null;
    location?: string | null;
    subjectId?: string | null;
    taskId?: string | null;
    startTime: string | Date;
    endTime: string | Date;
    type?: string;
    isLocked?: boolean;
    isFlexible?: boolean;
    trackStudyTime?: boolean;
    goalId?: string | null;
    seriesId?: string | null;
    recurrence?: string;
    recurrenceRule?: string | null;
    recurrenceEnd?: string | Date | null;
    completed?: boolean;
    completedAt?: string | Date | null;
    actualDurationMinutes?: number | null;
    plannedDurationMinutes?: number | null;
    subject?: { id: string; name: string; code: string | null; color: string } | null;
  } | null;
}

function isStudyEventCategory(type?: string | null, subId?: string | null): boolean {
  const upper = type?.toUpperCase();
  return upper === "SCHOOL" || upper === "SELF_STUDY" || upper === "STUDY" || Boolean(subId);
}

export function EventModal({
  open,
  onClose,
  subjects = [],
  defaultDate = getDateKeyVN(new Date()),
  defaultStartTime = "08:00",
  defaultEndTime = "09:30",
  defaultType = "SELF_STUDY",
  onSuccess,
  initialTab = "schedule",
  editingEvent,
}: EventModalProps) {
  const router = useRouter();
  const { startTimer } = usePipTimer();

  const [activeModalTab, setActiveModalTab] = useState<"schedule" | "resources">("schedule");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; subjectId?: string | null }>>([]);
  const [goalId, setGoalId] = useState<string>("");
  const [goals, setGoals] = useState<Array<{ id: string; title: string }>>([]);
  const [eventType, setEventType] = useState<CalendarEventType>(defaultType);
  const [dateStr, setDateStr] = useState<string>(defaultDate);
  const [startTimeStr, setStartTimeStr] = useState<string>(defaultStartTime);
  const [endTimeStr, setEndTimeStr] = useState<string>(defaultEndTime);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isFlexible, setIsFlexible] = useState<boolean>(defaultType === "PERSONAL");
  const [trackStudyTime, setTrackStudyTime] = useState<boolean>(isStudyEventCategory(defaultType, null));

  // Recurrence state
  const [recurrence, setRecurrence] = useState<string>("NONE");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");

  // Multi-slot state
  const [isMultiSlot, setIsMultiSlot] = useState(false);
  const [multiSlots, setMultiSlots] = useState<Record<number, Array<{id: string, start: string, end: string}>>>({});
  const [activeMultiSlotDay, setActiveMultiSlotDay] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recurring delete modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteModeChoice, setDeleteModeChoice] = useState<"SINGLE" | "ALL" | "FUTURE">("SINGLE");

  // Fetch tasks and goals for dropdowns
  useEffect(() => {
    async function loadTasksAndGoals() {
      try {
        const [resTasks, resGoals] = await Promise.all([
          fetch("/api/tasks").then((r) => (r.ok ? r.json() : { tasks: [] })),
          fetch("/api/goals").then((r) => (r.ok ? r.json() : { goals: [] })),
        ]);
        if (resTasks.tasks) setTasks(resTasks.tasks);
        if (resGoals.goals) setGoals(resGoals.goals);
      } catch (e) {
        console.warn("Failed to load tasks/goals:", e);
      }
    }
    loadTasksAndGoals();
  }, []);

  // Sync state whenever editingEvent or open changes
  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || "");
      setDescription(editingEvent.description || "");
      setLocation(editingEvent.location || "");
      setSubjectId(editingEvent.subjectId || "");
      setTaskId(editingEvent.taskId || "");
      setGoalId(editingEvent.goalId || "");

      const normalizedType = ((editingEvent.type?.toUpperCase() || "OTHER") as CalendarEventType);
      setEventType(normalizedType);

      setDateStr(formatVN(editingEvent.startTime, "yyyy-MM-dd"));
      setStartTimeStr(formatVN(editingEvent.startTime, "HH:mm"));
      setEndTimeStr(formatVN(editingEvent.endTime, "HH:mm"));
      setIsLocked(!!editingEvent.isLocked);
      setIsFlexible(editingEvent.isFlexible ?? (normalizedType === "PERSONAL"));
      const isStudy = isStudyEventCategory(normalizedType, editingEvent.subjectId);
      setTrackStudyTime(isStudy ? true : (editingEvent.trackStudyTime ?? false));
      setRecurrence(editingEvent.recurrence && editingEvent.recurrence !== "NONE" ? editingEvent.recurrence : "NONE");

      // Parse weekly days from recurrenceRule if present
      if (editingEvent.recurrenceRule && editingEvent.recurrenceRule.includes("BYDAY=")) {
        const byDayPart = editingEvent.recurrenceRule.split("BYDAY=")[1]?.split(";")[0];
        if (byDayPart) {
          const dayMap: { [key: string]: number } = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
          const parsedDays = byDayPart.split(",").map((code) => dayMap[code.trim()]).filter((d) => d !== undefined);
          setWeeklyDays(parsedDays);
        }
      } else {
        setWeeklyDays([]);
      }

      if (editingEvent.recurrenceEnd) {
        setRecurrenceEndDate(formatVN(editingEvent.recurrenceEnd, "yyyy-MM-dd"));
      } else {
        setRecurrenceEndDate("");
      }

      setActiveModalTab(initialTab);
    } else {
      setTitle("");
      setDescription("");
      setLocation("");
      setSubjectId(subjects[0]?.id || "");
      setTaskId("");
      setGoalId("");
      setEventType(defaultType);
      setDateStr(defaultDate);
      setStartTimeStr(defaultStartTime);
      setEndTimeStr(defaultEndTime);
      setIsLocked(defaultType === "SCHOOL" || defaultType === "EXAM");
      setIsFlexible(defaultType === "PERSONAL");
      setTrackStudyTime(isStudyEventCategory(defaultType, null));
      setRecurrence("NONE");
      setWeeklyDays([]);
      setRecurrenceEndDate("");
      setIsMultiSlot(false);
      setMultiSlots({});
      setActiveMultiSlotDay(null);
      setActiveModalTab("schedule");
    }
    setErrorMsg(null);
    setShowDeleteConfirmModal(false);
  }, [editingEvent, open, defaultDate, defaultStartTime, defaultEndTime, defaultType, initialTab, subjects]);

  const selectedSubject = subjects.find((s) => s.id === subjectId) || editingEvent?.subject;

  // Filter tasks belonging to current selected subject (or all if no subject)
  const availableTasks = useMemo(() => {
    if (!subjectId) return tasks;
    return tasks.filter((t) => !t.subjectId || t.subjectId === subjectId);
  }, [tasks, subjectId]);

  // Event countdown string
  const countdownText = useMemo(() => {
    if (!editingEvent) return null;
    const now = new Date().getTime();
    const eventTime = new Date(editingEvent.startTime).getTime();
    const diffMs = eventTime - now;

    if (diffMs <= 0) {
      const eventEndTime = new Date(editingEvent.endTime).getTime();
      if (now < eventEndTime) {
        return "Đang diễn ra";
      }
      return "Đã kết thúc";
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Bắt đầu sau ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [editingEvent]);

  const buildRRule = () => {
    if (recurrence === "NONE") return null;
    let rule = `FREQ=${recurrence}`;
    if (recurrence === "WEEKLY" && weeklyDays.length > 0 && !isMultiSlot) {
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const byDay = weeklyDays.map((d) => days[d]).join(",");
      rule += `;BYDAY=${byDay}`;
    }
    if (recurrenceEndDate) {
      const d = new Date(recurrenceEndDate);
      d.setUTCHours(23, 59, 59);
      rule += `;UNTIL=${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
    }
    return rule;
  };

  const getNextDateForDayOfWeek = (baseDate: Date, dayOfWeek: number) => {
    const d = new Date(baseDate);
    const currentDay = d.getDay();
    const distance = (dayOfWeek + 7 - currentDay) % 7;
    d.setDate(d.getDate() + distance);
    return d;
  };

  const handleSaveAction = async (mode: "SINGLE" | "ALL" = "SINGLE") => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) throw new Error("Vui lòng nhập tiêu đề sự kiện");
      if (!dateStr) throw new Error("Vui lòng chọn ngày");
      if (!startTimeStr || !endTimeStr) throw new Error("Vui lòng nhập giờ bắt đầu và kết thúc");

      let startUTC = new Date();
      let endUTC = new Date();
      let schedulesPayload: any[] = [];

      if (isMultiSlot && recurrence === "WEEKLY") {
        if (weeklyDays.length === 0) throw new Error("Vui lòng chọn ít nhất một ngày trong tuần");
        const baseDate = new Date(dateStr);
        const daysCode = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        
        for (const day of weeklyDays) {
          const slots = multiSlots[day] || [{ start: startTimeStr, end: endTimeStr }];
          const targetDate = getNextDateForDayOfWeek(baseDate, day);
          const targetDateStr = formatVN(targetDate, "yyyy-MM-dd");
          
          for (const slot of slots) {
            const slotStart = makeVNDate(targetDateStr, slot.start);
            const slotEnd = makeVNDate(targetDateStr, slot.end);
            if (slotEnd <= slotStart) throw new Error(`Giờ kết thúc phải sau giờ bắt đầu (Thứ ${day === 0 ? "CN" : day + 1})`);
            
            schedulesPayload.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              recurrenceRule: `FREQ=WEEKLY;BYDAY=${daysCode[day]}${recurrenceEndDate ? `;UNTIL=${new Date(recurrenceEndDate).toISOString().replace(/[-:]/g, "").split(".")[0]}Z` : ''}`,
            });
          }
        }
        // Use the first schedule as the master for the single-event fallback validation
        if (schedulesPayload.length > 0) {
          startUTC = new Date(schedulesPayload[0].startTime);
          endUTC = new Date(schedulesPayload[0].endTime);
        }
      } else {
        startUTC = makeVNDate(dateStr, startTimeStr);
        endUTC = makeVNDate(dateStr, endTimeStr);
        if (endUTC <= startUTC) throw new Error("Giờ kết thúc phải sau giờ bắt đầu");
      }

      const rrule = buildRRule();

      const payload = {
        id: editingEvent?.id,
        originalId: editingEvent?.originalId,
        exceptionDate: editingEvent ? formatVN(editingEvent.startTime, "yyyy-MM-dd") : undefined,
        updateMode: mode,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        subjectId: subjectId || null,
        taskId: taskId || null,
        goalId: goalId || null,
        startTime: startUTC.toISOString(),
        endTime: endUTC.toISOString(),
        type: eventType,
        isLocked,
        isFlexible,
        trackStudyTime: isStudyEventCategory(eventType, subjectId),
        timezone: "Asia/Ho_Chi_Minh",
        recurrence,
        recurrenceRule: isMultiSlot ? undefined : rrule,
        recurrenceEnd: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        schedules: isMultiSlot ? schedulesPayload : undefined,
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveAction("SINGLE");
  };

  const executeDelete = async (mode: "SINGLE" | "ALL" | "FUTURE") => {
    if (!editingEvent) return;
    try {
      setIsSubmitting(true);
      const isRecurring = Boolean(editingEvent.recurrence && editingEvent.recurrence !== "NONE");
      const cleanId = editingEvent.id.includes("_") ? editingEvent.id.split("_")[0] : editingEvent.id;
      const cleanOriginalId = editingEvent.originalId
        ? editingEvent.originalId.includes("_")
          ? editingEvent.originalId.split("_")[0]
          : editingEvent.originalId
        : cleanId;
      const exDate = getDateKeyVN(editingEvent.startTime);

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
      setShowDeleteConfirmModal(false);
      onClose();
    } catch (e: any) {
      alert(e.message || "Không thể xóa sự kiện");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!editingEvent) return;
    const isRecurring = Boolean(editingEvent.recurrence && editingEvent.recurrence !== "NONE");
    if (isRecurring) {
      setDeleteModeChoice("SINGLE");
      setShowDeleteConfirmModal(true);
    } else {
      if (confirm(`Bạn có chắc chắn muốn xóa lịch "${editingEvent.title}" không?`)) {
        executeDelete("SINGLE");
      }
    }
  };

  const handleStartTimer = () => {
    if (!editingEvent) return;
    if (!canStartStudyTimer(eventType)) {
      alert("Chỉ lịch Tự học (SELF_STUDY) mới có thể bấm giờ học!");
      return;
    }
    const cleanId = editingEvent.id.includes("_") ? editingEvent.id.split("_")[0] : editingEvent.id;
    const targetSub = selectedSubject || {
      id: "general",
      name: "Tự học",
      code: null,
      color: "#2d6a4f",
    };

    startTimer(
      {
        id: targetSub.id,
        name: targetSub.name,
        code: targetSub.code,
        color: targetSub.color,
      },
      {
        scheduleEventId: cleanId,
        taskId: taskId || null,
      }
    );
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
    if (weeklyDays.includes(dayIndex)) {
      setWeeklyDays(weeklyDays.filter((d) => d !== dayIndex));
      if (activeMultiSlotDay === dayIndex) setActiveMultiSlotDay(null);
    } else {
      setWeeklyDays([...weeklyDays, dayIndex].sort());
      setActiveMultiSlotDay(dayIndex);
      // Initialize with default slot if empty
      if (!multiSlots[dayIndex]) {
        setMultiSlots(prev => ({
          ...prev,
          [dayIndex]: [{ id: crypto.randomUUID(), start: startTimeStr, end: endTimeStr }]
        }));
      }
    }
  };

  const addSlotToDay = (dayIndex: number) => {
    setMultiSlots(prev => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), { id: crypto.randomUUID(), start: "12:00", end: "13:00" }]
    }));
  };

  const removeSlotFromDay = (dayIndex: number, slotId: string) => {
    setMultiSlots(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter(s => s.id !== slotId)
    }));
  };

  const updateSlotTime = (dayIndex: number, slotId: string, field: "start"|"end", value: string) => {
    setMultiSlots(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].map(s => s.id === slotId ? { ...s, [field]: value } : s)
    }));
  };

  const applySlotToAllSelectedDays = (dayIndex: number) => {
    const sourceSlots = multiSlots[dayIndex];
    if (!sourceSlots) return;
    
    setMultiSlots(prev => {
      const next = { ...prev };
      weeklyDays.forEach(d => {
        if (d !== dayIndex) {
          next[d] = sourceSlots.map(s => ({ ...s, id: crypto.randomUUID() }));
        }
      });
      return next;
    });
    alert("Đã sao chép khung giờ sang các ngày khác thành công!");
  };

  const handleSelectEventType = (t: CalendarEventType) => {
    setEventType(t);
    setTrackStudyTime(isStudyEventCategory(t, subjectId));
    if (t === "SCHOOL") {
      setIsLocked(true);
      setIsFlexible(false);
    } else if (t === "PERSONAL") {
      setIsLocked(false);
      setIsFlexible(true);
    } else if (t === "SELF_STUDY" || t === "STUDY") {
      setIsLocked(false);
      setIsFlexible(false);
    } else if (t === "EXAM" || t === "DEADLINE") {
      setIsLocked(true);
      setIsFlexible(false);
    }
  };

  const currentTypeConfig = getEventTypeConfig(eventType);
  const TypeIcon = currentTypeConfig.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-xl rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        {/* DELETE CONFIRMATION MODAL (Sections 17-20) */}
        {showDeleteConfirmModal && editingEvent ? (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Xác nhận xóa lịch "{editingEvent.title}"</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Sự kiện này thuộc chuỗi lịch lặp:{" "}
                <span className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                  {editingEvent.recurrence === "WEEKLY"
                    ? "Lặp hàng tuần"
                    : editingEvent.recurrence === "DAILY"
                    ? "Lặp hàng ngày"
                    : "Lặp định kỳ"}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1">
              <p className="font-semibold text-rose-800 dark:text-rose-300">
                Buổi đang chọn: {formatVN(editingEvent.startTime, "EEEE, dd/MM/yyyy (HH:mm - ")}
                {formatVN(editingEvent.endTime, "HH:mm)")}
              </p>
              <p className="text-[#526b5c] dark:text-[#a3bda9]">
                Bạn muốn áp dụng việc xóa cho:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <label
                onClick={() => setDeleteModeChoice("SINGLE")}
                className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteModeChoice === "SINGLE"
                    ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1b3426] ring-1 ring-[#2d6a4f]"
                    : "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:bg-[#f8fbf8]"
                }`}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteModeChoice === "SINGLE"}
                  onChange={() => setDeleteModeChoice("SINGLE")}
                  className="mt-0.5 text-[#2d6a4f] focus:ring-[#52b788]"
                />
                <div>
                  <div className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">
                    Chỉ xóa lịch này
                  </div>
                  <div className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                    Chỉ hủy occurrence vào ngày {formatVN(editingEvent.startTime, "dd/MM/yyyy")}. Các buổi học khác trong chuỗi vẫn giữ nguyên vẹn.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDeleteModeChoice("ALL")}
                className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteModeChoice === "ALL"
                    ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-600"
                    : "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:bg-[#f8fbf8]"
                }`}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteModeChoice === "ALL"}
                  onChange={() => setDeleteModeChoice("ALL")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-xs text-rose-700 dark:text-rose-300">
                    Xóa tất cả lịch trong chuỗi
                  </div>
                  <div className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                    Xóa toàn bộ chuỗi sự kiện này (các buổi học đã diễn ra có StudySession thực tế vẫn được bảo toàn dữ liệu lịch sử).
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDeleteModeChoice("FUTURE")}
                className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteModeChoice === "FUTURE"
                    ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-600"
                    : "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:bg-[#f8fbf8]"
                }`}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteModeChoice === "FUTURE"}
                  onChange={() => setDeleteModeChoice("FUTURE")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-xs text-amber-800 dark:text-amber-300">
                    Xóa từ lịch này trở đi
                  </div>
                  <div className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                    Dừng chuỗi lặp lại từ ngày {formatVN(editingEvent.startTime, "dd/MM/yyyy")}. Các buổi trước ngày này vẫn giữ nguyên.
                  </div>
                </div>
              </label>
            </div>

            <DialogFooter className="flex justify-between items-center pt-3 border-t border-[#dbe7dd] dark:border-[#263d2e] mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-2xl border-[#dbe7dd] text-xs h-9"
              >
                Hủy
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => executeDelete(deleteModeChoice)}
                disabled={isSubmitting}
                className="rounded-2xl font-semibold text-xs h-9 bg-rose-600 hover:bg-rose-700"
              >
                {isSubmitting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
                  <span className="text-xl">{currentTypeConfig.emoji}</span>
                  <span>{editingEvent ? "Chi tiết sự kiện" : "Tạo lịch mới"}</span>
                </DialogTitle>

                {countdownText && (
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#eef5f0] text-[#2d6a4f] dark:bg-[#1b3426] dark:text-[#74c69d] flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{countdownText}</span>
                  </span>
                )}
              </div>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Múi giờ Asia/Ho_Chi_Minh. Phân biệt rõ lịch học ngoài đời, tự học, cá nhân và thi cử.
              </DialogDescription>
            </DialogHeader>

            {/* Quick Action Banner for Completion & Study Timer */}
            {editingEvent && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#eef5f0] to-[#d8ebe0] dark:from-[#1b3426] dark:to-[#17261c] border border-[#b7d8c3] dark:border-[#263d2e] my-3">
                <div className="flex items-center space-x-3">
                  <EventCompleteCheckbox
                    eventId={editingEvent.id}
                    isCompleted={Boolean(editingEvent.completed)}
                    actualDurationMinutes={editingEvent.actualDurationMinutes}
                    plannedDurationMinutes={editingEvent.plannedDurationMinutes}
                    size="lg"
                    showLabel
                    onToggled={() => {
                      if (onSuccess) onSuccess();
                      router.refresh();
                    }}
                  />
                  {editingEvent.completed && (
                    <span className="text-xs font-mono font-bold text-[#2d6a4f] dark:text-[#52b788]">
                      (Đã học: {editingEvent.actualDurationMinutes || 0} phút)
                    </span>
                  )}
                </div>

                {isSelfStudyEvent(eventType) && !editingEvent.completed && (
                  <Button
                    type="button"
                    onClick={handleStartTimer}
                    size="sm"
                    className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl text-xs font-bold space-x-1.5 shadow-2xs self-start sm:self-auto"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Study Timer</span>
                  </Button>
                )}
              </div>
            )}

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
                  <span>Cài đặt sự kiện</span>
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
                  subjectId={subjectId || editingEvent.subjectId}
                  subjectName={selectedSubject?.name || "Môn học"}
                  sessionTitle={title || editingEvent.title}
                  timeFormatted={`${startTimeStr} - ${endTimeStr}`}
                  allSubjects={subjects}
                  onSubjectChange={(newSubId) => setSubjectId(newSubId)}
                  onRefreshCalendar={onSuccess}
                />
                <div className="flex justify-between items-center pt-4 border-t border-[#dbe7dd] dark:border-[#263d2e] mt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
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
              /* TAB CONTENT: CONTEXTUAL FORM */
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                    {errorMsg}
                  </div>
                )}

                {/* 1. Event Type Selector (Section 8) */}
                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    Loại lịch sự kiện <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRIMARY_EVENT_TYPES.map((t) => {
                      const cfg = getEventTypeConfig(t);
                      const Icon = cfg.icon;
                      const isSelected = eventType === t || (t === "SELF_STUDY" && eventType === "STUDY");
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSelectEventType(t)}
                          className={`flex items-center space-x-2 p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                            isSelected
                              ? "border-[#2d6a4f] shadow-xs font-bold ring-2 ring-[#2d6a4f]/20"
                              : "border-[#dbe7dd] dark:border-[#263d2e] opacity-80 hover:opacity-100 bg-[#fbfdfb] dark:bg-[#142318]"
                          }`}
                          style={{
                            backgroundColor: isSelected ? cfg.badgeBg : undefined,
                            color: isSelected ? cfg.badgeText : undefined,
                          }}
                        >
                          <span className="text-base shrink-0">{cfg.emoji}</span>
                          <div className="truncate">
                            <div className="truncate font-bold leading-tight">{cfg.shortLabel}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-1.5">
                    {currentTypeConfig.description}
                  </p>
                </div>

                {/* 2. Title Field */}
                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    {isSchoolEvent(eventType)
                      ? "Tên môn học / buổi học ở trường"
                      : isSelfStudyEvent(eventType)
                      ? "Tên buổi tự học / Topic"
                      : isPersonalEvent(eventType)
                      ? "Tên hoạt động cá nhân / Đi chơi"
                      : eventType === "EXAM"
                      ? "Tên kỳ thi / Môn thi"
                      : eventType === "DEADLINE"
                      ? "Tên bài tập / Hạn chót cần nộp"
                      : "Tiêu đề sự kiện"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      isSchoolEvent(eventType)
                        ? "Ví dụ: Toán cao cấp, Vật lý đại cương..."
                        : isSelfStudyEvent(eventType)
                        ? "Ví dụ: IELTS Reading - Test 18, Giải bài tập Unit 3..."
                        : isPersonalEvent(eventType)
                        ? "Ví dụ: Đi chơi với bạn, Xem phim, Tiệc sinh nhật..."
                        : eventType === "EXAM"
                        ? "Ví dụ: Thi cuối kỳ Giải tích 1..."
                        : eventType === "DEADLINE"
                        ? "Ví dụ: Nộp Assignment 2, Nộp báo cáo..."
                        : "Ví dụ: Lịch hẹn bác sĩ..."
                    }
                    className="rounded-2xl h-10 text-xs"
                  />
                </div>

                {/* 3. Contextual Fields: Subject / Goal / Task */}
                {(isSchoolEvent(eventType) || isSelfStudyEvent(eventType) || eventType === "EXAM" || eventType === "DEADLINE") && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                          Môn học liên kết {isSelfStudyEvent(eventType) && <span className="text-amber-600 font-normal">(khuyên dùng)</span>}
                        </label>
                        <select
                          value={subjectId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubjectId(val);
                            setTrackStudyTime(isStudyEventCategory(eventType, val));
                          }}
                          className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                        >
                          <option value="">-- Chọn môn học --</option>
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} {sub.code ? `(${sub.code})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {goals.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5 flex items-center space-x-1">
                            <Target className="w-3 h-3 text-[#2d6a4f]" />
                            <span>Mục tiêu / Goal (Tùy chọn)</span>
                          </label>
                          <select
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                            className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                          >
                            <option value="">-- Không gắn mục tiêu --</option>
                            {goals.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {(isSelfStudyEvent(eventType) || eventType === "DEADLINE") && (
                      <div>
                        <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                          Nhiệm vụ / Task liên kết (Tùy chọn)
                        </label>
                        <select
                          value={taskId}
                          onChange={(e) => setTaskId(e.target.value)}
                          className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                        >
                          <option value="">-- Không gắn nhiệm vụ --</option>
                          {availableTasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Location Field (School, Personal, Exam, Other) */}
                {(isSchoolEvent(eventType) || isPersonalEvent(eventType) || eventType === "EXAM" || eventType === "OTHER") && (
                  <div>
                    <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-[#52b788]" />
                      <span>{isSchoolEvent(eventType) ? "Địa điểm / Phòng học" : isPersonalEvent(eventType) ? "Địa điểm gặp mặt" : eventType === "EXAM" ? "Phòng thi / Giảng đường" : "Địa điểm"}</span>
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={
                        isSchoolEvent(eventType)
                          ? "Ví dụ: Trường ĐH Bách Khoa - Phòng A203"
                          : isPersonalEvent(eventType)
                          ? "Ví dụ: Highlands Coffee Nhà Thờ..."
                          : eventType === "EXAM"
                          ? "Ví dụ: Phòng thi 405 Nhà H1..."
                          : "Ví dụ: 123 Đường Nguyễn Huệ..."
                      }
                      className="rounded-2xl h-10 text-xs"
                    />
                  </div>
                )}

                {/* 5. Date & Time (Hide if isMultiSlot is ON) */}
                {!isMultiSlot && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                        {eventType === "DEADLINE" ? "Hạn chót (Ngày)" : "Ngày bắt đầu"}
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
                        {eventType === "DEADLINE" ? "Hạn chót (Giờ)" : "Bắt đầu"}
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
                )}
                
                {isMultiSlot && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1.5">
                        Tuần bắt đầu học
                      </label>
                      <Input
                        type="date"
                        required
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Recurrence Rule Picker (Sections 9, 16) */}
                <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#52b788]" />
                      <span>{isMultiSlot ? "Lịch học định kỳ" : "Lặp lại (Chu kỳ)"}</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {!editingEvent && (
                        <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold text-[#2d6a4f] dark:text-[#52b788]">
                          <input 
                            type="checkbox" 
                            checked={isMultiSlot}
                            onChange={(e) => {
                              setIsMultiSlot(e.target.checked);
                              if (e.target.checked) setRecurrence("WEEKLY");
                              else setRecurrence("NONE");
                            }}
                            className="rounded text-[#2d6a4f] focus:ring-[#52b788]"
                          />
                          <span>Nhiều ngày/Nhiều slot</span>
                        </label>
                      )}
                      {!isMultiSlot && (
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
                      )}
                    </div>
                  </div>

                  {recurrence === "WEEKLY" && (
                    <div>
                      <p className="text-[10px] text-[#526b5c] dark:text-[#a3bda9] mb-1.5 font-medium">
                        Chọn các ngày học hàng tuần (Ví dụ: T2 + T4 + T6):
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, i) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleDay(i)}
                            className={`flex-1 h-8 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                              weeklyDays.includes(i)
                                ? activeMultiSlotDay === i 
                                  ? "bg-[#1b4332] ring-2 ring-[#52b788] text-white shadow-md"
                                  : "bg-[#2d6a4f] text-white shadow-2xs"
                                : "bg-white dark:bg-[#1e3023] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      
                      {isMultiSlot && activeMultiSlotDay !== null && weeklyDays.includes(activeMultiSlotDay) && (
                        <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#1a2e22] border border-[#dbe7dd] dark:border-[#263d2e]">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                              Khung giờ {["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][activeMultiSlotDay]}
                            </span>
                            <div className="flex space-x-2">
                              {weeklyDays.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => applySlotToAllSelectedDays(activeMultiSlotDay)}
                                  className="h-6 text-[10px] px-2 text-[#2d6a4f] hover:bg-[#eef5f0]"
                                >
                                  Copy cho ngày khác
                                </Button>
                              )}
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addSlotToDay(activeMultiSlotDay)}
                                className="h-6 text-[10px] px-2 border-[#2d6a4f] text-[#2d6a4f]"
                              >
                                + Thêm ca
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(multiSlots[activeMultiSlotDay] || []).map((slot, idx) => (
                              <div key={slot.id} className="flex items-center space-x-2">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <Input
                                    type="time"
                                    required
                                    value={slot.start}
                                    onChange={(e) => updateSlotTime(activeMultiSlotDay, slot.id, "start", e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                  <Input
                                    type="time"
                                    required
                                    value={slot.end}
                                    onChange={(e) => updateSlotTime(activeMultiSlotDay, slot.id, "end", e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                {multiSlots[activeMultiSlotDay].length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSlotFromDay(activeMultiSlotDay, slot.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {recurrence !== "NONE" && (
                    <div>
                      <label className="block text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
                        Ngày kết thúc lặp (Tùy chọn)
                      </label>
                      <Input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* 7. Advanced Controls: isLocked, isFlexible */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e]">
                  <div className="text-[11px] font-bold text-[#192e22] dark:text-[#f0f7f2] uppercase tracking-wider flex items-center space-x-1.5 mb-1">
                    <Sliders className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Cấu hình linh hoạt & Ràng buộc AI</span>
                  </div>

                  {/* isLocked Checkbox (Phase 18) */}
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={isLocked}
                      onChange={(e) => {
                        setIsLocked(e.target.checked);
                        if (e.target.checked) setIsFlexible(false);
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-[#2d6a4f] focus:ring-[#52b788] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-[#a3a86c]" />
                        <span>Khóa sự kiện này (Hard Constraint)</span>
                      </span>
                      <p className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">
                        Lịch cố định không thể dịch chuyển. AI Scheduler tuyệt đối không được xếp lịch tự học đè lên khung giờ này.
                      </p>
                    </div>
                  </label>

                  {/* isFlexible Checkbox (Phase 18) */}
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={isFlexible}
                      onChange={(e) => {
                        setIsFlexible(e.target.checked);
                        if (e.target.checked) setIsLocked(false);
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-[#2d6a4f] focus:ring-[#52b788] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                        Linh hoạt (Flexible Constraint)
                      </span>
                      <p className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">
                        Cho phép kéo thả tự do hoặc để AI Scheduler đề xuất dời giờ khi phát sinh xung đột khẩn cấp.
                      </p>
                    </div>
                  </label>
                </div>

                {/* 8. Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                    Ghi chú chi tiết
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isSchoolEvent(eventType)
                        ? "Ví dụ: Phòng A203, mang bài tập nhóm, nộp bài kiểm tra..."
                        : isSelfStudyEvent(eventType)
                        ? "Ví dụ: Làm đề Cambridge 18 Test 2 Reading, xem giải chi tiết..."
                        : isPersonalEvent(eventType)
                        ? "Ví dụ: Hẹn ăn tối mừng sinh nhật bạn..."
                        : "Ghi chú nội dung..."
                    }
                    className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2]"
                  />
                </div>

                <DialogFooter className="flex justify-between items-center pt-2">
                  {editingEvent ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteClick}
                      disabled={isSubmitting}
                      size="sm"
                      className="font-semibold rounded-2xl"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Xóa lịch</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="rounded-2xl border-[#dbe7dd] text-xs"
                    >
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

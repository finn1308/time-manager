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
  CalendarClock,
  Sun,
  Sunset,
  Moon,
  Compass,
  CheckCircle2,
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

import { toast } from "sonner";

function addMinutesToTimeString(timeStr: string, minutes: number): string {
  if (!timeStr || !timeStr.includes(":")) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return "";
  let total = h * 60 + m + minutes;
  total = (total % 1440 + 1440) % 1440;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function calcMinutesBetweenTimes(startStr: string, endStr: string): number {
  if (!startStr || !endStr || !startStr.includes(":") || !endStr.includes(":")) return 60;
  const [sh, sm] = startStr.split(":").map((v) => parseInt(v, 10));
  const [eh, em] = endStr.split(":").map((v) => parseInt(v, 10));
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 60;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 1440;
  return diff;
}

function formatDurationLabelVN(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 phút";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) {
    return `${h} giờ ${m} phút (${minutes} phút)`;
  }
  if (h > 0) {
    return `${h} giờ (${minutes} phút)`;
  }
  return `${minutes} phút`;
}

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
    skillId?: string | null;
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
    schedulingMode?: string;
    targetMinutes?: number;
    activeDays?: number[] | string;
    preferredPeriod?: string;
    deadline?: string | Date | null;
    subject?: { id: string; name: string; code: string | null; color: string } | null;
    skill?: { id: string; name: string; category?: string } | null;
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

  // Scheduling Mode State (Section 1)
  const [schedulingMode, setSchedulingMode] = useState<"FIXED" | "FLEXIBLE">("FIXED");
  const [targetType, setTargetType] = useState<"SUBJECT" | "SKILL">("SUBJECT");
  const [skillId, setSkillId] = useState<string>("");
  const [skills, setSkills] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const [flexibleTargetMinutes, setFlexibleTargetMinutes] = useState<number>(30);
  const [startDateStr, setStartDateStr] = useState<string>(defaultDate);
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [flexibleActiveDays, setFlexibleActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [preferredPeriod, setPreferredPeriod] = useState<"ANY_TIME" | "MORNING" | "AFTERNOON" | "EVENING">("ANY_TIME");
  const [flexibleDeadline, setFlexibleDeadline] = useState<string>("");

  // Multi-slot state
  const [isMultiSlot, setIsMultiSlot] = useState(false);
  const [multiSlots, setMultiSlots] = useState<Record<number, Array<{id: string, start: string, end: string}>>>({});
  const [activeMultiSlotDay, setActiveMultiSlotDay] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState<number>(90);
  const [recurrence, setRecurrence] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("NONE");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");

  // Recurring delete modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteModeChoice, setDeleteModeChoice] = useState<"SINGLE" | "ALL" | "FUTURE" | "SERIES">("SINGLE");

  // Fetch tasks, goals, and skills for dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [resTasks, resGoals, resSkills] = await Promise.all([
          fetch("/api/tasks").then((r) => (r.ok ? r.json() : { tasks: [] })),
          fetch("/api/goals").then((r) => (r.ok ? r.json() : { goals: [] })),
          fetch("/api/skills").then((r) => (r.ok ? r.json() : [])),
        ]);
        if (resTasks.tasks) setTasks(resTasks.tasks);
        if (resGoals.goals) setGoals(resGoals.goals);
        if (Array.isArray(resSkills)) setSkills(resSkills);
      } catch (e) {
        console.warn("Failed to load tasks/goals/skills:", e);
      }
    }
    loadDropdowns();
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

      const isFlexMode = editingEvent.schedulingMode === "FLEXIBLE" || Boolean(editingEvent.targetMinutes);
      setSchedulingMode(isFlexMode ? "FLEXIBLE" : "FIXED");

      if (editingEvent.skillId) {
        setTargetType("SKILL");
        setSkillId(editingEvent.skillId);
      } else {
        setTargetType("SUBJECT");
        setSkillId("");
      }

      setFlexibleTargetMinutes(editingEvent.targetMinutes || editingEvent.plannedDurationMinutes || 30);
      setStartDateStr(formatVN(editingEvent.startTime, "yyyy-MM-dd"));
      if (editingEvent.recurrenceEnd) {
        setEndDateStr(formatVN(editingEvent.recurrenceEnd, "yyyy-MM-dd"));
      } else {
        setEndDateStr("");
      }

      if (editingEvent.activeDays) {
        if (Array.isArray(editingEvent.activeDays)) {
          setFlexibleActiveDays(editingEvent.activeDays);
        } else if (typeof editingEvent.activeDays === "string") {
          setFlexibleActiveDays(
            editingEvent.activeDays
              .split(",")
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n))
          );
        }
      } else {
        setFlexibleActiveDays([1, 2, 3, 4, 5]);
      }

      setPreferredPeriod((editingEvent.preferredPeriod as any) || "ANY_TIME");
      if (editingEvent.deadline) {
        setFlexibleDeadline(formatVN(editingEvent.deadline, "yyyy-MM-dd"));
      } else {
        setFlexibleDeadline("");
      }

      const normalizedType = ((editingEvent.type?.toUpperCase() || "OTHER") as CalendarEventType);
      setEventType(normalizedType);

      setDateStr(formatVN(editingEvent.startTime, "yyyy-MM-dd"));
      setStartTimeStr(formatVN(editingEvent.startTime, "HH:mm"));
      setEndTimeStr(formatVN(editingEvent.endTime, "HH:mm"));
      setIsLocked(!!editingEvent.isLocked);
      setIsFlexible(editingEvent.isFlexible ?? (normalizedType === "PERSONAL"));
      setIsAllDay((editingEvent as any).isAllDay || false);
      if (editingEvent.plannedDurationMinutes) setPlannedDurationMinutes(editingEvent.plannedDurationMinutes);
      const isStudy = isStudyEventCategory(normalizedType, editingEvent.subjectId);
      setTrackStudyTime(isStudy ? true : (editingEvent.trackStudyTime ?? false));
      setRecurrence((editingEvent.recurrence && editingEvent.recurrence !== "NONE" ? editingEvent.recurrence : "NONE") as any);

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
      setSkillId("");
      setTargetType("SUBJECT");
      setTaskId("");
      setGoalId("");
      setSchedulingMode("FIXED");
      setFlexibleTargetMinutes(30);
      setStartDateStr(defaultDate);
      setEndDateStr("");
      setFlexibleActiveDays([1, 2, 3, 4, 5]);
      setPreferredPeriod("ANY_TIME");
      setFlexibleDeadline("");
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
    const distance = dayOfWeek - currentDay; // Lấy đúng ngày trong tuần của baseDate
    d.setDate(d.getDate() + distance);
    return d;
  };

  const handleSaveAction = async (mode: "SINGLE" | "ALL" = "SINGLE") => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (schedulingMode === "FLEXIBLE") {
        let finalTitle = title.trim();
        if (!finalTitle) {
          if (targetType === "SUBJECT") {
            const sub = subjects.find((s) => s.id === subjectId);
            if (sub) finalTitle = sub.name;
          } else {
            const sk = skills.find((s) => s.id === skillId);
            if (sk) finalTitle = sk.name;
          }
        }
        if (!finalTitle) {
          throw new Error("Vui lòng nhập tên mục tiêu hoặc chọn môn học/kỹ năng");
        }

        const payload = {
          id: editingEvent?.id,
          schedulingMode: "FLEXIBLE",
          title: finalTitle,
          description: description.trim() || null,
          subjectId: targetType === "SUBJECT" && subjectId ? subjectId : null,
          skillId: targetType === "SKILL" && skillId ? skillId : null,
          targetMinutes: Number(flexibleTargetMinutes) || 30,
          startDate: startDateStr || dateStr,
          endDate: endDateStr || null,
          activeDays: flexibleActiveDays,
          preferredPeriod,
          deadline: flexibleDeadline || null,
        };

        const res = await fetch("/api/calendar/events", {
          method: editingEvent ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể lưu mục tiêu học linh hoạt");

        toast.success(editingEvent ? "Đã cập nhật mục tiêu học linh hoạt!" : "Đã tạo mục tiêu học linh hoạt thành công!");
        window.dispatchEvent(new Event("chronomind-study-updated"));
        if (onSuccess) onSuccess();
        router.refresh();
        onClose();
        return;
      }

      if (!title.trim()) throw new Error("Vui lòng nhập tiêu đề sự kiện");
      if (!dateStr) throw new Error("Vui lòng chọn ngày");
      if (!isAllDay && (!startTimeStr || !endTimeStr)) throw new Error("Vui lòng nhập giờ bắt đầu và kết thúc");

      let startUTC = new Date();
      let endUTC = new Date();
      let schedulesPayload: any[] = [];

      if (isAllDay) {
        startUTC = makeVNDate(dateStr, "00:00");
        endUTC = makeVNDate(dateStr, "23:59");
      } else if (isMultiSlot) {
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
            
            let rruleStr = undefined;
            if (recurrence === "WEEKLY") {
              rruleStr = `FREQ=WEEKLY;BYDAY=${daysCode[day]}${recurrenceEndDate ? `;UNTIL=${new Date(recurrenceEndDate).toISOString().replace(/[-:]/g, "").split(".")[0]}Z` : ''}`;
            }

            schedulesPayload.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              recurrenceRule: rruleStr,
            });
          }
        }
        // Use the first schedule as the master for the single-event fallback validation
        if (schedulesPayload.length > 0) {
          // Sort schedules to find the earliest one for the master event
          schedulesPayload.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
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
        isAllDay,
        plannedDurationMinutes: isAllDay ? plannedDurationMinutes : undefined,
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

  const executeDelete = async (mode: "SINGLE" | "ALL" | "FUTURE" | "SERIES") => {
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
      toast.error(e.message || "Không thể xóa sự kiện");
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
      toast("Chỉ lịch Tự học (SELF_STUDY) mới có thể bấm giờ học!");
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
    toast.success("Đã sao chép khung giờ sang các ngày khác thành công!");
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
      <DialogContent onClose={onClose} className="max-w-xl rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        {/* DELETE CONFIRMATION MODAL (Sections 17-20) */}
        {showDeleteConfirmModal && editingEvent ? (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Xác nhận xóa lịch "{editingEvent.title}"</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--text-subtle)]">
                Sự kiện này thuộc chuỗi lịch lặp:{" "}
                <span className="font-semibold text-[var(--text-ink)]">
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
              <p className="text-[var(--text-subtle)]">
                Bạn muốn áp dụng việc xóa cho:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <label
                onClick={() => setDeleteModeChoice("SINGLE")}
                className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteModeChoice === "SINGLE"
                    ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1b3426] ring-1 ring-[#2d6a4f]"
                    : "border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]"
                }`}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteModeChoice === "SINGLE"}
                  onChange={() => setDeleteModeChoice("SINGLE")}
                  className="mt-0.5 text-[var(--mint-dark)] focus:ring-[#52b788]"
                />
                <div>
                  <div className="font-bold text-xs text-[var(--text-ink)]">
                    Chỉ xóa lịch này
                  </div>
                  <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                    Chỉ hủy occurrence vào ngày {formatVN(editingEvent.startTime, "dd/MM/yyyy")}. Các buổi học khác trong chuỗi vẫn giữ nguyên vẹn.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDeleteModeChoice("ALL")}
                className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteModeChoice === "ALL"
                    ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-600"
                    : "border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]"
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
                  <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                    Xóa toàn bộ chuỗi sự kiện này (các buổi học đã diễn ra có StudySession thực tế vẫn được bảo toàn dữ liệu lịch sử).
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDeleteModeChoice("FUTURE")}
                className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  deleteModeChoice === "FUTURE"
                    ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-600"
                    : "border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]"
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
                  <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                    Dừng chuỗi lặp lại từ ngày {formatVN(editingEvent.startTime, "dd/MM/yyyy")}. Các buổi trước ngày này vẫn giữ nguyên.
                  </div>
                </div>
              </label>

              {editingEvent.seriesId && (
                <label
                  onClick={() => setDeleteModeChoice("SERIES")}
                  className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    deleteModeChoice === "SERIES"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-1 ring-purple-600"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteModeChoice === "SERIES"}
                    onChange={() => setDeleteModeChoice("SERIES")}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-purple-700 dark:text-purple-300">
                      Xóa toàn bộ nhóm lịch môn này
                    </div>
                    <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                      Xóa tất cả các khung giờ thuộc các ngày khác nhau (T2, T3...) được tạo cùng đợt.
                    </div>
                  </div>
                </label>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center pt-3 border-t border-[var(--border)] mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-2xl border-[var(--border)] text-xs h-9"
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
                <DialogTitle className="text-lg font-bold text-[var(--text-ink)] flex items-center space-x-2">
                  <span className="text-xl">{currentTypeConfig.emoji}</span>
                  <span>{editingEvent ? "Chi tiết sự kiện" : "Tạo lịch mới"}</span>
                </DialogTitle>

                {countdownText && (
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] dark:bg-[#1b3426] dark:text-[#74c69d] flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{countdownText}</span>
                  </span>
                )}
              </div>
              <DialogDescription className="text-xs text-[var(--text-subtle)]">
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
                    <span className="text-xs font-mono font-bold text-[var(--mint-dark)]">
                      (Đã học: {editingEvent.actualDurationMinutes || 0} phút)
                    </span>
                  )}
                </div>

                {isSelfStudyEvent(eventType) && !editingEvent.completed && (
                  <Button
                    type="button"
                    onClick={handleStartTimer}
                    size="sm"
                    className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-xl text-xs font-bold space-x-1.5 shadow-2xs self-start sm:self-auto"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Study Timer</span>
                  </Button>
                )}
              </div>
            )}

            {/* Mode Tabs if Editing Existing Event */}
            {editingEvent && (
              <div className="flex rounded-2xl bg-[#f0f6f2] dark:bg-[#15251b] p-1 border border-[var(--border)] my-3">
                <button
                  type="button"
                  onClick={() => setActiveModalTab("schedule")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                    activeModalTab === "schedule"
                      ? "bg-white dark:bg-[#1f3426] text-[var(--text-ink)] shadow-2xs"
                      : "text-[var(--text-subtle)] hover:text-[var(--text-ink)]"
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
                      ? "bg-white dark:bg-[#1f3426] text-[var(--text-ink)] shadow-2xs"
                      : "text-[var(--text-subtle)] hover:text-[var(--text-ink)]"
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
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)] mt-4">
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
                    className="rounded-2xl border-[var(--border)] text-xs h-9"
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

                {/* 0. Cách sắp xếp thời gian (Scheduling Mode Selector - Section 1) */}
                <div className="space-y-1.5 pb-1">
                  <label className="block text-xs font-bold text-[var(--text-ink)] dark:text-[#d8ebe0]">
                    Cách sắp xếp thời gian <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option A: Lịch cố định */}
                    <button
                      type="button"
                      onClick={() => setSchedulingMode("FIXED")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        schedulingMode === "FIXED"
                          ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1b3426] ring-2 ring-[#2d6a4f]/25 shadow-xs"
                          : "border-[var(--border)] bg-[#fbfdfb] dark:bg-[#142318] hover:bg-white opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CalendarClock className={`w-4 h-4 ${schedulingMode === "FIXED" ? "text-[var(--mint-dark)]" : "text-[var(--text-subtle)]"}`} />
                        <span className="text-xs font-bold text-[var(--text-ink)]">
                          Lịch cố định
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                        Học vào khung giờ cụ thể.
                      </p>
                    </button>

                    {/* Option B: Mục tiêu học linh hoạt */}
                    <button
                      type="button"
                      onClick={() => setSchedulingMode("FLEXIBLE")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        schedulingMode === "FLEXIBLE"
                          ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1b3426] ring-2 ring-[#2d6a4f]/25 shadow-xs"
                          : "border-[var(--border)] bg-[#fbfdfb] dark:bg-[#142318] hover:bg-white opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className={`w-4 h-4 ${schedulingMode === "FLEXIBLE" ? "text-[var(--mint-dark)]" : "text-[var(--text-subtle)]"}`} />
                        <span className="text-xs font-bold text-[var(--text-ink)]">
                          Mục tiêu học linh hoạt
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                        Hoàn thành đủ thời lượng trong ngày, không cần chọn giờ bắt đầu.
                      </p>
                    </button>
                  </div>
                </div>

                {schedulingMode === "FLEXIBLE" ? (
                  <div className="space-y-4 pt-1">
                    {/* Subject or Skill Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0]">
                          Môn học hoặc Kỹ năng <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex rounded-xl bg-[var(--mint-bg)] dark:bg-[#15251b] p-0.5 border border-[var(--border)] text-[11px]">
                          <button
                            type="button"
                            onClick={() => setTargetType("SUBJECT")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              targetType === "SUBJECT"
                                ? "bg-[var(--mint)] text-white shadow-2xs"
                                : "text-[var(--text-subtle)] hover:text-[var(--text-ink)]"
                            }`}
                          >
                            Môn học
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetType("SKILL")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                              targetType === "SKILL"
                                ? "bg-[var(--mint)] text-white shadow-2xs"
                                : "text-[var(--text-subtle)] hover:text-[var(--text-ink)]"
                            }`}
                          >
                            Kỹ năng / Skill
                          </button>
                        </div>
                      </div>

                      {targetType === "SUBJECT" ? (
                        <select
                          value={subjectId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubjectId(val);
                            const found = subjects.find((s) => s.id === val);
                            if (found && !title) setTitle(found.name);
                          }}
                          className="w-full h-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                        >
                          <option value="">-- Chọn môn học --</option>
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} {sub.code ? `(${sub.code})` : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={skillId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSkillId(val);
                            const found = skills.find((s) => s.id === val);
                            if (found && !title) setTitle(found.name);
                          }}
                          className="w-full h-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                        >
                          <option value="">-- Chọn kỹ năng / Skill --</option>
                          {skills.map((sk) => (
                            <option key={sk.id} value={sk.id}>
                              {sk.name} {sk.category ? `(${sk.category})` : ""}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="mt-2.5">
                        <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                          Tên mục tiêu / Kỹ năng cần học <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ví dụ: English Vocabulary, Giải đề LeetCode, Ôn tập HSK 4..."
                          className="rounded-2xl h-10 text-xs"
                        />
                      </div>
                    </div>

                    {/* Daily Target Duration */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[var(--text-ink)] flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
                          <span>Thời lượng mục tiêu mỗi ngày <span className="text-rose-500">*</span></span>
                        </label>
                        <span className="font-mono text-xs font-bold text-[var(--mint-dark)]">
                          {flexibleTargetMinutes} phút / ngày
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[15, 30, 45, 60, 90, 120].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setFlexibleTargetMinutes(mins)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              flexibleTargetMinutes === mins
                                ? "bg-[var(--mint)] text-white shadow-2xs"
                                : "bg-white dark:bg-[#1b2b20] border border-[var(--border)] text-[var(--text-subtle)] hover:bg-[var(--mint-bg)]"
                            }`}
                          >
                            {mins} phút
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[11px] text-[var(--text-subtle)]">Hoặc tự nhập:</span>
                        <Input
                          type="number"
                          min={5}
                          max={600}
                          value={flexibleTargetMinutes}
                          onChange={(e) => setFlexibleTargetMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                          className="w-24 h-8 text-xs font-mono rounded-xl"
                        />
                        <span className="text-xs text-[var(--text-subtle)]">phút</span>
                      </div>
                    </div>

                    {/* Start Date & Optional End Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                          Ngày bắt đầu <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          required
                          value={startDateStr}
                          onChange={(e) => setStartDateStr(e.target.value)}
                          className="rounded-2xl h-10 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                          Ngày kết thúc (Tùy chọn)
                        </label>
                        <Input
                          type="date"
                          value={endDateStr}
                          onChange={(e) => setEndDateStr(e.target.value)}
                          className="rounded-2xl h-10 text-xs"
                        />
                      </div>
                    </div>

                    {/* Active Weekdays */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[var(--text-ink)]">
                          Các ngày áp dụng trong tuần
                        </label>
                        <div className="flex space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setFlexibleActiveDays([0, 1, 2, 3, 4, 5, 6])}
                            className="text-[10px] font-bold text-[var(--mint-dark)] hover:underline cursor-pointer"
                          >
                            Cả tuần
                          </button>
                          <span className="text-[var(--text-subtle)] text-[10px]">•</span>
                          <button
                            type="button"
                            onClick={() => setFlexibleActiveDays([1, 2, 3, 4, 5])}
                            className="text-[10px] font-bold text-[var(--mint-dark)] hover:underline cursor-pointer"
                          >
                            T2 - T6
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        {[
                          { label: "CN", val: 0 },
                          { label: "T2", val: 1 },
                          { label: "T3", val: 2 },
                          { label: "T4", val: 3 },
                          { label: "T5", val: 4 },
                          { label: "T6", val: 5 },
                          { label: "T7", val: 6 },
                        ].map((d) => {
                          const isSelected = flexibleActiveDays.includes(d.val);
                          return (
                            <button
                              key={d.val}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (flexibleActiveDays.length > 1) {
                                    setFlexibleActiveDays(flexibleActiveDays.filter((x) => x !== d.val));
                                  } else {
                                    toast.error("Cần chọn ít nhất 1 ngày trong tuần");
                                  }
                                } else {
                                  setFlexibleActiveDays([...flexibleActiveDays, d.val].sort());
                                }
                              }}
                              className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[var(--mint)] text-white shadow-2xs"
                                  : "bg-white dark:bg-[#1b2b20] border border-[var(--border)] text-[var(--text-subtle)] hover:bg-[var(--mint-bg)]"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preferred Study Period */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5 flex items-center space-x-1">
                        <Sun className="w-3.5 h-3.5 text-[#52b788]" />
                        <span>Khung giờ ưu tiên trong ngày (Tùy chọn)</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "ANY_TIME", label: "Bất kỳ lúc nào", icon: Compass },
                          { id: "MORNING", label: "Buổi sáng", icon: Sun },
                          { id: "AFTERNOON", label: "Buổi chiều", icon: Sunset },
                          { id: "EVENING", label: "Buổi tối", icon: Moon },
                        ].map((p) => {
                          const Icon = p.icon;
                          const isSelected = preferredPeriod === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPreferredPeriod(p.id as any)}
                              className={`p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 text-[var(--text-subtle)]enter ${
                                isSelected
                                  ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1b3426] text-[var(--mint-dark)] ring-1 ring-[#2d6a4f]"
                                  : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-subtle)] hover:bg-[var(--bg-muted)]"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-[11px] leading-tight">{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Deadline */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5 flex items-center space-x-1">
                        <Target className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hạn chót hoàn thành mục tiêu (Tùy chọn)</span>
                      </label>
                      <Input
                        type="date"
                        value={flexibleDeadline}
                        onChange={(e) => setFlexibleDeadline(e.target.value)}
                        className="rounded-2xl h-10 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. Event Type Selector (Section 8) */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
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
                              ? "border-[var(--mint)] shadow-xs font-bold ring-2 ring-[#2d6a4f]/20"
                              : "border-[var(--border)] opacity-80 hover:opacity-100 bg-[#fbfdfb] dark:bg-[#142318]"
                          }`}
                          style={{
                            backgroundColor: isSelected ? cfg.badgeBg : undefined,
                            color: isSelected ? cfg.badgeText : undefined,
                          }}
                        >
                          <span className="text-[var(--text-subtle)]ase shrink-0">{cfg.emoji}</span>
                          <div className="truncate">
                            <div className="truncate font-bold leading-tight">{cfg.shortLabel}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[var(--text-subtle)] mt-1.5">
                    {currentTypeConfig.description}
                  </p>
                </div>

                {/* 2. Title Field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
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
                        <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                          Môn học liên kết {isSelfStudyEvent(eventType) && <span className="text-amber-600 font-normal">(khuyên dùng)</span>}
                        </label>
                        <select
                          value={subjectId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubjectId(val);
                            setTrackStudyTime(isStudyEventCategory(eventType, val));
                          }}
                          className="w-full h-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
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
                          <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5 flex items-center space-x-1">
                            <Target className="w-3 h-3 text-[var(--mint-dark)]" />
                            <span>Mục tiêu / Goal (Tùy chọn)</span>
                          </label>
                          <select
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                            className="w-full h-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
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
                        <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                          Nhiệm vụ / Task liên kết (Tùy chọn)
                        </label>
                        <select
                          value={taskId}
                          onChange={(e) => setTaskId(e.target.value)}
                          className="w-full h-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
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
                    <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5 flex items-center space-x-1">
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
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-[var(--mint-dark)]">
                        <input 
                          type="checkbox" 
                          checked={isAllDay}
                          onChange={(e) => setIsAllDay(e.target.checked)}
                          className="rounded text-[var(--mint-dark)] focus:ring-[#52b788]"
                        />
                        <span>Học tự do trong ngày (Không cần xếp giờ)</span>
                      </label>
                    </div>

                    {!isAllDay ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
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
                          <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
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
                          <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
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
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                            Ngày
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
                          <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                            Thời lượng (phút)
                          </label>
                          <select
                            value={plannedDurationMinutes}
                            onChange={(e) => setPlannedDurationMinutes(Number(e.target.value))}
                            className="w-full rounded-2xl h-10 text-xs px-3 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-ink)]"
                          >
                            <option value={15}>15 phút</option>
                            <option value={30}>30 phút</option>
                            <option value={45}>45 phút</option>
                            <option value={60}>60 phút (1 giờ)</option>
                            <option value={90}>90 phút (1.5 giờ)</option>
                            <option value={120}>120 phút (2 giờ)</option>
                            <option value={180}>180 phút (3 giờ)</option>
                            <option value={240}>240 phút (4 giờ)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {isMultiSlot && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1.5">
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
                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-ink)] flex items-center space-x-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#52b788]" />
                      <span>{isMultiSlot ? "Lịch học định kỳ" : "Lặp lại (Chu kỳ)"}</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {!editingEvent && (
                        <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold text-[var(--mint-dark)]">
                          <input 
                            type="checkbox" 
                            checked={isMultiSlot}
                            onChange={(e) => {
                              setIsMultiSlot(e.target.checked);
                              if (e.target.checked) setRecurrence("WEEKLY");
                              else setRecurrence("NONE");
                            }}
                            className="rounded text-[var(--mint-dark)] focus:ring-[#52b788]"
                          />
                          <span>Nhiều ngày/Nhiều slot</span>
                        </label>
                      )}
                      {isMultiSlot ? (
                        <select
                          value={recurrence}
                          onChange={(e) => setRecurrence(e.target.value as any)}
                          className="h-8 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-ink)]"
                        >
                          <option value="NONE">Chỉ chọn trong tuần này (Không lặp)</option>
                          <option value="WEEKLY">Lặp lại hàng tuần</option>
                        </select>
                      ) : (
                        <select
                          value={recurrence}
                          onChange={(e) => setRecurrence(e.target.value as any)}
                          className="h-8 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-ink)]"
                        >
                          <option value="NONE">Không lặp (Một lần)</option>
                          <option value="DAILY">Hàng ngày</option>
                          <option value="WEEKLY">Hàng tuần</option>
                          <option value="MONTHLY">Hàng tháng</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {(recurrence === "WEEKLY" || isMultiSlot) && (
                    <div>
                      <p className="text-[10px] text-[var(--text-subtle)] mb-1.5 font-medium">
                        {isMultiSlot ? "Chọn các ngày trong tuần:" : "Chọn các ngày học hàng tuần:"}
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
                                  : "bg-[var(--mint)] text-white shadow-2xs"
                                : "bg-white dark:bg-[#1e3023] text-[var(--text-subtle)] border border-[var(--border)]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      
                      {isMultiSlot && activeMultiSlotDay !== null && weeklyDays.includes(activeMultiSlotDay) && (
                        <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#1a2e22] border border-[var(--border)]">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-[var(--text-ink)]">
                              Khung giờ {["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][activeMultiSlotDay]}
                            </span>
                            <div className="flex space-x-2">
                              {weeklyDays.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => applySlotToAllSelectedDays(activeMultiSlotDay)}
                                  className="h-6 text-[10px] px-2 text-[var(--mint-dark)] hover:bg-[var(--mint-bg)]"
                                >
                                  Copy cho ngày khác
                                </Button>
                              )}
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addSlotToDay(activeMultiSlotDay)}
                                className="h-6 text-[10px] px-2 border-[var(--mint)] text-[var(--mint-dark)]"
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
                      <label className="block text-[10px] font-semibold text-[var(--text-subtle)] mb-1">
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
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)]">
                  <div className="text-[11px] font-bold text-[var(--text-ink)] uppercase tracking-wider flex items-center space-x-1.5 mb-1">
                    <Sliders className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
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
                      className="mt-0.5 w-4 h-4 rounded text-[var(--mint-dark)] focus:ring-[#52b788] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[var(--text-ink)] flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-[#a3a86c]" />
                        <span>Khóa sự kiện này (Hard Constraint)</span>
                      </span>
                      <p className="text-[10px] text-[var(--text-subtle)]">
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
                      className="mt-0.5 w-4 h-4 rounded text-[var(--mint-dark)] focus:ring-[#52b788] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[var(--text-ink)]">
                        Linh hoạt (Flexible Constraint)
                      </span>
                      <p className="text-[10px] text-[var(--text-subtle)]">
                        Cho phép kéo thả tự do hoặc để AI Scheduler đề xuất dời giờ khi phát sinh xung đột khẩn cấp.
                      </p>
                    </div>
                  </label>
                </div>
                  </>
                )}

                {/* 8. Description */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
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
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[var(--text-ink)]"
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
                      className="rounded-2xl border-[var(--border)] text-xs"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      disabled={isSubmitting}
                      className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl font-semibold text-xs"
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

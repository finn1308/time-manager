"use client";

import React, { useState, useEffect } from "react";
import { WeekView } from "@/components/calendar/week-view";
import { MonthView } from "@/components/calendar/month-view";
import { DayView } from "@/components/calendar/day-view";
import { AgendaView } from "@/components/calendar/agenda-view";
import { WhatIfSimulatorModal } from "@/components/calendar/what-if-simulator-modal";
import { RescheduleRecoveryModal } from "@/components/calendar/reschedule-recovery-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Grid,
  CalendarDays,
  Clock,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  RefreshCw,
  List,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ALL_EVENT_TYPES, getEventTypeConfig } from "@/lib/calendar/event-types";
import { SchoolTimetableGeneratorModal } from "@/components/calendar/school-timetable-generator-modal";
import { DailyFlexibleGoals } from "@/components/calendar/daily-flexible-goals";
import { EventModal } from "@/components/calendar/event-modal";

import { toast } from "sonner";
interface CalendarClientProps {
  initialEvents: any[];
  initialBlockedSlots: any[];
  initialSubjects: any[];
}

export function CalendarClient({
  initialEvents,
  initialBlockedSlots,
  initialSubjects,
}: CalendarClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "agenda">("week");
  const [events, setEvents] = useState<any[]>(initialEvents);
  const [blockedSlots, setBlockedSlots] = useState<any[]>(initialBlockedSlots);
  const [subjects, setSubjects] = useState<any[]>(initialSubjects);
  const [isRefreshing, setIsRefreshing] = useState(false); // only true when manually refreshing

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  // Natural Language Scheduling State (Section 17 & 44)
  const [nlpInput, setNlpInput] = useState("");
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [nlpProposal, setNlpProposal] = useState<any | null>(null);
  const [isConfirmingNlp, setIsConfirmingNlp] = useState(false);

  // What-If Simulator State (Section 35)
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  // Smart Reschedule & Recovery Modal (Section 16)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // School Timetable Generator Modal (Phase 8)
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);

  // New Event Modal State (supporting both Fixed and Flexible Goals)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [resEvents, resSlots, resSubs] = await Promise.all([
        fetch("/api/calendar/events").then((r) => r.json()),
        fetch("/api/blocked-slots").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resEvents.events) setEvents(resEvents.events);
      if (resSlots.slots) setBlockedSlots(resSlots.slots);
      if (resSubs.subjects) setSubjects(resSubs.subjects);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const handleStudyUpdated = () => {
      loadData();
    };
    window.addEventListener("chronomind-study-updated", handleStudyUpdated);
    return () => {
      window.removeEventListener("chronomind-study-updated", handleStudyUpdated);
    };
  }, []);

  const handleParseNlp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim() || isParsingNlp) return;
    setIsParsingNlp(true);

    try {
      const res = await fetch("/api/ai/parse-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlpInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể phân tích câu lệnh");

      setNlpProposal(data.parsed);
    } catch (err: any) {
      toast.error(err.message || "Lỗi xử lý ngôn ngữ tự nhiên");
    } finally {
      setIsParsingNlp(false);
    }
  };

  const handleConfirmNlpEvent = async () => {
    if (!nlpProposal) return;
    setIsConfirmingNlp(true);

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nlpProposal.title,
          subjectId: nlpProposal.subjectId,
          startTime: nlpProposal.startTime,
          endTime: nlpProposal.endTime,
          type: "STUDY",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Không thể lưu lịch học");
      }

      setNlpProposal(null);
      setNlpInput("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu sự kiện");
    } finally {
      setIsConfirmingNlp(false);
    }
  };

  const handleTriggerReschedule = () => {
    setIsRescheduleOpen(true);
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === "ALL" || ev.subject?.id === selectedSubjectFilter;
    const evType = (ev.type || "OTHER").toUpperCase();
    const matchesType =
      selectedTypeFilter === "ALL" ||
      evType === selectedTypeFilter ||
      (selectedTypeFilter === "SELF_STUDY" && evType === "STUDY");
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
            <CalendarIcon className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Lịch học & Phân bổ thời gian</span>
          </h1>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
            Múi giờ Asia/Ho_Chi_Minh. AI đọc toàn bộ lịch bận và khung giờ khóa để xếp lịch an toàn không xung đột.
          </p>
        </div>

        {/* View mode switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* School Timetable Generator Trigger (Phase 8) */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTimetableOpen(true)}
            className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs font-semibold space-x-1.5 h-9 bg-white dark:bg-[#17261c] hover:bg-[#eef5f0] dark:hover:bg-[#1b3426]"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Thời khóa biểu trường</span>
          </Button>

          {/* What-If Simulator Trigger (Section 35) */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWhatIfOpen(true)}
            className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs font-semibold space-x-1.5 h-9"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>What-If? (Giả định)</span>
          </Button>

          {/* Smart Reschedule Trigger (Section 16) */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerReschedule}
            className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs font-semibold space-x-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Smart Reschedule</span>
          </Button>

          {/* Day / Week / Month View Switcher */}
          <div className="flex items-center space-x-1 p-1 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] text-xs shadow-2xs">
            <button
              onClick={() => setViewMode("day")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                viewMode === "day"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ngày</span>
            </button>

            <button
              onClick={() => setViewMode("week")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                viewMode === "week"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tuần</span>
            </button>

            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tháng</span>
            </button>

            <button
              onClick={() => setViewMode("agenda")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-[#f0f7f2]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="🔍 Tìm kiếm sự kiện..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white dark:bg-[#17261c] border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl text-xs h-10 w-full sm:w-1/3"
        />
        <select
          value={selectedSubjectFilter}
          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl text-xs h-10 px-3 w-full sm:w-1/4 outline-none text-[#192e22] dark:text-[#f0f7f2]"
        >
          <option value="ALL">Tất cả môn học</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
        <select
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value)}
          className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl text-xs h-10 px-3 w-full sm:w-1/4 outline-none text-[#192e22] dark:text-[#f0f7f2]"
        >
          <option value="ALL">Tất cả loại sự kiện</option>
          {ALL_EVENT_TYPES.map((t) => {
            const cfg = getEventTypeConfig(t);
            return (
              <option key={t} value={t}>
                {cfg.label}
              </option>
            );
          })}
        </select>
      </div>

      {/* Natural Language Event Quick Input (Section 17 & 44) */}
      <form
        onSubmit={handleParseNlp}
        className="p-3.5 rounded-[24px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow flex items-center space-x-2"
      >
        <Sparkles className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788] shrink-0 ml-2" />
        <input
          type="text"
          value={nlpInput}
          onChange={(e) => setNlpInput(e.target.value)}
          placeholder='Nhập lịch bằng ngôn ngữ tự nhiên (VD: "Thứ 3 tuần sau 19:00 học IELTS 90 phút" hoặc "Ngày mai 14h học Toán 2 tiếng")...'
          className="flex-1 bg-transparent border-none text-xs text-[#192e22] dark:text-[#f0f7f2] placeholder:text-[#8ba393] focus:outline-none"
        />
        <Button
          type="submit"
          disabled={isParsingNlp || !nlpInput.trim()}
          className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs h-9 px-4 space-x-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isParsingNlp ? "Đang phân tích..." : "Tạo lịch"}</span>
        </Button>
      </form>

      {/* NLP Preview Modal Before Save (Section 17) */}
      {nlpProposal && (
        <Dialog open={!!nlpProposal} onOpenChange={(open) => !open && setNlpProposal(null)}>
          <DialogContent className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#2d6a4f] dark:text-[#52b788] mb-1">
                <CalendarCheck className="w-4 h-4" />
                <span>Xem trước sự kiện đã phân tích</span>
              </div>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Xác nhận tạo sự kiện học tập
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Kiểm tra thông tin trước khi ghi vào Database để bảo đảm không trùng lịch.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] space-y-2">
                <div className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                  {nlpProposal.title}
                </div>

                <div className="flex items-center justify-between text-[#526b5c] dark:text-[#a3bda9]">
                  <span>Ngày:</span>
                  <strong className="text-[#192e22] dark:text-[#f0f7f2]">
                    {nlpProposal.formattedDate}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-[#526b5c] dark:text-[#a3bda9]">
                  <span>Thời gian:</span>
                  <strong className="text-[#2d6a4f] dark:text-[#52b788]">
                    {nlpProposal.formattedTime} ({nlpProposal.durationMinutes} phút)
                  </strong>
                </div>

                {nlpProposal.subjectName && (
                  <div className="flex items-center justify-between text-[#526b5c] dark:text-[#a3bda9]">
                    <span>Môn học:</span>
                    <Badge variant="secondary" className="bg-[#eef5f0] text-[#2d6a4f] dark:bg-[#1d3024] dark:text-[#52b788] text-[10px]">
                      {nlpProposal.subjectName}
                    </Badge>
                  </div>
                )}
              </div>

              {nlpProposal.hasConflict ? (
                <div className="p-3 rounded-2xl bg-[#f7ebeb] text-[#b87474] border border-[#f0c4c4] text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Cảnh báo: {nlpProposal.conflictReason || "Khung giờ này bị trùng lịch!"}</span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#eef5f0] text-[#2d6a4f] border border-[#dbe7dd] text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Khung giờ hoàn toàn khả dụng và không bị xung đột.</span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNlpProposal(null)}
                className="rounded-2xl border-[#dbe7dd] text-[#526b5c] text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleConfirmNlpEvent}
                disabled={isConfirmingNlp || nlpProposal.hasConflict}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isConfirmingNlp ? "Đang lưu..." : "Xác nhận & Lưu vào lịch"}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* School Timetable Generator Modal (Phase 8) */}
      <SchoolTimetableGeneratorModal
        open={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        subjects={subjects}
        onSuccess={loadData}
      />

      {/* Smart Reschedule & Recovery Modal (Section 16) */}
      <RescheduleRecoveryModal
        open={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onSuccess={loadData}
      />

      {/* What-If Simulator Modal (Section 35) */}
      <WhatIfSimulatorModal
        open={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        subjects={subjects}
      />

      {/* Flexible Daily Goals Section (Section 5) */}
      <DailyFlexibleGoals
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Event Creation / Flexible Goal Modal */}
      {isCreateModalOpen && (
        <EventModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          subjects={subjects}
          onSuccess={loadData}
        />
      )}

      {viewMode === "day" && (
        <DayView
          initialEvents={filteredEvents}
          blockedSlots={blockedSlots}
          subjects={subjects}
          onEventsChange={loadData}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          initialEvents={filteredEvents}
          blockedSlots={blockedSlots}
          subjects={subjects}
          onEventsChange={loadData}
        />
      )}
      {viewMode === "month" && (
        <MonthView
          initialEvents={filteredEvents}
          subjects={subjects}
          onEventsChange={loadData}
        />
      )}
      {viewMode === "agenda" && (
        <AgendaView
          initialEvents={filteredEvents}
          subjects={subjects}
          onEventsChange={loadData}
        />
      )}
    </div>
  );
}

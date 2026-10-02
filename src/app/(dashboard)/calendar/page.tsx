"use client";

import React, { useState, useEffect } from "react";
import { WeekView } from "@/components/calendar/week-view";
import { MonthView } from "@/components/calendar/month-view";
import { DayView } from "@/components/calendar/day-view";
import { WhatIfSimulatorModal } from "@/components/calendar/what-if-simulator-modal";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [events, setEvents] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Natural Language Scheduling State (Section 17 & 44)
  const [nlpInput, setNlpInput] = useState("");
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [nlpProposal, setNlpProposal] = useState<any | null>(null);
  const [isConfirmingNlp, setIsConfirmingNlp] = useState(false);

  // What-If Simulator State (Section 35)
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  // Smart Reschedule State (Section 16)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<any | null>(null);
  const [isLoadingReschedule, setIsLoadingReschedule] = useState(false);

  const loadData = async () => {
    try {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      alert(err.message || "Lỗi xử lý ngôn ngữ tự nhiên");
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
      alert(err.message || "Lỗi lưu sự kiện");
    } finally {
      setIsConfirmingNlp(false);
    }
  };

  const handleTriggerReschedule = async () => {
    setIsRescheduleOpen(true);
    setIsLoadingReschedule(true);
    try {
      const res = await fetch("/api/ai/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: 90 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tìm lịch bù");
      setRescheduleData(data);
    } catch (err: any) {
      alert(err.message || "Lỗi tìm lịch bù");
    } finally {
      setIsLoadingReschedule(false);
    }
  };

  const handleApplyRescheduleSlot = async (slot: any) => {
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rescheduleData?.missedTitle || "Buổi học bù",
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: "STUDY",
        }),
      });

      if (!res.ok) throw new Error("Không thể thêm lịch bù");
      setIsRescheduleOpen(false);
      setRescheduleData(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi thêm lịch");
    }
  };

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
            <RefreshCw className="w-3.5 h-3.5" />
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
          </div>
        </div>
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
          <DialogContent onClose={() => setNlpProposal(null)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
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
                    <Badge variant="green" className="text-[10px]">
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

      {/* Smart Reschedule Modal (Section 16) */}
      {isRescheduleOpen && (
        <Dialog open={isRescheduleOpen} onOpenChange={(open) => !open && setIsRescheduleOpen(false)}>
          <DialogContent onClose={() => setIsRescheduleOpen(false)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#2d6a4f] dark:text-[#52b788] mb-1">
                <RefreshCw className="w-4 h-4" />
                <span>AI Smart Reschedule</span>
              </div>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Tìm thời gian học bù trống trong tuần
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Tự động quét các khung giờ rảnh và đề xuất buổi học thay thế không lo xung đột.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              {isLoadingReschedule ? (
                <div className="py-8 text-center text-xs text-[#526b5c] animate-pulse">
                  Đang tìm kiếm các slot thời gian trống phù hợp...
                </div>
              ) : rescheduleData?.proposedSlots?.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                    Đề xuất cho: <strong>{rescheduleData.missedTitle}</strong> ({rescheduleData.durationMinutes} phút)
                  </p>
                  {rescheduleData.proposedSlots.map((slot: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#2d6a4f] dark:text-[#52b788]">
                          {slot.formattedTime}
                        </div>
                        <div className="text-[11px] text-[#73927d] dark:text-[#8ba393] mt-0.5">
                          {slot.reason}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyRescheduleSlot(slot)}
                        className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold h-8"
                      >
                        Chọn slot này
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#526b5c]">
                  Không tìm thấy khoảng trống phù hợp trong 5 ngày tới.
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRescheduleOpen(false)}
                className="rounded-2xl text-[#526b5c] text-xs"
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* What-If Simulator Modal (Section 35) */}
      <WhatIfSimulatorModal
        open={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        subjects={subjects}
      />

      {/* Main Calendar View Area */}
      {loading ? (
        <div className="text-center py-20 text-xs text-[#526b5c] animate-pulse">
          Đang tải dữ liệu thời khóa biểu...
        </div>
      ) : (
        <>
          {viewMode === "day" && (
            <DayView
              initialEvents={events}
              blockedSlots={blockedSlots}
              subjects={subjects}
              onEventsChange={loadData}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              initialEvents={events}
              blockedSlots={blockedSlots}
              subjects={subjects}
              onEventsChange={loadData}
            />
          )}
          {viewMode === "month" && (
            <MonthView
              initialEvents={events}
              subjects={subjects}
              onEventsChange={loadData}
            />
          )}
        </>
      )}
    </div>
  );
}

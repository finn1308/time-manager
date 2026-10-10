"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Sparkles, Check, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatVN, getDateKeyVN } from "@/lib/date-utils";
import { addDays, parseISO } from "date-fns";

import { toast } from "sonner";
interface ProposedEvent {
  subjectId: string;
  taskId?: string | null;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reasoning: string;
}

interface AiSchedulePreviewModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string; code: string | null; color: string }>;
  onSuccess?: () => void;
}

export function AiSchedulePreviewModal({
  open,
  onClose,
  subjects = [],
  onSuccess,
}: AiSchedulePreviewModalProps) {
  const router = useRouter();

  const todayKey = getDateKeyVN(new Date());
  const nextWeekKey = getDateKeyVN(addDays(parseISO(todayKey), 6));

  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(nextWeekKey);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [results, setResults] = useState<{
    proposedEvents: ProposedEvent[];
    recommendedSlotsForFlexibleGoals?: Array<{
      goalId: string;
      goalTitle: string;
      date: string;
      recommendedStart: string;
      recommendedEnd: string;
      durationMinutes: number;
      reason: string;
    }>;
    workloadAnalysis?: Array<{
      date: string;
      dayOfWeek: number;
      flexibleGoalMinutes: number;
      fixedStudyMinutes: number;
      totalStudyMinutes: number;
      maxDailyMinutes: number;
      isOverloaded: boolean;
      notes?: string;
    }>;
    summary: string;
    providerUsed: string;
  } | null>(null);

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResults(null);

    try {
      const res = await fetch("/api/ai/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo lịch bằng AI");
      }

      setResults(data);
      const all = new Set<number>();
      data.proposedEvents.forEach((_: any, idx: number) => all.add(idx));
      setSelectedIndices(all);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi tạo lịch");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const handleCommit = async () => {
    if (!results) return;

    const eventsToSave = results.proposedEvents.filter((_, idx) => selectedIndices.has(idx));
    if (eventsToSave.length === 0) {
      toast("Vui lòng chọn ít nhất một buổi học để lưu");
      return;
    }

    try {
      setIsCommitting(true);
      const res = await fetch("/api/ai/commit-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSave }),
      });

      if (!res.ok) {
        throw new Error("Không thể lưu lịch vào cơ sở dữ liệu");
      }

      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu lịch");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] text-xs font-bold w-fit mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
            <span>AI STUDY SCHEDULER</span>
          </div>
          <DialogTitle>Tự động phân bổ lịch học thông minh</DialogTitle>
          <DialogDescription>
            AI đọc mục tiêu môn học, tính số giờ còn thiếu và tự động né 100% các khung giờ bị khóa và lịch bận cố định.
          </DialogDescription>
        </DialogHeader>

        {/* Form controls */}
        {!results && (
          <div className="space-y-4 py-2">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[#f7ebeb] border border-[#e8c6c6] text-xs text-[#8a3c3c] flex items-center space-x-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                  Từ ngày:
                </label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                  Đến ngày:
                </label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                Yêu cầu bổ sung cho AI (Tùy chọn):
              </label>
              <textarea
                rows={3}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="VD: Tuần này tôi cần ưu tiên học IELTS 2 tiếng mỗi ngày, mỗi buổi 90 phút..."
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[var(--text-ink)]"
              />
            </div>

            <div className="p-4 rounded-[20px] bg-[var(--mint-bg)] border border-[var(--border)] text-xs text-[var(--text-ink)] dark:text-[#d8ebe0] flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[var(--mint-dark)]" />
              <div>
                <span className="font-bold">Quy tắc chống xung đột lịch nghiêm ngặt:</span> Server sẽ chạy bộ kiểm tra deterministic collision, bảo đảm không bao giờ xếp trùng với sự kiện lịch hiện có, giờ ngủ hay khung giờ bận.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-2xl">
                Đóng
              </Button>
              <Button
                variant="default"
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl space-x-2 font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? "AI đang tính toán..." : "Bắt đầu phân bổ"}</span>
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Results Preview */}
        {results && (
          <div className="flex flex-col flex-1 overflow-hidden space-y-3.5 pt-2">
            <div className="p-4 rounded-[22px] bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] mb-1.5">
                <span className="font-bold text-[var(--text-ink)]">Chiến lược phân bổ:</span>
                <Badge variant="pill-active" className="text-[10px]">
                  {results.providerUsed}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-subtle)] leading-relaxed">
                {results.summary}
              </p>

              {/* Overload Notice if any */}
              {results.workloadAnalysis?.some((w) => w.isOverloaded) && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Cảnh báo tải trọng:</span> Một số ngày có nguy cơ vượt định mức tối đa. Hãy cân nhắc giảm bớt mục tiêu linh hoạt hoặc giãn ngày.
                  </div>
                </div>
              )}

              {/* Recommended Slots for Flexible Goals */}
              {results.recommendedSlotsForFlexibleGoals && results.recommendedSlotsForFlexibleGoals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1.5">
                  <div className="text-[11px] font-bold text-[var(--mint-dark)] dark:text-[#74c69d] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gợi ý khung giờ rảnh cho Mục tiêu linh hoạt (Không tự ý gán vào lịch):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {results.recommendedSlotsForFlexibleGoals.slice(0, 4).map((rec, i) => (
                      <div key={i} className="p-2 rounded-xl bg-white dark:bg-[#1b2f21] border border-[var(--border)] text-[11px]">
                        <span className="font-semibold text-[var(--text-ink)]">{rec.goalTitle}:</span>{" "}
                        <span className="text-[var(--mint-dark)] font-mono">
                          {formatVN(new Date(rec.recommendedStart), "dd/MM • HH:mm")}
                        </span>
                        <div className="text-[10px] text-[var(--text-subtle)] dark:text-[#8ba393] truncate">{rec.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] px-1 font-medium">
              <span>Đã chọn {selectedIndices.size} / {results.proposedEvents.length} buổi học</span>
              <button
                onClick={() => {
                  if (selectedIndices.size === results.proposedEvents.length) setSelectedIndices(new Set());
                  else {
                    const all = new Set<number>();
                    results.proposedEvents.forEach((_, idx) => all.add(idx));
                    setSelectedIndices(all);
                  }
                }}
                className="text-[var(--mint-dark)] font-bold hover:underline cursor-pointer"
              >
                {selectedIndices.size === results.proposedEvents.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-72">
              {results.proposedEvents.map((event, idx) => {
                const subject = subjects.find((s) => s.id === event.subjectId);
                const isSelected = selectedIndices.has(idx);

                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`p-3.5 rounded-[20px] border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[var(--bg-surface)] border-[var(--mint)] dark:border-[#52b788] shadow-sm ring-1 ring-[#52b788]/20"
                        : "bg-[var(--bg-muted)] border-[var(--border)] opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected
                              ? "bg-[var(--mint)] border-[var(--mint)] text-white"
                              : "border-[var(--border)] bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            {subject && (
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: subject.color || "#2d6a4f" }}
                              />
                            )}
                            <span className="font-bold text-sm text-[var(--text-ink)]">
                              {event.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-subtle)] mt-1 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="text-[11px] text-[var(--mint-dark)] mt-1.5 font-medium">
                            🌿 {event.reasoning}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center space-x-1 font-mono font-bold text-[var(--text-ink)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>
                            {formatVN(new Date(event.startTime), "EEEE, dd/MM • HH:mm")} – {formatVN(new Date(event.endTime), "HH:mm")}
                          </span>
                        </div>
                        <Badge variant="secondary" className="mt-1 font-mono text-[10px]">
                          {event.durationMinutes} phút
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResults(null)} disabled={isCommitting} className="rounded-2xl">
                Cấu hình lại
              </Button>
              <Button
                variant="default"
                onClick={handleCommit}
                disabled={isCommitting}
                className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl font-bold"
              >
                {isCommitting ? "Đang lưu..." : `Lưu ${selectedIndices.size} buổi học vào Lịch (Apply Schedule)`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

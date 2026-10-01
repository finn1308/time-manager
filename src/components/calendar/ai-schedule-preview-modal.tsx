"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sparkles, Check, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatVN } from "@/lib/date-utils";

interface ProposedEvent {
  subjectId: string;
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
}

export function AiSchedulePreviewModal({
  open,
  onClose,
  subjects,
}: AiSchedulePreviewModalProps) {
  const router = useRouter();

  // Date range defaults: Today to 7 days later
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 6);

  const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(nextWeek.toISOString().split("T")[0]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [results, setResults] = useState<{
    proposedEvents: ProposedEvent[];
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
      // Select all by default
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
      alert("Vui lòng chọn ít nhất một buổi học để lưu");
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

      router.refresh();
      onClose();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu lịch");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">AI Study Scheduler</span>
          </div>
          <DialogTitle>Tự động phân bổ lịch học thông minh</DialogTitle>
          <DialogDescription>
            AI sẽ đọc mục tiêu môn học, tính số giờ còn thiếu và tự động né 100% các khung giờ bị khóa / lịch bận cố định.
          </DialogDescription>
        </DialogHeader>

        {/* Form controls */}
        {!results && (
          <div className="space-y-4 py-2">
            {errorMsg && (
              <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#787774] mb-1">Từ ngày (VN):</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#787774] mb-1">Đến ngày (VN):</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#787774] mb-1">
                Yêu cầu bổ sung cho AI (Tùy chọn):
              </label>
              <textarea
                rows={3}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="VD: Tuần này tôi cần tập trung ôn tập môn Cấu trúc dữ liệu trước, ưu tiên khung giờ tối sau 19h..."
                className="w-full rounded-md border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] p-2.5 text-sm placeholder:text-[#9b9a97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Bảo đảm an toàn lịch trình:</span> Mọi khung giờ như giờ ngủ đêm (23:30 - 06:30), giờ học trên giảng đường, hoặc lịch bận bạn đã khóa sẽ được bảo vệ tuyệt đối.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Đóng
              </Button>
              <Button variant="default" onClick={handleGenerate} disabled={isLoading} className="space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? "AI đang tính toán..." : "Bắt đầu phân bổ"}</span>
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Results Preview */}
        {results && (
          <div className="flex flex-col flex-1 overflow-hidden space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-[#f7f6f3] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2e2e2e]">
              <div className="flex items-center justify-between text-xs text-[#787774] mb-1">
                <span className="font-semibold text-[#37352f] dark:text-[#f0f0f0]">Chiến lược phân bổ:</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-[#1a1a1a] border border-[#e9e9e7] dark:border-[#2e2e2e]">
                  {results.providerUsed}
                </span>
              </div>
              <p className="text-xs text-[#5a5955] dark:text-[#a0a0a0]">{results.summary}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-[#787774] px-1">
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
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {selectedIndices.size === results.proposedEvents.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-72">
              {results.proposedEvents.map((event, idx) => {
                const subject = subjects.find((s) => s.id === event.subjectId);
                const isSelected = selectedIndices.has(idx);

                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white dark:bg-[#202020] border-blue-500 dark:border-blue-400 shadow-xs"
                        : "bg-[#fbfbfa] dark:bg-[#1c1c1c] border-[#e9e9e7] dark:border-[#2e2e2e] opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-[#9b9a97] bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            {subject && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                            )}
                            <span className="font-semibold text-sm text-[#171717] dark:text-white">
                              {event.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
                            {event.description}
                          </p>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 italic">
                            💡 {event.reasoning}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center space-x-1 font-mono font-medium text-[#37352f] dark:text-[#d4d4d4]">
                          <Clock className="w-3 h-3 text-[#787774]" />
                          <span>
                            {formatVN(event.startTime, "dd/MM HH:mm")} - {formatVN(event.endTime, "HH:mm")}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#787774]">{event.durationMinutes} phút</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResults(null)} disabled={isCommitting}>
                Lập lại cấu hình
              </Button>
              <Button variant="default" onClick={handleCommit} disabled={isCommitting}>
                {isCommitting ? "Đang lưu..." : `Lưu ${selectedIndices.size} buổi học vào Lịch`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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

      if (onSuccess) onSuccess();
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
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#d8ebe0] text-[#1b4332] text-xs font-bold w-fit mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#2d6a4f]" />
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
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Từ ngày:
                </label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Đến ngày:
                </label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                Yêu cầu bổ sung cho AI (Tùy chọn):
              </label>
              <textarea
                rows={3}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="VD: Tuần này tôi cần ưu tiên học IELTS 2 tiếng mỗi ngày, mỗi buổi 90 phút..."
                className="w-full rounded-[18px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3.5 text-xs placeholder:text-[#8ba393] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2]"
              />
            </div>

            <div className="p-4 rounded-[20px] bg-[#eef5f0] dark:bg-[#1d3024] border border-[#dbe7dd] dark:border-[#263d2e] text-xs text-[#192e22] dark:text-[#d8ebe0] flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#2d6a4f] dark:text-[#52b788]" />
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
                className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl space-x-2 font-semibold"
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
            <div className="p-4 rounded-[22px] bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e]">
              <div className="flex items-center justify-between text-xs text-[#526b5c] dark:text-[#a3bda9] mb-1.5">
                <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">Chiến lược phân bổ:</span>
                <Badge variant="pill-active" className="text-[10px]">
                  {results.providerUsed}
                </Badge>
              </div>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] leading-relaxed">
                {results.summary}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-[#526b5c] dark:text-[#a3bda9] px-1 font-medium">
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
                className="text-[#2d6a4f] dark:text-[#52b788] font-bold hover:underline cursor-pointer"
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
                        ? "bg-white dark:bg-[#17261c] border-[#2d6a4f] dark:border-[#52b788] shadow-sm ring-1 ring-[#52b788]/20"
                        : "bg-[#f8fbf8] dark:bg-[#142318] border-[#dbe7dd] dark:border-[#263d2e] opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected
                              ? "bg-[#2d6a4f] border-[#2d6a4f] text-white"
                              : "border-[#dbe7dd] bg-white"
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
                            <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                              {event.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-1 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="text-[11px] text-[#2d6a4f] dark:text-[#52b788] mt-1.5 font-medium">
                            🌿 {event.reasoning}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center space-x-1 font-mono font-bold text-[#192e22] dark:text-[#f0f7f2]">
                          <Clock className="w-3.5 h-3.5 text-[#73927d]" />
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
                className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl font-bold"
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

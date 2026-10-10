"use client";

import React, { useState } from "react";
import { Plus, Star, Clock, BookOpen, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickTaskInputProps {
  onAddTask: (data: {
    title: string;
    priority?: string;
    estimatedMinutes?: number;
    subjectId?: string | null;
    isImportant?: boolean;
  }) => Promise<void>;
  subjects: Array<{ id: string; name: string; color: string; code?: string | null }>;
  currentDateDisplay?: string;
  isImportantView?: boolean;
}

export function QuickTaskInput({
  onAddTask,
  subjects,
  currentDateDisplay,
  isImportantView = false,
}: QuickTaskInputProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"MEDIUM" | "HIGH" | "URGENT" | "LOW">("MEDIUM");
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [isImportant, setIsImportant] = useState(isImportantView);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: title.trim(),
        priority,
        estimatedMinutes,
        subjectId,
        isImportant: isImportantView || isImportant,
      });

      // Reset
      setTitle("");
      setPriority("MEDIUM");
      setSubjectId(null);
      if (!isImportantView) setIsImportant(false);
      setShowOptions(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 sm:p-3 shadow-2xs transition-all focus-within:border-[var(--mint)] focus-within:shadow-sm"
    >
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4" />
        </div>

        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value && !showOptions) setShowOptions(true);
          }}
          onFocus={() => setShowOptions(true)}
          placeholder={
            currentDateDisplay
              ? `Thêm nhiệm vụ cho ${currentDateDisplay}... (Nhấn Enter để lưu)`
              : "Thêm nhiệm vụ mới... (Nhấn Enter để lưu)"
          }
          disabled={isSubmitting}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 text-xs sm:text-sm px-1.5 h-9 bg-transparent"
        />

        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || isSubmitting}
          className="rounded-xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-bold px-3.5 h-8 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all"
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          <span>{isSubmitting ? "Lưu..." : "Thêm"}</span>
        </Button>
      </div>

      {/* Quick configuration pills when active */}
      {showOptions && (
        <div className="mt-2.5 pt-2 border-t border-[var(--border)]/60 dark:border-[#263d2e] flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            {/* Subject Selector */}
            <select
              value={subjectId || ""}
              onChange={(e) => setSubjectId(e.target.value || null)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-ink)] focus:outline-none"
            >
              <option value="">Chung (Không môn)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            {/* Priority Selector */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-ink)] focus:outline-none"
            >
              <option value="MEDIUM">Ưu tiên: Trung bình</option>
              <option value="HIGH">Ưu tiên: Cao ⚡</option>
              <option value="URGENT">Ưu tiên: Gấp 🔥</option>
              <option value="LOW">Ưu tiên: Thấp</option>
            </select>

            {/* Estimated Duration */}
            <select
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10))}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-ink)] focus:outline-none"
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
              <option value={90}>90 phút</option>
              <option value={120}>2 tiếng</option>
            </select>
          </div>

          {/* Star Toggle */}
          <button
            type="button"
            onClick={() => setIsImportant(!isImportant)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
              isImportant
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                : "text-[var(--text-muted)] hover:bg-[var(--mint-soft)]"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isImportant ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>Quan trọng</span>
          </button>
        </div>
      )}
    </form>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Plus, X, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReminderItem {
  calendarEventId: string;
  title: string;
  subjectName: string;
  subjectColor: string;
  dateFormatted: string;
  timeFormatted: string;
  message: string;
}

interface AiResourceReminderBannerProps {
  onOpenResourceManager: (calendarEventId: string, title: string, subjectName: string) => void;
}

export function AiResourceReminderBanner({
  onOpenResourceManager,
}: AiResourceReminderBannerProps) {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkReminders() {
      try {
        const res = await fetch("/api/ai/missing-resources");
        if (res.ok) {
          const data = await res.json();
          setReminders(data.reminders || []);
        }
      } catch (err) {
        console.warn("Could not check missing resources:", err);
      } finally {
        setLoading(false);
      }
    }
    checkReminders();
  }, []);

  const activeReminders = reminders.filter((r) => !dismissedIds.includes(r.calendarEventId));

  if (loading || activeReminders.length === 0) return null;

  const current = activeReminders[0];

  return (
    <div className="mb-4 rounded-2xl bg-linear-to-r from-[#edf7f0] to-[#f4faf6] dark:from-[#13271a] dark:to-[#182e20] border border-[#b7d8c3] dark:border-[#284832] p-3 sm:p-4 shadow-xs transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-[var(--mint)] text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mint-dark)] dark:text-[#74c69d]">
                Nhắc nhở học tập AI
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--mint-bg)] text-[var(--mint-dark)] dark:bg-[#1f3827] dark:text-[#a3bda9] font-medium">
                {current.subjectName}
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--text-ink)] mt-0.5">
              {current.message}
            </p>
            <p className="text-[11px] text-[var(--text-subtle)] mt-0.5 font-mono">
              Thời gian: {current.dateFormatted} ({current.timeFormatted})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <Button
            size="sm"
            onClick={() => onOpenResourceManager(current.calendarEventId, current.title, current.subjectName)}
            className="h-8 rounded-xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-semibold px-3 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Thêm tài liệu / link</span>
          </Button>

          <button
            type="button"
            onClick={() => setDismissedIds((prev) => [...prev, current.calendarEventId])}
            title="Bỏ qua"
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

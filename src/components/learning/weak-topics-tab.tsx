"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Calendar, CheckCircle2, BookOpen, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
interface TopicStat {
  topic: string;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  isWeak: boolean;
}

export function WeakTopicsTab() {
  const [weakTopics, setWeakTopics] = useState<TopicStat[]>([]);
  const [strongTopics, setStrongTopics] = useState<TopicStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulingTopic, setSchedulingTopic] = useState<string | null>(null);
  const [scheduledMessage, setScheduledMessage] = useState<string | null>(null);

  const fetchStats = () => {
    fetch("/api/learning/weak-topics")
      .then((res) => res.json())
      .then((data) => {
        if (data.weakTopics) setWeakTopics(data.weakTopics);
        if (data.strongTopics) setStrongTopics(data.strongTopics);
      })
      .catch((err) => console.error("Weak topics fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleScheduleStudy = async (topic: string) => {
    setSchedulingTopic(topic);
    setScheduledMessage(null);
    try {
      const res = await fetch("/api/learning/schedule-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          durationMinutes: 45,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lên lịch học");

      setScheduledMessage(data.message || `Đã thêm buổi ôn tập "${topic}" vào Lịch học!`);
    } catch (e: any) {
      toast.error(e.message || "Lỗi lên lịch");
    } finally {
      setSchedulingTopic(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 space-y-2 shadow-xs">
        <h2 className="text-base font-extrabold text-[var(--text-ink)] flex items-center space-x-2">
          <span>🧠 Phân tích Điểm yếu & Lỗ hổng Kiến thức</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Hệ thống AI tự động theo dõi từng câu hỏi bạn làm sai qua các bài Quiz để phát hiện các chủ đề cần củng cố và đưa thẳng vào Lịch học.
        </p>
      </div>

      {scheduledMessage && (
        <div className="p-3.5 rounded-2xl bg-[#eef8f2] text-[var(--mint-dark)] border border-[#b7d8c3] text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-[var(--mint-dark)]" />
          <span>{scheduledMessage}</span>
        </div>
      )}

      {/* Weak Topics Section */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#b87474] flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4" />
          <span>Chủ đề yếu cần bù giờ (Độ chính xác &lt; 65%)</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">Đang phân tích dữ liệu...</div>
        ) : weakTopics.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#eef8f2] dark:bg-[#14261b] text-xs text-[var(--mint-dark)] dark:text-[#9fe3ba] font-medium text-center">
            🎉 Bạn chưa có chủ đề yếu nào đáng lo ngại! Hãy tiếp tục làm thêm quiz để nhận phân tích chi tiết.
          </div>
        ) : (
          <div className="space-y-3">
            {weakTopics.map((wt, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-[#e8c6c6] dark:border-[#4a2222] bg-[#fdf6f6] dark:bg-[#261616] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-ink)]">
                    {wt.topic}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs text-[var(--text-muted)] mt-1">
                    <span className="text-[#b87474] font-semibold">
                      Chính xác: {wt.accuracy}%
                    </span>
                    <span>•</span>
                    <span>Sai {wt.wrongCount} / {wt.totalAttempts} câu</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleScheduleStudy(wt.topic)}
                  disabled={schedulingTopic === wt.topic}
                  className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-full text-xs space-x-1.5 shrink-0"
                >
                  {schedulingTopic === wt.topic ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>Lên lịch ôn tập (Calendar)</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strong Topics Section */}
      {strongTopics.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--mint-dark)] flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Chủ đề đã nắm vững (Độ chính xác &ge; 65%)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {strongTopics.map((st, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs flex items-center justify-between"
              >
                <span className="font-medium text-[var(--text-ink)] truncate">
                  {st.topic}
                </span>
                <span className="font-bold text-[var(--mint-dark)] dark:text-[#7fc498] shrink-0 ml-2">
                  {st.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  RefreshCw,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDateKeyVN } from "@/lib/date-utils";

import { toast } from "sonner";
interface WeeklyReviewData {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  plannedHours: number;
  actualHours: number;
  completionRate: number;
  completedGoals: number;
  totalGoals: number;
  upcomingDeadlines: number;
  subjectStatsJson: string;
  aiInsightsJson: string;
  nextWeekPlanJson: string | null;
}

interface ForecastData {
  averageDailyVelocityHours: number;
  totalActiveGoals: number;
  onTrackCount: number;
  atRiskCount: number;
  highRiskCount: number;
  goals: Array<{
    id: string;
    title: string;
    subjectName: string;
    subjectColor: string;
    targetDate: string | null;
    daysRemaining: number;
    targetHours: number;
    completedHours: number;
    remainingHours: number;
    currentVelocityHoursPerDay: number;
    requiredVelocityHoursPerDay: number;
    completionProbabilityPercent: number;
    riskStatus: "ON_TRACK" | "AT_RISK" | "HIGH_RISK" | "BEHIND";
    riskLabel: string;
    projectedCompletionDate: string;
    recommendation: string;
  }>;
}

export default function WeeklyReviewPage() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week
  const [review, setReview] = useState<WeeklyReviewData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Compute Monday & Sunday for selected week
  const currentWeekBounds = React.useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMonday = (day + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + weekOffset * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      weekStartDate: getDateKeyVN(monday),
      weekEndDate: getDateKeyVN(sunday),
      label: `${monday.getDate()}/${monday.getMonth() + 1} — ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`,
    };
  }, [weekOffset]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewRes, forecastRes] = await Promise.all([
        fetch(`/api/weekly-review?weekStartDate=${currentWeekBounds.weekStartDate}`),
        fetch("/api/forecast"),
      ]);

      if (reviewRes.ok) {
        const rData = await reviewRes.json();
        setReview(rData.review);
      }
      if (forecastRes.ok) {
        const fData = await forecastRes.json();
        setForecast(fData);
      }
    } catch (err) {
      console.error("Load weekly review error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWeekBounds.weekStartDate]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStartDate: currentWeekBounds.weekStartDate,
          weekEndDate: currentWeekBounds.weekEndDate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReview(data.review);
      } else {
        toast.error("Lỗi tạo đánh giá tuần bằng AI");
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const parsedAiInsights = React.useMemo(() => {
    if (!review?.aiInsightsJson) return null;
    try {
      return JSON.parse(review.aiInsightsJson);
    } catch {
      return null;
    }
  }, [review]);

  const parsedSubjectStats = React.useMemo(() => {
    if (!review?.subjectStatsJson) return [];
    try {
      return JSON.parse(review.subjectStatsJson);
    } catch {
      return [];
    }
  }, [review]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Week Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[var(--mint-dark)] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>AI WEEKLY REVIEW & PROGRESS FORECAST</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-ink)] tracking-tight">
            Đánh giá tuần & Dự báo mục tiêu
          </h1>
          <p className="text-xs text-[var(--text-subtle)]">
            Phản tỉnh hiệu suất học tập, phân tích tính kỷ luật và dự báo rủi ro deadline.
          </p>
        </div>

        {/* Week Navigator & Action */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-[var(--mint-bg)] dark:hover:bg-[#1d3024] text-[var(--text-subtle)] cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-[var(--text-ink)]">
              {currentWeekBounds.label}
            </span>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-[var(--mint-bg)] dark:hover:bg-[#1d3024] text-[var(--text-subtle)] cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-2xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-bold space-x-1.5 shadow-2xs"
          >
            {generating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{review ? "Đánh giá lại bằng AI" : "Tạo đánh giá tuần bằng AI"}</span>
          </Button>
        </div>
      </div>

      {/* 1. Scorecard Metrics Banner */}
      {review && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-muted)] uppercase">
              <Clock className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
              <span>Thời gian thực học</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-[var(--text-ink)]">
                {review.actualHours}h
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ {review.plannedHours}h kế hoạch</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-[var(--mint-bg)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--mint)] rounded-full"
                style={{ width: `${Math.min(100, review.completionRate)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-muted)] uppercase">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tỷ lệ hoàn thành</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {review.completionRate}%
              </span>
            </div>
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">
              {review.completionRate >= 80 ? "Xuất sắc! Đạt chuẩn kỷ luật cao" : "Cần bổ sung phiên học bù"}
            </p>
          </div>

          <div className="p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-muted)] uppercase">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Mục tiêu tuần</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-black text-[var(--text-ink)]">
                {review.completedGoals}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ {review.totalGoals} hoàn thành</span>
            </div>
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">Tiến độ học tập dài hạn</p>
          </div>

          <div className="p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-muted)] uppercase">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Deadline tuần tới</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {review.upcomingDeadlines}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">Cần chuẩn bị sắp xếp trước</p>
          </div>
        </div>
      )}

      {/* 2. AI Reflection & Insights Panel */}
      {parsedAiInsights && (
        <div className="p-6 rounded-[28px] bg-gradient-to-br from-white via-[#fcfdfc] to-[#f4f8f5] dark:from-[#17261c] dark:via-[#142318] dark:to-[#101c14] border border-[#52b788]/60 shadow-md space-y-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--mint)] text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-ink)]">
                Phản tỉnh học tập từ AI Study Coach
              </h3>
              <p className="text-[10px] text-[var(--text-subtle)]">
                Được tổng hợp từ toàn bộ phiên học, deadline và thói quen của bạn trong tuần
              </p>
            </div>
          </div>

          {/* AI Summary */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2c20] border border-[var(--border)] text-xs font-medium text-[var(--text-ink)] leading-relaxed">
            {parsedAiInsights.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Achievements */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2c20] border border-[var(--border)] space-y-2">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Thành tựu nổi bật</span>
              </h4>
              <ul className="space-y-1.5">
                {parsedAiInsights.keyAchievements?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px] text-[var(--text-subtle)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--mint-dark)] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Areas */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2c20] border border-[var(--border)] space-y-2">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Điểm cần tối ưu hóa</span>
              </h4>
              <ul className="space-y-1.5">
                {parsedAiInsights.improvementAreas?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px] text-[var(--text-subtle)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Week Advice & CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--mint-bg)]/50 dark:bg-[#1d3827]/40 border border-[#b7d8c3]/60 dark:border-[#263d2e]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1] uppercase tracking-wider">
                Chiến lược tuần tới
              </span>
              <p className="text-xs text-[var(--text-ink)] font-semibold">
                {parsedAiInsights.nextWeekAdvice}
              </p>
            </div>

            <Link href="/calendar">
              <Button className="rounded-2xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-bold space-x-1.5 shadow-2xs shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lập lịch tuần tới bằng AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Empty State for Review */}
      {!review && !loading && (
        <div className="py-12 text-center p-8 rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs space-y-3">
          <Sparkles className="w-8 h-8 text-[var(--mint-dark)] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[var(--text-ink)]">
            Chưa có bản đánh giá tuần này
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Nhấn nút bên dưới để AI tự động phân tích toàn bộ lịch học và tạo báo cáo phản tỉnh cho bạn.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-2xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-semibold"
          >
            {generating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Tạo đánh giá tuần bằng AI
          </Button>
        </div>
      )}

      {/* 3. Subject Time Distribution */}
      {parsedSubjectStats.length > 0 && (
        <div className="p-6 rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-ink)]">
              Phân bổ thời gian theo môn học (Thực tế vs Kế hoạch)
            </h3>
            <span className="text-[10px] text-[var(--text-muted)]">Đơn vị: Giờ (h)</span>
          </div>

          <div className="space-y-3">
            {parsedSubjectStats.map((sub: any, idx: number) => {
              const maxH = Math.max(sub.plannedHours, sub.actualHours, 1);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center space-x-2 text-[var(--text-ink)]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span>{sub.name}</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {sub.actualHours}h thực tế / {sub.plannedHours}h kế hoạch
                    </span>
                  </div>

                  {/* Dual bar: Actual vs Planned */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-[var(--mint-bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: sub.color || "#2d6a4f",
                          width: `${Math.min(100, (sub.actualHours / maxH) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Progress Forecast & Goal Risk Matrix (Section 33) */}
      {forecast && (
        <div className="p-6 rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--mint-dark)]">
                <Target className="w-4 h-4" />
                <span>DỰ BÁO TIẾN ĐỘ HOÀN THÀNH MỤC TIÊU & DEADLINE</span>
              </div>
              <p className="text-xs text-[var(--text-subtle)]">
                Tính toán dựa trên vận tốc học thực tế ({forecast.averageDailyVelocityHours}h/ngày) trong 14 ngày qua.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                {forecast.onTrackCount} Đúng hạn
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                {forecast.atRiskCount} Rủi ro
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800">
                {forecast.highRiskCount} Báo động
              </span>
            </div>
          </div>

          {/* Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forecast.goals.map((goal) => {
              const badgeClass =
                goal.riskStatus === "ON_TRACK"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : goal.riskStatus === "AT_RISK"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[#fcfdfc] dark:bg-[#132217] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${goal.subjectColor}20`,
                          color: goal.subjectColor,
                        }}
                      >
                        {goal.subjectName}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--text-ink)] mt-1">
                        {goal.title}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      {goal.riskLabel} • {goal.completionProbabilityPercent}%
                    </span>
                  </div>

                  {/* Progress & Velocity Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border)]">
                    <div>
                      <p className="text-[var(--text-muted)]">Còn lại</p>
                      <p className="font-bold text-[var(--text-ink)]">{goal.remainingHours}h</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">Thời gian còn</p>
                      <p className="font-bold text-[var(--text-ink)]">{goal.daysRemaining} ngày</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">Tốc độ yêu cầu</p>
                      <p className="font-bold text-[var(--text-ink)]">{goal.requiredVelocityHoursPerDay}h/ngày</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="text-[11px] text-[var(--text-subtle)] bg-[var(--mint-bg)] dark:bg-[#1a2c20] p-2.5 rounded-xl border border-[var(--border)]/50 dark:border-[#263d2e]">
                    <span className="font-semibold text-[var(--text-ink)]">Gợi ý AI: </span>
                    {goal.recommendation}
                  </div>
                </div>
              );
            })}

            {forecast.goals.length === 0 && (
              <div className="col-span-2 py-8 text-center text-xs text-[var(--text-muted)]">
                Hiện tại không có mục tiêu nào đang hoạt động. Tạo mục tiêu mới trong trang Goals để theo dõi dự báo!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

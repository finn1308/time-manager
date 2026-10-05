"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  ArrowRight,
  BookOpen,
  Headphones,
  Keyboard,
  Target,
  BarChart3,
  Bot,
  Flame,
  Award,
} from "lucide-react";
import { AdaptiveQuizModal } from "@/components/vocab/adaptive-quiz-modal";

export default function AdaptiveDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [refreshingAi, setRefreshingAi] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Fetch Dashboard Analytics
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, aiRes] = await Promise.all([
        fetch("/api/learning/analytics"),
        fetch("/api/learning/ai-analysis"),
      ]);

      const analyticsData = await analyticsRes.json();
      const aiData = await aiRes.json();

      if (analyticsRes.ok) setAnalytics(analyticsData.analytics);
      if (aiRes.ok) setAiReport(aiData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Refresh AI Analysis
  const handleRefreshAi = async () => {
    try {
      setRefreshingAi(true);
      const res = await fetch("/api/learning/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiReport(data);
      } else {
        alert(data.error || "Không thể phân tích AI");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối AI");
    } finally {
      setRefreshingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs font-bold text-gray-500">
          Đang tải dữ liệu học thích ứng & mô hình trí nhớ...
        </p>
      </div>
    );
  }

  const breakdown = analytics?.masteryBreakdown || {
    weak: 0,
    medium: 0,
    strong: 0,
    mastered: 0,
  };
  const totalWords = analytics?.totalWordsTracked || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black">
              <Brain className="w-3.5 h-3.5" />
              <span>DEEP KNOWLEDGE TRACING & ADAPTIVE AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Trung tâm Học thích ứng AI (Adaptive Learning)
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              Hệ thống liên tục đo lường điểm thành thạo của từng từ, dự đoán đường cong quên lãng
              Ebbinghaus và tự động điều chỉnh độ khó cùng tần suất xuất hiện câu hỏi.
            </p>
          </div>

          <button
            onClick={() => setShowQuizModal(true)}
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 shrink-0 self-start md:self-center cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Luyện tập thích ứng AI</span>
          </button>
        </div>

        {/* Real Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-extrabold uppercase text-white/70 block">
              Từ vựng đã theo dõi
            </span>
            <span className="text-xl font-black">{totalWords} từ</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-extrabold uppercase text-white/70 block">
              Độ chính xác trung bình
            </span>
            <span className="text-xl font-black">
              {Math.round((analytics?.accuracy || 0) * 100)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-extrabold uppercase text-white/70 block">
              Tốc độ phản xạ trung bình
            </span>
            <span className="text-xl font-black">
              {analytics?.averageResponseTime || 0}s
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-extrabold uppercase text-white/70 block">
              Tỷ lệ lưu giữ trí nhớ
            </span>
            <span className="text-xl font-black">
              {Math.round((analytics?.retentionRate || 0) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Phân bố thành thạo & Kỹ năng chéo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Mastery Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <h2 className="font-extrabold text-base text-gray-900 dark:text-white">
                Phân bố mức độ thành thạo
              </h2>
            </div>
            <span className="text-xs font-bold text-gray-400">{totalWords} từ tổng số</span>
          </div>

          {/* Color stacked bar */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-3.5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${totalWords > 0 ? (breakdown.mastered / totalWords) * 100 : 0}%` }}
              className="bg-emerald-500 h-full transition-all"
              title="Đã thành thạo"
            />
            <div
              style={{ width: `${totalWords > 0 ? (breakdown.strong / totalWords) * 100 : 0}%` }}
              className="bg-sky-500 h-full transition-all"
              title="Vững vàng"
            />
            <div
              style={{ width: `${totalWords > 0 ? (breakdown.medium / totalWords) * 100 : 0}%` }}
              className="bg-amber-400 h-full transition-all"
              title="Đang ghi nhớ"
            />
            <div
              style={{ width: `${totalWords > 0 ? (breakdown.weak / totalWords) * 100 : 0}%` }}
              className="bg-rose-500 h-full transition-all"
              title="Cần củng cố"
            />
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-300 block">
                Thành thạo
              </span>
              <span className="text-base font-black text-emerald-800 dark:text-emerald-200">
                {breakdown.mastered}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900">
              <span className="text-[10px] uppercase font-extrabold text-sky-700 dark:text-sky-300 block">
                Vững vàng
              </span>
              <span className="text-base font-black text-sky-800 dark:text-sky-200">
                {breakdown.strong}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <span className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-300 block">
                Đang nhớ
              </span>
              <span className="text-base font-black text-amber-800 dark:text-amber-200">
                {breakdown.medium}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <span className="text-[10px] uppercase font-extrabold text-rose-700 dark:text-rose-300 block">
                Cần củng cố
              </span>
              <span className="text-base font-black text-rose-800 dark:text-rose-200">
                {breakdown.weak}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Cross-Skill Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-500" />
              <h2 className="font-extrabold text-base text-gray-900 dark:text-white">
                Đánh giá kỹ năng chéo (Cross-Skill)
              </h2>
            </div>
            <span className="text-[11px] text-gray-400 font-bold">5 chiều năng lực</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Recognition */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">Nhận diện nghĩa (Recognition)</span>
                <span className="text-emerald-600">
                  {Math.round((analytics?.crossSkillAverages?.recognition || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(analytics?.crossSkillAverages?.recognition || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Active Recall */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">Truy xuất chủ động (Active Recall)</span>
                <span className="text-sky-600">
                  {Math.round((analytics?.crossSkillAverages?.recall || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${(analytics?.crossSkillAverages?.recall || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Spelling */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">Gõ chính tả (Spelling & Typing)</span>
                <span className="text-purple-600">
                  {Math.round((analytics?.crossSkillAverages?.spelling || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${(analytics?.crossSkillAverages?.spelling || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Listening */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">Luyện nghe (Listening)</span>
                <span className="text-amber-600">
                  {Math.round((analytics?.crossSkillAverages?.listening || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(analytics?.crossSkillAverages?.listening || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Cognitive Learning Report Card */}
      {aiReport && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  Báo cáo Phân tích Nhận thức AI
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {aiReport.providerUsed}
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  Cập nhật: {new Date(aiReport.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <button
              onClick={handleRefreshAi}
              disabled={refreshingAi}
              className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingAi ? "animate-spin" : ""}`} />
              <span>{refreshingAi ? "Đang phân tích..." : "Làm mới"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
                Thế mạnh nhận thức
              </span>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                {aiReport.report.strongestArea}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-400">
                Điểm cần lưu ý / Rào cản
              </span>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                {aiReport.report.weakestArea}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#132217] space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-gray-500">
              Khuyến nghị lộ trình học tập từ AI
            </span>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {aiReport.report.recommendedFocus}
            </p>
          </div>

          {aiReport.report.cognitiveInsights && (
            <p className="text-xs italic text-gray-500 dark:text-gray-400 pt-1">
              " {aiReport.report.cognitiveInsights} "
            </p>
          )}
        </div>
      )}

      {/* Words at Risk of Being Forgotten (Ebbinghaus) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-extrabold text-base text-gray-900 dark:text-white">
                Từ vựng có nguy cơ quên lãng cao (Ebbinghaus Alert)
              </h2>
              <p className="text-xs text-gray-400">
                Xác suất truy xuất suy giảm theo thời gian. Hãy ôn tập ngay trước khi trí nhớ phân rã.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-black">
            {analytics?.highForgettingRiskCount || 0} từ cần ôn
          </span>
        </div>

        {analytics?.wordsAtRisk?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {analytics.wordsAtRisk.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-black text-sm text-gray-900 dark:text-white">
                      {item.term}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Nguy cơ {Math.round(item.forgettingRisk * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                    {item.meaning}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-amber-200/50 dark:border-amber-900/30">
                  <span>Mastery: {Math.round(item.knowledgeScore * 100)}%</span>
                  <button
                    onClick={() => setShowQuizModal(true)}
                    className="text-emerald-600 font-extrabold hover:underline cursor-pointer"
                  >
                    Ôn ngay →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 py-3">
            Tuyệt vời! Hiện tại không có từ nào có nguy cơ quên lãng vượt ngưỡng 40%.
          </p>
        )}
      </div>

      {/* Adaptive Quiz Engine Modal */}
      {showQuizModal && (
        <AdaptiveQuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          onSessionComplete={fetchDashboardData}
        />
      )}
    </div>
  );
}

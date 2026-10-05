"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Clock,
  Flame,
  Award,
  BookOpen,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UniversalReviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedItems, setCompletedItems] = useState<number>(0);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);

  const fetchReviewItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/review/today");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Error loading today's review:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewItems();
  }, []);

  // Combine items into a prioritized review queue
  const reviewQueue = data
    ? [
        ...(data.items.mistakes || []),
        ...(data.items.flashcards || []),
        ...(data.items.vocabulary || []),
      ]
    : [];

  const currentItem = reviewQueue[currentIndex];

  const handleRate = async (rating: number, isCorrect: boolean) => {
    if (!currentItem || submitting) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/review/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: currentItem.reviewType,
          itemId: currentItem.id,
          rating,
          isCorrect,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEarnedXp((prev) => prev + (json.xpEarned || 10));
        setCompletedItems((prev) => prev + 1);

        if (currentIndex + 1 < reviewQueue.length) {
          setCurrentIndex((prev) => prev + 1);
          setShowAnswer(false);
        } else {
          setIsFinished(true);
        }
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
          Đang chuẩn bị danh sách ôn tập cá nhân hóa hôm nay...
        </p>
      </div>
    );
  }

  if (isFinished || reviewQueue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Award className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
          Hoàn thành xuất sắc bài ôn tập hôm nay!
        </h1>
        <p className="text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto text-sm sm:text-base">
          Bạn đã hoàn thành {completedItems} mục ôn tập tổng hợp. Não bộ của bạn vừa được kích hoạt Active Recall và Spaced Repetition!
        </p>
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="p-4 bg-white dark:bg-[#17261c] rounded-2xl border border-emerald-100 dark:border-[#263d2e] shadow-sm">
            <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Kinh nghiệm</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{earnedXp || 50} XP</span>
          </div>
          <div className="p-4 bg-white dark:bg-[#17261c] rounded-2xl border border-emerald-100 dark:border-[#263d2e] shadow-sm">
            <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Đã ôn tập</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {completedItems || reviewQueue.length} mục
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link href="/vocab/index/5">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về Trung tâm Luyện tập
            </Button>
          </Link>
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setShowAnswer(false);
              setIsFinished(false);
              fetchReviewItems();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Luyện tập tiếp
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / reviewQueue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <Link href="/vocab/index/5">
          <Button variant="ghost" size="sm" className="rounded-xl text-[#526b5c] hover:text-[#192e22]">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại
          </Button>
        </Link>
        <div className="flex items-center space-x-2 text-sm text-[#526b5c] dark:text-[#a3bda9]">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>
            {currentIndex + 1} / {reviewQueue.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-emerald-100 dark:bg-[#1e3324] h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Active Recall Card */}
      <Card className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] shadow-lg min-h-[380px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <Badge
              className={`rounded-full px-3 py-1 font-semibold text-xs ${
                currentItem.reviewType === "MISTAKE"
                  ? "bg-rose-100 text-rose-700 border-rose-200"
                  : currentItem.reviewType === "FLASHCARD"
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}
            >
              {currentItem.reviewType === "MISTAKE"
                ? "⚠️ Ngân hàng lỗi sai"
                : currentItem.reviewType === "FLASHCARD"
                ? `🃏 Flashcard: ${currentItem.deckTitle || "Chung"}`
                : "📚 Từ vựng LUYENTU"}
            </Badge>

            {currentItem.subjectName && (
              <span className="text-xs font-medium text-[#526b5c] dark:text-[#a3bda9]">
                Môn: {currentItem.subjectName}
              </span>
            )}
          </div>

          {/* Front / Question */}
          <div className="space-y-4 my-6">
            <span className="text-xs uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9] font-medium block">
              Câu hỏi / Khái niệm
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2] leading-relaxed">
              {currentItem.front}
            </h2>

            {currentItem.subtitle && (
              <p className="text-sm text-[#526b5c] dark:text-[#a3bda9] italic font-mono">
                {currentItem.subtitle}
              </p>
            )}

            {currentItem.reviewType === "MISTAKE" && currentItem.userAnswer && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                <span className="font-semibold">Lần trước bạn chọn: </span>
                {currentItem.userAnswer}
              </div>
            )}
          </div>

          {/* Back / Answer Reveal */}
          {showAnswer && (
            <div className="pt-6 border-t border-dashed border-emerald-200 dark:border-[#263d2e] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                Đáp án chính xác
              </span>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {currentItem.back}
              </p>

              {currentItem.explanation && (
                <div className="p-3 bg-emerald-50 dark:bg-[#1a2f22] rounded-xl text-xs text-[#2d6a4f] dark:text-[#a3bda9]">
                  <span className="font-semibold">Giải thích chi tiết: </span>
                  {currentItem.explanation}
                </div>
              )}

              {currentItem.example && (
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] italic">
                  Ví dụ: {currentItem.example}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-6 border-t border-emerald-50 dark:border-[#263d2e] mt-6">
          {!showAnswer ? (
            <Button
              onClick={() => setShowAnswer(true)}
              className="w-full py-6 text-base font-bold bg-[#408257] hover:bg-[#346a47] text-white rounded-2xl shadow-md"
            >
              Hiện đáp án (Space)
            </Button>
          ) : (
            <div className="space-y-3">
              <span className="text-xs text-center text-[#526b5c] dark:text-[#a3bda9] block">
                Bạn nhớ khái niệm này ở mức độ nào?
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  onClick={() => handleRate(1, false)}
                  variant="outline"
                  className="py-5 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Chưa thuộc (1)
                </Button>
                <Button
                  onClick={() => handleRate(2, true)}
                  variant="outline"
                  className="py-5 rounded-2xl border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  Khá khó (2)
                </Button>
                <Button
                  onClick={() => handleRate(3, true)}
                  variant="outline"
                  className="py-5 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  Đã nhớ (3)
                </Button>
                <Button
                  onClick={() => handleRate(4, true)}
                  className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Rất dễ (4)
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

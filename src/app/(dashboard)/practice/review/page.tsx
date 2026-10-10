"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Coins,
  Play,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PracticeReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedItems, setCompletedItems] = useState<number>(0);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

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
    startTimeRef.current = Date.now();
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

  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleRate = useCallback(
    async (rating: number, isCorrect: boolean) => {
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
            // Record practice study session
            const elapsedSeconds = Math.max(
              30,
              Math.round((Date.now() - startTimeRef.current) / 1000)
            );
            fetch("/api/study-sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                actualDurationSeconds: elapsedSeconds,
                source: "PRACTICE_SESSION",
                notes: `Phiên ôn tập hôm nay: hoàn thành ${reviewQueue.length} mục`,
                productivityScore: 90,
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error submitting rating:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [currentItem, submitting, currentIndex, reviewQueue.length]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || isFinished || !currentItem) return;

      // Space flips answer
      if (e.code === "Space" && !showAnswer) {
        e.preventDefault();
        setShowAnswer(true);
        return;
      }

      if (showAnswer) {
        if (e.key === "1") {
          e.preventDefault();
          handleRate(1, false);
        } else if (e.key === "2") {
          e.preventDefault();
          handleRate(2, true);
        } else if (e.key === "3") {
          e.preventDefault();
          handleRate(3, true);
        } else if (e.key === "4") {
          e.preventDefault();
          handleRate(4, true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, isFinished, currentItem, showAnswer, handleRate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-[var(--text-subtle)]">
          Đang chuẩn bị danh sách ôn tập hôm nay...
        </p>
      </div>
    );
  }

  if (isFinished || reviewQueue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-md">
          <Award className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-ink)]">
          Hoàn thành xuất sắc phiên ôn tập!
        </h1>
        <p className="text-[var(--text-subtle)] max-w-md mx-auto text-sm sm:text-base leading-relaxed">
          {completedItems > 0
            ? `Bạn đã ôn tập ${completedItems} mục kiến thức. Kết quả đã được cập nhật vào Spaced Repetition và Thống kê giờ học (StudyRecord).`
            : "Hôm nay không còn mục nào đến hạn ôn tập. Bạn có thể thêm lỗi sai mới hoặc ôn luyện các môn học!"}
        </p>

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-emerald-100 dark:border-[#263d2e] shadow-xs min-w-[120px]">
            <span className="text-xs text-[var(--text-subtle)] block font-bold">Kinh nghiệm</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{earnedXp || 50} XP</span>
          </div>
          <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-emerald-100 dark:border-[#263d2e] shadow-xs min-w-[120px]">
            <span className="text-xs text-[var(--text-subtle)] block font-bold">Đã ôn tập</span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {completedItems || reviewQueue.length} mục
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link href="/practice">
            <Button variant="outline" className="rounded-2xl font-bold border-[var(--border)]">
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
            className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl font-bold shadow-xs"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Luyện tập tiếp
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / reviewQueue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Rounded Pill Bar matching LuyenTu reference screenshot 4 & 5 */}
      <div className="rounded-full border-2 border-gray-300 dark:border-gray-700 bg-[var(--bg-surface)] px-5 py-3 flex items-center justify-between shadow-2xs">
        {/* Left: XP Coin badge + Counter */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50 text-xs font-black">
            <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>+10 XP</span>
          </div>
          <span className="text-xs font-extrabold text-[var(--text-ink)]">
            {currentIndex + 1} / {reviewQueue.length}
          </span>
        </div>

        {/* Center: Thin Progress Bar */}
        <div className="flex-1 max-w-xs mx-4 hidden sm:block">
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Actions (Chơi lại, Thoát) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setShowAnswer(false);
            }}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chơi lại</span>
          </button>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <button
            onClick={() => router.push("/practice")}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Thoát
          </button>
        </div>
      </div>

      {/* Main Active Recall Card matching LuyenTu reference screenshot 4 */}
      <div
        onClick={() => {
          if (!showAnswer) setShowAnswer(true);
        }}
        className={`p-8 sm:p-12 rounded-[32px] transition-all min-h-[380px] flex flex-col justify-between cursor-pointer select-none relative shadow-xl ${
          currentItem.reviewType === "MISTAKE"
            ? "bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#4c0519] text-white"
            : "bg-gradient-to-b from-[#4338ca] via-[#3730a3] to-[#312e81] text-white"
        }`}
      >
        {/* Top tag & Subject */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/20">
              {currentItem.reviewType === "MISTAKE"
                ? "⚠️ NGÂN HÀNG LỖI SAI"
                : currentItem.reviewType === "FLASHCARD"
                ? `🃏 FLASHCARD: ${currentItem.deckTitle || "CHUNG"}`
                : "📚 TỪ VỰNG ÔN TẬP"}
            </span>

            {currentItem.subjectName && (
              <span className="text-xs font-bold text-white/80">
                Môn: {currentItem.subjectName}
              </span>
            )}
          </div>

          {/* Central Question / Prompt */}
          <div className="space-y-4 my-8 text-center">
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight break-words tracking-tight">
              {currentItem.front}
            </h2>

            {/* Phonetic / Part of speech */}
            {(currentItem.subtitle || currentItem.partOfSpeech) && (
              <div className="flex items-center justify-center gap-2">
                {currentItem.partOfSpeech && (
                  <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                    {currentItem.partOfSpeech}
                  </span>
                )}
                {currentItem.subtitle && (
                  <span className="text-sm text-white/80 font-mono italic">
                    {currentItem.subtitle}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentItem.front);
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all ml-1 cursor-pointer"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Wrong Answer indicator for mistakes */}
            {currentItem.reviewType === "MISTAKE" && currentItem.userAnswer && (
              <div className="inline-block p-3 bg-black/30 rounded-2xl border border-white/10 text-xs text-rose-200 text-left max-w-md mx-auto">
                <span className="font-bold">Lần trước bạn làm sai: </span>
                <span>{currentItem.userAnswer}</span>
              </div>
            )}
          </div>

          {/* Answer Reveal Section */}
          {showAnswer && (
            <div className="pt-6 border-t border-dashed border-white/20 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
              <span className="text-xs uppercase font-black tracking-wider text-emerald-300 block text-center">
                Đáp án chính xác
              </span>
              <p className="text-xl sm:text-2xl font-black text-white text-center">
                {currentItem.back}
              </p>

              {currentItem.explanation && (
                <div className="p-4 bg-black/25 rounded-2xl text-xs text-white/90 max-w-lg mx-auto leading-relaxed border border-white/10">
                  <span className="font-bold text-emerald-300">Giải thích: </span>
                  {currentItem.explanation}
                </div>
              )}

              {currentItem.example && (
                <p className="text-xs text-white/80 italic text-center max-w-md mx-auto">
                  Ví dụ: {currentItem.example}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card Footer Hint */}
        {!showAnswer && (
          <div className="pt-6 text-center text-xs text-white/70 font-semibold">
            ⚡ Nhấn <strong className="text-white underline">Space</strong> hoặc click vào thẻ để xem đáp án
          </div>
        )}
      </div>

      {/* Action Controls matching LuyenTu reference screenshot 4 */}
      <div className="pt-2">
        {!showAnswer ? (
          <Button
            onClick={() => setShowAnswer(true)}
            className="w-full py-6 text-base font-extrabold bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl shadow-md cursor-pointer transition-all active:scale-[0.99]"
          >
            Hiện đáp án (Nhấn Space)
          </Button>
        ) : (
          <div className="space-y-3">
            <span className="text-xs text-center font-bold text-[var(--text-subtle)] block">
              Bạn nhớ khái niệm này ở mức độ nào? (Nhấn phím 1 - 4)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Rating 1: Quên */}
              <button
                onClick={() => handleRate(1, false)}
                disabled={submitting}
                className="p-3.5 rounded-2xl border-2 border-rose-400 bg-[var(--bg-surface)] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-extrabold text-sm flex flex-col items-center justify-center space-y-1 shadow-2xs active:scale-95 cursor-pointer"
              >
                <div className="flex items-center space-x-1">
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Quên (1)</span>
                </div>
                <span className="text-[10px] text-gray-400 font-normal">Chưa thuộc</span>
              </button>

              {/* Rating 2: Khó */}
              <button
                onClick={() => handleRate(2, true)}
                disabled={submitting}
                className="p-3.5 rounded-2xl border-2 border-amber-400 bg-[var(--bg-surface)] text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all font-extrabold text-sm flex flex-col items-center justify-center space-y-1 shadow-2xs active:scale-95 cursor-pointer"
              >
                <span>Khá khó (2)</span>
                <span className="text-[10px] text-gray-400 font-normal">Cần ôn thêm</span>
              </button>

              {/* Rating 3: Nhớ */}
              <button
                onClick={() => handleRate(3, true)}
                disabled={submitting}
                className="p-3.5 rounded-2xl border-2 border-sky-400 bg-[var(--bg-surface)] text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all font-extrabold text-sm flex flex-col items-center justify-center space-y-1 shadow-2xs active:scale-95 cursor-pointer"
              >
                <span>Đã nhớ (3)</span>
                <span className="text-[10px] text-gray-400 font-normal">Khá ổn</span>
              </button>

              {/* Rating 4: Thuộc */}
              <button
                onClick={() => handleRate(4, true)}
                disabled={submitting}
                className="p-3.5 rounded-2xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white transition-all font-extrabold text-sm flex flex-col items-center justify-center space-y-1 shadow-md active:scale-95 cursor-pointer"
              >
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Rất dễ (4)</span>
                </div>
                <span className="text-[10px] text-emerald-100 font-normal">Đã thuộc lòng</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

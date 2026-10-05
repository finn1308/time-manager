"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Volume2,
  Brain,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import {
  InteractiveStudyModal,
  StudyWord,
} from "@/components/vocab/interactive-study-modal";

interface DueWordItem extends StudyWord {
  wordSetTitle: string;
  courseTitle: string;
  status: string;
  repetition: number;
  intervalDays: number;
}

export default function PracticeVocabularyReviewPage() {
  const [loading, setLoading] = useState(true);
  const [dueWords, setDueWords] = useState<DueWordItem[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [showStudyModal, setShowStudyModal] = useState(false);

  const fetchDueWords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vocab/spaced-repetition");
      const data = await res.json();
      if (res.ok) {
        setDueWords(data.dueWords || []);
        setTotalDue(data.totalDue || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueWords();
  }, [fetchDueWords]);

  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      <div className="flex items-center space-x-2 text-xs text-[#526b5c] dark:text-[#a3bda9]">
        <Link href="/practice" className="hover:underline">
          Practice Hub
        </Link>
        <span>/</span>
        <Link href="/practice/vocabulary" className="hover:underline">
          Vocabulary
        </Link>
        <span>/</span>
        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">Review</span>
      </div>

      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white p-6 sm:p-8 shadow-xl shadow-[#10b981]/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-100">
            <Clock className="w-3.5 h-3.5" />
            <span>Spaced Repetition System • SuperMemo SM-2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ôn Tập Từ Vựng Đến Hạn
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-xl">
            Ôn lại đúng thời điểm não bộ chuẩn bị quên để khắc sâu từ vựng vào trí nhớ dài hạn (Long-term Memory).
          </p>
        </div>

        <div className="text-center bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
          <span className="text-[10px] uppercase font-bold text-emerald-100 block">
            Từ cần ôn hôm nay
          </span>
          <span className="text-3xl font-black">{totalDue}</span>
          <span className="text-xs text-emerald-100 block mt-0.5">từ vựng</span>
        </div>
      </div>

      {/* Action / Review Now Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 dark:text-white">
            {totalDue > 0
              ? `Bạn có ${totalDue} từ vựng đã đến hạn ôn tập!`
              : "Tuyệt vời! Không có từ nào bị trễ hạn ôn tập."}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Duy trì ôn tập đều đặn giúp bạn tăng 80% khả năng ghi nhớ từ vựng sau 1 tháng.
          </p>
        </div>

        {totalDue > 0 && (
          <button
            onClick={() => setShowStudyModal(true)}
            className="px-6 py-3 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 active:scale-98 cursor-pointer"
          >
            <span>Bắt đầu ôn tập ngay ({totalDue} từ)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Due Words List */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
          Danh sách từ cần củng cố ({dueWords.length})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin" />
            <p className="text-xs text-gray-400">Đang quét hàng đợi ôn tập...</p>
          </div>
        ) : dueWords.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {dueWords.map((w) => (
              <div
                key={w.id}
                className="py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 px-2 rounded-2xl transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => playAudio(w.term)}
                    className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 mt-0.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-extrabold text-base text-gray-900 dark:text-white">
                        {w.term}
                      </span>
                      {w.phonetic && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                          {w.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {w.meaning}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {w.courseTitle} • {w.wordSetTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Khoảng lặp: {w.intervalDays} ngày
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">Đã ôn {w.repetition} lần</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#10b981] mx-auto opacity-70" />
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Bạn đã hoàn thành toàn bộ mục tiêu ôn tập ngắt quãng!
            </h4>
            <p className="text-xs text-gray-400">
              Hãy quay lại vào ngày mai khi có từ mới đến chu kỳ ôn tập.
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showStudyModal && dueWords.length > 0 && (
        <InteractiveStudyModal
          isOpen={showStudyModal}
          onClose={() => {
            setShowStudyModal(false);
            fetchDueWords();
          }}
          wordSetId={dueWords[0]?.id || "spaced"}
          wordSetTitle="Ôn tập ngắt quãng SM-2"
          mode="FLASHCARD"
          words={dueWords}
          onSessionComplete={fetchDueWords}
        />
      )}
    </div>
  );
}

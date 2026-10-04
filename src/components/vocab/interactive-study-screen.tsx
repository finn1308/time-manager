"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  CheckCircle2,
  Headphones,
  Keyboard,
  Grid2X2,
  RotateCcw,
  Sparkles,
  Coins,
  ChevronRight,
  ArrowLeft,
  Volume2,
  RefreshCw,
} from "lucide-react";
import {
  InteractiveStudyModal,
  StudyMode,
  StudyWord,
} from "./interactive-study-modal";
import { VocabIndexNav } from "./vocab-index-nav";

export interface InteractiveStudyScreenProps {
  initialMode?: StudyMode;
  initialSetId?: string;
  onNavigateStep?: (step: 1 | 2 | 3 | 4 | 5) => void;
  hideNav?: boolean;
}

export function InteractiveStudyScreen({
  initialMode: propInitialMode,
  initialSetId,
  onNavigateStep,
  hideNav = false,
}: InteractiveStudyScreenProps = {}) {
  const searchParams = useSearchParams();
  const urlMode = (searchParams?.get("mode")?.toUpperCase() as StudyMode) || undefined;
  const initialMode = propInitialMode || urlMode || "FLASHCARD";

  const [mode, setMode] = useState<StudyMode>(
    ["FLASHCARD", "QUIZ", "LISTENING", "TYPING", "MATCHING"].includes(initialMode)
      ? initialMode
      : "FLASHCARD"
  );

  useEffect(() => {
    if (propInitialMode && ["FLASHCARD", "QUIZ", "LISTENING", "TYPING", "MATCHING"].includes(propInitialMode)) {
      setMode(propInitialMode);
    }
  }, [propInitialMode]);

  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<StudyWord[]>([]);
  const [wordSetTitle, setWordSetTitle] = useState("1. Lời chào hỏi");
  const [wordSetId, setWordSetId] = useState<string>(initialSetId || "");

  // Load words from specific set (or Set 1 of A1)
  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      const targetSetId = initialSetId || wordSetId;
      if (targetSetId) {
        const setRes = await fetch(`/api/vocab/sets/${targetSetId}`);
        if (setRes.ok) {
          const setData = await setRes.json();
          if (setData.set) {
            setWordSetTitle(`${setData.set.orderNumber || 1}. ${setData.set.title}`);
          }
          setWords(setData.allWords || []);
          return;
        }
      }

      const res = await fetch("/api/vocab/courses/a1-0-3-0");
      if (res.ok) {
        const data = await res.json();
        const set1 = data.course?.wordSets?.[0];
        if (set1) {
          setWordSetTitle(`${set1.orderNumber}. ${set1.title}`);
          setWordSetId(set1.id);
          const setRes = await fetch(`/api/vocab/sets/${set1.id}`);
          if (setRes.ok) {
            const setData = await setRes.json();
            setWords(setData.allWords || []);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [initialSetId, wordSetId]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const modeTabs: { id: StudyMode; title: string; reward: string; icon: any; color: string }[] = [
    { id: "FLASHCARD", title: "Flashcard", reward: "+5 Xu", icon: Layers, color: "from-purple-500 to-indigo-600" },
    { id: "QUIZ", title: "Trắc nghiệm Quiz", reward: "+10 Xu", icon: CheckCircle2, color: "from-amber-500 to-orange-600" },
    { id: "LISTENING", title: "Nghe chép Listening", reward: "+15 Xu", icon: Headphones, color: "from-sky-500 to-blue-600" },
    { id: "TYPING", title: "Gõ từ Typing", reward: "+10 Xu", icon: Keyboard, color: "from-emerald-500 to-green-600" },
    { id: "MATCHING", title: "Ghép cặp Matching", reward: "+10 Xu", icon: Grid2X2, color: "from-blue-500 to-cyan-600" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Web Index Switcher */}
      <VocabIndexNav currentStep={4} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400">LUYENTU Luyện tập</span>
            <span className="text-gray-300">•</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold px-2 py-0.2 rounded-full uppercase">
              Web 4 • Game/Study Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Luyện tập tương tác chuyên sâu</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Bài học: <strong>{wordSetTitle}</strong> ({words.length} từ vựng). Hỗ trợ đầy đủ phím tắt bàn phím (Hotkeys).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/vocab/index/3"
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cài đặt (Web 3)</span>
          </Link>
          <Link
            href="/vocab/index/5"
            className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-200/80 dark:border-rose-900/50"
          >
            <span>Sang Mini-games (Web 5)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="p-2 rounded-2xl bg-white dark:bg-[#16241b] border border-gray-200 dark:border-[#263d2e] shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {modeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md scale-102 font-black`
                    : "bg-gray-50 dark:bg-[#1f3325] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27402f]"
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-extrabold">{tab.title}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-white dark:bg-[#16241b] text-amber-600"
                  }`}
                >
                  {tab.reward}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Study Engine Rendered in Full-Page View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-400">Đang khởi tạo Engine bài học...</p>
        </div>
      ) : words.length > 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#15251a] border border-gray-200 dark:border-[#263d2e] p-4 sm:p-8 shadow-sm">
          {/* Key Hints Banner */}
          <div className="mb-4 p-3 rounded-2xl bg-gray-50 dark:bg-[#1c3021] border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 flex-wrap gap-2">
            <span className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phím tắt hỗ trợ:</span>
            </span>
            {mode === "FLASHCARD" && (
              <span className="text-[11px] font-mono">
                [Space]: Lật thẻ • [Ctrl+S]: Nghe • [Ctrl+1]: Quên • [Ctrl+2]: Thuộc • [Enter]: Check
              </span>
            )}
            {mode === "LISTENING" && (
              <span className="text-[11px] font-mono">
                [Ctrl+X]: Nghe phát âm • [Ctrl+E]: Xem ví dụ • [Ctrl+Space]: Gợi ý • [Enter]: Kiểm tra
              </span>
            )}
            {mode === "TYPING" && (
              <span className="text-[11px] font-mono">
                [Ctrl+S]: Nghe mẫu • [Ctrl+E]: Xem ví dụ • [Ctrl+Space]: Gợi ý • [Enter]: Kiểm tra
              </span>
            )}
            {mode === "MATCHING" && (
              <span className="text-[11px] font-mono">
                5 Trái tim • Đếm ngược 60 giây • Bấm thẻ Anh rồi bấm thẻ Việt tương ứng
              </span>
            )}
            {mode === "QUIZ" && (
              <span className="text-[11px] font-mono">
                [1], [2], [3], [4]: Phím số chọn nhanh đáp án
              </span>
            )}
          </div>

          <InteractiveStudyModal
            isOpen={true}
            isEmbedded={true}
            onClose={() => {}}
            wordSetId={wordSetId}
            wordSetTitle={wordSetTitle}
            mode={mode}
            words={words}
            onSessionComplete={loadWords}
          />
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-[#15251a] rounded-3xl border border-gray-200 dark:border-[#263d2e] p-6 space-y-3">
          <Layers className="w-12 h-12 text-emerald-500 mx-auto opacity-50" />
          <h3 className="font-bold text-base">Chưa có từ vựng để luyện tập</h3>
          <p className="text-xs text-gray-400">Hãy thêm từ vựng vào bài học trước khi bắt đầu.</p>
        </div>
      )}
    </div>
  );
}

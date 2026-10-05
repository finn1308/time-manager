"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  BookOpen,
  Volume2,
  CheckCircle2,
  Sparkles,
  Coins,
  RefreshCw,
  Star,
  Layers,
  HelpCircle,
  Headphones,
  Keyboard,
  Grid2X2,
  Zap,
  Flame,
  Check,
  Plus,
  Search,
} from "lucide-react";
import {
  InteractiveStudyModal,
  StudyMode,
  StudyWord,
} from "@/components/vocab/interactive-study-modal";
import { AddWordsModal } from "@/components/vocab/add-words-modal";
import { SpecialModesModal } from "@/components/vocab/special-modes-modal";
import { VocabIndexNav } from "./vocab-index-nav";
import { useVocabWorkspace } from "./vocab-workspace-context";

interface WordItem extends StudyWord {
  status: string;
  isFavorite: boolean;
  timesStudied: number;
}

interface WordSetDetails {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  isPro: boolean;
  course: {
    id: string;
    slug: string;
    title: string;
    icon: string | null;
  };
  totalWords: number;
  learnedWordsCount: number;
  masteredWordsCount: number;
  progressPercent: number;
}

export interface LessonDetailScreenProps {
  initialSetId?: string;
  onStartStudy?: (mode: StudyMode) => void;
  onOpenSpecialModes?: () => void;
  onNavigateStep?: (step: 1 | 2 | 3 | 4 | 5) => void;
  hideNav?: boolean;
}

export function LessonDetailScreen({
  initialSetId,
  onStartStudy,
  onOpenSpecialModes,
  onNavigateStep,
  hideNav = false,
}: LessonDetailScreenProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    setId,
    setSetId,
    loading,
    error,
    setDetails,
    allWords,
    filteredWords,
    tableSearch,
    setTableSearch,
    statusFilter,
    setStatusFilter,
    quantityFilter,
    setQuantityFilter,
    orderFilter,
    setOrderFilter,
    userCoins,
    setUserCoins,
    isPro,
    fetchSetData,
    toggleFavorite,
  } = useVocabWorkspace();

  // Sync setId if initialSetId changes from parent
  useEffect(() => {
    if (initialSetId && initialSetId !== setId) {
      setSetId(initialSetId);
    }
  }, [initialSetId, setId, setSetId]);

  // Study Modal states
  const [activeStudyMode, setActiveStudyMode] = useState<StudyMode | null>(null);
  const [showSpecialModesModal, setShowSpecialModesModal] = useState(false);
  const [showAddWordsModal, setShowAddWordsModal] = useState(false);

  // Toggle favorite is now handled by Context

  // Audio speech synthesis helper
  const playWordAudio = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const displayedWordsInTable = allWords.filter((w) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      w.term.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      (w.exampleSentence && w.exampleSentence.toLowerCase().includes(q))
    );
  });

  if (loading || (!setDetails && !error)) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {!hideNav && <VocabIndexNav currentStep={3} onStepChange={onNavigateStep} />}
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Đang tải dữ liệu bài học & từ vựng...
          </p>
        </div>
      </div>
    );
  }

  if (error || !setDetails) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {!hideNav && <VocabIndexNav currentStep={3} onStepChange={onNavigateStep} />}
        <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-center space-y-3">
          <h3 className="font-bold text-base text-red-700 dark:text-red-400">
            Không tìm thấy bài học
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400">{error || "Vui lòng chọn bài học từ danh sách để tiếp tục."}</p>
          <Link
            href="/vocab/index/2"
            onClick={(e) => {
              if (onNavigateStep) {
                e.preventDefault();
                onNavigateStep(2);
              }
            }}
            className="inline-block px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 transition-all cursor-pointer"
          >
            Quay lại Danh sách bài học (Web 2)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Web Index Switcher */}
      {!hideNav && <VocabIndexNav currentStep={3} onStepChange={onNavigateStep} />}

      {/* Top Header Card matching Image 2 */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link
              href={`/vocab/courses/${setDetails.course?.slug || "a1-0-3-0"}`}
              onClick={(e) => {
                if (onNavigateStep) {
                  e.preventDefault();
                  onNavigateStep(2);
                }
              }}
              className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Quay lại danh sách bài học (Web 2)"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-400">
                  {setDetails.course?.title || "Khóa học A1"}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold px-2 py-0.2 rounded-full uppercase">
                  Web 3 • Lesson Setup
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-0.5">
                Bài {setDetails.orderNumber}: {setDetails.title}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {setDetails.totalWords} từ vựng
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {setDetails.learnedWordsCount}/{setDetails.totalWords} đã học ({setDetails.progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Add Words Button */}
          <button
            onClick={() => setShowAddWordsModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center space-x-1.5 self-start sm:self-center cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ vựng</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
          <div
            className="bg-[#10b981] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, setDetails.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Section: Tùy chỉnh (Filters) matching Image 2 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-purple-600" />
            <h2 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
              Cấu hình bài học
            </h2>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
            {filteredWords.length}/{setDetails.totalWords} từ đã lọc
          </span>
        </div>

        {/* 3 Dropdown Filters matching Image 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* TRẠNG THÁI */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Trạng thái từ
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-2xs"
              >
                <option value="ALL">📖 Toàn bộ</option>
                <option value="NOT_MEMORIZED">📖 Chưa thuộc</option>
                <option value="LEARNING">📖 Đang học</option>
                <option value="MASTERED">📖 Đã thuộc</option>
                <option value="FAVORITE">❤️ Yêu thích</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                ▼
              </div>
            </div>
          </div>

          {/* SỐ LƯỢNG */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Số lượng học
            </label>
            <div className="relative">
              <select
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-2xs"
              >
                <option value="5">🔢 5 từ</option>
                <option value="10">🔢 10 từ</option>
                <option value="15">🔢 15 từ</option>
                <option value="20">🔢 20 từ</option>
                <option value="ALL">🔢 Toàn bộ</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                ▼
              </div>
            </div>
          </div>

          {/* THỨ TỰ */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Thứ tự xuất hiện
            </label>
            <div className="relative">
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-2xs"
              >
                <option value="DEFAULT">⬇️ Theo thứ tự</option>
                <option value="RANDOM">🔀 Ngẫu nhiên</option>
                <option value="ALPHABETICAL">🔤 Theo bảng chữ cái (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: 6 Card chế độ học chính matching Image 2 */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <span>6 Chế độ luyện tập</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Nhận Xu Chrono
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Bấm vào chế độ để bắt đầu luyện tập tương tác (Web 4)
            </p>
          </div>

          <Link
            href="/vocab/index/4"
            onClick={(e) => {
              if (onNavigateStep) {
                e.preventDefault();
                onNavigateStep(4);
              }
            }}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Mở Web 4 luyện tập toàn màn hình →</span>
          </Link>
        </div>

        {/* 6 Colorful Gradient Learning Mode Cards matching Image 2 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Flashcard */}
          <button
            onClick={() => setActiveStudyMode("FLASHCARD")}
            disabled={filteredWords.length === 0}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed] text-white flex flex-col justify-between items-center text-center min-h-[160px] shadow-sm hover:shadow-md hover:scale-102 transition-all active:scale-98 disabled:opacity-50 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Flashcard</h3>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Lật thẻ để học từ vựng
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold mt-1">
              +5 🟡
            </span>
          </button>

          {/* 2. Quiz */}
          <button
            onClick={() => setActiveStudyMode("QUIZ")}
            disabled={filteredWords.length === 0}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#fdba74] via-[#fb923c] to-[#f97316] text-white flex flex-col justify-between items-center text-center min-h-[160px] shadow-sm hover:shadow-md hover:scale-102 transition-all active:scale-98 disabled:opacity-50 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Quiz</h3>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Trắc nghiệm chọn đáp...
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold mt-1">
              +10 🟡
            </span>
          </button>

          {/* 3. Listening */}
          <button
            onClick={() => setActiveStudyMode("LISTENING")}
            disabled={filteredWords.length === 0}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#67e8f9] via-[#38bdf8] to-[#0284c7] text-white flex flex-col justify-between items-center text-center min-h-[160px] shadow-sm hover:shadow-md hover:scale-102 transition-all active:scale-98 disabled:opacity-50 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Listening</h3>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Nghe từ và gõ lại (30s)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold mt-1">
              +15 🟡
            </span>
          </button>

          {/* 4. Typing */}
          <button
            onClick={() => setActiveStudyMode("TYPING")}
            disabled={filteredWords.length === 0}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#86efac] via-[#4ade80] to-[#16a34a] text-white flex flex-col justify-between items-center text-center min-h-[160px] shadow-sm hover:shadow-md hover:scale-102 transition-all active:scale-98 disabled:opacity-50 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Typing</h3>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Xem nghĩa, gõ từ tiếng..
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold mt-1">
              +10 🟡
            </span>
          </button>

          {/* 5. Ghép cặp */}
          <button
            onClick={() => setActiveStudyMode("MATCHING")}
            disabled={filteredWords.length === 0}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#93c5fd] via-[#60a5fa] to-[#2563eb] text-white flex flex-col justify-between items-center text-center min-h-[160px] shadow-sm hover:shadow-md hover:scale-102 transition-all active:scale-98 disabled:opacity-50 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
              <Grid2X2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Ghép cặp</h3>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Nối từ với nghĩa
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold mt-1">
              +10 🟡
            </span>
          </button>

          {/* 6. Đặc biệt */}
          <button
            onClick={() => setShowSpecialModesModal(true)}
            disabled={filteredWords.length === 0}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#f472b6] via-[#ec4899] to-[#db2777] text-white flex flex-col justify-between items-center text-center min-h-[160px] shadow-sm hover:shadow-md hover:scale-102 transition-all active:scale-98 disabled:opacity-50 relative group cursor-pointer"
          >
            <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-[9px] shadow-xs flex items-center space-x-1">
              <span>HOT</span>
              <Flame className="w-2.5 h-2.5 fill-current" />
            </span>

            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Đặc biệt</h3>
              <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                Hỗn hợp, đặt câu, Quá...
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold mt-1">
              +20 🟡
            </span>
          </button>
        </div>

        {/* Notice line */}
        <div className="text-center pt-2">
          {filteredWords.length === 0 ? (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Không có từ nào để học. Hãy nới lỏng bộ lọc bên trên!
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sẵn sàng học <strong className="text-emerald-600 dark:text-emerald-400">{filteredWords.length} từ vựng</strong> theo bộ lọc tùy chỉnh. Bấm vào bất kỳ thẻ chế độ nào ở trên để luyện tập ngay!
            </p>
          )}
        </div>
      </div>

      {/* Data Table: Danh sách từ vựng chi tiết */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
              <span>Bảng từ vựng chi tiết</span>
              <span className="text-xs font-bold text-gray-400">
                ({displayedWordsInTable.length}/{allWords.length} từ)
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Phát âm chuẩn bản xứ, phiên âm IPA, loại từ, giải nghĩa và ví dụ câu.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Tìm từ vựng, nghĩa, ví dụ..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#263d2e] bg-gray-50 dark:bg-[#132217] text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {displayedWordsInTable.map((word) => (
            <div
              key={word.id}
              className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 px-2 rounded-2xl transition-colors"
            >
              <div className="flex items-start space-x-3.5">
                <button
                  onClick={() => playWordAudio(word.term)}
                  className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shrink-0 mt-0.5 shadow-2xs cursor-pointer"
                  title="Bấm để nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-baseline space-x-2 flex-wrap gap-y-1">
                    <span className="font-extrabold text-base text-gray-900 dark:text-white">
                      {word.term}
                    </span>
                    {word.phonetic && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                        {word.phonetic}
                      </span>
                    )}
                    {word.partOfSpeech && (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.2 rounded-md">
                        {word.partOfSpeech}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 break-words">
                    {word.meaning}
                  </p>

                  {word.exampleSentence && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic break-words">
                      "{word.exampleSentence}" {word.exampleMeaning && `— ${word.exampleMeaning}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${
                    word.status === "MASTERED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : word.status === "LEARNING"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {word.status === "MASTERED"
                    ? "✓ Đã thuộc"
                    : word.status === "LEARNING"
                    ? "Đang học"
                    : "Chưa học"}
                </span>

                <button
                  onClick={() => toggleFavorite(word.id, word.isFavorite)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    word.isFavorite
                      ? "text-amber-500"
                      : "text-gray-300 hover:text-amber-400"
                  }`}
                  title={word.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  <Star className={`w-4 h-4 ${word.isFavorite ? "fill-amber-500" : ""}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Study Modal */}
      {activeStudyMode && (
        <InteractiveStudyModal
          isOpen={Boolean(activeStudyMode)}
          onClose={() => {
            setActiveStudyMode(null);
            fetchSetData();
          }}
          wordSetId={setDetails.id}
          wordSetTitle={`${setDetails.orderNumber}. ${setDetails.title}`}
          mode={activeStudyMode}
          words={filteredWords}
          onSessionComplete={fetchSetData}
        />
      )}

      {/* Special Modes Modal */}
      <SpecialModesModal
        isOpen={showSpecialModesModal}
        onClose={() => setShowSpecialModesModal(false)}
        wordSetId={setDetails.id}
        wordSetTitle={`${setDetails.orderNumber}. ${setDetails.title}`}
        words={allWords}
        userCoins={userCoins}
        isUserPro={isPro}
        onCoinsUpdated={(newCoins) => setUserCoins(newCoins)}
        onSessionComplete={fetchSetData}
      />

      {/* Add Words Modal */}
      <AddWordsModal
        isOpen={showAddWordsModal}
        onClose={() => setShowAddWordsModal(false)}
        defaultWordSetId={setDetails.id}
        onWordsAdded={() => fetchSetData()}
      />
    </div>
  );
}

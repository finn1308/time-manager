"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  InteractiveStudyModal,
  StudyMode,
  StudyWord,
} from "@/components/vocab/interactive-study-modal";
import { AddWordsModal } from "@/components/vocab/add-words-modal";
import { SpecialModesModal } from "@/components/vocab/special-modes-modal";

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

export default function WordSetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setDetails, setSetDetails] = useState<WordSetDetails | null>(null);
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [filteredWords, setFilteredWords] = useState<WordItem[]>([]);

  // Filter States matching Image 2
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, NOT_MEMORIZED, LEARNING, MASTERED, FAVORITE
  const [quantityFilter, setQuantityFilter] = useState("20"); // 5, 10, 15, 20, ALL
  const [orderFilter, setOrderFilter] = useState("DEFAULT"); // RANDOM, DEFAULT, ALPHABETICAL

  // Interactive Study Modal state
  const [activeStudyMode, setActiveStudyMode] = useState<StudyMode | null>(null);
  const [showSpecialModesModal, setShowSpecialModesModal] = useState(false);
  const [showAddWordsModal, setShowAddWordsModal] = useState(false);
  const [userCoins, setUserCoins] = useState(150);
  const [isPro, setIsPro] = useState(false);

  const fetchSetData = useCallback(async () => {
    if (!setId) return;
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        status: statusFilter,
        limit: quantityFilter,
        sort: orderFilter,
      });

      const [res, shopRes] = await Promise.all([
        fetch(`/api/vocab/sets/${setId}?${queryParams.toString()}`),
        fetch("/api/vocab/shop").catch(() => null),
      ]);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải bộ từ");

      setSetDetails(data.set);
      setAllWords(data.words);
      setFilteredWords(data.filteredWords);

      if (shopRes && shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData.userCoins !== undefined) setUserCoins(shopData.userCoins);
        if (shopData.isPro !== undefined) setIsPro(Boolean(shopData.isPro));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [setId, statusFilter, quantityFilter, orderFilter]);

  useEffect(() => {
    fetchSetData();
  }, [fetchSetData]);

  // Audio Playback
  const playWordAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Favorite
  const toggleFavorite = async (wordId: string, currentFav: boolean) => {
    try {
      await fetch(`/api/vocab/words/${wordId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentFav }),
      });

      setAllWords((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isFavorite: !currentFav } : w))
      );
      setFilteredWords((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isFavorite: !currentFav } : w))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Đang tải bộ từ vựng...
        </p>
      </div>
    );
  }

  if (error || !setDetails) {
    return (
      <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-center space-y-3">
        <h3 className="font-bold text-base text-red-700 dark:text-red-400">
          Không tìm thấy bộ từ vựng
        </h3>
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/vocab"
          className="inline-block px-4 py-2 bg-[#10b981] text-white text-xs font-semibold rounded-xl hover:bg-[#059669] transition-all"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Header Card matching Image 2 */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link
              href={`/vocab/courses/${setDetails.course?.slug || "a1-0-3-0"}`}
              className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors shadow-xs shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {setDetails.orderNumber}. {setDetails.title}
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
            className="px-4 py-2.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center space-x-1.5 self-start sm:self-center cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ vựng</span>
          </button>
        </div>

        {/* Full-width bright green progress bar matching Image 2 */}
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
            <Settings className="w-4 h-4 text-gray-500" />
            <h2 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
              Tùy chỉnh
            </h2>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
            {filteredWords.length}/{setDetails.totalWords} từ
          </span>
        </div>

        {/* 3 Dropdown Filters matching Image 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* TRẠNG THÁI */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10b981] appearance-none"
              >
                <option value="ALL">📖 Tất cả</option>
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
              Số lượng
            </label>
            <div className="relative">
              <select
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10b981] appearance-none"
              >
                <option value="5">🔢 5 từ</option>
                <option value="10">🔢 10 từ</option>
                <option value="15">🔢 15 từ</option>
                <option value="20">🔢 20 từ</option>
                <option value="ALL">🔢 Tất cả</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                ▼
              </div>
            </div>
          </div>

          {/* THỨ TỰ */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Thứ tự
            </label>
            <div className="relative">
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10b981] appearance-none"
              >
                <option value="RANDOM">🔀 Ngẫu nhiên</option>
                <option value="DEFAULT">⬇️ Mặc định</option>
                <option value="ALPHABETICAL">🔤 A - Z</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Chọn chế độ học matching Image 2 */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
            Chọn chế độ học
          </h2>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Cài đặt học tập"
          >
            <Settings className="w-4 h-4" />
          </button>
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

        {/* Notice line when empty or ready */}
        <div className="text-center pt-2">
          {filteredWords.length === 0 ? (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Không có từ nào để học. Hãy thay đổi bộ lọc!
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sẵn sàng học <strong className="text-emerald-600 dark:text-emerald-400">{filteredWords.length} từ vựng</strong> theo bộ lọc tùy chỉnh. Bấm vào bất kỳ chế độ nào ở trên để bắt đầu!
            </p>
          )}
        </div>
      </div>

      {/* Word List Table (Detailed view of words in this set) */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
              Danh sách từ vựng trong bộ ({allWords.length} từ)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tra cứu phát âm, nghĩa tiếng Việt và ví dụ câu thực tế.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {allWords.map((word) => (
            <div
              key={word.id}
              className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 px-2 rounded-2xl transition-colors"
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => playWordAudio(word.term)}
                  className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 mt-0.5"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-extrabold text-base text-gray-900 dark:text-white">
                      {word.term}
                    </span>
                    {word.phonetic && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                        {word.phonetic}
                      </span>
                    )}
                    {word.partOfSpeech && (
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        ({word.partOfSpeech})
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                    {word.meaning}
                  </p>

                  {word.exampleSentence && (
                    <p className="text-[11px] text-gray-500 italic mt-1">
                      "{word.exampleSentence}" {word.exampleMeaning && `— ${word.exampleMeaning}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2.5 self-end sm:self-center">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    word.status === "MASTERED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : word.status === "LEARNING"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {word.status === "MASTERED"
                    ? "Đã thuộc"
                    : word.status === "LEARNING"
                    ? "Đang học"
                    : "Chưa học"}
                </span>

                <button
                  onClick={() => toggleFavorite(word.id, word.isFavorite)}
                  className={`p-1.5 rounded-lg transition-colors ${
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

      {/* Interactive Study Modal (Launches Flashcard, Quiz, Listening, Typing, Matching) */}
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

      {/* Special Modes Modal (Image 3: Hỗn hợp, Luyện đặt câu, Quán cơm tấm, Chim chăm chỉ, Giải cứu khỉ) */}
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

      {/* Add Words Modal (Image 1: Thêm vào bộ từ) */}
      <AddWordsModal
        isOpen={showAddWordsModal}
        onClose={() => setShowAddWordsModal(false)}
        defaultWordSetId={setDetails.id}
        onWordsAdded={() => fetchSetData()}
      />
    </div>
  );
}

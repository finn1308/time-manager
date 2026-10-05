"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Volume2,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Flame,
  Clock,
} from "lucide-react";
import { AddWordsModal } from "@/components/vocab/add-words-modal";

interface WordItem {
  id: string;
  term: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaning: string;
  explanation: string | null;
  exampleSentence: string | null;
  exampleMeaning: string | null;
  difficulty?: string | null;
  topic?: string | null;
  wordSetTitle: string;
  courseTitle: string;
  courseSlug: string;
  status: string;
  isFavorite: boolean;
  repetition?: number;
  intervalDays?: number;
  nextReviewDate?: string | null;
}

interface StatusCounts {
  all: number;
  new: number;
  learning: number;
  mastered: number;
  reviewDue: number;
}

export default function PracticeVocabularyWordBankPage() {
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<WordItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    new: 0,
    learning: 0,
    mastered: 0,
    reviewDue: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchWords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        query: searchQuery,
        status: statusFilter,
        page: String(page),
        limit: "25",
      });

      const res = await fetch(`/api/vocab/words?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setWords(data.words || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const toggleFavorite = async (wordId: string, currentFav: boolean) => {
    try {
      await fetch(`/api/vocab/words/${wordId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentFav }),
      });

      setWords((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isFavorite: !currentFav } : w))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-[#526b5c] dark:text-[#a3bda9]">
        <Link href="/practice" className="hover:underline">
          Practice Hub
        </Link>
        <span>/</span>
        <Link href="/practice/vocabulary" className="hover:underline">
          Vocabulary
        </Link>
        <span>/</span>
        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">Word Bank</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-6 sm:p-8 shadow-xl shadow-[#2d6a4f]/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-100">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kho từ vựng & Tiến độ học tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Danh Mục Từ Vựng
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-xl">
            Tra cứu từ vựng, theo dõi trạng thái ghi nhớ theo thuật toán Spaced Repetition và củng cố các từ đến hạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/practice/vocabulary/learn"
            className="px-4 py-2.5 rounded-2xl bg-white text-[#1b4332] font-bold text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center space-x-1.5"
          >
            <Brain className="w-4 h-4 text-[#2d6a4f]" />
            <span>Luyện Flashcard</span>
          </Link>
          <Link
            href="/practice/vocabulary/review"
            className="px-4 py-2.5 rounded-2xl bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-bold text-xs border border-white/20 transition-all flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4 text-emerald-300" />
            <span>Ôn tập ({statusCounts.reviewDue})</span>
          </Link>
        </div>
      </div>

      {/* Vocabulary Progress Statistics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md"
              : "bg-white dark:bg-[#18281d] border-[#dbe7dd] dark:border-[#263d2e] hover:border-[#2d6a4f]"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "ALL" ? "text-emerald-100" : "text-[#73927d]"}`}>
            Tổng số từ
          </span>
          <span className="text-2xl font-black">{statusCounts.all}</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("MASTERED");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "MASTERED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white dark:bg-[#18281d] border-[#dbe7dd] dark:border-[#263d2e] hover:border-emerald-500"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "MASTERED" ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400"}`}>
            Đã thuộc (Mastered)
          </span>
          <span className="text-2xl font-black">{statusCounts.mastered}</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("LEARNING");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "LEARNING"
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-white dark:bg-[#18281d] border-[#dbe7dd] dark:border-[#263d2e] hover:border-amber-500"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "LEARNING" ? "text-amber-100" : "text-amber-600 dark:text-amber-400"}`}>
            Đang học (Learning)
          </span>
          <span className="text-2xl font-black">{statusCounts.learning}</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("NEW");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "NEW"
              ? "bg-sky-600 text-white border-sky-600 shadow-md"
              : "bg-white dark:bg-[#18281d] border-[#dbe7dd] dark:border-[#263d2e] hover:border-sky-500"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "NEW" ? "text-sky-100" : "text-sky-600 dark:text-sky-400"}`}>
            Chưa học (New)
          </span>
          <span className="text-2xl font-black">{statusCounts.new}</span>
        </button>

        <button
          onClick={() => {
            setStatusFilter("REVIEW_DUE");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === "REVIEW_DUE"
              ? "bg-rose-600 text-white border-rose-600 shadow-md"
              : "bg-white dark:bg-[#18281d] border-[#dbe7dd] dark:border-[#263d2e] hover:border-rose-500"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "REVIEW_DUE" ? "text-rose-100" : "text-rose-600 dark:text-rose-400"}`}>
            Đến hạn ôn (Review Due)
          </span>
          <span className="text-2xl font-black">{statusCounts.reviewDue}</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#18281d] border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo từ, nghĩa, phát âm..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ mới</span>
          </button>
        </div>
      </div>

      {/* Word List Table */}
      <div className="bg-white dark:bg-[#18281d] rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#2d6a4f] animate-spin" />
            <p className="text-xs text-gray-400">Đang tải kho từ vựng...</p>
          </div>
        ) : words.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {words.map((w, index) => (
              <div
                key={w.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-start space-x-3.5">
                  <span className="text-xs font-bold text-gray-400 mt-1 w-5 shrink-0">
                    {(page - 1) * 25 + index + 1}
                  </span>

                  <button
                    onClick={() => playAudio(w.term)}
                    className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 mt-0.5 cursor-pointer"
                    title="Phát âm tiếng Anh"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-base font-extrabold text-gray-900 dark:text-white">
                        {w.term}
                      </span>
                      {w.phonetic && (
                        <span className="text-xs text-[#2d6a4f] dark:text-[#52b788] font-mono">
                          {w.phonetic}
                        </span>
                      )}
                      {w.partOfSpeech && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {w.partOfSpeech}
                        </span>
                      )}
                      {w.difficulty && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {w.difficulty}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {w.meaning}
                    </p>

                    {w.exampleSentence && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                        "{w.exampleSentence}"
                      </p>
                    )}
                    {w.exampleMeaning && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        → {w.exampleMeaning}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.status === "MASTERED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : w.status === "LEARNING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {w.status === "MASTERED"
                        ? "ĐÃ THUỘC"
                        : w.status === "LEARNING"
                        ? "ĐANG HỌC"
                        : "TỪ MỚI"}
                    </span>

                    <button
                      onClick={() => toggleFavorite(w.id, w.isFavorite)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        w.isFavorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-300 hover:text-amber-400"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${w.isFavorite ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>

                  <span className="text-[10px] text-gray-400">
                    {w.courseTitle} • {w.wordSetTitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Không tìm thấy từ vựng phù hợp
            </h4>
            <p className="text-xs text-gray-400">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Hiển thị {words.length} / {totalCount} từ
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddWordsModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            fetchWords();
          }}
          wordSetId={words[0]?.id || "new"}
        />
      )}
    </div>
  );
}

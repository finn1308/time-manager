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
} from "lucide-react";

interface WordItem {
  id: string;
  term: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaning: string;
  explanation: string | null;
  exampleSentence: string | null;
  exampleMeaning: string | null;
  wordSetTitle: string;
  courseTitle: string;
  courseSlug: string;
  status: string;
  isFavorite: boolean;
}

export default function VocabWordBankPage() {
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<WordItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-[#10b981]" />
            <span>Kho Từ Vựng Toàn Hệ Thống</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tổng cộng <strong>{totalCount}</strong> từ vựng được lập chỉ mục và phân loại.
          </p>
        </div>

        <Link
          href="/api/export?format=csv&entity=courses"
          target="_blank"
          className="text-xs text-[#10b981] hover:underline font-bold flex items-center space-x-1"
        >
          <span>Xuất dữ liệu CSV</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tra cứu từ tiếng Anh hoặc nghĩa tiếng Việt..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#10b981]"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "LEARNING", label: "Đang học" },
            { id: "MASTERED", label: "Đã thuộc" },
            { id: "FAVORITE", label: "Yêu thích" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#10b981] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Words Table */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin" />
            <p className="text-xs text-gray-400">Đang tìm từ vựng...</p>
          </div>
        ) : words.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {words.map((w) => (
              <div
                key={w.id}
                className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 px-2 rounded-2xl transition-colors"
              >
                <div className="flex items-start space-x-3.5">
                  <button
                    onClick={() => playAudio(w.term)}
                    className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 mt-0.5"
                    title="Nghe phát âm"
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
                      {w.partOfSpeech && (
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          ({w.partOfSpeech})
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {w.meaning}
                    </p>

                    {w.exampleSentence && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5">
                        "{w.exampleSentence}" {w.exampleMeaning && `— ${w.exampleMeaning}`}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-1">
                      <span>{w.courseTitle}</span>
                      <span>•</span>
                      <span>{w.wordSetTitle}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      w.status === "MASTERED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : w.status === "LEARNING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {w.status === "MASTERED"
                      ? "Đã thuộc"
                      : w.status === "LEARNING"
                      ? "Đang học"
                      : "Chưa học"}
                  </span>

                  <button
                    onClick={() => toggleFavorite(w.id, w.isFavorite)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      w.isFavorite ? "text-amber-500" : "text-gray-300 hover:text-amber-400"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${w.isFavorite ? "fill-amber-500" : ""}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Không có từ vựng nào khớp với bộ lọc
            </h4>
            <p className="text-xs text-gray-400">Hãy thử đổi từ khóa tìm kiếm hoặc trạng thái.</p>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
            <span className="text-gray-400">
              Trang {page} / {totalPages}
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

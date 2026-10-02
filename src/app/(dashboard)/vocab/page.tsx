"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Pin,
  Sparkles,
  Trophy,
  Clock,
  ArrowRight,
  Coins,
  Search,
  CheckCircle2,
  RefreshCw,
  Plus,
  Flame,
  Award,
} from "lucide-react";

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  coverColor: string | null;
  level: string;
  isPro: boolean;
  totalWordSets: number;
  totalWords: number;
  learnedWordsCount: number;
  completionPercent: number;
  isPinned: boolean;
}

export default function VocabCoursesHubPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vocab/courses");
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = selectedLevel === "ALL" || c.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Pinned courses first
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner: LUYENTU Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white p-6 sm:p-8 shadow-xl shadow-[#10b981]/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền tảng Luyện Từ Vựng Thông Minh • LUYENTU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Khóa học & Lộ trình Từ vựng
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium">
              Chinh phục từ vựng tiếng Anh theo phương pháp Spaced Repetition (Lặp lại ngắt quãng SM-2)
              và 6 chế độ luyện tập chuyên sâu.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href="/vocab/spaced-repetition"
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 text-xs font-extrabold shadow-sm hover:bg-emerald-50 transition-all flex items-center space-x-1.5"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>⏱️ Ôn tập ngắt quãng</span>
            </Link>

            <Link
              href="/vocab/shop"
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Cửa hàng Xu</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khóa học từ vựng (A1, IELTS, TOEIC...)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
          />
        </div>

        <div className="flex items-center space-x-2">
          {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedLevel === lvl
                  ? "bg-[#10b981] text-white"
                  : "bg-white dark:bg-[#18281d] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#263d2e] hover:bg-gray-50"
              }`}
            >
              {lvl === "ALL"
                ? "Tất cả"
                : lvl === "BEGINNER"
                ? "Cơ bản"
                : lvl === "INTERMEDIATE"
                ? "Trung cấp"
                : "Nâng cao"}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin" />
          <p className="text-xs font-semibold text-gray-400">Đang tải danh sách khóa học...</p>
        </div>
      ) : sortedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedCourses.map((c) => (
            <Link
              key={c.id}
              href={`/vocab/courses/${c.slug}`}
              className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] hover:border-[#10b981] hover:shadow-md transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-2xl flex items-center justify-center shrink-0">
                    {c.icon || "📚"}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {c.isPinned && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e68a00] text-white flex items-center space-x-1 shadow-2xs">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        <span>Đã ghim</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {c.level}
                    </span>
                  </div>
                </div>

                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white group-hover:text-[#10b981] transition-colors">
                  {c.title}
                </h3>
                {c.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {c.subtitle}
                  </p>
                )}

                <div className="flex items-center space-x-3 text-xs font-semibold text-gray-600 dark:text-gray-400 mt-4">
                  <span>{c.totalWordSets} bộ từ</span>
                  <span>•</span>
                  <span>{c.totalWords} từ vựng</span>
                </div>
              </div>

              {/* Bottom Progress */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Tiến độ</span>
                  <span className="font-extrabold text-[#10b981]">
                    {c.completionPercent}% ({c.learnedWordsCount}/{c.totalWords})
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10b981] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(2, c.completionPercent)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-[#18281d] rounded-3xl border border-gray-200 dark:border-[#263d2e] p-6 space-y-3">
          <BookOpen className="w-12 h-12 text-[#10b981] mx-auto opacity-50" />
          <h3 className="font-bold text-base">Không tìm thấy khóa học phù hợp</h3>
          <p className="text-xs text-gray-400">Hãy thử tìm kiếm với từ khóa khác.</p>
        </div>
      )}
    </div>
  );
}

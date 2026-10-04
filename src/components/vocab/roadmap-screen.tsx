"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Compass,
  Pin,
  Sparkles,
  Search,
  BookOpen,
  Plus,
  RefreshCw,
  Clock,
  Coins,
  ChevronRight,
  Filter,
  CheckCircle2,
  GraduationCap,
  Award,
  Zap,
  Star,
  Layers,
} from "lucide-react";
import { VocabIndexNav } from "./vocab-index-nav";
import { AddWordsModal } from "./add-words-modal";

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

export interface RoadmapScreenProps {
  initialCourses?: CourseItem[];
  onSelectCourse?: (slug: string) => void;
  onNavigateStep?: (step: 1 | 2 | 3 | 4 | 5) => void;
  hideNav?: boolean;
}

export function RoadmapScreen({
  initialCourses = [],
  onSelectCourse,
  onNavigateStep,
  hideNav = false,
}: RoadmapScreenProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [showAddWordsModal, setShowAddWordsModal] = useState(false);

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
    if (initialCourses.length === 0) {
      fetchCourses();
    }
  }, [initialCourses.length, fetchCourses]);

  const categories = [
    { id: "ALL", label: "Tất cả lộ trình" },
    { id: "THPT", label: "THPT Quốc Gia" },
    { id: "CAMBRIDGE", label: "Sách Cambridge / IELTS" },
    { id: "TOEIC", label: "TOEIC 4 kỹ năng" },
    { id: "CEFR", label: "Theo cấp độ CEFR" },
  ];

  const filteredCourses = courses.filter((c) => {
    const text = (c.title + " " + (c.subtitle || "") + " " + (c.description || "")).toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());

    // Category filter
    let matchesCategory = true;
    if (activeCategory === "THPT") {
      matchesCategory = c.slug.includes("thpt") || c.slug.includes("hsa") || text.includes("thpt") || text.includes("hsa");
    } else if (activeCategory === "CAMBRIDGE") {
      matchesCategory = c.slug.includes("cambridge") || text.includes("cambridge") || text.includes("ielts");
    } else if (activeCategory === "TOEIC") {
      matchesCategory = c.slug.includes("toeic") || text.includes("toeic");
    } else if (activeCategory === "CEFR") {
      matchesCategory = c.slug.includes("a1") || c.slug.includes("destination") || text.includes("cefr");
    }

    // Level filter
    const matchesLevel = selectedLevel === "ALL" || c.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Pinned courses first
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const pinnedCourse = courses.find((c) => c.isPinned) || courses[0];

  const getDifficultyScale = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return { text: "Dễ (A1-A2)", stars: 1, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" };
      case "INTERMEDIATE":
        return { text: "Trung bình (B1-B2)", stars: 2, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" };
      case "ADVANCED":
        return { text: "Nâng cao (C1-C2)", stars: 3, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300" };
      default:
        return { text: "Phổ thông", stars: 1, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Web Index Switcher (Web 1 to Web 5) */}
      {!hideNav && <VocabIndexNav currentStep={1} onStepChange={onNavigateStep} />}

      {/* Breadcrumbs & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center space-x-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              ChronoMind
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/vocab" className="text-emerald-600 dark:text-emerald-400 font-bold">
              LUYENTU
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800 dark:text-gray-200">Lộ trình học (Web 1)</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <span>Bản đồ Lộ trình Từ vựng</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold uppercase">
              Web 1 • Roadmap
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setShowAddWordsModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-emerald-700 dark:text-emerald-300 text-xs font-extrabold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ vào bộ</span>
          </button>

          <Link
            href="/vocab/spaced-repetition"
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Học ngắt quãng SM-2</span>
          </Link>
        </div>
      </div>

      {/* Pinned Course Highlight Banner */}
      {pinnedCourse && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white p-6 sm:p-7 shadow-lg shadow-emerald-600/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                  <Pin className="w-3 h-3 fill-current" />
                  <span>Lộ trình đang ghim ưu tiên</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold text-white">
                  {pinnedCourse.level} • {getDifficultyScale(pinnedCourse.level).text}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                  <span>{pinnedCourse.icon || "📚"}</span>
                  <span>{pinnedCourse.title}</span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1 leading-relaxed">
                  {pinnedCourse.subtitle || pinnedCourse.description}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-bold text-emerald-100">
                <span>📁 {pinnedCourse.totalWordSets} chủ đề</span>
                <span>•</span>
                <span>📖 {pinnedCourse.totalWords} từ vựng</span>
                <span>•</span>
                <span className="text-amber-300 font-extrabold">
                  ✓ Tiến độ: {pinnedCourse.completionPercent}% ({pinnedCourse.learnedWordsCount}/{pinnedCourse.totalWords} từ)
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
              <Link
                href={`/vocab/courses/${pinnedCourse.slug}`}
                className="px-5 py-3 rounded-2xl bg-white text-emerald-800 text-xs font-black shadow-md hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2 active:scale-95 text-center"
              >
                <span>Vào học lộ trình ngay (Web 2)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vocab/index/2"
                className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all text-center"
              >
                Xem chi tiết bài học →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar with Categories & Level Selector */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-sm scale-[1.02]"
                  : "bg-white dark:bg-[#18281d] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#263d2e] hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input & Difficulty Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm lộ trình (HSA, THPT, Cambridge, In Use, TOEIC, A1...)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Độ khó:</span>
            </span>
            {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedLevel === lvl
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black shadow-xs"
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
      </div>

      {/* Section Grid các lộ trình */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-400">Đang tải danh sách lộ trình học...</p>
        </div>
      ) : sortedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedCourses.map((c) => {
            const diff = getDifficultyScale(c.level);
            return (
              <div
                key={c.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group shadow-xs relative"
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${c.coverColor || "#10b981"}20` }}
                    >
                      {c.icon || "📚"}
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap justify-end gap-y-1">
                      {c.isPinned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center space-x-0.5 shadow-2xs">
                          <Pin className="w-2.5 h-2.5 fill-current" />
                          <span>Đã ghim</span>
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${diff.bg}`}>
                        {diff.text}
                      </span>

                      {c.isPro && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-2xs">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="font-black text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {c.title}
                  </h3>
                  {c.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                      {c.subtitle}
                    </p>
                  )}

                  {/* Course Metadata */}
                  <div className="flex items-center space-x-3 text-xs font-bold text-gray-500 dark:text-gray-400 mt-4">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{c.totalWordSets} bài học</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>{c.totalWords} từ vựng</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Progress & Action */}
                <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">Tiến độ hoàn thành</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {c.completionPercent}% ({c.learnedWordsCount}/{c.totalWords})
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(3, c.completionPercent)}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/vocab/courses/${c.slug}`}
                    className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                  >
                    <span>Xem danh sách bài học (Web 2)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-[#18281d] rounded-3xl border border-gray-200 dark:border-[#263d2e] p-6 space-y-3">
          <BookOpen className="w-12 h-12 text-emerald-500 mx-auto opacity-50" />
          <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">Không tìm thấy lộ trình phù hợp</h3>
          <p className="text-xs text-gray-400">Hãy thử tìm kiếm với bộ lọc hoặc từ khóa khác.</p>
        </div>
      )}

      {/* Add Words Modal */}
      <AddWordsModal
        isOpen={showAddWordsModal}
        onClose={() => setShowAddWordsModal(false)}
        onWordsAdded={() => fetchCourses()}
      />
    </div>
  );
}

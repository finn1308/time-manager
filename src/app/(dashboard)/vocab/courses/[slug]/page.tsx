"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pin,
  Trophy,
  Clock,
  Unlock,
  Lock,
  Play,
  CheckCircle2,
  Sparkles,
  Coins,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Plus,
} from "lucide-react";
import { AddWordsModal } from "@/components/vocab/add-words-modal";

interface WordSetSummary {
  id: string;
  orderNumber: number;
  title: string;
  description: string | null;
  isPro: boolean;
  isLocked: boolean;
  totalWords: number;
  learnedWordsCount: number;
  progressPercent: number;
  isMastered: boolean;
}

interface CourseDetails {
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
  wordSets: WordSetSummary[];
}

export default function VocabCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "a1-0-3-0";

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [showAddWordsModal, setShowAddWordsModal] = useState(false);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/vocab/courses/${slug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể tải khóa học");
      }

      setCourse(data.course);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Handle Toggle Pin
  const handleTogglePin = async () => {
    if (!course) return;
    try {
      setPinLoading(true);
      const res = await fetch(`/api/vocab/courses/${slug}/pin`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCourse((prev) => (prev ? { ...prev, isPinned: data.isPinned } : null));
    } catch (err: any) {
      alert("Lỗi ghim khóa học: " + err.message);
    } finally {
      setPinLoading(false);
    }
  };

  // Handle Unlock All PRO Sets
  const handleUnlockCourse = async () => {
    try {
      setUnlockLoading(true);
      const res = await fetch(`/api/vocab/courses/${slug}/unlock`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || "Mở khóa thành công!");
      setShowUnlockModal(false);
      await fetchCourseData();
    } catch (err: any) {
      alert(err.message || "Lỗi mở khóa");
    } finally {
      setUnlockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Đang tải khóa học từ vựng...
        </p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-center space-y-3">
        <h3 className="font-bold text-base text-red-700 dark:text-red-400">
          Không tìm thấy khóa học
        </h3>
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/vocab"
          className="inline-block px-4 py-2 bg-[#10b981] text-white text-xs font-semibold rounded-xl hover:bg-[#059669] transition-all"
        >
          Quay lại danh sách khóa học
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Navigation Links Bar matching image */}
      <div className="flex items-center justify-between">
        <Link
          href="/vocab"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-xs flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#203626] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Action Buttons: Thêm từ vựng, Đã ghim, BXH, Học ngắt quãng */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Thêm từ vựng button */}
          <button
            onClick={() => setShowAddWordsModal(true)}
            className="px-4 py-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ vựng</span>
          </button>

          {/* Ghim / Đã ghim Button */}
          <button
            onClick={handleTogglePin}
            disabled={pinLoading}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
              course.isPinned
                ? "bg-[#e68a00] hover:bg-[#cc7a00] text-white"
                : "bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${course.isPinned ? "fill-white" : ""}`} />
            <span>{course.isPinned ? "📌 Đã ghim" : "Ghim"}</span>
          </button>

          {/* BXH Button */}
          <Link
            href="/vocab/leaderboard"
            className="px-4 py-2 rounded-2xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] hover:bg-gray-50 dark:hover:bg-[#203626] text-xs font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>BXH</span>
          </Link>

          {/* Học ngắt quãng Button (Spaced Repetition) */}
          <Link
            href="/vocab/spaced-repetition"
            className="px-4 py-2 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏱️ Học ngắt quãng</span>
          </Link>
        </div>
      </div>

      {/* Course Banner Card matching Image 1 */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">{course.icon || "📚"}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {course.title}
            </h1>
          </div>
          {course.subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {course.subtitle}
            </p>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {course.totalWordSets} bộ từ
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {course.totalWords} từ vựng
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            {course.completionPercent}% hoàn thành
          </span>
        </div>

        {/* Progress Bar: Tiến độ 9/371 từ */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>Tiến độ: {course.learnedWordsCount}/{course.totalWords} từ</span>
            <span>{course.completionPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#10b981] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(1, course.completionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section: Các bộ từ (Word Sets Header + Mở khóa button) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
            Các bộ từ
          </h2>

          <button
            onClick={() => setShowUnlockModal(true)}
            className="px-4 py-1.5 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Mở khóa</span>
          </button>
        </div>

        {/* Grid of Word Set Cards matching Image 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {course.wordSets.map((set) => {
            const isCompleted = set.progressPercent === 100;
            const isUnlocked = !set.isLocked;

            return (
              <div
                key={set.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all relative flex flex-col justify-between group ${
                  set.orderNumber === 1
                    ? "bg-white dark:bg-[#18281d] border-emerald-300 dark:border-emerald-800 shadow-sm"
                    : "bg-white dark:bg-[#18281d] border-dashed border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    {/* Circle icon on the left: Trophy for #1, or Grey Number for others */}
                    <div className="flex items-center space-x-3">
                      {set.orderNumber === 1 ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex flex-col items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                            #1
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                          {set.orderNumber}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center space-x-1.5">
                          {set.isLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-1">
                            {set.orderNumber}. {set.title}
                          </h3>
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {set.learnedWordsCount > 0
                              ? `${set.learnedWordsCount} / ${set.totalWords} từ`
                              : `${set.totalWords} từ`}
                          </span>
                          {set.learnedWordsCount > 0 && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {set.progressPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side badge or Play button */}
                    <div>
                      {set.isPro && set.isLocked ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          PRO
                        </span>
                      ) : (
                        <Link
                          href={`/vocab/sets/${set.id}`}
                          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#10b981] hover:text-white text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar for Set */}
                  {set.learnedWordsCount > 0 && (
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-[#10b981] h-full rounded-full transition-all duration-300"
                        style={{ width: `${set.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Bottom link */}
                <div className="mt-3 pt-2">
                  {isUnlocked ? (
                    <Link
                      href={`/vocab/sets/${set.id}`}
                      className="text-xs font-bold text-[#10b981] hover:underline flex items-center space-x-1"
                    >
                      <span>Vào học ngay</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Mở khóa với Xu / PRO</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Mở Khóa Khóa Học PRO */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#18281d] rounded-3xl max-w-md w-full p-6 border border-gray-200 dark:border-[#263d2e] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Mở khóa trọn bộ {course.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Mở khóa tất cả các bộ từ vựng PRO bao gồm Số đếm, Màu sắc, Ngày trong tuần, Thời tiết và hơn thế nữa!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Chi phí mở khóa</span>
              </div>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                100 Xu
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUnlockCourse}
                disabled={unlockLoading}
                className="px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                {unlockLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận mở khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Words Modal (Screenshot 1: Thêm vào bộ từ) */}
      <AddWordsModal
        isOpen={showAddWordsModal}
        onClose={() => setShowAddWordsModal(false)}
        onWordsAdded={() => fetchCourseData()}
      />
    </div>
  );
}

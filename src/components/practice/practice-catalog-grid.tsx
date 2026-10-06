"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  AlertCircle,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { PracticeSubject, PracticeStats } from "./types";
import { usePipTimer } from "@/components/timer/pip-timer-provider";

interface SubjectSessionSummary {
  subjectId: string;
  totalSeconds: number;
  sessionCount: number;
}

interface PracticeCatalogGridProps {
  stats: PracticeStats;
  subjects: PracticeSubject[];
  activeFilter: string;
  searchQuery: string;
  subjectSessionSummaries?: Record<string, SubjectSessionSummary>;
}

export function PracticeCatalogGrid({
  stats,
  subjects,
  activeFilter,
  searchQuery,
  subjectSessionSummaries = {},
}: PracticeCatalogGridProps) {
  const { startTimer, pauseTimer, isRunning, activeSubject } = usePipTimer();

  // Core system modules
  const coreModules = [
    {
      id: "review",
      title: "Ôn tập tổng hợp hôm nay (Today's Review)",
      category: "REVIEW",
      description: "Hệ thống active recall tự động tổng hợp từ vựng, flashcards và lỗi sai cần ôn lại hôm nay.",
      href: "/practice/review",
      icon: Award,
      badge: "KHUYÊN DÙNG",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      borderHover: "hover:border-emerald-400",
      metricLabel: `${stats.dueCount} mục đến hạn`,
      progress: stats.completionRate,
    },
    {
      id: "mistakes",
      title: "Ngân hàng lỗi sai (Mistake Bank)",
      category: "MISTAKES",
      description: "Kho lưu trữ và khắc phục các câu hỏi từng làm sai từ quiz, đề thi và flashcards.",
      href: "/practice/mistakes",
      icon: AlertCircle,
      badge: "TRỌNG TÂM",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      borderHover: "hover:border-rose-400",
      metricLabel: `${stats.mistakeCount} lỗi ghi nhận`,
      progress: stats.totalItems > 0 ? Math.round((stats.resolvedCount / stats.totalItems) * 100) : 0,
    },
    {
      id: "flashcards",
      title: "Thẻ ghi nhớ Flashcards (Anki-style)",
      category: "FLASHCARDS",
      description: "Ôn tập kiến thức với thuật toán lặp lại ngắt quãng SM-2, tối ưu ghi nhớ dài hạn.",
      href: "/flashcards",
      icon: Layers,
      badge: "TRÍ NHỚ",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
      borderHover: "hover:border-purple-400",
      metricLabel: "Bộ thẻ tự tạo",
      progress: 65,
    },
    {
      id: "learning",
      title: "Study Quest & Trắc nghiệm Quiz",
      category: "QUIZ",
      description: "Thử thách trắc nghiệm theo môn học, chấm điểm tự động và phân tích điểm yếu.",
      href: "/learning",
      icon: Sparkles,
      badge: "THỬ THÁCH",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      borderHover: "hover:border-amber-400",
      metricLabel: "Trắc nghiệm kiểm tra",
      progress: 50,
    },
  ];

  // Filter core modules
  const filteredCore = coreModules.filter((m) => {
    if (activeFilter !== "ALL" && activeFilter !== m.category) return false;
    if (searchQuery) {
      const match = (m.title + " " + m.description).toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  // Filter subjects
  const filteredSubjects = subjects.filter((sub) => {
    if (activeFilter !== "ALL" && activeFilter !== `SUBJECT_${sub.id}`) return false;
    if (searchQuery) {
      const match = (sub.name + " " + (sub.code || "")).toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const totalVisible = filteredCore.length + (activeFilter.startsWith("SUBJECT") || activeFilter === "ALL" ? filteredSubjects.length : 0);

  const handleTimerToggle = (sub: PracticeSubject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRunning && activeSubject?.id === sub.id) {
      pauseTimer();
    } else {
      startTimer({
        id: sub.id,
        name: sub.name,
        code: sub.code,
        color: sub.color || "#2d6a4f",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
            Chế độ luyện tập & Môn học
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            {totalVisible} mục
          </span>
        </div>
      </div>

      {totalVisible === 0 ? (
        <div className="p-12 rounded-[28px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-center space-y-3">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto stroke-[1.5]" />
          <h4 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Không tìm thấy mục luyện tập phù hợp
          </h4>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-sm mx-auto">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá các bài luyện tập khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Core Practice Modules */}
          {filteredCore.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id} href={mod.href} className="block group">
                <div
                  className={`p-5 rounded-[26px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] ${mod.borderHover} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full relative`}
                >
                  <div>
                    {/* Top row: Icon & Badge */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl ${mod.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {mod.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${mod.badgeColor}`}
                        >
                          {mod.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-[#2d6a4f] dark:group-hover:text-[#52b788] transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1.5 leading-relaxed line-clamp-2">
                      {mod.description}
                    </p>

                    {/* Metric pill */}
                    <div className="mt-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                        {mod.metricLabel}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Progress Bar matching LuyenTu */}
                  <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#526b5c] dark:text-[#a3bda9] mb-1.5">
                      <span>Tiến độ hoàn thành</span>
                      <span>{mod.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${mod.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Real Subjects Cards with One-Click PIP Timer */}
          {(activeFilter === "ALL" || activeFilter.startsWith("SUBJECT")) &&
            filteredSubjects.map((sub) => {
              const summary = subjectSessionSummaries[sub.id];
              const hours = summary ? Math.round((summary.totalSeconds / 3600) * 10) / 10 : 0;
              const isCurrentTimer = isRunning && activeSubject?.id === sub.id;

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-[26px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                        style={{ backgroundColor: sub.color || "#2d6a4f" }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>

                      <button
                        onClick={(e) => handleTimerToggle(sub, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95 ${
                          isCurrentTimer
                            ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60"
                        }`}
                        title={isCurrentTimer ? "Tạm dừng bấm giờ" : `Bấm giờ học môn ${sub.name}`}
                      >
                        {isCurrentTimer ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Đang bấm giờ</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                            <span>Bấm giờ luyện</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h4 className="text-base font-extrabold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-emerald-600 transition-colors">
                      {sub.name}
                    </h4>
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
                      Mã môn: <strong className="font-mono">{sub.code || "CHUNG"}</strong> • Luyện tập và ghi nhận thời gian thực tế
                    </p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Đã học: {hours} giờ</span>
                      </span>
                      {summary && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          {summary.sessionCount} buổi học
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Link */}
                  <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <Link
                      href={`/subjects`}
                      className="text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] hover:underline flex items-center space-x-1"
                    >
                      <span>Xem chi tiết môn học</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

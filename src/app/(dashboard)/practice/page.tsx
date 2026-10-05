import React from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  PlaySquare,
  Gamepad2,
  Layers,
  AlertCircle,
  Award,
  Languages,
  BookOpen,
  Headphones,
  FileEdit,
  Mic,
  Clock,
  ArrowRight,
  CheckCircle2,
  Flame,
  Search,
  RotateCcw,
  Check,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PracticeQuickTimer } from "./practice-quick-timer";

export const metadata = {
  title: "Luyện tập (Practice Hub) • ChronoMind",
  description: "Trung tâm luyện tập duy nhất: Từ vựng Luyentu, Kỹ năng tiếng Anh, Ôn tập ngắt quãng và Mini-games",
};

export default async function PracticeHubPage() {
  const user = await getCurrentUser();

  let subjects: any[] = [];
  let vocabStats = {
    total: 0,
    mastered: 0,
    learning: 0,
    newWords: 0,
    reviewDue: 0,
  };
  let activeSubject: any = null;
  let totalPracticeSeconds = 0;

  if (user) {
    const now = new Date();

    const [dbSubjects, wordsProgress, practiceSessions] = await Promise.all([
      prisma.subject.findMany({
        where: { userId: user.id },
        orderBy: { priority: "desc" },
      }),
      prisma.userWordProgress.findMany({
        where: { userId: user.id },
        include: {
          word: {
            select: {
              id: true,
              subjectId: true,
            },
          },
        },
      }),
      prisma.studySession.findMany({
        where: {
          userId: user.id,
          source: { in: ["PRACTICE_VOCAB", "PIP_TIMER", "CALENDAR_CHECKBOX"] },
        },
        select: { actualDurationSeconds: true },
      }),
    ]);

    subjects = dbSubjects;
    activeSubject =
      dbSubjects.find((s) => s.code === "IELTS" || s.name.includes("IELTS")) ||
      dbSubjects[0] ||
      null;

    vocabStats.total = wordsProgress.length;
    for (const wp of wordsProgress) {
      if (wp.status === "MASTERED") vocabStats.mastered++;
      else if (wp.status === "LEARNING") vocabStats.learning++;
      else vocabStats.newWords++;

      if (
        (wp.nextReviewDate && wp.nextReviewDate <= now) ||
        (!wp.nextReviewDate && wp.status === "LEARNING")
      ) {
        vocabStats.reviewDue++;
      }
    }

    totalPracticeSeconds = practiceSessions.reduce(
      (sum, s) => sum + s.actualDurationSeconds,
      0
    );
  }

  const practiceHours = Math.round((totalPracticeSeconds / 3600) * 10) / 10;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dbe7dd] dark:border-[#263d2e] pb-6">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#2d6a4f] text-white rounded-2xl shadow-sm">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
              Trung Tâm Luyện Tập (Practice Hub)
            </h1>
            <p className="text-xs sm:text-sm text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
              Hệ thống học tập và luyện tập hợp nhất: Từ vựng, Kỹ năng, Ôn tập ngắt quãng & Ngân hàng lỗi sai
            </p>
          </div>
        </div>

        {activeSubject && (
          <div className="flex items-center gap-2.5">
            <PracticeQuickTimer subject={activeSubject} />
          </div>
        )}
      </div>

      {/* Vocabulary Progress Sync Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-6 sm:p-7 shadow-xl shadow-[#2d6a4f]/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Môn học liên kết: {activeSubject?.name || "IELTS Academic"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Tiến Độ Từ Vựng & Luyện Tập
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50 max-w-xl leading-relaxed">
              Dữ liệu luyện từ vựng được tự động đồng bộ thời gian thực với Môn học, Thống kê giờ học (StudyRecord) và Bảng điều khiển (Dashboard).
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-100 block">
                Tổng số từ
              </span>
              <span className="text-2xl font-black">{vocabStats.total}</span>
              <span className="text-[10px] text-emerald-200 block">từ vựng</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-100 block">
                Đã thuộc
              </span>
              <span className="text-2xl font-black text-emerald-300">
                {vocabStats.mastered}
              </span>
              <span className="text-[10px] text-emerald-200 block">
                {vocabStats.total > 0
                  ? Math.round((vocabStats.mastered / vocabStats.total) * 100)
                  : 0}
                %
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-100 block">
                Đang học
              </span>
              <span className="text-2xl font-black text-amber-300">
                {vocabStats.learning}
              </span>
              <span className="text-[10px] text-amber-200 block">từ vựng</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-100 block">
                Đến hạn ôn
              </span>
              <span className="text-2xl font-black text-rose-300">
                {vocabStats.reviewDue}
              </span>
              <span className="text-[10px] text-rose-200 block">cần ôn ngay</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: VOCABULARY ENGINE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2d6a4f]" />
            <h2 className="text-lg font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
              Từ Vựng (Vocabulary)
            </h2>
          </div>
          <Link
            href="/practice/vocabulary"
            className="text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] hover:underline flex items-center space-x-1"
          >
            <span>Mở Vocabulary Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Vocabulary Learning System */}
          <Link href="/practice/vocabulary" className="group">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-[#2d6a4f] hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Languages className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    Học từ vựng
                  </h3>
                </div>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Hệ thống học từ vựng học thuật cao cấp, lộ trình đa dạng và thư viện từ vựng phong phú.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
                <span>Truy cập</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* 2. Flashcards Learn */}
          <Link href="/practice/vocabulary" className="group">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-purple-400 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Thẻ Flashcards (Spaced Repetition)
                </h3>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Lật thẻ 2 mặt, phát âm IPA, ví dụ câu ngữ cảnh và đánh giá độ thuộc từ vựng.

                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>Học Flashcards ngay</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* 3. Spaced Repetition Review */}
          <Link href="/practice/vocabulary/review" className="group">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border border-amber-300 dark:border-amber-800 hover:shadow-md transition-all h-full flex flex-col justify-between relative ring-2 ring-amber-500/20">
              <div>
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    Ôn tập ngắt quãng
                  </h3>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {vocabStats.reviewDue} ĐẾN HẠN
                  </span>
                </div>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Ôn đúng thời điểm não bộ chuẩn bị quên để khắc sâu từ vào trí nhớ dài hạn.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                <span>Ôn tập ngay</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* 4. Vocabulary Test / Quiz */}
          <Link href="/practice/vocabulary/test" className="group">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-blue-400 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Kiểm tra từ vựng (Quiz)
                </h3>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Thử thách trắc nghiệm 4 đáp án, kiểm tra độ nhạy bén và ghi nhận điểm số.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>Làm bài kiểm tra</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 2: COMPREHENSIVE PRACTICE & REVIEW SUITE */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h2 className="text-lg font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
            Ôn Tập Chủ Động & Quản Lý Lỗi Sai
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/practice/review" className="group">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border border-emerald-300 ring-2 ring-emerald-500/20 dark:border-emerald-800 hover:shadow-md transition-all cursor-pointer flex items-start space-x-4 h-full relative">
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    Ôn tập tổng hợp hôm nay (Universal Review)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    KHUYÊN DÙNG
                  </span>
                </div>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Tổng hợp thông minh từ vựng đến hạn, flashcards môn học và các câu hỏi trong ngân hàng lỗi sai thành 1 phiên tập trung duy nhất.
                </p>
              </div>
            </div>
          </Link>

          <Link href="/practice/mistakes" className="group">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border border-rose-200 dark:border-rose-900/50 hover:shadow-md transition-all cursor-pointer flex items-start space-x-4 h-full relative">
              <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shrink-0 group-hover:scale-105 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    Ngân hàng lỗi sai (Mistake Bank)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    TRỌNG TÂM
                  </span>
                </div>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Tự động lưu trữ các câu làm sai từ bài tập, flashcard và bài kiểm tra để luyện tập lại cho tới khi hoàn toàn làm chủ.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 3: ENGLISH SKILLS SUITE */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <h2 className="text-lg font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
            Kỹ Năng Tiếng Anh (English Skills)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Reading */}
          <Link href="/practice/vocabulary" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-sky-400 transition-all h-full">
              <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Reading
              </h3>
              <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                Đọc hiểu học thuật IELTS kèm phân tích từ vựng ngữ cảnh.
              </p>
            </div>
          </Link>

          {/* Listening */}
          <Link href="/practice/vocabulary/index/4" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-indigo-400 transition-all h-full">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Listening
              </h3>
              <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                Luyện nghe chép chính tả và nhận diện từ vựng âm chuẩn.
              </p>
            </div>
          </Link>

          {/* Grammar */}
          <Link href="/practice/vocabulary/words" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-emerald-400 transition-all h-full">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Grammar
              </h3>
              <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                Collocations, cấu trúc từ loại và cách kết hợp câu tự nhiên.
              </p>
            </div>
          </Link>

          {/* Writing */}
          <Link href="/practice/vocabulary/index/5" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-amber-400 transition-all h-full">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <FileEdit className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Writing
              </h3>
              <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                Luyện đặt câu với từ vựng mới học và AI chữa bài trực tiếp.
              </p>
            </div>
          </Link>

          {/* Speaking */}
          <Link href="/practice/vocabulary/words" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-rose-400 transition-all h-full">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Speaking
              </h3>
              <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                Luyện phát âm chuẩn IPA từng từ và tăng cường phản xạ nói.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 4: MINI-GAMES & SPECIAL MODES */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Mini-games Luyện Tập Tương Tác
              </h3>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Vừa học vừa chơi, tăng tốc phản xạ nhớ từ và nhận xu thưởng
              </p>
            </div>
          </div>

          <Link
            href="/practice/vocabulary/index/5"
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
          >
            <span>Xem tất cả chế độ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/practice/vocabulary/games/com-tam"
            className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-100 dark:border-gray-800 transition-all flex items-center space-x-3 group"
          >
            <span className="text-2xl">🍱</span>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600">
                Quán Cơm Tấm
              </h4>
              <p className="text-[10px] text-gray-500">Phục vụ món ăn theo từ vựng</p>
            </div>
          </Link>

          <Link
            href="/practice/vocabulary/games/monkey-rescue"
            className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-100 dark:border-gray-800 transition-all flex items-center space-x-3 group"
          >
            <span className="text-2xl">🐒</span>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600">
                Giải Cứu Khỉ
              </h4>
              <p className="text-[10px] text-gray-500">Tìm chuối qua thử thách từ vựng</p>
            </div>
          </Link>

          <Link
            href="/practice/vocabulary/games/flappy-bird"
            className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-100 dark:border-gray-800 transition-all flex items-center space-x-3 group"
          >
            <span className="text-2xl">🐦</span>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600">
                Chim Chăm Chỉ
              </h4>
              <p className="text-[10px] text-gray-500">Bay qua chướng ngại vật</p>
            </div>
          </Link>

          <Link
            href="/practice/vocabulary/games/sentence-craft"
            className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-100 dark:border-gray-800 transition-all flex items-center space-x-3 group"
          >
            <span className="text-2xl">✍️</span>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600">
                Luyện Đặt Câu
              </h4>
              <p className="text-[10px] text-gray-500">AI chấm điểm câu tiếng Anh</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Plus, Zap, Award, Layers, ArrowRight } from "lucide-react";

interface PracticeQuickAccessProps {
  onOpenAddMistake: () => void;
}

export function PracticeQuickAccess({ onOpenAddMistake }: PracticeQuickAccessProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-subtle)]">
          Truy cập nhanh
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Thêm lỗi sai */}
        <button
          onClick={onOpenAddMistake}
          className="p-4 sm:p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between group text-left w-full active:scale-[0.99]"
        >
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold text-[var(--text-ink)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Thêm lỗi sai
              </h4>
              <p className="text-xs text-[var(--text-subtle)] truncate mt-0.5">
                Ghi nhận vào ngân hàng lỗi
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-sky-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>

        {/* 2. Ôn tập hôm nay */}
        <Link href="/practice/review" className="block group">
          <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between h-full active:scale-[0.99]">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-bold text-[var(--text-ink)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Luyện tập
                </h4>
                <p className="text-xs text-[var(--text-subtle)] truncate mt-0.5">
                  Flashcard & Lỗi sai đến hạn
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-purple-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </Link>

        {/* 3. Ngân hàng lỗi sai */}
        <Link href="/practice/mistakes" className="block group">
          <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all flex items-center justify-between h-full active:scale-[0.99]">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-bold text-[var(--text-ink)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Ngân hàng lỗi
                </h4>
                <p className="text-xs text-[var(--text-subtle)] truncate mt-0.5">
                  Xem & khắc phục lỗ hổng
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </Link>

        {/* 4. Flashcards Anki-style */}
        <Link href="/flashcards" className="block group">
          <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex items-center justify-between h-full active:scale-[0.99]">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Layers className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-bold text-[var(--text-ink)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Flashcards
                </h4>
                <p className="text-xs text-[var(--text-subtle)] truncate mt-0.5">
                  Hệ thống thẻ ghi nhớ Anki
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Pin, Award, Play, Sparkles, ArrowRight } from "lucide-react";

interface PracticePinnedCardProps {
  dueCount: number;
  totalReviewItems: number;
}

export function PracticePinnedCard({
  dueCount,
  totalReviewItems,
}: PracticePinnedCardProps) {
  const percent = totalReviewItems > 0 ? Math.min(100, Math.round(((totalReviewItems - dueCount) / totalReviewItems) * 100)) : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
        <Pin className="w-4 h-4 text-rose-500 fill-rose-500" />
        <span>Lộ trình & Chế độ đã ghim</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pinned Card with Amber border matching LuyenTu reference screenshot */}
        <Link href="/practice/review" className="block group">
          <div className="p-5 rounded-[26px] bg-white dark:bg-[#17261c] border-2 border-amber-400 hover:border-amber-500 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between h-full">
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  KHUYÊN DÙNG
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </div>

              <h3 className="text-base font-extrabold text-[#192e22] dark:text-[#f0f7f2] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                Ôn tập tổng hợp hôm nay
              </h3>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1 line-clamp-2">
                Tổng hợp flashcards, câu làm sai và khái niệm đến hạn trong 1 phiên tập trung.
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  📚 {dueCount > 0 ? `${dueCount} mục đến hạn` : "Đã hoàn thành"}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  ĐỘ KHÓ 1/5
                </span>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#526b5c] dark:text-[#a3bda9] mb-1.5">
                <span>Tiến độ ôn</span>
                <span>{percent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

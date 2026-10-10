"use client";

import React from "react";
import Link from "next/link";
import { Gamepad2, ArrowRight, Sparkles } from "lucide-react";

export function PracticeGamesGrid() {
  const games = [
    {
      id: "com-tam",
      title: "Quán Cơm Tấm",
      emoji: "🍱",
      desc: "Phục vụ món ăn theo phản xạ câu hỏi và ghi nhớ bài học",
      badge: "PHẢN XẠ",
      color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30",
    },
    {
      id: "monkey-rescue",
      title: "Giải Cứu Khỉ",
      emoji: "🐒",
      desc: "Vượt qua thử thách kiến thức để tìm chuối giải cứu khỉ con",
      badge: "VUI NHỘN",
      color: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30",
    },
    {
      id: "flappy-bird",
      title: "Chim Chăm Chỉ",
      emoji: "🐦",
      desc: "Bay qua các chướng ngại vật bằng cách trả lời đúng câu hỏi",
      badge: "TỐC ĐỘ",
      color: "bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/30",
    },
    {
      id: "sentence-craft",
      title: "Luyện Đặt Câu",
      emoji: "✍️",
      desc: "AI hỗ trợ kiểm tra ngữ pháp và chấm điểm đặt câu theo ngữ cảnh",
      badge: "AI CHẤM ĐIỂM",
      color: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/30",
    },
  ];

  return (
    <div className="p-6 sm:p-7 rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shadow-2xs">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-ink)]">
              Mini-games Luyện Tập Tương Tác
            </h3>
            <p className="text-xs text-[var(--text-subtle)]">
              Vừa học vừa chơi, tăng tốc phản xạ ghi nhớ và nhận xu thưởng
            </p>
          </div>
        </div>

        <Link
          href="/practice/games"
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
        >
          <span>Xem tất cả game</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/practice/games/${g.id}`}
            className="p-4 rounded-[22px] bg-gray-50/80 dark:bg-gray-800/40 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex items-start space-x-3.5 group shadow-2xs active:scale-95"
          >
            <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform">
              {g.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                  {g.title}
                </h4>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 shrink-0">
                  {g.badge}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-subtle)] line-clamp-2 leading-relaxed">
                {g.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

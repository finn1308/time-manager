"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  Coins,
  Crown,
  BookOpen,
} from "lucide-react";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  xp: number;
  coins: number;
  streakDays: number;
  isPro: boolean;
  wordsMastered: number;
  isCurrentUser: boolean;
}

export default function VocabLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vocab/leaderboard");
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#f59e0b] via-[#ea580c] to-[#c2410c] text-white p-6 sm:p-8 shadow-xl shadow-[#f59e0b]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-amber-100">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Bảng Vinh Danh • Top Learners</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bảng Xếp Hạng Luyện Từ
          </h1>
          <p className="text-xs sm:text-sm text-amber-50 leading-relaxed max-w-md">
            Vinh danh những người học chăm chỉ nhất theo điểm kinh nghiệm (XP) và số từ vựng đã ghi nhớ.
          </p>
        </div>

        <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-3xl shrink-0">
          🏆
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-gray-400">Đang tổng hợp xếp hạng...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-2.5">
            {leaderboard.map((user) => {
              const isTop1 = user.rank === 1;
              const isTop2 = user.rank === 2;
              const isTop3 = user.rank === 3;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    user.isCurrentUser
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs"
                      : isTop1
                      ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#132217]"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {isTop1 ? (
                        <span className="text-2xl">🥇</span>
                      ) : isTop2 ? (
                        <span className="text-2xl">🥈</span>
                      ) : isTop3 ? (
                        <span className="text-2xl">🥉</span>
                      ) : (
                        <span className="text-sm font-black text-gray-400">
                          #{user.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar / Name */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                          {user.name}
                        </span>
                        {user.isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-white">
                            Bạn
                          </span>
                        )}
                        {user.isPro && (
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3 text-emerald-500" />
                          <span>{user.wordsMastered} từ thuộc</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-orange-500 font-semibold">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          <span>{user.streakDays} ngày streak</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-[#10b981]">
                      {user.xp} XP
                    </span>
                    <span className="text-[10px] text-amber-500 font-bold block">
                      {user.coins} 🟡
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <Trophy className="w-10 h-10 text-amber-500 mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Chưa có dữ liệu xếp hạng
            </h4>
            <p className="text-xs text-gray-400">
              Hãy là người đầu tiên hoàn thành phiên học từ vựng để đứng đầu bảng vinh danh!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

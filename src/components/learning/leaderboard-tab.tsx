"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Award, Flame, Zap, ShieldCheck, CheckCircle2, User } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
  quizzesCompleted: number;
  accuracy: number;
  streakDays: number;
  isCurrentUser: boolean;
}

export function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<string>("");

  useEffect(() => {
    fetch("/api/learning/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.rankingRules) setRules(data.rankingRules);
      })
      .catch((err) => console.error("Leaderboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 space-y-2 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[var(--mint-bg)] dark:bg-[#1e3b28] flex items-center justify-center text-[var(--mint-dark)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[var(--text-ink)]">
              Bảng Xếp Hạng Học Tập (Study Quest Leaderboard)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Vinh danh những người học chăm chỉ và bền bỉ nhất hệ thống.
            </p>
          </div>
        </div>

        {rules && (
          <div className="p-3.5 rounded-2xl bg-[var(--mint-bg)] dark:bg-[#15291b] border border-[var(--border)] text-[11px] text-[#2d4734] dark:text-[#a0c7aa] flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-[var(--mint-dark)] shrink-0 mt-0.5" />
            <p className="leading-relaxed">{rules}</p>
          </div>
        )}
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-4 sm:p-6 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Đang tải dữ liệu bảng xếp hạng...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Chưa có người học nào trong bảng xếp hạng. Hãy hoàn thành bài Quiz đầu tiên để dẫn đầu!
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((item) => {
              const isTop3 = item.rank <= 3;
              const medalEmoji =
                item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : null;

              return (
                <div
                  key={item.userId}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                    item.isCurrentUser
                      ? "bg-[#eef8f2] dark:bg-[#1a3825] border-[#52b788] font-bold shadow-2xs"
                      : "bg-[var(--bg-muted)] border-[var(--border)]"
                  }`}
                >
                  {/* Left: Rank & User */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isTop3
                          ? "bg-[var(--mint-bg)] text-[var(--mint-dark)]"
                          : "bg-[#e5ede7] dark:bg-[#203627] text-[var(--text-muted)]"
                      }`}
                    >
                      {medalEmoji || item.rank}
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[var(--text-ink)]">
                          {item.displayName}
                        </span>
                        {item.isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[var(--mint)] text-white">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                        <span>{item.quizzesCompleted} quiz</span>
                        <span>•</span>
                        <span>{item.accuracy}% chính xác</span>
                        <span>•</span>
                        <span className="flex items-center text-[#d9483b]">
                          <Flame className="w-2.5 h-2.5 mr-0.5" />
                          {item.streakDays} ngày
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: XP Score */}
                  <div className="flex items-center space-x-1 font-mono font-bold text-sm text-[var(--mint-dark)] dark:text-[#7fc498]">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{item.xp} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

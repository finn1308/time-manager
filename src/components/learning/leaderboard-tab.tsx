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
      <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 space-y-2 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#d8ebe0] dark:bg-[#1e3b28] flex items-center justify-center text-[#2d6a4f] dark:text-[#52b788]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
              Bảng Xếp Hạng Học Tập (Study Quest Leaderboard)
            </h2>
            <p className="text-xs text-[#73927d]">
              Vinh danh những người học chăm chỉ và bền bỉ nhất hệ thống.
            </p>
          </div>
        </div>

        {rules && (
          <div className="p-3.5 rounded-2xl bg-[#eef5f0] dark:bg-[#15291b] border border-[#dbe7dd] dark:border-[#263d2e] text-[11px] text-[#2d4734] dark:text-[#a0c7aa] flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#2d6a4f] shrink-0 mt-0.5" />
            <p className="leading-relaxed">{rules}</p>
          </div>
        )}
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-4 sm:p-6 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#73927d]">
            Đang tải dữ liệu bảng xếp hạng...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#73927d]">
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
                      : "bg-[#f8fbf8] dark:bg-[#142318] border-[#dbe7dd] dark:border-[#263d2e]"
                  }`}
                >
                  {/* Left: Rank & User */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isTop3
                          ? "bg-[#d8ebe0] text-[#1b4332]"
                          : "bg-[#e5ede7] dark:bg-[#203627] text-[#73927d]"
                      }`}
                    >
                      {medalEmoji || item.rank}
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
                          {item.displayName}
                        </span>
                        {item.isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#2d6a4f] text-white">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-[#73927d] mt-0.5">
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
                  <div className="flex items-center space-x-1 font-mono font-bold text-sm text-[#2d6a4f] dark:text-[#7fc498]">
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

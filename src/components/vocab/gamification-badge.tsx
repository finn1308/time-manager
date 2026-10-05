"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Coins, Sparkles } from "lucide-react";

export function GamificationBadge() {
  const [coins, setCoins] = useState<number>(100);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const fetchGamification = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vocab/shop");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.userCoins === "number") {
          setCoins(data.userCoins);
        }
      }
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamification();

    // Listen to local reward events
    const handleCoinsUpdated = (event: CustomEvent) => {
      if (typeof event.detail?.coins === "number") {
        setCoins(event.detail.coins);
      } else if (typeof event.detail?.earnedCoins === "number") {
        setCoins((prev) => prev + event.detail.earnedCoins);
      }
    };

    window.addEventListener("coinsUpdated" as any, handleCoinsUpdated);
    return () => {
      window.removeEventListener("coinsUpdated" as any, handleCoinsUpdated);
    };
  }, []);

  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2">
      {/* Streak Badge */}
      <div
        className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/50 text-[11px] font-extrabold shadow-2xs cursor-default"
        title={`Chuỗi học tập liên tiếp: ${streakDays} ngày`}
      >
        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
        <span>{streakDays} ngày</span>
      </div>

      {/* Coins Badge */}
      <Link
        href="/vocab/shop"
        className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50 text-[11px] font-extrabold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Bấm để mở Cửa hàng đổi Xu quà tặng"
      >
        <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
        <span>{coins} Xu</span>
      </Link>
    </div>
  );
}

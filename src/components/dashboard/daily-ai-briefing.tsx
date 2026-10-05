"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Award,
  AlertCircle,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DailyAiBriefing() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    dueReviewsCount: number;
    upcomingDeadlinesCount: number;
    prioritySubject: string;
    weakTopic: string;
    recommendedMinutes: number;
  }>({
    dueReviewsCount: 0,
    upcomingDeadlinesCount: 0,
    prioritySubject: "Toán học / Chuyên ngành",
    weakTopic: "Kiến thức trọng tâm",
    recommendedMinutes: 90,
  });

  useEffect(() => {
    async function loadBriefing() {
      try {
        const [resReview, resAssign, resProfile] = await Promise.all([
          fetch("/api/review/today").then((r) => r.json()).catch(() => ({})),
          fetch("/api/assignments").then((r) => r.json()).catch(() => ({})),
          fetch("/api/ai/memory").then((r) => r.json()).catch(() => ({})),
        ]);

        const dueCount = resReview?.summary?.totalItems || 0;
        const assignCount =
          resAssign?.assignments?.filter((a: any) => a.status !== "SUBMITTED" && a.status !== "COMPLETED").length || 0;
        const weakList = resProfile?.profile?.weaknesses || [];
        const preferredMins = resProfile?.profile?.preferredDurationMins || 60;

        setData({
          dueReviewsCount: dueCount,
          upcomingDeadlinesCount: assignCount,
          prioritySubject: weakList[0] || "Môn học trọng tâm",
          weakTopic: resProfile?.profile?.frequentMistakeTypes?.[0]?.label || "Lỗ hổng kiến thức",
          recommendedMinutes: Math.max(45, preferredMins * 2),
        });
      } catch (err) {
        console.error("Error loading daily briefing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBriefing();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng!";
    if (hour < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  };

  return (
    <Card className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/60 dark:border-[#263d2e] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white text-[10px] py-0.5 px-2">
              <Sparkles className="w-3 h-3 mr-1 inline" />
              DAILY AI BRIEFING
            </Badge>
            <span className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
            {getGreeting()} Kế hoạch học tập tối ưu hôm nay
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#526b5c] dark:text-[#a3bda9]">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              {data.dueReviewsCount} mục cần ôn tập
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {data.upcomingDeadlinesCount} bài tập cần xử lý
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Khuyến nghị: {data.recommendedMinutes} phút
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/practice/review">
            <Button size="sm" className="bg-[#408257] hover:bg-[#346a47] text-white rounded-xl text-xs font-semibold shadow-sm">
              <Award className="w-3.5 h-3.5 mr-1.5" />
              Ôn tập ngay ({data.dueReviewsCount})
            </Button>
          </Link>
          <Link href="/calendar">
            <Button size="sm" variant="outline" className="rounded-xl border-emerald-200 text-xs">
              Xem Lịch học
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

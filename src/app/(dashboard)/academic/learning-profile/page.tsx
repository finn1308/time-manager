"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Clock,
  Sun,
  Moon,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LearningProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recalculating, setRecalculating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/memory");
      const json = await res.json();
      if (json.success) {
        setProfile(json.profile);
      }
    } catch (err) {
      console.error("Error loading learning profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await fetch("/api/ai/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECALCULATE" }),
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.profile);
      }
    } catch (err) {
      console.error("Error recalculating profile:", err);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/academic">
            <Button variant="ghost" size="icon" className="rounded-xl text-[#526b5c]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 bg-teal-100 dark:bg-teal-950/40 rounded-2xl text-teal-600 dark:text-teal-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Hồ sơ Trí tuệ Học tập AI (Personal Learning Memory)
            </h1>
            <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
              Mô hình hóa trí nhớ, phản xạ học tập và các dạng sai sót lặp lại của sinh viên
            </p>
          </div>
        </div>

        <Button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="bg-[#408257] hover:bg-[#346a47] text-white rounded-2xl shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className={`w-4 h-4 mr-1.5 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Đang tính toán..." : "Tổng hợp lại dữ liệu"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !profile ? (
        <Card className="p-8 text-center rounded-3xl">
          <p className="text-sm text-[#526b5c]">Chưa có dữ liệu hồ sơ nhận thức.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Cognitive Summary Banner */}
          <Card className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-200 dark:border-teal-900/40 space-y-3">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Tổng kết nhận thức AI (Cognitive Insights)
            </div>
            <p className="text-sm text-[#192e22] dark:text-[#f0f7f2] leading-relaxed">
              {profile.cognitiveSummary}
            </p>
            <span className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] block pt-1">
              Cập nhật lần cuối: {new Date(profile.lastUpdated).toLocaleString("vi-VN")}
            </span>
          </Card>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e]">
              <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Trình độ nhận thức</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                {profile.overallLevel}
              </span>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e]">
              <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Tỷ lệ duy trì trí nhớ</span>
              <span className="text-xl font-bold text-teal-600 dark:text-teal-400 block mt-1">
                {Math.round(profile.retentionRate * 100)}%
              </span>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e]">
              <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Thời lượng phiên tối ưu</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400 block mt-1">
                {profile.preferredDurationMins} phút
              </span>
            </Card>

            <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e]">
              <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Khung giờ tập trung đỉnh</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 block mt-1">
                {profile.preferredTimeOfDay === "MORNING"
                  ? "Buổi sáng"
                  : profile.preferredTimeOfDay === "AFTERNOON"
                  ? "Buổi chiều"
                  : "Buổi tối"}
              </span>
            </Card>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Môn học & Kỹ năng thế mạnh
              </div>
              {profile.strengths?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.strengths.map((s: string, i: number) => (
                    <Badge key={i} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 text-xs py-1">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#526b5c]">Đang tiếp tục phân tích sau các phiên học tiếp theo.</p>
              )}
            </Card>

            <Card className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border-rose-100 dark:border-rose-950/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Môn học & Kỹ năng cần củng cố
              </div>
              {profile.weaknesses?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.weaknesses.map((w: string, i: number) => (
                    <Badge key={i} className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 text-xs py-1">
                      {w}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#526b5c]">Không phát hiện môn học nào dưới ngưỡng an toàn.</p>
              )}
            </Card>
          </div>

          {/* Frequent Mistake Types */}
          <Card className="p-5 rounded-3xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] space-y-3">
            <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Hành vi & Dạng lỗi sai thường gặp (Error Patterns)
            </h3>
            {profile.frequentMistakeTypes?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {profile.frequentMistakeTypes.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-[#1a2f22] rounded-2xl border border-gray-100 dark:border-[#263d2e]">
                    <span className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] block">
                      {m.label}
                    </span>
                    <span className="text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                      Số lần lặp lại: {m.count} lần
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#526b5c]">Chưa ghi nhận đủ số lượng mẫu lỗi sai.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

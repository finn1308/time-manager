"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dna, Sparkles, Clock, Sun, Moon, Sunrise, AlertCircle } from "lucide-react";

interface SchedulingDnaProps {
  totalSessionsCount: number;
  averageSessionMinutes: number;
  bestFocusTimeSlot: string; // e.g. "Buổi tối (19:00 - 22:00)"
  estimationVariancePercent: number; // e.g. +12% or -5%
  topSubjectName: string | null;
}

export function SchedulingDna({
  totalSessionsCount,
  averageSessionMinutes,
  bestFocusTimeSlot,
  estimationVariancePercent,
  topSubjectName,
}: SchedulingDnaProps) {
  const hasEnoughData = totalSessionsCount >= 3;

  return (
    <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] soft-card-shadow">
      <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[var(--mint-bg)] text-[var(--mint-dark)] dark:text-[#74c69d] flex items-center justify-center shadow-2xs">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-[var(--text-ink)] flex items-center space-x-2">
              <span>Personal Scheduling DNA</span>
              <Sparkles className="w-4 h-4 text-[#52b788]" />
            </CardTitle>
            <p className="text-xs text-[var(--text-subtle)]">
              {hasEnoughData
                ? `Được phân tích từ ${totalSessionsCount} buổi học thực tế của bạn`
                : "Phân tích đặc tính học tập cá nhân dựa trên dữ liệu thật"}
            </p>
          </div>
        </div>

        {hasEnoughData ? (
          <Badge variant="green" className="text-xs font-semibold">
            Đã kích hoạt
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Chờ thêm dữ liệu ({totalSessionsCount}/3 buổi)
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-6 pt-2">
        {hasEnoughData ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Best Focus Slot */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-subtle)] uppercase">
                <Sun className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
                <span>Khung giờ tập trung nhất</span>
              </div>
              <div className="text-sm font-bold text-[var(--text-ink)] mt-1.5">
                {bestFocusTimeSlot}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                AI sẽ ưu tiên xếp các môn quan trọng vào thời gian này.
              </p>
            </div>

            {/* Average Duration */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-subtle)] uppercase">
                <Clock className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
                <span>Thời lượng trung bình</span>
              </div>
              <div className="text-sm font-bold text-[var(--text-ink)] mt-1.5">
                {averageSessionMinutes} phút / buổi
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Thời gian lý tưởng để bạn duy trì sự tập trung cao độ.
              </p>
            </div>

            {/* Estimation Error Variance */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)]">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-subtle)] uppercase">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
                <span>Độ lệch Planned vs Actual</span>
              </div>
              <div className="text-sm font-bold text-[var(--text-ink)] mt-1.5">
                {estimationVariancePercent > 0
                  ? `+${estimationVariancePercent}% so với dự kiến`
                  : `${estimationVariancePercent}% so với dự kiến`}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {topSubjectName ? `Môn học tập nhiều nhất: ${topSubjectName}` : "Đang đồng bộ..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 rounded-2xl bg-[var(--bg-muted)] border border-dashed border-[var(--border)] text-center space-y-1.5">
            <p className="text-xs font-semibold text-[var(--text-ink)]">
              Chưa đủ dữ liệu để giải mã Personal Scheduling DNA
            </p>
            <p className="text-[11px] text-[var(--text-subtle)] max-w-md mx-auto">
              Hệ thống cần tối thiểu 3 phiên học thực tế để tự động nhận diện khung giờ tập trung, độ lệch thời gian và thói quen học tập của bạn.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

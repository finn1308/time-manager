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
    <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow">
      <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#74c69d] flex items-center justify-center shadow-2xs">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
              <span>Personal Scheduling DNA</span>
              <Sparkles className="w-4 h-4 text-[#52b788]" />
            </CardTitle>
            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
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
            <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e]">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-[#526b5c] dark:text-[#a3bda9] uppercase">
                <Sun className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>Khung giờ tập trung nhất</span>
              </div>
              <div className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mt-1.5">
                {bestFocusTimeSlot}
              </div>
              <p className="text-[11px] text-[#73927d] dark:text-[#8ba393] mt-1">
                AI sẽ ưu tiên xếp các môn quan trọng vào thời gian này.
              </p>
            </div>

            {/* Average Duration */}
            <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e]">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-[#526b5c] dark:text-[#a3bda9] uppercase">
                <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>Thời lượng trung bình</span>
              </div>
              <div className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mt-1.5">
                {averageSessionMinutes} phút / buổi
              </div>
              <p className="text-[11px] text-[#73927d] dark:text-[#8ba393] mt-1">
                Thời gian lý tưởng để bạn duy trì sự tập trung cao độ.
              </p>
            </div>

            {/* Estimation Error Variance */}
            <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd]/80 dark:border-[#263d2e]">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-[#526b5c] dark:text-[#a3bda9] uppercase">
                <AlertCircle className="w-3.5 h-3.5 text-[#2d6a4f]" />
                <span>Độ lệch Planned vs Actual</span>
              </div>
              <div className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] mt-1.5">
                {estimationVariancePercent > 0
                  ? `+${estimationVariancePercent}% so với dự kiến`
                  : `${estimationVariancePercent}% so với dự kiến`}
              </div>
              <p className="text-[11px] text-[#73927d] dark:text-[#8ba393] mt-1">
                {topSubjectName ? `Môn học tập nhiều nhất: ${topSubjectName}` : "Đang đồng bộ..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-dashed border-[#dbe7dd] dark:border-[#263d2e] text-center space-y-1.5">
            <p className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2]">
              Chưa đủ dữ liệu để giải mã Personal Scheduling DNA
            </p>
            <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto">
              Hệ thống cần tối thiểu 3 phiên học thực tế để tự động nhận diện khung giờ tập trung, độ lệch thời gian và thói quen học tập của bạn.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Wallet, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubjectBudgetBreakdown {
  id: string;
  name: string;
  color: string;
  actualHours: number;
}

interface StudyBudgetCardProps {
  weeklyBudgetHours: number;
  weeklyActualHours: number;
  subjectsBreakdown: SubjectBudgetBreakdown[];
}

export function StudyBudgetCard({
  weeklyBudgetHours,
  weeklyActualHours,
  subjectsBreakdown,
}: StudyBudgetCardProps) {
  const percent =
    weeklyBudgetHours > 0
      ? Math.min(100, Math.round((weeklyActualHours / weeklyBudgetHours) * 100))
      : 0;

  const studyDebt = Math.max(0, Math.round((weeklyBudgetHours - weeklyActualHours) * 10) / 10);

  return (
    <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] soft-card-shadow">
      <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[var(--mint-bg)] text-[var(--mint-dark)] dark:text-[#9cd1b1] flex items-center justify-center shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-[var(--text-ink)]">
              Ngân sách học tập tuần (Study Budget)
            </CardTitle>
            <p className="text-xs text-[var(--text-subtle)]">
              Quản lý hạn mức thời gian và kiểm soát nợ thời gian học (Study Debt)
            </p>
          </div>
        </div>

        <Badge variant={studyDebt === 0 ? "green" : "yellow"} className="text-xs font-mono font-bold">
          {studyDebt === 0 ? "Đạt ngân sách" : `Nợ: ${studyDebt}h`}
        </Badge>
      </CardHeader>

      <CardContent className="p-6 pt-2 space-y-4">
        {/* Progress Bar & Numbers */}
        <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-ink)]">
              Tiến độ tuần:{" "}
              <strong className="text-[var(--mint-dark)]">
                {weeklyActualHours.toFixed(1)}h / {weeklyBudgetHours.toFixed(1)}h
              </strong>
            </span>
            <span className="text-[var(--text-subtle)]">{percent}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#dbe7dd] dark:bg-[#263d2e] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[var(--mint)]"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)] pt-1">
            <span>
              {studyDebt > 0 ? (
                <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  Study Debt: Cần bù {studyDebt}h trong các ngày còn lại của tuần
                </span>
              ) : (
                <span className="text-[var(--mint-dark)] font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  Xuất sắc! Bạn đã hoàn thành 100% chỉ tiêu ngân sách tuần này.
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Subject Breakdown (Section 30) */}
        {subjectsBreakdown.length > 0 && (
          <div>
            <div className="text-xs font-bold text-[var(--text-ink)] mb-2 flex items-center justify-between">
              <span>Phân bổ thời gian thực tế tuần này (Breakdown)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {subjectsBreakdown.map((sub) => (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-[#122015] text-xs flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#2d6a4f" }}
                    />
                    <span className="font-semibold text-[var(--text-ink)] truncate">
                      {sub.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[var(--mint-dark)] shrink-0 ml-1">
                    {sub.actualHours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

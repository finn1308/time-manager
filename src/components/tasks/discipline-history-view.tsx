"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Filter,
  AlertTriangle,
  Award,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateDisplay } from "@/lib/tasks/smart-todo";
import { toast } from "sonner";

interface DisciplineHistoryViewProps {
  onTriggerClosureModal?: (dateKey: string) => void;
}

export function DisciplineHistoryView({ onTriggerClosureModal }: DisciplineHistoryViewProps) {
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<{
    summaries: any[];
    metrics: any;
    todayKey: string;
  } | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/history?range=${range}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải lịch sử");
      setHistoryData(data);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải thống kê kỷ luật");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-ink)] flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[var(--mint-dark)]" />
            <span>Thống kê kỷ luật theo ngày</span>
          </h2>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">
            Bảo toàn trung thực lịch sử hoàn thành từng ngày, theo dõi tỷ lệ kỷ luật và các nhiệm vụ chuyển tiếp.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center space-x-1 p-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setRange("week")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              range === "week"
                ? "bg-[var(--mint)] text-white shadow-2xs"
                : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setRange("month")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              range === "month"
                ? "bg-[var(--mint)] text-white shadow-2xs"
                : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
            }`}
          >
            30 ngày qua
          </button>
          <button
            onClick={() => setRange("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              range === "all"
                ? "bg-[var(--mint)] text-white shadow-2xs"
                : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
            }`}
          >
            Toàn bộ
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      {historyData?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-subtle)] mb-1">
              <Award className="w-4 h-4 text-[var(--mint-dark)]" />
              <span>Tỷ lệ hoàn thành TB</span>
            </div>
            <div className="text-2xl font-bold text-[var(--mint-dark)]">
              {historyData.metrics.averageCompletionRate}%
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Đo lường trung thực theo ngày giao</p>
          </Card>

          <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-subtle)] mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hoàn thành / Đã giao</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-ink)]">
              {historyData.metrics.totalTasksCompleted}/{historyData.metrics.totalTasksRecorded}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Nhiệm vụ trong kỳ thống kê</p>
          </Card>

          <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-subtle)] mb-1">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>Chuyển tiếp (Rollover)</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {historyData.metrics.totalRollovers}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Nhiệm vụ dời sang ngày tiếp</p>
          </Card>

          <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-subtle)] mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Số ngày đã chốt sổ</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-ink)]">
              {historyData.metrics.daysClosedCount} / {historyData.metrics.daysRecordedCount}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Lưu trữ snapshot đóng băng</p>
          </Card>
        </div>
      )}

      {/* Daily Timeline List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#e8f0eb] dark:bg-[#203326] animate-pulse" />
            ))}
          </div>
        ) : !historyData?.summaries || historyData.summaries.length === 0 ? (
          <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
            <Calendar className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-[var(--text-ink)]">
              Chưa có dữ liệu lịch sử trong khoảng thời gian này
            </h3>
            <p className="text-xs text-[var(--text-subtle)] mt-1">
              Tạo và thực hiện các nhiệm vụ hàng ngày để xây dựng chuỗi kỷ luật cá nhân!
            </p>
          </Card>
        ) : (
          historyData.summaries.map((daySummary: any) => {
            const isExpanded = expandedDate === daySummary.dateKey;
            const isToday = daySummary.dateKey === historyData.todayKey;
            const hasTasks = daySummary.totalTasks > 0;

            return (
              <Card
                key={daySummary.dateKey}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all"
              >
                {/* Header Row: Date & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setExpandedDate(isExpanded ? null : daySummary.dateKey)}
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--mint-soft)] cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[var(--text-ink)]">
                          {formatDateDisplay(daySummary.dateKey, historyData.todayKey)}
                        </span>
                        {isToday && (
                          <Badge className="rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] text-[10px] font-bold">
                            Hôm nay
                          </Badge>
                        )}
                        {daySummary.isClosed ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            <span>ĐÃ CHỐT SỔ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>ĐANG MỞ</span>
                          </span>
                        )}
                      </div>

                      {daySummary.closedAt && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Đóng sổ: {new Date(daySummary.closedAt).toLocaleTimeString("vi-VN")}{" "}
                          {new Date(daySummary.closedAt).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right metrics */}
                  <div className="flex items-center space-x-3 sm:space-x-5 pl-7 sm:pl-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[var(--text-ink)]">
                        {hasTasks ? `${daySummary.completedTasks}/${daySummary.totalTasks} nhiệm vụ` : "Không có nhiệm vụ"}
                      </div>
                      {hasTasks ? (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {daySummary.uncompletedTasks} chưa xong
                          {daySummary.rolledOverTasks > 0 ? ` • ${daySummary.rolledOverTasks} chuyển tiếp` : ""}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[var(--text-muted)]">Ngày nghỉ ngơi</div>
                      )}
                    </div>

                    {/* Completion Rate Pill */}
                    <div
                      className={`px-3 py-1.5 rounded-2xl font-bold text-xs shrink-0 ${
                        !hasTasks
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          : daySummary.completionRate >= 80
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : daySummary.completionRate >= 50
                          ? "bg-[var(--mint-bg)] text-[var(--mint-dark)]"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {hasTasks ? `${daySummary.completionRate}%` : "—"}
                    </div>

                    {/* Manual closure button if not closed */}
                    {!daySummary.isClosed && onTriggerClosureModal && (
                      <Button
                        size="sm"
                        onClick={() => onTriggerClosureModal(daySummary.dateKey)}
                        className="rounded-xl bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-[10px] font-bold h-7 px-2.5 cursor-pointer"
                      >
                        Chốt ngày
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {hasTasks && (
                  <div className="mt-3 w-full bg-[#dbe7dd]/60 dark:bg-[#263d2e] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#2d6a4f] to-[#52b788] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, daySummary.completionRate))}%` }}
                    />
                  </div>
                )}

                {/* Expanded Tasks Snapshot Details */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)]/60 dark:border-[#263d2e] space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {daySummary.isClosed ? "Snapshot nhiệm vụ tại thời điểm đóng sổ:" : "Danh sách nhiệm vụ thực tế của ngày:"}
                    </div>

                    {!daySummary.tasks || daySummary.tasks.length === 0 ? (
                      <div className="text-xs text-[var(--text-muted)] italic py-2">Không có nhiệm vụ nào được ghi nhận.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {daySummary.tasks.map((task: any) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                              task.isCompleted
                                ? "bg-[var(--bg-muted)]/40 border-[var(--border)]/60 dark:border-[#263d2e]/60"
                                : "bg-[var(--bg-surface)] border-amber-200/60 dark:border-amber-900/40"
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  task.isCompleted ? "bg-emerald-600" : "bg-amber-500"
                                }`}
                              />
                              <span
                                className={`truncate font-medium ${
                                  task.isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text-ink)]"
                                }`}
                              >
                                {task.title}
                              </span>

                              {task.isRollover && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 font-semibold">
                                  Chuyển tiếp ({task.rolloverCount || 1})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {task.subject && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: task.subject.color || task.subjectColor || "#2d6a4f" }}
                                >
                                  {task.subject.name || task.subjectName}
                                </span>
                              )}

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  task.isCompleted
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                }`}
                              >
                                {task.isCompleted ? "Hoàn thành" : "Chưa làm"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

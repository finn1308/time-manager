"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Flame,
  ArrowRight,
  CalendarDays,
  Check,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCount: 0, urgentCount: 0, unscheduledCount: 0 });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "URGENT" | "UPCOMING" | "FUTURE" | "UNSCHEDULED">("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("3");
  const [priority, setPriority] = useState("HIGH");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Distribute Modal
  const [distributeModalOpen, setDistributeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [bufferDays, setBufferDays] = useState<number>(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [distributionResult, setDistributionResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resDeadlines, resSubs] = await Promise.all([
        fetch("/api/deadlines").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resDeadlines.deadlines) {
        setDeadlines(resDeadlines.deadlines);
        setStats(resDeadlines.stats || { totalCount: 0, urgentCount: 0, unscheduledCount: 0 });
      }
      if (resSubs.subjects) {
        setSubjects(resSubs.subjects);
      }
    } catch (err) {
      console.error("Error loading deadlines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          deadline: deadlineDate,
          subjectId: subjectId || null,
          estimatedMinutes: Math.round(parseFloat(estimatedHours || "1") * 60),
          priority,
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        setTitle("");
        setSubjectId("");
        setDeadlineDate("");
        setEstimatedHours("3");
        setDescription("");
        setCreateModalOpen(false);
        showToast("Đã tạo deadline / bài tập mới thành công!");
        loadData();
      }
    } catch (err) {
      console.error("Failed to create deadline:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDistribute = async (item: any) => {
    setSelectedItem(item);
    setDistributionResult(null);
    setDistributeModalOpen(true);
    setPreviewLoading(true);

    try {
      const res = await fetch("/api/deadlines/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          deadlineDate: item.deadline,
          estimatedMinutes: item.estimatedMinutes,
          subjectId: item.subject?.id || null,
          taskId: item.sourceType === "TASK" ? item.id : null,
          goalId: item.sourceType === "GOAL" ? item.id : null,
          sessionDurationMins: sessionDuration,
          bufferDays: bufferDays,
          commit: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDistributionResult(data);
      }
    } catch (err) {
      console.error("Error previewing distribution:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRefreshPreview = async () => {
    if (!selectedItem) return;
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/deadlines/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedItem.title,
          deadlineDate: selectedItem.deadline,
          estimatedMinutes: selectedItem.estimatedMinutes,
          subjectId: selectedItem.subject?.id || null,
          taskId: selectedItem.sourceType === "TASK" ? selectedItem.id : null,
          goalId: selectedItem.sourceType === "GOAL" ? selectedItem.id : null,
          sessionDurationMins: sessionDuration,
          bufferDays: bufferDays,
          commit: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDistributionResult(data);
      }
    } catch (err) {
      console.error("Error refreshing preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommitDistribution = async () => {
    if (!selectedItem) return;
    setCommitting(true);
    try {
      const res = await fetch("/api/deadlines/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedItem.title,
          deadlineDate: selectedItem.deadline,
          estimatedMinutes: selectedItem.estimatedMinutes,
          subjectId: selectedItem.subject?.id || null,
          taskId: selectedItem.sourceType === "TASK" ? selectedItem.id : null,
          goalId: selectedItem.sourceType === "GOAL" ? selectedItem.id : null,
          sessionDurationMins: sessionDuration,
          bufferDays: bufferDays,
          commit: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDistributeModalOpen(false);
        showToast(data.message || "Đã đưa các phiên học vào Lịch thành công!");
        loadData();
      }
    } catch (err) {
      console.error("Error committing distribution:", err);
    } finally {
      setCommitting(false);
    }
  };

  const filteredDeadlines = deadlines.filter((d) => {
    if (activeTab === "URGENT") return d.urgency.status === "URGENT" || d.urgency.status === "OVERDUE";
    if (activeTab === "UPCOMING") return d.urgency.status === "UPCOMING";
    if (activeTab === "FUTURE") return d.urgency.status === "FUTURE";
    if (activeTab === "UNSCHEDULED") return !d.hasScheduledPlan;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[var(--mint)] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#a3bda9]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-ink)] flex items-center space-x-2.5">
            <Flame className="w-6 h-6 text-[#d97706] dark:text-[#f59e0b]" />
            <span>Deadline & Assignment Engine</span>
          </h1>
          <p className="text-xs text-[var(--text-subtle)] mt-1">
            Chống dồn lịch học trước giờ G: Tự động chia nhỏ khối lượng bài tập thành các phiên học cách đều, có ngày đệm an toàn.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl flex items-center space-x-2 shadow-2xs text-xs font-semibold h-10 px-4 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Deadline / Bài tập</span>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--mint-bg)] text-[var(--mint-dark)] flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-subtle)] font-medium">Tổng hạn chót</div>
            <div className="text-xl font-bold text-[var(--text-ink)]">{stats.totalCount}</div>
          </div>
        </Card>

        <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] dark:bg-[#382b14] text-[#d97706] flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#d97706] font-medium">Khẩn cấp (&le; 2 ngày)</div>
            <div className="text-xl font-bold text-[var(--text-ink)]">{stats.urgentCount}</div>
          </div>
        </Card>

        <Card className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] dark:bg-[#351a1a] text-[#ef4444] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#ef4444] font-medium">Chưa xếp lịch học</div>
            <div className="text-xl font-bold text-[var(--text-ink)]">{stats.unscheduledCount}</div>
          </div>
        </Card>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-[var(--mint)] text-white shadow-2xs"
              : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
          }`}
        >
          Tất cả ({deadlines.length})
        </button>
        <button
          onClick={() => setActiveTab("URGENT")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "URGENT"
              ? "bg-[#d97706] text-white shadow-2xs"
              : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
          }`}
        >
          🚨 Khẩn cấp (&le; 2 ngày)
        </button>
        <button
          onClick={() => setActiveTab("UPCOMING")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "UPCOMING"
              ? "bg-[var(--mint)] text-white shadow-2xs"
              : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
          }`}
        >
          ⚠️ Sắp tới (3 - 7 ngày)
        </button>
        <button
          onClick={() => setActiveTab("FUTURE")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "FUTURE"
              ? "bg-[var(--mint)] text-white shadow-2xs"
              : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
          }`}
        >
          📅 Kế hoạch xa (&gt; 7 ngày)
        </button>
        <button
          onClick={() => setActiveTab("UNSCHEDULED")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "UNSCHEDULED"
              ? "bg-[#ef4444] text-white shadow-2xs"
              : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)]"
          }`}
        >
          Chưa có lịch ({stats.unscheduledCount})
        </button>
      </div>

      {/* Deadlines List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-subtle)] animate-pulse">
          Đang tải danh sách bài tập & deadline...
        </div>
      ) : filteredDeadlines.length === 0 ? (
        <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--mint-bg)] text-[var(--mint-dark)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-ink)]">
            Không có deadline nào trong danh mục này
          </h3>
          <p className="text-xs text-[var(--text-subtle)] max-w-md mx-auto mt-2 leading-relaxed">
            Tuyệt vời! Hiện tại bạn không có hạn nộp dồn ứ. Hãy thêm bài tập hoặc kỳ thi mới để AI lên kế hoạch chuẩn bị sớm.
          </p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="mt-5 bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl text-xs font-semibold cursor-pointer"
          >
            Tạo bài tập / deadline mới
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeadlines.map((item) => {
            const estHours = (item.estimatedMinutes / 60).toFixed(1);
            return (
              <Card
                key={`${item.sourceType}-${item.id}`}
                className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 soft-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)]">
                        {item.sourceType}
                      </span>
                      {item.subject && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white truncate max-w-[150px]"
                          style={{ backgroundColor: item.subject.color || "#2d6a4f" }}
                        >
                          {item.subject.name}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: item.urgency.badgeColor }}
                      >
                        {item.urgency.badgeLabel}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-[var(--text-subtle)] shrink-0">
                      Ưu tiên: {item.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-ink)] mt-2.5">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-[var(--text-subtle)] mt-1.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>Hạn: <strong>{format(new Date(item.deadline), "dd/MM/yyyy")}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
                      <span>Khối lượng: <strong>{estHours}h</strong> ({item.estimatedMinutes}p)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="text-xs">
                    {item.hasScheduledPlan ? (
                      <span className="text-[var(--mint-dark)] font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã xếp lịch học</span>
                      </span>
                    ) : (
                      <span className="text-[#d97706] font-medium flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Chưa lên lịch học</span>
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleOpenDistribute(item)}
                    className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-xl text-xs font-semibold h-8 px-3 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Phân bổ chống dồn</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent onClose={() => setCreateModalOpen(false)} className="max-w-md rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--text-ink)]">
              Thêm Deadline / Bài tập mới
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-subtle)]">
              Khai báo hạn nộp và khối lượng thời gian dự kiến để hệ thống chia đều lịch ôn luyện.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDeadline} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                Tên bài tập / Đề án / Kỳ thi *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Bài tập lớn Hệ điều hành - Nộp đồ án"
                required
                className="rounded-2xl border-[var(--border)] text-xs h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                  Môn học liên quan
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-[var(--border)] bg-white dark:bg-[#142318] px-3 text-xs text-[var(--text-ink)]"
                >
                  <option value="">-- Tùy chọn môn --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-[var(--border)] bg-white dark:bg-[#142318] px-3 text-xs text-[var(--text-ink)]"
                >
                  <option value="URGENT">Khẩn cấp (URGENT)</option>
                  <option value="HIGH">Cao (HIGH)</option>
                  <option value="MEDIUM">Vừa (MEDIUM)</option>
                  <option value="LOW">Thấp (LOW)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                  Thời hạn deadline *
                </label>
                <Input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  className="rounded-2xl border-[var(--border)] text-xs h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                  Khối lượng ước tính (Giờ) *
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  required
                  className="rounded-2xl border-[var(--border)] text-xs h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                Ghi chú yêu cầu bài tập
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Cần code xong phần multithreading và viết báo cáo 5 trang"
                className="rounded-2xl border-[var(--border)] text-xs h-10"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-2xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl font-semibold text-xs"
              >
                {submitting ? "Đang lưu..." : "Lưu Deadline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Distribution Modal */}
      <Dialog open={distributeModalOpen} onOpenChange={setDistributeModalOpen}>
        <DialogContent onClose={() => setDistributeModalOpen(false)} className="max-w-xl rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--text-ink)] flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#d97706]" />
              <span>Phân bổ phiên học chống dồn bài (Anti-Cramming)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-subtle)]">
              {selectedItem ? `Áp dụng cho: "${selectedItem.title}"` : ""}
            </DialogDescription>
          </DialogHeader>

          {/* Config Controls */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-[var(--border)]">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                Thời lượng mỗi buổi học
              </label>
              <select
                value={sessionDuration}
                onChange={(e) => setSessionDuration(parseInt(e.target.value, 10))}
                className="w-full h-9 rounded-xl border border-[var(--border)] bg-white dark:bg-[#142318] px-3 text-xs text-[var(--text-ink)]"
              >
                <option value={45}>45 phút (Tập trung nhanh)</option>
                <option value={60}>60 phút (Tiêu chuẩn 1h)</option>
                <option value={90}>90 phút (Deep work khối)</option>
                <option value={120}>120 phút (Ôn thi chuyên sâu)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-ink)] mb-1">
                Ngày đệm trước deadline
              </label>
              <select
                value={bufferDays}
                onChange={(e) => setBufferDays(parseInt(e.target.value, 10))}
                className="w-full h-9 rounded-xl border border-[var(--border)] bg-white dark:bg-[#142318] px-3 text-xs text-[var(--text-ink)]"
              >
                <option value={1}>1 ngày đệm (Khuyên dùng - Thư giãn/Tổng duyệt)</option>
                <option value={2}>2 ngày đệm (An toàn tối đa)</option>
                <option value={0}>0 ngày (Học đến sát ngày nộp)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1 pb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshPreview}
              disabled={previewLoading}
              className="text-xs rounded-xl flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cập nhật xem trước</span>
            </Button>
          </div>

          {/* Schedule Preview */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Kế hoạch phiên học đề xuất
            </h4>

            {previewLoading ? (
              <div className="py-8 text-center text-xs text-[var(--text-subtle)] animate-pulse">
                Đang tính toán các khoảng thời gian trống tối ưu...
              </div>
            ) : distributionResult && distributionResult.sessions ? (
              <div className="space-y-2">
                <div className="p-3 bg-[var(--mint-bg)] dark:bg-[#1a2d21] rounded-2xl text-xs text-[var(--mint-dark)] leading-relaxed">
                  {distributionResult.summary}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {distributionResult.sessions.map((s: any, idx: number) => {
                    const startStr = format(new Date(s.startTime), "HH:mm");
                    const endStr = format(new Date(s.endTime), "HH:mm");
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-[#142318] text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-6 h-6 rounded-lg bg-[var(--mint)] text-white flex items-center justify-center font-bold text-[11px]">
                            {s.sessionNumber}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-ink)]">
                              {s.dayOfWeek}, {s.dateFormatted} ({s.periodName})
                            </div>
                            <div className="text-[11px] text-[var(--text-subtle)]">
                              {startStr} – {endStr} ({s.durationMinutes} phút)
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)]">
                          Đã tối ưu trống
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-[var(--text-subtle)]">
                Chưa có dữ liệu phân bổ
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDistributeModalOpen(false)}
              className="rounded-2xl text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              disabled={committing || previewLoading || !distributionResult?.sessions?.length}
              onClick={handleCommitDistribution}
              className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl font-semibold text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{committing ? "Đang lên lịch..." : "Xác nhận đưa vào Lịch học"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

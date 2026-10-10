"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Play,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ExamModePage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [targetScore, setTargetScore] = useState(8.5);
  const [currentScore, setCurrentScore] = useState(5.0);
  const [studyHours, setStudyHours] = useState(40);
  const [saving, setSaving] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [resExams, resSubjects] = await Promise.all([
        fetch("/api/exams").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resExams.success) {
        setExams(resExams.exams || []);
      }
      if (resSubjects.subjects) {
        setSubjects(resSubjects.subjects);
      }
    } catch (err) {
      console.error("Error loading exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !examDate) return;

    try {
      setSaving(true);
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subjectId: subjectId || null,
          examDate,
          targetScore,
          currentScore,
          availableStudyHours: studyHours,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setTitle("");
        setExamDate("");
        fetchExams();
      }
    } catch (err) {
      console.error("Error creating exam plan:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhase = async (examId: string, nextPhase: string) => {
    try {
      await fetch("/api/exams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: examId, currentPhase: nextPhase }),
      });
      fetchExams();
    } catch (err) {
      console.error("Error updating exam phase:", err);
    }
  };

  const phaseNames: Record<string, string> = {
    FOUNDATION: "1. Nền tảng cốt lõi",
    WEAK_TOPIC_RECOVERY: "2. Phục hồi lỗ hổng",
    PRACTICE: "3. Luyện tập chuyên sâu",
    MOCK_EXAM: "4. Thi thử bấm giờ",
    FINAL_REVIEW: "5. Tổng duyệt",
  };

  const riskBadge = (risk: string) => {
    if (risk === "CRITICAL")
      return <Badge className="bg-red-100 text-red-700 border-red-200">Báo động đỏ</Badge>;
    if (risk === "HIGH")
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Rủi ro cao</Badge>;
    if (risk === "MODERATE")
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Cần tập trung</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">An toàn</Badge>;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/learn">
            <Button variant="ghost" size="icon" className="rounded-xl text-[var(--text-subtle)]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-2xl text-amber-600 dark:text-amber-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-ink)]">
              Chế độ Luyện thi (Dedicated Exam Mode)
            </h1>
            <p className="text-sm text-[var(--text-subtle)]">
              Chiến lược ôn thi 5 giai đoạn: Nền tảng → Lấp lỗ hổng → Luyện đề → Thi thử → Tổng duyệt
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#408257] hover:bg-[#346a47] text-white rounded-2xl shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Thiết lập kỳ thi mới
        </Button>
      </div>

      {/* Main Exams List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl bg-[var(--bg-surface)] border-emerald-100 dark:border-[#263d2e] p-8">
          <Target className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-ink)]">
            Chưa có kế hoạch luyện thi nào!
          </h3>
          <p className="text-xs text-[var(--text-subtle)] mt-1 max-w-sm mx-auto mb-5">
            Tạo kế hoạch ôn thi giữa kỳ hoặc cuối kỳ để AI xây dựng lộ trình 5 giai đoạn và tính toán chỉ số sẵn sàng.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo kế hoạch thi đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {exams.map((exam) => {
            const strategy = exam.strategy;
            const daysLeft = strategy?.daysRemaining ?? 10;
            const readiness = strategy?.readinessScore ?? 45;

            return (
              <Card
                key={exam.id}
                className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-surface)] border border-emerald-100 dark:border-[#263d2e] shadow-sm space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold">
                        🎯 KỲ THI
                      </Badge>
                      {exam.subject && (
                        <Badge variant="outline" className="text-xs">
                          {exam.subject.name}
                        </Badge>
                      )}
                      {riskBadge(strategy?.riskLevel || "LOW")}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-ink)]">
                      {exam.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-subtle)] block">Thời gian còn lại</span>
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {daysLeft === 0 ? "Hôm nay!" : `Còn ${daysLeft} ngày`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Readiness Meter & Target Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-[#263d2e]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">Độ sẵn sàng thi</span>
                      <span className="font-bold text-emerald-600">{readiness}%</span>
                    </div>
                    <div className="w-full bg-emerald-100 dark:bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${readiness}%` }} />
                    </div>
                    <span className="text-[10px] text-[var(--text-subtle)] block mt-1.5">
                      Dựa trên tỷ lệ câu hỏi đã giải quyết trong Mistake Bank
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[var(--text-subtle)] block">Mục tiêu điểm số</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {exam.targetScore} / 10
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-subtle)] block">Dự báo hiện tại</span>
                      <span className="text-sm font-bold text-[var(--text-ink)]">
                        ~{strategy?.estimatedScore ?? exam.currentScore}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                    <span className="text-xs text-purple-700 dark:text-purple-300 block font-semibold">Khối lượng đề xuất</span>
                    <span className="text-xl font-bold text-purple-800 dark:text-purple-200">
                      {strategy?.recommendedDailyMinutes ?? 60} phút/ngày
                    </span>
                    <span className="text-[10px] text-[var(--text-subtle)] block mt-1">
                      Tổng số giờ dự kiến: {exam.availableStudyHours}h
                    </span>
                  </div>
                </div>

                {/* 5-Phase Progression Strategy */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] block">
                    Tiến độ chiến lược 5 giai đoạn
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {strategy?.phases.map((phase: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleUpdatePhase(exam.id, phase.key)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          phase.isCurrent
                            ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40"
                            : phase.isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                            : "bg-gray-50 dark:bg-[#1a2f22] border-gray-200 dark:border-[#263d2e] text-[var(--text-subtle)] opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold">Giai đoạn {idx + 1}</span>
                          {phase.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <h4 className="text-xs font-bold line-clamp-1">{phase.key}</h4>
                        <span className="text-[10px] block mt-1 opacity-90">{phase.recommendedHours} giờ</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-50 dark:border-[#263d2e]">
                  <div className="flex items-center gap-2">
                    <Link href={`/practice/mistakes?subjectId=${exam.subjectId || "ALL"}`}>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                        Ôn câu sai môn này
                      </Button>
                    </Link>
                    <Link href="/practice/review">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">
                        <BookOpen className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                        Luyện thẻ ghi nhớ
                      </Button>
                    </Link>
                  </div>

                  <Link href={`/calendar`}>
                    <Button size="sm" className="bg-[#408257] hover:bg-[#346a47] text-white rounded-xl text-xs">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      Xem trên Lịch học
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Exam Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateExam} className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-ink)]">
              Thiết lập kế hoạch luyện thi 5 giai đoạn
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-subtle)]">Tên kỳ thi / Học phần *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Thi kết thúc học phần Toán cao cấp A1"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-subtle)]">Môn học</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-100 dark:border-[#263d2e] bg-[var(--bg-surface)]"
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-subtle)]">Ngày thi chính thức *</label>
                <Input
                  required
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-subtle)]">Điểm hiện tại</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={currentScore}
                  onChange={(e) => setCurrentScore(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-emerald-600">Điểm mục tiêu</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-subtle)]">Quỹ giờ học (h)</label>
                <Input
                  type="number"
                  min="5"
                  max="200"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {saving ? "Đang tạo..." : "Kích hoạt kế hoạch thi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

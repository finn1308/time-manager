"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  Play,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Layers,
  BookOpen,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function MistakeBankPage() {
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNRESOLVED" | "RESOLVED">("UNRESOLVED");
  const [search, setSearch] = useState("");

  // Modal create
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("");
  const [newUserAnswer, setNewUserAnswer] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newErrorType, setNewErrorType] = useState("KNOWLEDGE_GAP");
  const [newExplanation, setNewExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMistakes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubject !== "ALL") params.append("subjectId", selectedSubject);
      if (selectedType !== "ALL") params.append("errorType", selectedType);
      if (statusFilter === "UNRESOLVED") params.append("isResolved", "false");
      if (statusFilter === "RESOLVED") params.append("isResolved", "true");
      if (search) params.append("search", search);

      const [resMistakes, resSubjects] = await Promise.all([
        fetch(`/api/mistakes?${params.toString()}`).then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resMistakes.success) {
        setMistakes(resMistakes.mistakes || []);
        setStats(resMistakes.stats || null);
      }
      if (resSubjects.subjects) {
        setSubjects(resSubjects.subjects);
      }
    } catch (err) {
      console.error("Error loading mistakes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, [selectedSubject, selectedType, statusFilter, search]);

  const handleToggleResolve = async (id: string, currentStatus: boolean) => {
    try {
      await fetch("/api/mistakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mistakeId: id, isResolved: !currentStatus }),
      });
      fetchMistakes();
    } catch (err) {
      console.error("Error updating mistake status:", err);
    }
  };

  const handleCreateMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newCorrectAnswer || !newUserAnswer) return;

    try {
      setSaving(true);
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestion,
          correctAnswer: newCorrectAnswer,
          userAnswer: newUserAnswer,
          subjectId: newSubjectId || null,
          errorType: newErrorType,
          explanation: newExplanation || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewQuestion("");
        setNewCorrectAnswer("");
        setNewUserAnswer("");
        setNewExplanation("");
        fetchMistakes();
      }
    } catch (err) {
      console.error("Error creating mistake:", err);
    } finally {
      setSaving(false);
    }
  };

  const errorTypeLabels: Record<string, string> = {
    KNOWLEDGE_GAP: "Lỗ hổng kiến thức",
    MISUNDERSTANDING: "Hiểu sai khái niệm",
    CARELESS: "Bất cẩn / Đọc lướt",
    MEMORY_FAILURE: "Quên sau thời gian dài",
    CALCULATION: "Sai sót tính toán",
    VOCABULARY: "Nhầm lẫn từ vựng",
    CONCEPT_CONFUSION: "Nhầm định lý / quy tắc",
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/vocab/index/5">
            <Button variant="ghost" size="icon" className="rounded-xl text-[#526b5c]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Ngân hàng lỗi sai (Mistake Bank)
            </h1>
            <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
              Quản lý và ôn tập các câu hỏi từng làm sai từ đề thi, quiz và flashcards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vocab/review">
            <Button className="bg-[#408257] hover:bg-[#346a47] text-white rounded-2xl shadow-sm">
              <Play className="w-4 h-4 mr-2" />
              Luyện tập lỗi sai ngay
            </Button>
          </Link>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="rounded-2xl border-emerald-200 dark:border-[#263d2e]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ghi nhận lỗi
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e]">
            <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] block">Tổng số lỗi đã ghi</span>
            <span className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">{stats.total}</span>
          </Card>
          <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-rose-100 dark:border-rose-950/30">
            <span className="text-xs text-rose-600 dark:text-rose-400 block font-medium">Chưa khắc phục</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.unresolved}</span>
          </Card>
          <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e]">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">Đã khắc phục</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</span>
          </Card>
          <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-purple-100 dark:border-[#263d2e]">
            <span className="text-xs text-purple-600 dark:text-purple-400 block font-medium">Dạng lỗi phổ biến</span>
            <span className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] truncate block mt-1">
              {stats.byErrorType[0]?.errorType ? errorTypeLabels[stats.byErrorType[0].errorType] || "Chưa rõ" : "Chưa có"}
            </span>
          </Card>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#526b5c]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, khái niệm..."
              className="pl-9 rounded-xl border-emerald-100 dark:border-[#263d2e]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Status pills */}
            <Button
              size="sm"
              variant={statusFilter === "UNRESOLVED" ? "default" : "outline"}
              onClick={() => setStatusFilter("UNRESOLVED")}
              className={`rounded-xl text-xs ${statusFilter === "UNRESOLVED" ? "bg-rose-600 text-white" : ""}`}
            >
              Chưa khắc phục
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "RESOLVED" ? "default" : "outline"}
              onClick={() => setStatusFilter("RESOLVED")}
              className={`rounded-xl text-xs ${statusFilter === "RESOLVED" ? "bg-emerald-600 text-white" : ""}`}
            >
              Đã thuộc
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "ALL" ? "default" : "outline"}
              onClick={() => setStatusFilter("ALL")}
              className="rounded-xl text-xs"
            >
              Tất cả
            </Button>

            {/* Subject select */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs p-2 rounded-xl bg-gray-50 dark:bg-[#1a2f22] border border-emerald-100 dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2]"
            >
              <option value="ALL">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Mistakes List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mistakes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#17261c] rounded-3xl border border-emerald-100 dark:border-[#263d2e] p-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Không tìm thấy lỗi sai nào!
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1 max-w-sm mx-auto">
            Bạn đã khắc phục toàn bộ các câu hỏi đã ghi nhận hoặc không có lỗi sai nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {mistakes.map((m) => (
            <Card
              key={m.id}
              className={`p-5 rounded-2xl border transition-all ${
                m.isResolved
                  ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-[#263d2e] opacity-80"
                  : "bg-white dark:bg-[#17261c] border-rose-100 dark:border-rose-950/30 shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.subject && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-medium">
                        {m.subject.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-rose-200 text-rose-600">
                      {errorTypeLabels[m.errorType] || m.errorType}
                    </Badge>
                    {m.concept && (
                      <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] font-mono">
                        • {m.concept}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2] break-words">
                    {m.question}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl text-rose-700 dark:text-rose-300">
                      <span className="font-semibold block mb-0.5">Câu trả lời sai:</span>
                      {m.userAnswer}
                    </div>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-300">
                      <span className="font-semibold block mb-0.5">Đáp án đúng:</span>
                      {m.correctAnswer}
                    </div>
                  </div>

                  {m.explanation && (
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] italic pt-1">
                      Giải thích: {m.explanation}
                    </p>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="shrink-0 flex items-center gap-2 sm:self-center">
                  <Button
                    size="sm"
                    variant={m.isResolved ? "outline" : "default"}
                    onClick={() => handleToggleResolve(m.id, m.isResolved)}
                    className={`rounded-xl text-xs ${
                      m.isResolved
                        ? "border-emerald-200 text-emerald-600"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {m.isResolved ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Ôn lại
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Đã khắc phục
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Mistake Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateMistake} className="space-y-4">
            <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Ghi nhận lỗi sai vào ngân hàng
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#526b5c]">Câu hỏi / Đề bài *</label>
              <Input
                required
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="VD: Đạo hàm của hàm số y = ln(x) là gì?"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-rose-600">Câu bạn chọn sai *</label>
                <Input
                  required
                  value={newUserAnswer}
                  onChange={(e) => setNewUserAnswer(e.target.value)}
                  placeholder="VD: 1/x^2"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-emerald-600">Đáp án chính xác *</label>
                <Input
                  required
                  value={newCorrectAnswer}
                  onChange={(e) => setNewCorrectAnswer(e.target.value)}
                  placeholder="VD: 1/x"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#526b5c]">Môn học liên quan</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-100 dark:border-[#263d2e] bg-white dark:bg-[#17261c]"
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
                <label className="text-xs font-medium text-[#526b5c]">Phân loại lỗi</label>
                <select
                  value={newErrorType}
                  onChange={(e) => setNewErrorType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-100 dark:border-[#263d2e] bg-white dark:bg-[#17261c]"
                >
                  {Object.entries(errorTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#526b5c]">Giải thích & Ghi chú nhớ lâu</label>
              <Input
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="VD: Đạo hàm ln(u) = u'/u, với u = x thì u' = 1..."
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {saving ? "Đang lưu..." : "Lưu vào ngân hàng"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

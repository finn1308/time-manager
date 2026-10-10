"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Plus,
  GitBranch,
  BookOpen,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function KnowledgeGraphPage() {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  // Create Node Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [chapter, setChapter] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [importance, setImportance] = useState("CORE");
  const [saving, setSaving] = useState(false);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [nodeId, setNodeId] = useState("");
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const [requiredMastery, setRequiredMastery] = useState(0.6);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubject !== "ALL") params.append("subjectId", selectedSubject);

      const [resGraph, resSubjects] = await Promise.all([
        fetch(`/api/knowledge/graph?${params.toString()}`).then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resGraph.success) {
        setNodes(resGraph.nodes || []);
        setEdges(resGraph.edges || []);
        setWarnings(resGraph.warnings || []);
      }
      if (resSubjects.subjects) {
        setSubjects(resSubjects.subjects);
      }
    } catch (err) {
      console.error("Error loading knowledge graph:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [selectedSubject]);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setSaving(true);
      const res = await fetch("/api/knowledge/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          chapter,
          subjectId: subjectId || null,
          importance,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setTitle("");
        setChapter("");
        fetchGraph();
      }
    } catch (err) {
      console.error("Error creating concept node:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkPrerequisite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId || !prerequisiteId) return;

    try {
      setSaving(true);
      const res = await fetch("/api/knowledge/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LINK_PREREQUISITE",
          nodeId,
          prerequisiteId,
          requiredMastery,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowLinkModal(false);
        setNodeId("");
        setPrerequisiteId("");
        fetchGraph();
      }
    } catch (err) {
      console.error("Error linking prerequisite:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/academic">
            <Button variant="ghost" size="icon" className="rounded-xl text-[var(--text-subtle)]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-2xl text-purple-600 dark:text-purple-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-ink)]">
              Cây tri thức & Động cơ Tiên quyết (Knowledge Graph)
            </h1>
            <p className="text-sm text-[var(--text-subtle)]">
              Liên kết logic giữa các chuyên đề và cảnh báo điều kiện tiên quyết trước khi học bài mới
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowLinkModal(true)}
            variant="outline"
            className="rounded-2xl border-purple-200 text-purple-700 text-xs"
          >
            <LinkIcon className="w-4 h-4 mr-1.5" />
            Nối điều kiện tiên quyết
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#408257] hover:bg-[#346a47] text-white rounded-2xl shadow-sm text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm khái niệm
          </Button>
        </div>
      </div>

      {/* Prerequisite Warnings Banner */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Cảnh báo điều kiện tiên quyết chưa đạt ({warnings.length})
          </div>
          <div className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
            {warnings.map((w, i) => (
              <div key={i} className="p-2.5 bg-white/70 dark:bg-[#1a2f22]/70 rounded-xl border border-amber-100 dark:border-amber-900/20">
                {w.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4 rounded-2xl bg-[var(--bg-surface)] border-emerald-100 dark:border-[#263d2e] flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-subtle)]">Lọc theo môn học:</span>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="text-xs p-2 rounded-xl bg-gray-50 dark:bg-[#1a2f22] border border-emerald-100 dark:border-[#263d2e] text-[var(--text-ink)]"
        >
          <option value="ALL">Tất cả môn học</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Concepts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : nodes.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl bg-[var(--bg-surface)] border-emerald-100 dark:border-[#263d2e] p-8">
          <GitBranch className="w-12 h-12 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-ink)]">
            Chưa có cấu trúc cây kiến thức!
          </h3>
          <p className="text-xs text-[var(--text-subtle)] mt-1 max-w-sm mx-auto mb-5">
            Sử dụng tính năng Syllabus Importer hoặc thêm khái niệm thủ công để tạo sơ đồ tiên quyết.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm khái niệm đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {nodes.map((node) => {
            const mastery = Math.round(node.masteryScore * 100);
            return (
              <Card
                key={node.id}
                className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-emerald-100 dark:border-[#263d2e] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {node.chapter || "Chương chung"}
                  </Badge>
                  <Badge
                    className={`text-[10px] ${
                      node.importance === "CORE"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {node.importance === "CORE" ? "Cốt lõi" : "Nâng cao"}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-ink)] line-clamp-2">
                  {node.title}
                </h3>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)]">
                    <span>Mức độ làm chủ</span>
                    <span className="font-bold text-emerald-600">{mastery}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>

                {node.subject && (
                  <span className="text-[10px] text-[var(--text-subtle)] block truncate">
                    Môn: {node.subject.name}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Node Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateNode} className="space-y-4">
            <h2 className="text-base font-bold text-[var(--text-ink)]">
              Thêm khái niệm / chuyên đề mới
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-subtle)]">Tên khái niệm *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Quy tắc chuỗi (Chain Rule)"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-subtle)]">Chương / Tuần</label>
                <Input
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="VD: Chương 2: Đạo hàm"
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-subtle)]">Môn học</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-100 dark:border-[#263d2e] bg-[var(--bg-surface)]"
                >
                  <option value="">-- Chọn môn --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Lưu khái niệm
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Prerequisite Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleLinkPrerequisite} className="space-y-4">
            <h2 className="text-base font-bold text-[var(--text-ink)]">
              Thiết lập quan hệ điều kiện tiên quyết
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-subtle)]">Khái niệm cần học (Target)</label>
              <select
                required
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-emerald-100 dark:border-[#263d2e] bg-[var(--bg-surface)]"
              >
                <option value="">-- Chọn khái niệm --</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-purple-600">Yêu cầu phải nắm vững trước (Prerequisite)</label>
              <select
                required
                value={prerequisiteId}
                onChange={(e) => setPrerequisiteId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-purple-200 dark:border-[#263d2e] bg-[var(--bg-surface)]"
              >
                <option value="">-- Chọn điều kiện tiên quyết --</option>
                {nodes
                  .filter((n) => n.id !== nodeId)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-subtle)]">Mức độ làm chủ yêu cầu tối thiểu</label>
              <Input
                type="number"
                step="0.05"
                min="0.3"
                max="1.0"
                value={requiredMastery}
                onChange={(e) => setRequiredMastery(Number(e.target.value))}
                className="rounded-xl text-xs"
              />
              <span className="text-[10px] text-[var(--text-subtle)] block">
                Mặc định 0.6 (Nắm vững 60% kiến thức trước khi học tiếp)
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowLinkModal(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                Thiết lập liên kết
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

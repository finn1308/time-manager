"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  Layers,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<any[]>([]);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [workloadMins, setWorkloadMins] = useState(180);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [decomposingId, setDecomposingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedSubject !== "ALL") params.append("subjectId", selectedSubject);

      const [resAssign, resSubjects] = await Promise.all([
        fetch(`/api/assignments?${params.toString()}`).then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resAssign.success) {
        setAssignments(resAssign.assignments || []);
        setStatusCounts(resAssign.statusCounts || []);
      }
      if (resSubjects.subjects) {
        setSubjects(resSubjects.subjects);
      }
    } catch (err) {
      console.error("Error loading assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedStatus, selectedSubject]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    try {
      setSaving(true);
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subjectId: subjectId || null,
          deadline,
          priority,
          estimatedWorkloadMinutes: workloadMins,
          description,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setTitle("");
        setDeadline("");
        setDescription("");
        fetchAssignments();
      }
    } catch (err) {
      console.error("Error creating assignment:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDecomposeAI = async (assignmentId: string) => {
    try {
      setDecomposingId(assignmentId);
      const res = await fetch(`/api/assignments/${assignmentId}/breakdown`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        alert(`Thành công! ${json.message}. Bạn có thể vào mục Nhiệm vụ (Tasks) để theo dõi các bước.`);
        fetchAssignments();
      }
    } catch (err) {
      console.error("Error decomposing assignment:", err);
    } finally {
      setDecomposingId(null);
    }
  };

  const handleUpdateStatus = async (assignmentId: string, newStatus: string) => {
    try {
      await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignmentId, status: newStatus }),
      });
      fetchAssignments();
    } catch (err) {
      console.error("Error updating assignment status:", err);
    }
  };

  const statusLabels: Record<string, string> = {
    NOT_STARTED: "Chưa bắt đầu",
    PLANNING: "Lập kế hoạch",
    IN_PROGRESS: "Đang làm",
    REVIEWING: "Chỉnh sửa / Soát lỗi",
    COMPLETED: "Hoàn tất",
    SUBMITTED: "Đã nộp bài",
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
          <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Bài tập lớn & Đồ án (Assignments)
            </h1>
            <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
              Quản lý tiến độ đồ án, tiểu luận và phân rã thành các nhiệm vụ chi tiết bằng AI
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#408257] hover:bg-[#346a47] text-white rounded-2xl shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm bài tập / đồ án
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 rounded-2xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={selectedStatus === "ALL" ? "default" : "outline"}
          onClick={() => setSelectedStatus("ALL")}
          className="rounded-xl text-xs"
        >
          Tất cả
        </Button>
        {Object.entries(statusLabels).map(([statusKey, label]) => (
          <Button
            key={statusKey}
            size="sm"
            variant={selectedStatus === statusKey ? "default" : "outline"}
            onClick={() => setSelectedStatus(statusKey)}
            className={`rounded-xl text-xs ${
              selectedStatus === statusKey ? "bg-emerald-600 text-white" : ""
            }`}
          >
            {label}
          </Button>
        ))}

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="text-xs p-2 rounded-xl bg-gray-50 dark:bg-[#1a2f22] border border-emerald-100 dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2] ml-auto"
        >
          <option value="ALL">Tất cả môn học</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Assignments List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] p-8">
          <FileCheck className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Chưa có bài tập nào!
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1 max-w-sm mx-auto mb-5">
            Thêm đồ án hoặc tiểu luận học kỳ để AI tự động chia nhỏ thành các chặng hoàn thành đúng hạn.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo bài tập đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((item) => {
            const isDecomposing = decomposingId === item.id;
            return (
              <Card
                key={item.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#17261c] border border-emerald-100 dark:border-[#263d2e] shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.subject && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {item.subject.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Hạn: {new Date(item.deadline).toLocaleDateString("vi-VN")}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          item.priority === "URGENT"
                            ? "bg-rose-100 text-rose-700"
                            : item.priority === "HIGH"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        Ưu tiên {item.priority}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                      {item.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isDecomposing}
                      onClick={() => handleDecomposeAI(item.id)}
                      className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-xs font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                      {isDecomposing ? "Đang phân rã..." : "Phân rã AI (5 bước)"}
                    </Button>

                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                      className="text-xs p-2 rounded-xl bg-gray-50 dark:bg-[#1a2f22] border border-emerald-200 dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2] font-semibold"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-[#526b5c] dark:text-[#a3bda9] pt-2 border-t border-emerald-50 dark:border-[#263d2e]">
                  <span>Ước lượng thời lượng: {Math.round(item.estimatedWorkloadMinutes / 60)} giờ</span>
                  {item.grade !== null && item.grade !== undefined && (
                    <span className="font-bold text-emerald-600">Điểm đạt được: {item.grade}/10</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Thêm bài tập lớn / đồ án mới
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#526b5c]">Tên đồ án / bài tập *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đồ án Xây dựng Website Bán Hàng"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#526b5c]">Môn học</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
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
                <label className="text-xs font-medium text-[#526b5c]">Hạn nộp bài *</label>
                <Input
                  required
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#526b5c]">Độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-100 dark:border-[#263d2e] bg-white dark:bg-[#17261c]"
                >
                  <option value="LOW">Thấp (Low)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HIGH">Cao (High)</option>
                  <option value="URGENT">Khẩn cấp (Urgent)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#526b5c]">Ước tính thời gian (phút)</label>
                <Input
                  type="number"
                  min="30"
                  step="30"
                  value={workloadMins}
                  onChange={(e) => setWorkloadMins(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#526b5c]">Mô tả yêu cầu</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Yêu cầu đồ án, định dạng nộp file..."
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {saving ? "Đang lưu..." : "Tạo bài tập"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

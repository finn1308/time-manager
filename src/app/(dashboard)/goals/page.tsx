"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Target, Plus, Calendar, Clock, BookOpen, CheckCircle2, Trash2, AlertCircle, CheckSquare, Square } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [targetHours, setTargetHours] = useState("10");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [milestonesText, setMilestonesText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [resGoals, resSubs] = await Promise.all([
        fetch("/api/goals").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resGoals.goals) setGoals(resGoals.goals);
      if (resSubs.subjects) setSubjects(resSubs.subjects);
    } catch (err) {
      console.error("Error loading goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetHours) return;

    setSubmitting(true);
    try {
      const milestonesList = milestonesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t) => ({ title: t, done: false }));

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subjectId: subjectId || null,
          targetHours: parseFloat(targetHours),
          deadline: deadline || null,
          description: description.trim() || null,
          milestones: milestonesList.length > 0 ? JSON.stringify(milestonesList) : null,
        }),
      });

      if (res.ok) {
        setTitle("");
        setSubjectId("");
        setTargetHours("10");
        setDeadline("");
        setDescription("");
        setMilestonesText("");
        setModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục tiêu này?")) return;
    try {
      await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentCompleted: boolean) => {
    try {
      // Optimistic update
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          milestoneRecords: (g.milestoneRecords || []).map((m: any) =>
            m.id === milestoneId ? { ...m, isCompleted: !currentCompleted } : m
          ),
        }))
      );

      const res = await fetch("/api/milestones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestoneId, isCompleted: !currentCompleted }),
      });
      if (!res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to toggle milestone:", err);
      loadData();
    }
  };

  const handleAddMilestone = async (goalId: string, milestoneTitle: string) => {
    if (!milestoneTitle.trim()) return;
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, title: milestoneTitle.trim() }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to add milestone:", err);
    }
  };

  const [newMilestoneInput, setNewMilestoneInput] = useState<{ [goalId: string]: string }>({});

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
            <Target className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Mục tiêu học tập & Milestone (Goals)</span>
          </h1>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
            Thiết lập hệ thống phân cấp: Môn học → Mục tiêu lớn → Mốc Milestone → Phiên học để AI phân bổ tối ưu.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl flex items-center space-x-2 shadow-2xs text-xs font-semibold h-10 px-4 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mục tiêu mới</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-[#e8f0eb] dark:bg-[#203326] rounded-[28px] animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Chưa có mục tiêu học tập
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto mt-2 leading-relaxed">
            Thêm mục tiêu đầu tiên (ví dụ: Hoàn thành 20 giờ IELTS Writing trước ngày 25) để hệ thống tự động tính toán số giờ cần học mỗi tuần.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="mt-5 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs font-semibold cursor-pointer"
          >
            Tạo mục tiêu ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const now = new Date();
            let daysLeft = null;
            let reqWeeklyHours = null;
            if (g.deadline) {
              daysLeft = differenceInDays(new Date(g.deadline), now);
              const weeksLeft = Math.max(0.5, daysLeft / 7);
              reqWeeklyHours = Math.round((g.targetHours / weeksLeft) * 10) / 10;
            }

            const records: any[] = g.milestoneRecords || [];
            let fallbackList: Array<{ title: string; done: boolean }> = [];
            if (records.length === 0 && g.milestones) {
              try {
                fallbackList = JSON.parse(g.milestones);
              } catch {}
            }

            const totalMilestones = records.length > 0 ? records.length : fallbackList.length;
            const completedCount =
              records.length > 0
                ? records.filter((m) => m.isCompleted).length
                : fallbackList.filter((m) => m.done).length;
            const progressPercent = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

            return (
              <Card
                key={g.id}
                className="rounded-[26px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-5 soft-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      {g.subject && (
                        <span
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white truncate max-w-[200px]"
                          style={{ backgroundColor: g.subject.color || "#2d6a4f" }}
                        >
                          {g.subject.name}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                        {g.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-full hover:bg-[#f7ebeb] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer shrink-0"
                      title="Xóa mục tiêu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {g.description && (
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-2 line-clamp-2">
                      {g.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  {totalMilestones > 0 && (
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9]">
                        <span>Tiến độ milestone</span>
                        <span className="font-semibold text-[#2d6a4f] dark:text-[#52b788]">
                          {completedCount}/{totalMilestones} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e8f1eb] dark:bg-[#203527] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2d6a4f] dark:bg-[#52b788] transition-all duration-300 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Milestones Checklist */}
                  <div className="mt-4 pt-3 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#73927d]">
                      <span>Milestones ({totalMilestones})</span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {records.length > 0 ? (
                        records.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(m.id, m.isCompleted)}
                            className="flex items-center space-x-2 text-xs p-1.5 rounded-xl hover:bg-[#f3f8f5] dark:hover:bg-[#1a2d21] cursor-pointer transition-colors"
                          >
                            {m.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788] shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-[#8ba393] shrink-0" />
                            )}
                            <span
                              className={`truncate flex-1 ${
                                m.isCompleted
                                  ? "line-through text-[#8ba393] dark:text-[#607d6a]"
                                  : "text-[#192e22] dark:text-[#f0f7f2]"
                              }`}
                            >
                              {m.title}
                            </span>
                          </div>
                        ))
                      ) : fallbackList.length > 0 ? (
                        fallbackList.map((m, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs p-1">
                            <Square className="w-3.5 h-3.5 text-[#8ba393] shrink-0" />
                            <span className="truncate text-[#192e22] dark:text-[#f0f7f2]">{m.title}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-[#8ba393] italic py-1">Chưa có milestone nào</div>
                      )}
                    </div>

                    {/* Quick Add Milestone inline */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Input
                        placeholder="+ Thêm mốc nhỏ..."
                        value={newMilestoneInput[g.id] || ""}
                        onChange={(e) =>
                          setNewMilestoneInput((prev) => ({ ...prev, [g.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMilestone(g.id, newMilestoneInput[g.id] || "");
                            setNewMilestoneInput((prev) => ({ ...prev, [g.id]: "" }));
                          }
                        }}
                        className="h-7 text-[11px] rounded-lg border-[#dbe7dd] dark:border-[#263d2e] px-2"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleAddMilestone(g.id, newMilestoneInput[g.id] || "");
                          setNewMilestoneInput((prev) => ({ ...prev, [g.id]: "" }));
                        }}
                        className="h-7 px-2 text-xs text-[#2d6a4f] dark:text-[#52b788] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#dbe7dd]/70 dark:border-[#263d2e] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#526b5c] dark:text-[#a3bda9]">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#2d6a4f] dark:text-[#52b788]" />
                      <span>Chỉ tiêu: <strong>{g.targetHours}h</strong></span>
                    </span>
                    {g.deadline && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#73927d]" />
                        <span>{format(new Date(g.deadline), "dd/MM/yyyy")}</span>
                      </span>
                    )}
                  </div>

                  {/* Deadline Indicator */}
                  {daysLeft !== null && (
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className={daysLeft <= 7 ? "text-amber-700 dark:text-amber-400 font-semibold" : "text-[#526b5c] dark:text-[#a3bda9]"}>
                        {daysLeft > 0 ? `Còn ${daysLeft} ngày` : daysLeft === 0 ? "Hạn là hôm nay" : "Đã quá hạn"}
                      </span>
                      {reqWeeklyHours && (
                        <span className="text-[#2d6a4f] dark:text-[#52b788] font-bold">
                          Cần {reqWeeklyHours}h / tuần
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent onClose={() => setModalOpen(false)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Tạo mục tiêu học tập mới
            </DialogTitle>
            <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
              Thiết lập chỉ tiêu số giờ, deadline và các mốc milestone nhỏ để AI tự động chia nhỏ kế hoạch.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGoal} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Tiêu đề mục tiêu *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đạt 20 giờ luyện giải Cam 19"
                required
                className="rounded-2xl border-[#dbe7dd] text-xs h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Môn học liên quan
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#142318] px-3 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Số giờ mục tiêu *
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  required
                  className="rounded-2xl border-[#dbe7dd] text-xs h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Thời hạn hoàn thành / Deadline (Tùy chọn - để trống nếu học tự do)
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-2xl border-[#dbe7dd] text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Milestones nhỏ (Mỗi dòng 1 nhiệm vụ / mốc)
              </label>
              <textarea
                rows={3}
                value={milestonesText}
                onChange={(e) => setMilestonesText(e.target.value)}
                placeholder="VD:&#10;Reading Test 1 & 2&#10;Writing Task 2 Essay&#10;Vocabulary Review"
                className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#142318] p-3 text-xs text-[#192e22] dark:text-[#f0f7f2] placeholder:text-[#8ba393] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Ghi chú chi tiết
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Cần ưu tiên các bài Task 2 dạng Agree/Disagree"
                className="rounded-2xl border-[#dbe7dd] text-xs h-10"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl font-semibold text-xs"
              >
                {submitting ? "Đang lưu..." : "Lưu mục tiêu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

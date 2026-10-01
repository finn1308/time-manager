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
            Đặt ra số giờ cần đạt, deadline và các mốc milestone nhỏ để AI phân bổ lịch học thông minh.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl flex items-center space-x-2 shadow-2xs text-xs font-semibold h-10 px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mục tiêu mới</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#526b5c] animate-pulse">
          Đang tải danh sách mục tiêu...
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
            className="mt-5 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs font-semibold"
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

            let milestonesList: Array<{ title: string; done: boolean }> = [];
            if (g.milestones) {
              try {
                milestonesList = JSON.parse(g.milestones);
              } catch {}
            }

            return (
              <Card
                key={g.id}
                className="rounded-[26px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-5 soft-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {g.subject && (
                        <span
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: g.subject.color || "#2d6a4f" }}
                        >
                          {g.subject.name}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
                        {g.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-full hover:bg-[#f7ebeb] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer"
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

                  {/* Milestones Checklist (Section 10) */}
                  {milestonesList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#73927d]">
                        Milestones ({milestonesList.length})
                      </div>
                      <div className="space-y-1 text-xs">
                        {milestonesList.map((m, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-[#192e22] dark:text-[#f0f7f2]">
                            <Square className="w-3 h-3 text-[#2d6a4f] shrink-0" />
                            <span className="truncate">{m.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {/* Deadline Indicator (Section 32) */}
                  {daysLeft !== null && (
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className={daysLeft <= 7 ? "text-amber-700 font-semibold" : "text-[#526b5c]"}>
                        {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã đến hạn"}
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
                Thời hạn hoàn thành (Deadline)
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

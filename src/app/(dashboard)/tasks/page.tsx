"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskDependencyAlertModal } from "@/components/tasks/task-dependency-alert-modal";
import {
import { toast } from "sonner";
  CheckSquare,
  Sparkles,
  Plus,
  Send,
  Kanban,
  List,
  Search,
  Filter,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick NLP Input State
  const [quickInput, setQuickInput] = useState("");
  const [isParsingQuick, setIsParsingQuick] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);

  // Dependency Block Alert State
  const [dependencyAlert, setDependencyAlert] = useState<{
    open: boolean;
    task: any | null;
    blockingTasks: any[];
  }>({
    open: false,
    task: null,
    blockingTasks: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resTasks, resSubjects] = await Promise.all([
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resTasks.tasks) setTasks(resTasks.tasks);
      if (resSubjects.subjects) setSubjects(resSubjects.subjects);
    } catch (err) {
      console.error("Error loading tasks data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isParsingQuick) return;

    setIsParsingQuick(true);
    try {
      const res = await fetch("/api/tasks/quick-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quickInput.trim(), autoCreate: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể phân tích task");

      setQuickInput("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo task nhanh");
    } finally {
      setIsParsingQuick(false);
    }
  };

  const handleToggleComplete = async (task: any, force = false) => {
    const nextCompleted = !task.isCompleted;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted, force }),
      });

      const data = await res.json();

      if (res.status === 409 && data.blockingTasks) {
        // Blocked by dependencies
        setDependencyAlert({
          open: true,
          task,
          blockingTasks: data.blockingTasks,
        });
        return;
      }

      if (!res.ok) throw new Error(data.message || data.error || "Không thể cập nhật");

      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Không thể chuyển trạng thái");
      }
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa task này?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi khi xóa");
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa task");
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === "ALL" || t.subjectId === selectedSubjectFilter;
    const matchesPriority = selectedPriorityFilter === "ALL" || t.priority === selectedPriorityFilter;
    return matchesSearch && matchesSubject && matchesPriority;
  });

  // Columns for Kanban Board
  const columns = [
    { id: "INBOX", label: "Inbox", icon: Inbox, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
    { id: "TODO", label: "To Do", icon: CheckSquare, color: "text-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024]" },
    { id: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { id: "DONE", label: "Done", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" },
  ];

  // Stats
  const nowTimestamp = useMemo(() => new Date().getTime(), [tasks]);
  const inboxCount = tasks.filter((t) => t.status === "INBOX").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.isCompleted || t.status === "DONE").length;
  const overdueCount = tasks.filter(
    (t) => t.deadline && !t.isCompleted && new Date(t.deadline).getTime() < nowTimestamp
  ).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#86e2a8] text-xs font-bold mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>CHRONOMIND TASK & INBOX ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            Nhiệm vụ & Quick Inbox
          </h1>
          <p className="text-xs sm:text-sm text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
            Quản lý công việc kiểu Todoist, phân tích ngôn ngữ tự nhiên tiếng Việt và kiểm soát thứ tự phụ thuộc (DAG).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Switcher */}
          <div className="flex items-center space-x-1 p-1 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] text-xs shadow-2xs">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024]"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs space-x-1.5 h-9"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm task</span>
          </Button>
        </div>
      </div>

      {/* Quick NLP Inbox Input Card */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleQuickAdd} className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>QUICK INBOX NLP PARSER (TIẾNG VIỆT)</span>
            </div>
            <span className="text-[11px] text-[#73927d] font-normal hidden sm:inline">
              Nhấn Enter để thêm ngay vào Inbox
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="VD: Mai 14h học Toán chương 3 90p #urgent, Thứ 6 nộp tiểu luận Triết học 2 tiếng..."
              disabled={isParsingQuick}
              className="flex-1 rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-xs h-11"
            />
            <Button
              type="submit"
              disabled={!quickInput.trim() || isParsingQuick}
              className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs h-11 px-5 space-x-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isParsingQuick ? "Đang xử lý..." : "Thêm vào Inbox"}</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-[#73927d] dark:text-[#8ba393] pt-0.5">
            <span>Cú pháp hỗ trợ:</span>
            <span className="font-mono bg-[#f4f8f5] dark:bg-[#101c14] px-1.5 py-0.5 rounded">#urgent / #high</span>
            <span className="font-mono bg-[#f4f8f5] dark:bg-[#101c14] px-1.5 py-0.5 rounded">90p / 2 tiếng</span>
            <span className="font-mono bg-[#f4f8f5] dark:bg-[#101c14] px-1.5 py-0.5 rounded">mai / thứ 5 / 15:00</span>
          </div>
        </form>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Inbox className="w-3.5 h-3.5 text-blue-600" />
            <span>Hộp thư đến (Inbox)</span>
          </div>
          <div className="text-xl font-bold text-[#192e22] dark:text-[#f0f7f2]">{inboxCount}</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Đang thực hiện</span>
          </div>
          <div className="text-xl font-bold text-[#192e22] dark:text-[#f0f7f2]">{inProgressCount}</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã hoàn thành</span>
          </div>
          <div className="text-xl font-bold text-[#192e22] dark:text-[#f0f7f2]">{doneCount}</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Quá hạn</span>
          </div>
          <div className={`text-xl font-bold ${overdueCount > 0 ? "text-rose-600" : "text-[#192e22] dark:text-[#f0f7f2]"}`}>
            {overdueCount}
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#73927d] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm task..."
            className="pl-9 rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-xs h-9"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 py-1.5 text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] focus:outline-none"
          >
            <option value="ALL">Tất cả môn học</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 py-1.5 text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] focus:outline-none"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="URGENT">Khẩn cấp (Urgent)</option>
            <option value="HIGH">Cao (High)</option>
            <option value="MEDIUM">Trung bình (Medium)</option>
            <option value="LOW">Thấp (Low)</option>
          </select>
        </div>
      </div>

      {/* Main Views */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-10 bg-[#e8f0eb] dark:bg-[#203326] rounded-xl animate-pulse" />
              <div className="h-32 bg-[#e8f0eb] dark:bg-[#203326] rounded-2xl animate-pulse" />
              <div className="h-32 bg-[#e8f0eb] dark:bg-[#203326] rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : viewMode === "board" ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const Icon = col.icon;
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] p-3.5 space-y-3 shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-xl ${col.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2]">
                      {col.label}
                    </span>
                    <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 font-bold border-[#dbe7dd]">
                      {colTasks.length}
                    </Badge>
                  </div>

                  <button
                    onClick={() => {
                      setTaskToEdit({ status: col.id });
                      setIsModalOpen(true);
                    }}
                    title={`Thêm task vào ${col.label}`}
                    className="p-1 rounded-lg text-[#73927d] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Cards Column */}
                <div className="space-y-2.5 min-h-[140px]">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#73927d] italic">
                      Trống
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={(t) => {
                          setTaskToEdit(t);
                          setIsModalOpen(true);
                        }}
                        onDelete={handleDeleteTask}
                        onToggleComplete={(t) => handleToggleComplete(t)}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-12 text-center">
              <CheckSquare className="w-8 h-8 text-[#73927d] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Không tìm thấy task nào
              </p>
              <p className="text-[11px] text-[#526b5c] mt-1">
                Hãy thêm task mới hoặc thay đổi bộ lọc tìm kiếm.
              </p>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onToggleComplete={(t) => handleToggleComplete(t)}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        taskToEdit={taskToEdit}
        subjects={subjects}
        allTasks={tasks}
      />

      {/* Dependency Warning Dialog */}
      <TaskDependencyAlertModal
        open={dependencyAlert.open}
        onClose={() => setDependencyAlert({ open: false, task: null, blockingTasks: [] })}
        taskTitle={dependencyAlert.task?.title || ""}
        blockingTasks={dependencyAlert.blockingTasks}
        onForceConfirm={() => {
          if (dependencyAlert.task) {
            handleToggleComplete(dependencyAlert.task, true);
          }
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DailyTaskItem } from "@/components/tasks/daily-task-item";
import { QuickTaskInput } from "@/components/tasks/quick-task-input";
import { DailyClosureModal } from "@/components/tasks/daily-closure-modal";
import { DisciplineHistoryView } from "@/components/tasks/discipline-history-view";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDependencyAlertModal } from "@/components/tasks/task-dependency-alert-modal";
import { toast } from "sonner";
import {
  Sun,
  Star,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Layers,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Inbox,
  Clock,
} from "lucide-react";
import {
  formatDateDisplay,
  getNextDayKey,
  getPrevDayKey,
  getTodayKey,
} from "@/lib/tasks/smart-todo";

type ActiveListType =
  | "today"
  | "important"
  | "planned"
  | "pending"
  | "completed"
  | "all"
  | "history";

export default function TasksPage() {
  // Navigation & View State
  const [activeList, setActiveList] = useState<ActiveListType>("today");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [todayKey, setTodayKey] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Data State
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [daySummary, setDaySummary] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    uncompletedTasks: 0,
    completionRate: 0,
  });
  const [unclosedPastDays, setUnclosedPastDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("ALL");

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [closureDateTarget, setClosureDateTarget] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

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

  // Load Tasks Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (activeList === "today") {
        params.set("list", "today");
        params.set("dateKey", selectedDateKey);
      } else {
        params.set("list", activeList);
      }

      if (selectedSubjectFilter !== "ALL") {
        params.set("subjectId", selectedSubjectFilter);
      }
      if (selectedPriorityFilter !== "ALL") {
        params.set("priority", selectedPriorityFilter);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const [resTasks, resSubjects, resClosure] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`).then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch(`/api/tasks/day-closure?dateKey=${selectedDateKey}`).then((r) =>
          r.json()
        ),
      ]);

      if (resTasks.tasks) setTasks(resTasks.tasks);
      if (resTasks.stats) setStats(resTasks.stats);
      if (resTasks.todayKey) {
        setTodayKey(resTasks.todayKey);
        if (!selectedDateKey) setSelectedDateKey(resTasks.todayKey);
      }
      if (resTasks.daySummary) setDaySummary(resTasks.daySummary);
      else if (resClosure.daySummary) setDaySummary(resClosure.daySummary);

      if (resSubjects.subjects) setSubjects(resSubjects.subjects);
      if (resClosure.unclosedPastDays) {
        setUnclosedPastDays(resClosure.unclosedPastDays);
      }
    } catch (err) {
      console.error("Error loading tasks data:", err);
      toast.error("Không thể tải danh sách nhiệm vụ");
    } finally {
      setLoading(false);
    }
  }, [
    activeList,
    selectedDateKey,
    selectedSubjectFilter,
    selectedPriorityFilter,
    searchQuery,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick Add Task
  const handleQuickAdd = async (data: {
    title: string;
    priority?: string;
    estimatedMinutes?: number;
    subjectId?: string | null;
    isImportant?: boolean;
  }) => {
    try {
      const scheduledDate =
        activeList === "today" ? selectedDateKey : todayKey;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          scheduledDate,
          status: "TODO",
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Không thể tạo nhiệm vụ");

      toast.success("Đã thêm nhiệm vụ mới");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo nhiệm vụ");
    }
  };

  // Optimistic Toggle Complete
  const handleToggleComplete = async (task: any, force = false) => {
    const nextCompleted = !task.isCompleted;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? new Date() : null,
              status: nextCompleted ? "DONE" : "TODO",
            }
          : t
      )
    );

    // Update stats optimistically
    setStats((prev) => {
      const newDone = nextCompleted
        ? prev.completedTasks + 1
        : Math.max(0, prev.completedTasks - 1);
      const newUncompleted = Math.max(0, prev.totalTasks - newDone);
      const newRate =
        prev.totalTasks > 0
          ? Math.round((newDone / prev.totalTasks) * 1000) / 10
          : 0;
      return {
        ...prev,
        completedTasks: newDone,
        uncompletedTasks: newUncompleted,
        completionRate: newRate,
      };
    });

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted, force }),
      });

      const data = await res.json();

      if (res.status === 409 && data.blockingTasks) {
        // Rollback optimistic update
        await loadData();
        setDependencyAlert({
          open: true,
          task,
          blockingTasks: data.blockingTasks,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || "Lỗi cập nhật");
      }

      // Soft reload to keep day summary in sync
      const resSummary = await fetch(
        `/api/tasks/day-closure?dateKey=${selectedDateKey}`
      ).then((r) => r.json());
      if (resSummary.daySummary) setDaySummary(resSummary.daySummary);
      if (resSummary.stats) setStats(resSummary.stats);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật nhiệm vụ");
      await loadData(); // rollback
    }
  };

  // Optimistic Toggle Important (Star)
  const handleToggleImportant = async (task: any) => {
    const nextImportant = !task.isImportant;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isImportant: nextImportant } : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isImportant: nextImportant }),
      });

      if (!res.ok) {
        throw new Error("Lỗi cập nhật đánh dấu quan trọng");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật");
      await loadData(); // rollback
    }
  };

  // Direct Rollover
  const handleRolloverDirect = async (task: any, targetDateKey: string) => {
    try {
      const res = await fetch("/api/tasks/rollover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: [task.id],
          targetDateKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể chuyển ngày");

      toast.success(
        `Đã chuyển nhiệm vụ "${task.title}" sang ${formatDateDisplay(
          targetDateKey
        )}`
      );
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi chuyển ngày");
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi khi xóa nhiệm vụ");

      toast.success("Đã xóa nhiệm vụ");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa nhiệm vụ");
    }
  };

  // Change Date Navigation
  const handlePrevDay = () => {
    setSelectedDateKey(getPrevDayKey(selectedDateKey));
  };

  const handleNextDay = () => {
    setSelectedDateKey(getNextDayKey(selectedDateKey));
  };

  const handleJumpToToday = () => {
    setSelectedDateKey(todayKey);
  };

  // Open Closure Modal
  const openClosureModalFor = (date: string) => {
    setClosureDateTarget(date);
    setIsClosureModalOpen(true);
  };

  // Filter tasks based on search & selectors for Kanban
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSubject =
        selectedSubjectFilter === "ALL" ||
        t.subjectId === selectedSubjectFilter;
      const matchesPriority =
        selectedPriorityFilter === "ALL" ||
        t.priority === selectedPriorityFilter;
      return matchesSearch && matchesSubject && matchesPriority;
    });
  }, [tasks, searchQuery, selectedSubjectFilter, selectedPriorityFilter]);

  // Microsoft To Do Lists Definition
  const todoLists = [
    {
      id: "today",
      label: "Hôm nay",
      subLabel: "My Day",
      icon: Sun,
      color: "text-amber-500",
      activeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200",
    },
    {
      id: "important",
      label: "Quan trọng",
      subLabel: "Important",
      icon: Star,
      color: "text-yellow-500",
      activeBg: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200 border-yellow-200",
    },
    {
      id: "planned",
      label: "Đã lên lịch",
      subLabel: "Planned",
      icon: CalendarDays,
      color: "text-blue-500",
      activeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-200",
    },
    {
      id: "pending",
      label: "Chưa hoàn thành",
      subLabel: "Pending",
      icon: ListTodo,
      color: "text-rose-500",
      activeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200",
    },
    {
      id: "completed",
      label: "Đã hoàn thành",
      subLabel: "Completed",
      icon: CheckCircle2,
      color: "text-emerald-600",
      activeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200",
    },
    {
      id: "all",
      label: "Tất cả nhiệm vụ",
      subLabel: "All Tasks",
      icon: Layers,
      color: "text-slate-600",
      activeBg: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300",
    },
    {
      id: "history",
      label: "Lịch sử kỷ luật",
      subLabel: "Discipline",
      icon: TrendingUp,
      color: "text-[var(--mint-dark)]",
      activeBg: "bg-[var(--mint-bg)] text-[var(--mint-dark)] border-[#b7d8c3]",
    },
  ];

  // Kanban Columns
  const kanbanColumns = [
    { id: "INBOX", label: "Inbox", icon: Inbox, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
    { id: "TODO", label: "Cần làm (To Do)", icon: ListTodo, color: "text-[var(--mint-dark)] bg-[var(--mint-bg)]" },
    { id: "IN_PROGRESS", label: "Đang làm", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { id: "DONE", label: "Hoàn thành", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Alert banner for unclosed past days (Part 4 & 8) */}
      {unclosedPastDays.length > 0 && activeList !== "history" && (
        <div className="p-4 rounded-[24px] bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Bạn có {unclosedPastDays.length} ngày trước chưa chốt sổ kỷ luật!
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Ngày gần nhất: <strong>{formatDateDisplay(unclosedPastDays[0].dateKey)}</strong> (còn{" "}
                <strong>{unclosedPastDays[0].uncompletedTasks}</strong> nhiệm vụ chưa hoàn thành).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pl-10 sm:pl-0">
            <Button
              size="sm"
              onClick={() => openClosureModalFor(unclosedPastDays[0].dateKey)}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-3.5 shadow-2xs cursor-pointer"
            >
              Chốt ngày ngay
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Microsoft To Do Sidebar + Right Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Microsoft To Do Lists Menu */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-2xs">
            <div className="p-2 pb-3 border-b border-[var(--border)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2">
                Danh sách công việc
              </span>
            </div>

            <nav className="space-y-1 mt-2">
              {todoLists.map((list) => {
                const Icon = list.icon;
                const isActive = activeList === list.id;
                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      setActiveList(list.id as any);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? `${list.activeBg} font-bold shadow-2xs border`
                        : "text-[var(--text-subtle)] hover:bg-[var(--mint-soft)] hover:text-[var(--text-ink)] dark:hover:text-[#f0f7f2]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${list.color}`} />
                      <span className="truncate">{list.label}</span>
                    </div>

                    {list.id === "today" && stats.totalTasks > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] font-bold">
                        {stats.completedTasks}/{stats.totalTasks}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Quick Subject Filter in sidebar */}
          <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-2xs hidden lg:block">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
              <span>Lọc theo môn học</span>
              <Filter className="w-3.5 h-3.5" />
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedSubjectFilter("ALL")}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  selectedSubjectFilter === "ALL"
                    ? "bg-[var(--mint-bg)] text-[var(--mint-dark)] font-bold"
                    : "text-[var(--text-subtle)] hover:bg-[var(--mint-bg)]"
                }`}
              >
                Tất cả môn học
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectFilter(sub.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    selectedSubjectFilter === sub.id
                      ? "bg-[var(--mint-bg)] text-[var(--mint-dark)] font-bold"
                      : "text-[var(--text-subtle)] hover:bg-[var(--mint-bg)]"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#2d6a4f" }}
                    />
                    <span className="truncate">{sub.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Master Workspace */}
        <div className="lg:col-span-9 space-y-5">
          {activeList === "history" ? (
            /* Discipline History Component (Part 5) */
            <DisciplineHistoryView
              onTriggerClosureModal={(dKey) => openClosureModalFor(dKey)}
            />
          ) : (
            <>
              {/* Workspace Header Card */}
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: View title & Date navigator */}
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] text-xs font-bold mb-2">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {todoLists.find((l) => l.id === activeList)?.label.toUpperCase()}
                      </span>
                    </div>

                    {activeList === "today" ? (
                      /* Date Navigation Bar */
                      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-ink)]">
                          {formatDateDisplay(selectedDateKey, todayKey)}
                        </h1>

                        <div className="flex items-center space-x-1 pl-2">
                          <button
                            onClick={handlePrevDay}
                            title="Ngày trước"
                            className="p-1.5 rounded-full hover:bg-[var(--mint-soft)] text-[var(--text-muted)] cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          {selectedDateKey !== todayKey && (
                            <button
                              onClick={handleJumpToToday}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--mint-bg)] text-[var(--mint-dark)] cursor-pointer"
                            >
                              Hôm nay
                            </button>
                          )}
                          <button
                            onClick={handleNextDay}
                            title="Ngày sau"
                            className="p-1.5 rounded-full hover:bg-[var(--mint-soft)] text-[var(--text-muted)] cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Quick native date jump */}
                          <input
                            type="date"
                            value={selectedDateKey}
                            onChange={(e) =>
                              e.target.value &&
                              setSelectedDateKey(e.target.value)
                            }
                            className="text-xs px-2 py-1 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] cursor-pointer ml-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-ink)]">
                        {todoLists.find((l) => l.id === activeList)?.label}
                      </h1>
                    )}

                    <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                      {activeList === "today"
                        ? "Quản lý nhiệm vụ tập trung theo ngày, ghi nhận kỷ luật trung thực và chuyển tiếp thông minh."
                        : "Nhiệm vụ được đồng bộ trực tiếp từ một nguồn dữ liệu duy nhất trong hệ thống."}
                    </p>
                  </div>

                  {/* Right: Actions (Chốt ngày, View Switcher, Add Task) */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    {/* Closure Button on Today list */}
                    {activeList === "today" && (
                      <Button
                        onClick={() => openClosureModalFor(selectedDateKey)}
                        className={`rounded-2xl text-xs font-bold h-9 px-3.5 space-x-1.5 cursor-pointer shadow-sm ${
                          daySummary?.isClosed
                            ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                            : "bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {daySummary?.isClosed ? "Đã chốt sổ (Xem lại)" : "Chốt ngày"}
                        </span>
                      </Button>
                    )}

                    {/* View Switcher: List vs Board */}
                    <div className="flex items-center space-x-1 p-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs shadow-2xs">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          viewMode === "list"
                            ? "bg-[var(--mint)] text-white shadow-2xs"
                            : "text-[var(--text-subtle)] hover:bg-[var(--mint-bg)]"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>List</span>
                      </button>
                      <button
                        onClick={() => setViewMode("board")}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                          viewMode === "board"
                            ? "bg-[var(--mint)] text-white shadow-2xs"
                            : "text-[var(--text-subtle)] hover:bg-[var(--mint-bg)]"
                        }`}
                      >
                        <Kanban className="w-3.5 h-3.5" />
                        <span>Board</span>
                      </button>
                    </div>

                    {/* Full Task Modal Button */}
                    <Button
                      onClick={() => {
                        setTaskToEdit({
                          scheduledDate:
                            activeList === "today"
                              ? selectedDateKey
                              : todayKey,
                        });
                        setIsTaskModalOpen(true);
                      }}
                      className="rounded-2xl bg-[var(--mint-dark)] hover:bg-[var(--text-ink)] text-white font-bold text-xs h-9 px-3 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Chi tiết</span>
                    </Button>
                  </div>
                </div>

                {/* Today's Completion Progress Bar */}
                {activeList === "today" && (
                  <div className="pt-2 border-t border-[var(--border)]/60 dark:border-[#263d2e] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[var(--text-subtle)]">
                          Tiến độ hoàn thành:
                        </span>
                        <strong className="text-[var(--text-ink)]">
                          {stats.completedTasks}/{stats.totalTasks} nhiệm vụ ({stats.completionRate}%)
                        </strong>
                      </div>

                      {daySummary?.isClosed ? (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ngày này đã chốt kết quả</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {stats.uncompletedTasks} nhiệm vụ đang chờ
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-[#dbe7dd]/60 dark:bg-[#263d2e] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#2d6a4f] to-[#52b788] h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, stats.completionRate)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Task Input Bar (Microsoft To Do style) */}
              <QuickTaskInput
                onAddTask={handleQuickAdd}
                subjects={subjects}
                currentDateDisplay={
                  activeList === "today"
                    ? formatDateDisplay(selectedDateKey, todayKey)
                    : undefined
                }
                isImportantView={activeList === "important"}
              />

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm nhiệm vụ..."
                    className="pl-9 rounded-2xl border-[var(--border)] text-xs h-9"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedPriorityFilter}
                    onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-ink)] focus:outline-none"
                  >
                    <option value="ALL">Tất cả ưu tiên</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="LOW">Thấp (Low)</option>
                  </select>
                </div>
              </div>

              {/* Content View: List or Board */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl bg-[#e8f0eb] dark:bg-[#203326] animate-pulse"
                    />
                  ))}
                </div>
              ) : viewMode === "list" ? (
                /* Microsoft To Do List View */
                <div className="space-y-2.5">
                  {filteredTasks.length === 0 ? (
                    <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
                      <CheckCircle2 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-60" />
                      <h3 className="text-sm font-bold text-[var(--text-ink)]">
                        Không có nhiệm vụ nào trong danh sách này
                      </h3>
                      <p className="text-xs text-[var(--text-subtle)] mt-1">
                        Hãy nhập nhanh một nhiệm vụ ở thanh trên và nhấn Enter để lưu!
                      </p>
                    </Card>
                  ) : (
                    filteredTasks.map((task) => (
                      <DailyTaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onToggleImportant={handleToggleImportant}
                        onEdit={(t) => {
                          setTaskToEdit(t);
                          setIsTaskModalOpen(true);
                        }}
                        onDelete={handleDeleteTask}
                        onRolloverDirect={handleRolloverDirect}
                        selectedDateKey={selectedDateKey}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* Kanban Board View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                  {kanbanColumns.map((col) => {
                    const Icon = col.icon;
                    const colTasks = filteredTasks.filter(
                      (t) => t.status === col.id
                    );

                    return (
                      <div
                        key={col.id}
                        className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-muted)] p-3.5 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-xl ${col.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs text-[var(--text-ink)]">
                              {col.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="rounded-full text-[10px] px-2 py-0 font-bold border-[var(--border)]"
                            >
                              {colTasks.length}
                            </Badge>
                          </div>

                          <button
                            onClick={() => {
                              setTaskToEdit({
                                status: col.id,
                                scheduledDate:
                                  activeList === "today"
                                    ? selectedDateKey
                                    : todayKey,
                              });
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--mint-bg)] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2.5 min-h-[140px]">
                          {colTasks.length === 0 ? (
                            <div className="py-8 text-center text-[11px] text-[var(--text-muted)] italic">
                              Trống
                            </div>
                          ) : (
                            colTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={(t) => {
                                  setTaskToEdit(t);
                                  setIsTaskModalOpen(true);
                                }}
                                onDelete={handleDeleteTask}
                                onToggleComplete={(t) =>
                                  handleToggleComplete(t)
                                }
                                onStatusChange={async (taskId, newStatus) => {
                                  await fetch(`/api/tasks/${taskId}`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      status: newStatus,
                                    }),
                                  });
                                  await loadData();
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={loadData}
        taskToEdit={taskToEdit}
        subjects={subjects}
        allTasks={tasks}
      />

      {/* Daily Closure Modal (Part 3 & 4) */}
      <DailyClosureModal
        open={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        dateKey={closureDateTarget}
        stats={stats}
        uncompletedTasks={tasks.filter((t) => !t.isCompleted)}
        onSuccess={loadData}
        isAlreadyClosed={daySummary?.isClosed}
        closedAt={daySummary?.closedAt}
      />

      {/* Dependency Warning Dialog */}
      <TaskDependencyAlertModal
        open={dependencyAlert.open}
        onClose={() =>
          setDependencyAlert({ open: false, task: null, blockingTasks: [] })
        }
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

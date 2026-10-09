"use client";

import React, { useState } from "react";
import {
  Check,
  Star,
  Clock,
  Calendar,
  Play,
  RotateCcw,
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowRight,
  AlertCircle,
  FileText,
} from "lucide-react";
import { usePipTimer } from "@/components/timer/pip-timer-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNextDayKey, formatDateDisplay } from "@/lib/tasks/smart-todo";
import { toast } from "sonner";

export interface DailyTaskItemProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    estimatedMinutes: number;
    deadline?: string | Date | null;
    scheduledDate?: string | null;
    originalDate?: string | null;
    isImportant: boolean;
    isCompleted: boolean;
    completedAt?: string | Date | null;
    isRollover: boolean;
    rolloverCount: number;
    subject?: {
      id: string;
      name: string;
      code?: string | null;
      color: string;
    } | null;
  };
  onToggleComplete: (task: any) => void;
  onToggleImportant: (task: any) => void;
  onEdit: (task: any) => void;
  onDelete: (id: string) => void;
  onRolloverDirect?: (task: any, targetDateKey: string) => void;
  selectedDateKey?: string;
}

export function DailyTaskItem({
  task,
  onToggleComplete,
  onToggleImportant,
  onEdit,
  onDelete,
  onRolloverDirect,
  selectedDateKey,
}: DailyTaskItemProps) {
  const { startTimer } = usePipTimer();
  const [isHovered, setIsHovered] = useState(false);

  const handleStartStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sub = task.subject || {
      id: "general",
      name: task.title,
      code: "TASK",
      color: "#2d6a4f",
    };

    startTimer(
      {
        id: sub.id,
        name: task.subject ? sub.name : task.title,
        code: sub.code || "TASK",
        color: sub.color || "#2d6a4f",
      },
      {
        taskId: task.id,
        targetMinutes: task.estimatedMinutes || 30,
      }
    );
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
            Gấp 🔥
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
            Cao ⚡
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium text-[10px]">
            Thấp
          </span>
        );
      default:
        return null;
    }
  };

  const nextDayKey = getNextDayKey(task.scheduledDate || selectedDateKey || new Date().toISOString().slice(0, 10));

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-2xl border transition-all duration-150 ${
        task.isCompleted
          ? "bg-[#f8fbf8]/70 dark:bg-[#132217]/50 border-[#dbe7dd]/70 dark:border-[#263d2e]/60 opacity-80"
          : "bg-white dark:bg-[#17261c] border-[#dbe7dd] dark:border-[#263d2e] hover:border-[#b7d8c3] hover:shadow-2xs"
      }`}
    >
      {/* Left: Circular Checkbox + Task Information */}
      <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
        {/* Microsoft To Do style circular checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 ${
            task.isCompleted
              ? "bg-[#2d6a4f] border-[#2d6a4f] text-white shadow-2xs scale-95"
              : "border-[#8fa897] dark:border-[#4d6b56] hover:border-[#2d6a4f] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024]"
          }`}
          title={task.isCompleted ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
        >
          {task.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        {/* Task Title & Meta tags */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span
              onClick={() => onEdit(task)}
              className={`text-xs sm:text-sm font-semibold tracking-tight cursor-pointer hover:text-[#2d6a4f] dark:hover:text-[#52b788] transition-colors truncate max-w-full ${
                task.isCompleted
                  ? "line-through text-[#73927d] dark:text-[#6a8372]"
                  : "text-[#192e22] dark:text-[#f0f7f2]"
              }`}
            >
              {task.title}
            </span>

            {/* Badges row */}
            <div className="inline-flex items-center space-x-1.5 flex-wrap gap-y-1">
              {/* Subject Badge */}
              {task.subject && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: task.subject.color || "#2d6a4f" }}
                >
                  {task.subject.code ? `[${task.subject.code}] ` : ""}
                  {task.subject.name}
                </span>
              )}

              {/* Priority Badge */}
              {getPriorityBadge(task.priority)}

              {/* Rollover Badge */}
              {task.isRollover && (
                <span
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800/40"
                  title={`Chuyển tiếp từ ngày ${task.originalDate || "cũ"} (${task.rolloverCount} lần)`}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Chuyển tiếp {task.rolloverCount > 1 ? `(${task.rolloverCount})` : ""}</span>
                </span>
              )}
            </div>
          </div>

          {/* Sub-meta details: notes, scheduled date, deadline */}
          <div className="flex items-center space-x-3 text-[11px] text-[#73927d] dark:text-[#8ba393] mt-1 flex-wrap gap-y-1">
            {task.description && (
              <span className="flex items-center space-x-1 truncate max-w-xs" title={task.description}>
                <FileText className="w-3 h-3 text-[#526b5c] shrink-0" />
                <span className="truncate">{task.description}</span>
              </span>
            )}

            {task.estimatedMinutes > 0 && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#2d6a4f] dark:text-[#52b788]" />
                <span>{task.estimatedMinutes}p</span>
              </span>
            )}

            {task.deadline && (
              <span className="flex items-center space-x-1 text-amber-700 dark:text-amber-300 font-medium">
                <Calendar className="w-3 h-3" />
                <span>Hạn: {new Date(task.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
              </span>
            )}

            {task.isCompleted && task.completedAt && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Xong: {new Date(task.completedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions (Timer, Star, Menu) */}
      <div className="flex items-center space-x-1 shrink-0">
        {/* Fast Study Timer Button */}
        {!task.isCompleted && (
          <Button
            size="sm"
            onClick={handleStartStudy}
            className="h-7 px-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-[10px] font-bold space-x-1 cursor-pointer shadow-2xs transition-all active:scale-95"
            title="Bật Timer tập trung cho nhiệm vụ này"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span className="hidden sm:inline">Học ngay</span>
          </Button>
        )}

        {/* Star Button for Important list */}
        <button
          type="button"
          onClick={() => onToggleImportant(task)}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            task.isImportant
              ? "text-amber-500 hover:text-amber-600"
              : "text-[#a3bda9] hover:text-amber-500 hover:bg-[#eef5f0] dark:hover:bg-[#1d3024]"
          }`}
          title={task.isImportant ? "Bỏ đánh dấu quan trọng" : "Đánh dấu quan trọng"}
        >
          <Star className={`w-4 h-4 ${task.isImportant ? "fill-amber-500" : ""}`} />
        </button>

        {/* More Actions Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-full text-[#73927d] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] cursor-pointer"
              title="Thao tác khác"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] p-1.5 text-xs w-48 shadow-lg">
            <DropdownMenuItem onClick={() => onEdit(task)} className="rounded-xl cursor-pointer">
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              <span>Chỉnh sửa chi tiết</span>
            </DropdownMenuItem>

            {onRolloverDirect && !task.isCompleted && (
              <DropdownMenuItem
                onClick={() => onRolloverDirect(task, nextDayKey)}
                className="rounded-xl cursor-pointer text-purple-700 dark:text-purple-300"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-2" />
                <span>Chuyển sang ngày mai</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-1 bg-[#dbe7dd]/60 dark:bg-[#263d2e]" />

            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="rounded-xl cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span>Xóa nhiệm vụ</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

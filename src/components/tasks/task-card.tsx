"use client";

import React, { useMemo } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Clock,
  Calendar,
  AlertTriangle,
  Lock,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { usePipTimer } from "../timer/pip-timer-provider";

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  onStatusChange,
}: TaskCardProps) {
  const { startTimer } = usePipTimer();

  // Check if blocked by incomplete prerequisites
  const incompletePrereqs = (task.dependencies || []).filter(
    (dep: any) => !dep.prerequisite?.isCompleted && dep.prerequisite?.status !== "DONE"
  );
  const isBlocked = incompletePrereqs.length > 0;

  const handleStartStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sub = task.subject || {
      id: "general",
      name: "Tự do: " + task.title,
      color: "#2d6a4f",
    };

    startTimer(
      {
        id: sub.id,
        name: task.subject ? sub.name : task.title,
        code: sub.code,
        color: sub.color || "#2d6a4f",
      },
      {
        taskId: task.id,
        targetMinutes: task.estimatedMinutes || 45,
      }
    );
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">Gấp 🔥</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">Cao ⚡</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium text-[10px]">Thấp</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1d3827] dark:text-[#86e2a8] font-semibold text-[10px]">Trung bình</span>;
    }
  };

  const isOverdue = useMemo(() => {
    if (!task.deadline || task.isCompleted) return false;
    return new Date(task.deadline).getTime() < new Date().getTime();
  }, [task.deadline, task.isCompleted]);

  return (
    <Card className={`rounded-[22px] border transition-all p-3.5 shadow-2xs group hover:shadow-sm ${
      task.isCompleted
        ? "border-[#dbe7dd] dark:border-[#263d2e] bg-[#fbfdfc] dark:bg-[#142318]/60 opacity-75"
        : isBlocked
        ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10"
        : "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]"
    }`}>
      {/* Top row: Subject, Priority & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-1.5 truncate">
          {task.subject ? (
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs truncate max-w-[130px]"
              style={{ backgroundColor: task.subject.color || "#2d6a4f" }}
            >
              <span>{task.subject.code ? `[${task.subject.code}] ` : ""}</span>
              <span className="truncate">{task.subject.name}</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-medium">
              Chung
            </span>
          )}
          {getPriorityBadge(task.priority)}
        </div>

        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            title="Chỉnh sửa task"
            className="p-1 rounded-lg text-[#73927d] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] hover:text-[#2d6a4f] cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Xóa task"
            className="p-1 rounded-lg text-[#a3a86c] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Checkbox + Title */}
      <div className="flex items-start space-x-2.5">
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
            task.isCompleted
              ? "bg-[#2d6a4f] border-[#2d6a4f] text-white"
              : isBlocked
              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40"
              : "border-[#b0c4b6] dark:border-[#385642] hover:border-[#2d6a4f]"
          }`}
          title={isBlocked ? "Bị chặn bởi task khác" : task.isCompleted ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
        >
          {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
          {!task.isCompleted && isBlocked && <Lock className="w-2.5 h-2.5 text-amber-600" />}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className={`text-xs font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] leading-snug ${
            task.isCompleted ? "line-through opacity-70" : ""
          }`}>
            {task.title}
          </h4>

          {task.description && (
            <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Dependency Warning */}
      {isBlocked && (
        <div className="mt-2.5 p-2 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center space-x-1.5 text-[10px] text-amber-900 dark:text-amber-200">
          <Lock className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="truncate">
            Cần xong trước: <strong>{incompletePrereqs.map((d: any) => d.prerequisite?.title).join(", ")}</strong>
          </span>
        </div>
      )}

      {/* Bottom Row: Deadline, Time, Fast Start button */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] text-[10px]">
        <div className="flex items-center space-x-2 text-[#73927d] dark:text-[#8ba393]">
          <span className="flex items-center space-x-1 font-semibold">
            <Clock className="w-3 h-3 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>{task.estimatedMinutes || 60}p</span>
          </span>

          {task.deadline && (
            <span
              className={`flex items-center space-x-1 font-semibold ${
                isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : ""
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(task.deadline).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          )}
        </div>

        {/* Quick Study Button */}
        {!task.isCompleted && (
          <Button
            size="sm"
            onClick={handleStartStudy}
            className="h-7 px-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-[10px] font-bold space-x-1 cursor-pointer shadow-2xs"
            title="Bật Timer tập trung cho task này"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>Học ngay</span>
          </Button>
        )}
      </div>
    </Card>
  );
}

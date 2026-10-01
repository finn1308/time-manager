"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Play, Edit2, Target, Trash2, Plus, Sparkles } from "lucide-react";
import { usePipTimer } from "../timer/pip-timer-provider";
import { SubjectDialog } from "./subject-dialog";
import { GoalDialog } from "./goal-dialog";
import { useRouter } from "next/navigation";

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
  color: string;
  description: string | null;
  studyGoals: Array<{
    id: string;
    targetHours: number;
    priority: number;
    isAutoAlloc: boolean;
    notes: string | null;
    startDate: string;
    endDate: string;
  }>;
  totalLoggedMinutes: number;
}

interface SubjectTableProps {
  subjects: SubjectItem[];
}

export function SubjectTable({ subjects }: SubjectTableProps) {
  const router = useRouter();
  const { startTimer } = usePipTimer();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa môn học "${name}" và toàn bộ lịch liên quan?`)) return;
    try {
      await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      alert("Không thể xóa môn học");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#787774] dark:text-[#9b9a97]">
          Danh sách {subjects.length} môn học & tiến độ hoàn thành chỉ tiêu
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="space-x-1.5 text-xs"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Đặt chỉ tiêu giờ học</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm môn học</span>
          </Button>
        </div>
      </div>

      {/* Notion-style Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#f7f6f3] dark:bg-[#252525] text-[#787774] dark:text-[#9b9a97]">
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Môn học</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Mục tiêu</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Đã học</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider min-w-[140px]">Tiến độ</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Ưu tiên AI</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Phân bổ</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9e9e7] dark:divide-[#2e2e2e]">
            {subjects.map((sub) => {
              const activeGoal = sub.studyGoals[0];
              const target = activeGoal ? activeGoal.targetHours : 0;
              const loggedHours = Math.round((sub.totalLoggedMinutes / 60) * 10) / 10;
              const percent = target > 0 ? Math.min(100, Math.round((loggedHours / target) * 100)) : 0;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-[#fbfbfa] dark:hover:bg-[#242424] transition-colors"
                >
                  {/* Subject Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: sub.color }}
                      />
                      <div>
                        <div className="font-semibold text-sm text-[#171717] dark:text-white flex items-center space-x-1.5">
                          <span>{sub.name}</span>
                          {sub.code && (
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[#787774] font-mono">
                              {sub.code}
                            </span>
                          )}
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] truncate max-w-xs mt-0.5">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Target Hours */}
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {target > 0 ? `${target}h` : <span className="text-[#9b9a97] italic">Chưa đặt</span>}
                  </td>

                  {/* Logged Hours */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {loggedHours}h
                  </td>

                  {/* Progress Bar */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#787774]">
                        <span>{percent}%</span>
                        {target > 0 && <span>còn {Math.max(0, target - loggedHours).toFixed(1)}h</span>}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: sub.color,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 text-center">
                    {activeGoal ? (
                      <Badge
                        variant={
                          activeGoal.priority >= 4
                            ? "red"
                            : activeGoal.priority === 3
                            ? "yellow"
                            : "default"
                        }
                      >
                        Ưu tiên {activeGoal.priority}/5
                      </Badge>
                    ) : (
                      <span className="text-[#9b9a97]">-</span>
                    )}
                  </td>

                  {/* AI Alloc Mode */}
                  <td className="py-3 px-4 text-center">
                    {activeGoal?.isAutoAlloc ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Auto</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#787774]">Thủ công</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() =>
                          startTimer({
                            id: sub.id,
                            name: sub.name,
                            code: sub.code,
                            color: sub.color,
                          })
                        }
                        title="Vào học ngay môn này (Bật Timer)"
                        className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        title="Sửa môn học"
                        className="p-1.5 rounded-md hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#787774] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        title="Xóa môn học"
                        className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#787774] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {subjects.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-[#9b9a97]">
                  Chưa có môn học nào. Hãy bấm "Thêm môn học" để bắt đầu!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isSubjectModalOpen && (
        <SubjectDialog
          open={isSubjectModalOpen}
          onClose={() => {
            setIsSubjectModalOpen(false);
            setEditingSubject(null);
          }}
          editingSubject={editingSubject}
        />
      )}

      {isGoalModalOpen && (
        <GoalDialog
          open={isGoalModalOpen}
          onClose={() => {
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
          subjects={subjects}
          editingGoal={editingGoal}
        />
      )}
    </div>
  );
}

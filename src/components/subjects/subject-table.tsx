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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Danh sách {subjects.length} môn học & tiến độ hoàn thành chỉ tiêu
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            variant="pill"
            size="sm"
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="space-x-1.5 text-xs font-bold"
          >
            <Target className="w-3.5 h-3.5 text-purple-600" />
            <span>Đặt chỉ tiêu giờ học</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="space-x-1.5 text-xs font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm môn học</span>
          </Button>
        </div>
      </div>

      {/* Modern Rounded Table Container (rounded-[28px]) */}
      <div className="overflow-x-auto rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 soft-card-shadow">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Môn học</th>
              <th className="py-3.5 px-4 text-right">Mục tiêu</th>
              <th className="py-3.5 px-4 text-right">Đã học</th>
              <th className="py-3.5 px-4 min-w-[150px]">Tiến độ</th>
              <th className="py-3.5 px-4 text-center">Ưu tiên AI</th>
              <th className="py-3.5 px-4 text-center">Phân bổ</th>
              <th className="py-3.5 px-5 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {subjects.map((sub) => {
              const activeGoal = sub.studyGoals[0];
              const target = activeGoal ? activeGoal.targetHours : 0;
              const loggedHours = Math.round((sub.totalLoggedMinutes / 60) * 10) / 10;
              const percent = target > 0 ? Math.min(100, Math.round((loggedHours / target) * 100)) : 0;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Subject Name */}
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: sub.color }}
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{sub.name}</span>
                          {sub.code && (
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {sub.code}
                            </Badge>
                          )}
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Target Hours */}
                  <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {target > 0 ? `${target}h` : <span className="text-slate-400 italic">Chưa đặt</span>}
                  </td>

                  {/* Logged Hours */}
                  <td className="py-4 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {loggedHours}h
                  </td>

                  {/* Progress Bar */}
                  <td className="py-4 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>{percent}%</span>
                        {target > 0 && <span>còn {Math.max(0, target - loggedHours).toFixed(1)}h</span>}
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 shadow-2xs"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: sub.color,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-4 text-center">
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
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* AI Alloc Mode */}
                  <td className="py-4 px-4 text-center">
                    {activeGoal?.isAutoAlloc ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Auto</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Thủ công</span>
                    )}
                  </td>

                  {/* Action Buttons (Pill / Circles) */}
                  <td className="py-4 px-5 text-right">
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
                        title="Vào học ngay (Bật Timer)"
                        className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        title="Sửa môn học"
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        title="Xóa môn học"
                        className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                <td colSpan={7} className="py-14 text-center text-sm text-slate-400">
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

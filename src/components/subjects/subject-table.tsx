"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Play, Edit2, Target, Trash2, Plus, Sparkles, BookOpen } from "lucide-react";
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
  targetHours?: number | null;
  completedHours?: number;
  priority?: number;
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
        <div className="text-xs text-[#526b5c] dark:text-[#a3bda9] font-medium">
          Danh sách {subjects.length} môn học & tiến độ hoàn thành chỉ tiêu
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="space-x-1.5 text-xs font-semibold bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm môn học</span>
          </Button>
        </div>
      </div>

      {/* Modern Rounded Table Container */}
      <div className="overflow-x-auto rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#dbe7dd]/80 dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-[#526b5c] dark:text-[#a3bda9] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Môn học</th>
              <th className="py-3.5 px-4 text-right">Chỉ tiêu</th>
              <th className="py-3.5 px-4 text-right">Đã học</th>
              <th className="py-3.5 px-4 min-w-[150px]">Tiến độ</th>
              <th className="py-3.5 px-4 text-center">Ưu tiên</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7dd]/60 dark:divide-[#263d2e]">
            {subjects.map((sub) => {
              const target = sub.targetHours; // can be null/undefined
              const loggedHours = sub.completedHours !== undefined
                ? sub.completedHours
                : Math.round((sub.totalLoggedMinutes / 60) * 10) / 10;
              const percent = target ? Math.min(100, Math.round((loggedHours / target) * 100)) : 0;
              const priority = sub.priority || 3;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-[#f8fbf8] dark:hover:bg-[#142318] transition-colors"
                >
                  {/* Subject Name */}
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: sub.color || "#2d6a4f" }}
                      />
                      <div>
                        <div className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
                          <span>{sub.name}</span>
                          {sub.code && (
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {sub.code}
                            </Badge>
                          )}
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] truncate max-w-xs mt-0.5">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Target Hours */}
                  <td className="py-4 px-4 text-right font-mono font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                    {target ? `${target}h` : <span className="text-[#8ba393] italic text-[11px]">Không đặt chỉ tiêu</span>}
                  </td>

                  {/* Logged Hours */}
                  <td className="py-4 px-4 text-right font-mono font-black text-[#2d6a4f] dark:text-[#52b788]">
                    {loggedHours}h
                  </td>

                  {/* Progress Bar */}
                  <td className="py-4 px-4">
                    {target ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-[#526b5c] dark:text-[#a3bda9] font-semibold">
                          <span>{percent}%</span>
                          <span>còn {Math.max(0, target - loggedHours).toFixed(1)}h</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#dbe7dd] dark:bg-[#263d2e] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: sub.color || "#2d6a4f",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#8ba393] text-[11px] italic">Không yêu cầu tiến độ</span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-4 text-center">
                    <Badge
                      variant={
                        priority >= 4
                          ? "green"
                          : priority === 3
                          ? "yellow"
                          : "default"
                      }
                    >
                      Mức {priority}/5
                    </Badge>
                  </td>

                  {/* Action Buttons */}
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
                        className="p-2 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] hover:bg-[#b7d8c3] text-[#1b4332] dark:text-[#9cd1b1] transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        title="Sửa môn học"
                        className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#73927d] hover:text-[#192e22] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSubject(sub.id, sub.name)}
                        title="Xóa môn học"
                        className="p-2 rounded-full hover:bg-[#f7ebeb] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer"
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
                <td colSpan={6} className="py-14 text-center text-sm text-[#526b5c] dark:text-[#a3bda9]">
                  Chưa có môn học nào. Hãy bấm "Thêm môn học" để bắt đầu lập kế hoạch!
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
          usedColors={subjects.map(s => s.color)}
        />
      )}
    </div>
  );
}

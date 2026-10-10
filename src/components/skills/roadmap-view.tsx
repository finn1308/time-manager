"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Clock, Play, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

interface RoadmapViewProps {
  initialSkill: any;
}

import { usePipTimer } from "@/components/timer/pip-timer-provider";

export function RoadmapView({ initialSkill }: RoadmapViewProps) {
  const router = useRouter();
  const [skill] = useState(initialSkill);
  const [isScheduling, setIsScheduling] = useState(false);
  const { startTimer } = usePipTimer();

  const handleSchedule = async () => {
    if (!confirm("Hệ thống sẽ xếp lịch các bài tập chưa hoàn thành vào Calendar của bạn. Tiếp tục?")) return;
    setIsScheduling(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/schedule`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Đã lên lịch thành công cho ${data.count} bài tập vào Calendar!`);
        router.refresh();
      } else {
        toast.error("Lỗi khi lên lịch các bài tập.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex items-center space-x-4">
        <Link href={`/skills/${skill.id}`} className="p-2 rounded-full hover:bg-[var(--mint-soft)] text-[var(--text-subtle)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--mint-dark)] dark:text-[#9cd1b1]">
            Lộ trình học: {skill.name}
          </h1>
          <p className="text-sm text-[var(--text-subtle)]">
            Được tạo bởi AI dựa trên nguyên lý Ultra Learning
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSchedule}
          disabled={isScheduling}
          className="bg-[var(--mint)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#1b4332] disabled:opacity-70"
        >
          {isScheduling ? "Đang lên lịch..." : "Lên lịch vào Calendar"}
        </button>
      </div>

      <div className="space-y-8">
        {skill.phases.map((phase: any, phaseIndex: number) => (
          <div key={phase.id} className="relative">
            {/* Phase Header */}
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-[var(--mint)] text-white flex items-center justify-center font-bold text-sm shadow-md z-10 shrink-0">
                {phaseIndex + 1}
              </div>
              <div className="ml-4 bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border)] shadow-sm flex-1">
                <h3 className="font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1] text-lg">{phase.name}</h3>
                {phase.description && <p className="text-sm text-[var(--text-subtle)]">{phase.description}</p>}
              </div>
            </div>

            {/* Units & Tasks */}
            <div className="ml-4 pl-8 border-l-2 border-dashed border-[#b7d8c3] dark:border-[#263d2e] pb-4 space-y-6">
              {phase.units.map((unit: any) => (
                <div key={unit.id} className="bg-white dark:bg-[#132217] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="bg-[var(--bg-muted)] dark:bg-[#1a2e22] px-4 py-3 border-b border-[var(--border)]">
                    <h4 className="font-bold text-[var(--text-ink)]">{unit.name}</h4>
                    {unit.description && <p className="text-xs text-[var(--text-subtle)] mt-1">{unit.description}</p>}
                  </div>
                  <div className="divide-y divide-[#dbe7dd] dark:divide-[#263d2e]">
                    {unit.tasks.map((task: any) => (
                      <div key={task.id} className="p-4 flex items-start justify-between hover:bg-[#fcfdfc] dark:hover:bg-[#17261c] transition-colors">
                        <div className="flex items-start space-x-3">
                          <button className="mt-0.5 text-[#a3bda9] hover:text-[#52b788] transition-colors">
                            {task.status === "COMPLETED" ? <CheckCircle2 className="w-5 h-5 text-[#52b788]" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div>
                            <h5 className="font-medium text-[var(--text-ink)] text-sm">{task.name}</h5>
                            <div className="flex items-center space-x-3 mt-1.5">
                              <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[#f0f7f2] dark:bg-[#1d3024] px-1.5 py-0.5 rounded">
                                {task.taskType === "THEORY" ? <BookOpen className="w-3 h-3 mr-1" /> : null}
                                {task.taskType}
                              </span>
                              <span className="inline-flex items-center text-xs text-[var(--text-muted)]">
                                <Clock className="w-3 h-3 mr-1" /> {task.plannedMinutes} phút
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            startTimer(
                              {
                                id: skill.id, // we map skill to subject
                                name: skill.name,
                                color: "#2d6a4f",
                              },
                              {
                                taskId: task.id,
                                mode: "POMODORO",
                                targetMinutes: task.plannedMinutes,
                              }
                            );
                          }}
                          className="w-8 h-8 rounded-full bg-[var(--mint-bg)] text-[var(--mint-dark)] flex items-center justify-center hover:bg-[var(--mint-bg)] transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {skill.phases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--text-subtle)]">Chưa có lộ trình nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

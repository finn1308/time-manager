"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Target, CheckCircle2, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface SkillAnalyticsProps {
  initialSkill: any;
}

export function SkillAnalytics({ initialSkill }: SkillAnalyticsProps) {
  const router = useRouter();
  const [skill, setSkill] = useState(initialSkill);
  const [isAdapting, setIsAdapting] = useState(false);

  // Calculate stats
  const totalPlannedMinutes = skill.phases.reduce((acc: number, p: any) => acc + (p.plannedHours * 60), 0);
  const totalActualMinutes = skill.studySessions.reduce((acc: number, s: any) => acc + (s.actualDurationSeconds / 60), 0);
  const progressPercent = totalPlannedMinutes > 0 ? Math.min(100, Math.round((totalActualMinutes / totalPlannedMinutes) * 100)) : 0;
  const totalCompletedTasks = skill.phases.reduce((acc: number, p: any) => acc + p.units.reduce((uAcc: number, u: any) => uAcc + u.tasks.filter((t: any) => t.status === "COMPLETED").length, 0), 0);
  const totalTasks = skill.phases.reduce((acc: number, p: any) => acc + p.units.reduce((uAcc: number, u: any) => uAcc + u.tasks.length, 0), 0);

  const handleAdapt = async () => {
    setIsAdapting(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/adapt`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Đã thêm ${data.addedTasks} bài tập mới. Lý do: ${data.reasoning}`);
        router.refresh();
      } else {
        alert(data.error || data.message || "Lỗi khi chạy Adaptive Learning.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối.");
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/skills/${skill.id}`} className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1b4332] dark:text-[#9cd1b1]">
              Phân tích Kỹ năng: {skill.name}
            </h1>
            <p className="text-sm text-[#526b5c]">
              Đo lường thời gian học thực tế so với mục tiêu và tiến độ lộ trình.
            </p>
          </div>
        </div>
        
        <button
          onClick={handleAdapt}
          disabled={isAdapting}
          className="bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1b4332] disabled:opacity-70 flex items-center"
        >
          {isAdapting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Adaptive Review (AI)
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#17261c] p-6 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-[#1b4332] dark:text-[#f0f7f2]">
            {Math.round(totalActualMinutes / 60)}<span className="text-lg text-[#526b5c] font-medium ml-1">giờ</span>
          </h3>
          <p className="text-sm text-[#526b5c] font-medium mt-1">Đã học thực tế</p>
        </div>

        <div className="bg-white dark:bg-[#17261c] p-6 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-[#1b4332] dark:text-[#f0f7f2]">
            {totalCompletedTasks} <span className="text-lg text-[#526b5c] font-medium">/ {totalTasks}</span>
          </h3>
          <p className="text-sm text-[#526b5c] font-medium mt-1">Bài tập hoàn thành</p>
        </div>

        <div className="bg-white dark:bg-[#17261c] p-6 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-[#1b4332] dark:text-[#f0f7f2]">
            {progressPercent}%
          </h3>
          <p className="text-sm text-[#526b5c] font-medium mt-1">Tiến độ thời gian</p>
          <div className="w-full bg-[#eef5f0] dark:bg-[#132217] rounded-full h-2 mt-3">
            <div className="bg-[#52b788] h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#17261c] p-6 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-[#1b4332] dark:text-[#f0f7f2]">
            {skill.studySessions.length}
          </h3>
          <p className="text-sm text-[#526b5c] font-medium mt-1">Phiên học (Sessions)</p>
        </div>
      </div>

      {/* Planned vs Actual Breakdown */}
      <div className="bg-white dark:bg-[#17261c] p-6 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
        <h3 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-6 flex items-center text-lg">
          <BarChart3 className="w-5 h-5 mr-2 text-[#52b788]" /> So sánh Thời gian theo Phase
        </h3>
        <div className="space-y-6">
          {skill.phases.map((phase: any) => {
            const phaseTasks = phase.units.flatMap((u: any) => u.tasks);
            const plannedMins = phaseTasks.reduce((acc: number, t: any) => acc + t.plannedMinutes, 0);
            const actualMins = phaseTasks.reduce((acc: number, t: any) => acc + t.actualMinutes, 0);
            const percent = plannedMins > 0 ? Math.min(100, Math.round((actualMins / plannedMins) * 100)) : 0;

            return (
              <div key={phase.id}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-[#192e22] dark:text-[#f0f7f2] text-sm">{phase.name}</h4>
                  <span className="text-xs text-[#526b5c] font-medium">
                    {Math.round(actualMins / 60)}h / {Math.round(plannedMins / 60)}h ({percent}%)
                  </span>
                </div>
                <div className="w-full bg-[#eef5f0] dark:bg-[#132217] rounded-full h-3">
                  <div className="bg-[#52b788] h-3 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

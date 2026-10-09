"use client";

import React, { useState } from "react";
import { Plus, Target, Flame, Play, Clock, MoreVertical, Edit2, Trash2, Map } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SkillsDashboardProps {
  initialSkills: any[];
}

export function SkillsDashboard({ initialSkills }: SkillsDashboardProps) {
  const [skills, setSkills] = useState(initialSkills);
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1b4332] dark:text-[#9cd1b1] flex items-center space-x-2">
            <Target className="w-7 h-7 text-[#52b788]" />
            <span>Kỹ năng & Ultra Learning</span>
          </h1>
          <p className="text-[#526b5c] dark:text-[#a3bda9] mt-1 text-sm">
            Học kỹ năng mới dựa trên nguyên lý Ultra Learning (Metalearning, Focus, Drill).
          </p>
        </div>

        <Link
          href="/skills/create"
          className="inline-flex items-center justify-center space-x-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm kỹ năng mới</span>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xs">
          <div className="flex items-center space-x-2 text-[#73927d]">
            <Target className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Đang học</span>
          </div>
          <p className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2] mt-1">
            {skills.filter(s => s.status === "LEARNING").length}
          </p>
        </div>
        <div className="p-4 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xs">
          <div className="flex items-center space-x-2 text-[#73927d]">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Hoàn thành</span>
          </div>
          <p className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2] mt-1">
            {skills.filter(s => s.status === "COMPLETED").length}
          </p>
        </div>
        <div className="p-4 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] shadow-2xs">
          <div className="flex items-center space-x-2 text-[#73927d]">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Giờ đã học</span>
          </div>
          <p className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2] mt-1">
            {Math.round(skills.reduce((acc, s) => acc + (s.totalActualHours || 0), 0))}h
          </p>
        </div>
      </div>

      {/* Skills Grid */}
      {skills.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#17261c] rounded-[32px] border border-dashed border-[#b7d8c3] dark:border-[#263d2e]">
          <Target className="w-16 h-16 text-[#b7d8c3] dark:text-[#263d2e] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-2">Chưa có kỹ năng nào</h3>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9] mb-6 max-w-md mx-auto">
            Bắt đầu học một kỹ năng mới (IELTS, Lập trình, Đánh đàn, v.v.) và để AI tạo lộ trình Ultra Learning cho bạn.
          </p>
          <Link
            href="/skills/create"
            className="inline-flex items-center justify-center space-x-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo kỹ năng đầu tiên</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => {
            const isLearning = skill.status === "LEARNING";
            const progress = skill.progressPercentage || 0;
            
            return (
              <div
                key={skill.id}
                className="group relative flex flex-col p-5 rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:border-[#74a882] transition-all shadow-2xs hover:shadow-lg"
              >
                {/* Status Badge & Menu */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      isLearning
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {skill.status === "NOT_STARTED" ? "Chưa bắt đầu" : skill.status === "LEARNING" ? "Đang học" : skill.status === "PAUSED" ? "Tạm dừng" : "Hoàn thành"}
                  </span>
                  
                  <button className="p-1.5 rounded-full text-[#73927d] hover:bg-[#f0f7f2] dark:hover:bg-[#1d3024] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-1 line-clamp-1 cursor-pointer hover:underline" onClick={() => router.push(`/skills/${skill.id}`)}>
                    {skill.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-[#526b5c] dark:text-[#a3bda9]">
                    <span>Mục tiêu: {skill.targetLevel || "Chưa xác định"}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#526b5c] dark:text-[#a3bda9]">Tiến độ</span>
                    <span className="text-[#2d6a4f] dark:text-[#52b788]">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#eef5f0] dark:bg-[#1d3024] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2d6a4f] dark:bg-[#52b788] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer Stats & Actions */}
                <div className="mt-auto pt-4 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-[#526b5c] dark:text-[#a3bda9] font-medium">
                    <div className="flex items-center space-x-1" title="Kế hoạch tuần">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{skill.weeklyHoursCommitment || 0}h/tuần</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/skills/${skill.id}/roadmap`)}
                      className="p-2 rounded-xl bg-[#eef5f0] text-[#2d6a4f] hover:bg-[#d8ebe0] dark:bg-[#1d3024] dark:text-[#74c69d] dark:hover:bg-[#263d2e] transition-colors"
                      title="Xem Roadmap"
                    >
                      <Map className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/skills/${skill.id}`)}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Tiếp tục</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

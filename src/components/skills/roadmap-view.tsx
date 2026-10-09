"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Clock, Play, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RoadmapViewProps {
  initialSkill: any;
}

export function RoadmapView({ initialSkill }: RoadmapViewProps) {
  const router = useRouter();
  const [skill] = useState(initialSkill);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex items-center space-x-4">
        <Link href={`/skills/${skill.id}`} className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1b4332] dark:text-[#9cd1b1]">
            Lộ trình học: {skill.name}
          </h1>
          <p className="text-sm text-[#526b5c]">
            Được tạo bởi AI dựa trên nguyên lý Ultra Learning
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {skill.phases.map((phase: any, phaseIndex: number) => (
          <div key={phase.id} className="relative">
            {/* Phase Header */}
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center font-bold text-sm shadow-md z-10 shrink-0">
                {phaseIndex + 1}
              </div>
              <div className="ml-4 bg-white dark:bg-[#17261c] px-4 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm flex-1">
                <h3 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] text-lg">{phase.name}</h3>
                {phase.description && <p className="text-sm text-[#526b5c]">{phase.description}</p>}
              </div>
            </div>

            {/* Units & Tasks */}
            <div className="ml-4 pl-8 border-l-2 border-dashed border-[#b7d8c3] dark:border-[#263d2e] pb-4 space-y-6">
              {phase.units.map((unit: any) => (
                <div key={unit.id} className="bg-white dark:bg-[#132217] rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] overflow-hidden">
                  <div className="bg-[#f8fbf8] dark:bg-[#1a2e22] px-4 py-3 border-b border-[#dbe7dd] dark:border-[#263d2e]">
                    <h4 className="font-bold text-[#192e22] dark:text-[#f0f7f2]">{unit.name}</h4>
                    {unit.description && <p className="text-xs text-[#526b5c] mt-1">{unit.description}</p>}
                  </div>
                  <div className="divide-y divide-[#dbe7dd] dark:divide-[#263d2e]">
                    {unit.tasks.map((task: any) => (
                      <div key={task.id} className="p-4 flex items-start justify-between hover:bg-[#fcfdfc] dark:hover:bg-[#17261c] transition-colors">
                        <div className="flex items-start space-x-3">
                          <button className="mt-0.5 text-[#a3bda9] hover:text-[#52b788] transition-colors">
                            {task.status === "COMPLETED" ? <CheckCircle2 className="w-5 h-5 text-[#52b788]" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div>
                            <h5 className="font-medium text-[#192e22] dark:text-[#f0f7f2] text-sm">{task.name}</h5>
                            <div className="flex items-center space-x-3 mt-1.5">
                              <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold text-[#73927d] bg-[#f0f7f2] dark:bg-[#1d3024] px-1.5 py-0.5 rounded">
                                {task.taskType === "THEORY" ? <BookOpen className="w-3 h-3 mr-1" /> : null}
                                {task.taskType}
                              </span>
                              <span className="inline-flex items-center text-xs text-[#73927d]">
                                <Clock className="w-3 h-3 mr-1" /> {task.plannedMinutes} phút
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-[#eef5f0] text-[#2d6a4f] flex items-center justify-center hover:bg-[#d8ebe0] transition-colors">
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
            <p className="text-[#526b5c]">Chưa có lộ trình nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

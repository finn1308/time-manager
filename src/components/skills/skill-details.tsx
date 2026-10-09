"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Map, Target, Brain, Sparkles, Loader2, Play, BookOpen, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";

interface SkillDetailsProps {
  initialSkill: any;
}

export function SkillDetails({ initialSkill }: SkillDetailsProps) {
  const router = useRouter();
  const [skill, setSkill] = useState(initialSkill);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newResource, setNewResource] = useState({ title: "", url: "" });
  const [isAddingResource, setIsAddingResource] = useState(false);

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/analyze`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Roadmap generated successfully!");
        router.refresh();
        router.push(`/skills/${skill.id}/roadmap`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to generate roadmap");
      }
    } catch (err) {
      console.error(err);
      alert("Error calling AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingResource(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResource),
      });
      if (res.ok) {
        const added = await res.json();
        setSkill({ ...skill, resources: [...(skill.resources || []), added] });
        setNewResource({ title: "", url: "" });
      } else {
        alert("Lỗi khi thêm tài liệu.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối.");
    } finally {
      setIsAddingResource(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/skills" className="p-2 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1b4332] dark:text-[#9cd1b1]">
              {skill.name}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-[#526b5c] mt-1">
              <span className="font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] uppercase">
                {skill.status}
              </span>
              <span>•</span>
              <span>{skill.weeklyHoursCommitment}h/tuần</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/skills/${skill.id}/analytics`}
            className="px-4 py-2 bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-xl text-sm font-bold text-[#1b4332] shadow-sm hover:bg-[#f0f7f2]"
          >
            Analytics
          </Link>
          <Link
            href={`/skills/${skill.id}/roadmap`}
            className="px-4 py-2 bg-[#2d6a4f] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#1b4332]"
          >
            <Map className="w-4 h-4 inline-block mr-2" />
            Xem Roadmap
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#17261c] p-5 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
            <h3 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" /> Mục tiêu
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#526b5c] uppercase tracking-wider font-bold mb-1">Trình độ hiện tại</p>
                <p className="text-sm font-medium">{skill.level}</p>
              </div>
              <div>
                <p className="text-xs text-[#526b5c] uppercase tracking-wider font-bold mb-1">Trình độ mục tiêu</p>
                <p className="text-sm font-medium">{skill.targetLevel}</p>
              </div>
              {skill.specificGoal && (
                <div>
                  <p className="text-xs text-[#526b5c] uppercase tracking-wider font-bold mb-1">Mục tiêu chi tiết</p>
                  <p className="text-sm">{skill.specificGoal}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Knowledge Map */}
        <div className="md:col-span-2 space-y-6">
          {!skill.knowledgeMap ? (
            <div className="bg-gradient-to-br from-[#eef5f0] to-white dark:from-[#17261c] dark:to-[#132217] p-8 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] text-center shadow-sm">
              <Sparkles className="w-12 h-12 text-[#52b788] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-2">
                Phân tích Kỹ năng & Tạo Lộ trình
              </h2>
              <p className="text-[#526b5c] text-sm max-w-md mx-auto mb-6">
                ChronoMind sẽ sử dụng AI để thiết kế bản đồ kiến thức (Knowledge Map) và lộ trình học tập dựa trên nguyên lý Ultra Learning (Metalearning, Focus, Drill).
              </p>
              <button
                onClick={handleGenerateRoadmap}
                disabled={isGenerating}
                className="inline-flex items-center justify-center space-x-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang phân tích & tạo lộ trình...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Thiết kế Lộ trình Ultra Learning</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#17261c] p-6 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
                <h3 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-4 flex items-center text-lg">
                  <Brain className="w-5 h-5 mr-2 text-purple-500" /> Bản đồ Kiến thức (Knowledge Map)
                </h3>
                <div className="space-y-6">
                  {skill.knowledgeMap.domains && (
                    <div>
                      <h4 className="text-sm font-bold text-[#526b5c] mb-2">Các Lĩnh vực cốt lõi</h4>
                      <div className="flex flex-wrap gap-2">
                        {skill.knowledgeMap.domains.map((d: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg text-sm font-medium">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skill.knowledgeMap.coreConcepts && (
                    <div>
                      <h4 className="text-sm font-bold text-[#526b5c] mb-2">Khái niệm quan trọng</h4>
                      <ul className="list-disc list-inside text-sm text-[#192e22] dark:text-[#f0f7f2] space-y-1">
                        {skill.knowledgeMap.coreConcepts.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-[#17261c] p-6 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
                <h3 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-4 flex items-center text-lg">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" /> Chiến lược Học tập (Metalearning)
                </h3>
                <div className="space-y-4 text-sm text-[#192e22] dark:text-[#f0f7f2]">
                  {skill.learningStrategy?.metalearning && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <strong>Cách học:</strong> {skill.learningStrategy.metalearning}
                    </div>
                  )}
                  {skill.learningStrategy?.focus && (
                    <div>
                      <strong>Tập trung (Focus):</strong> {skill.learningStrategy.focus}
                    </div>
                  )}
                  {skill.learningStrategy?.directness && (
                    <div>
                      <strong>Thực hành trực tiếp (Directness):</strong> {skill.learningStrategy.directness}
                    </div>
                  )}
                  {skill.learningStrategy?.drill && (
                    <div>
                      <strong>Khoét sâu điểm yếu (Drill):</strong> {skill.learningStrategy.drill}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Resources */}
      <div className="bg-white dark:bg-[#17261c] p-6 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs">
        <h3 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] mb-6 flex items-center text-lg">
          <BookOpen className="w-5 h-5 mr-2 text-[#52b788]" /> Tài liệu & Nguồn học
        </h3>
        
        <div className="space-y-4 mb-6">
          {(skill.resources || []).length === 0 ? (
            <p className="text-sm text-[#526b5c] italic">Chưa có tài liệu nào.</p>
          ) : (
            (skill.resources || []).map((res: any) => (
              <div key={res.id} className="flex items-center justify-between bg-[#f8fbf8] dark:bg-[#132217] p-3 rounded-xl">
                <div>
                  <h4 className="font-bold text-[#1b4332] dark:text-[#9cd1b1] text-sm">{res.title}</h4>
                  <a href={res.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                    {res.url}
                  </a>
                </div>
                <a href={res.url} target="_blank" rel="noreferrer" className="text-[#526b5c] hover:text-[#1b4332]">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddResource} className="flex space-x-2">
          <input
            type="text"
            placeholder="Tên tài liệu..."
            required
            value={newResource.title}
            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
            className="flex-1 bg-[#f8fbf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#263d2e] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
          />
          <input
            type="url"
            placeholder="URL..."
            required
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            className="flex-1 bg-[#f8fbf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#263d2e] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
          />
          <button
            type="submit"
            disabled={isAddingResource}
            className="bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1b4332] disabled:opacity-70 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </button>
        </form>
      </div>

    </div>
  );
}

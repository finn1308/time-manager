"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Map,
  PlusCircle,
  Trophy,
  BookOpen,
  Calendar,
  Flame,
  Zap,
  ArrowRight,
  RotateCcw,
  Loader2,
  Trash2,
} from "lucide-react";
import { RoadmapTimeline, RoadmapData } from "@/components/learning/roadmap-timeline";
import { CreateQuestWizard } from "@/components/learning/create-quest-wizard";
import { LeaderboardTab } from "@/components/learning/leaderboard-tab";
import { WeakTopicsTab } from "@/components/learning/weak-topics-tab";
import { StudyBunnyMascot } from "@/components/learning/study-bunny-mascot";
import { Button } from "@/components/ui/button";

export default function LearningHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"ROADMAP" | "CREATE" | "LEADERBOARD" | "WEAK_TOPICS">("ROADMAP");
  const [roadmaps, setRoadmaps] = useState<RoadmapData[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string | null; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0);
  const [streakDays, setStreakDays] = useState(1);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roadmapsRes, subjectsRes] = await Promise.all([
        fetch("/api/learning/roadmaps"),
        fetch("/api/subjects"),
      ]);

      const roadmapsData = await roadmapsRes.json();
      const subjectsData = await subjectsRes.json();

      if (roadmapsData.roadmaps) {
        setRoadmaps(roadmapsData.roadmaps);
        if (roadmapsData.roadmaps.length > 0 && !selectedRoadmapId) {
          setSelectedRoadmapId(roadmapsData.roadmaps[0].id);
        }
      }
      if (typeof roadmapsData.userXp === "number") setUserXp(roadmapsData.userXp);
      if (typeof roadmapsData.streakDays === "number") setStreakDays(roadmapsData.streakDays);

      if (Array.isArray(subjectsData.subjects)) {
        setSubjects(subjectsData.subjects);
      }
    } catch (err) {
      console.error("Error loading learning hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0];

  const handleQuestCreated = async (newRoadmapId: string) => {
    await fetchData();
    setSelectedRoadmapId(newRoadmapId);
    setActiveTab("ROADMAP");
  };

  const handleSelectQuiz = (quizId: string) => {
    router.push(`/learning/quiz/${quizId}`);
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lộ trình học tập này?")) return;
    try {
      await fetch(`/api/learning/roadmaps/${id}`, { method: "DELETE" });
      await fetchData();
      setSelectedRoadmapId(null);
    } catch {
      alert("Không thể xóa lộ trình");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dbe7dd] dark:border-[#263d2e] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-[#d8ebe0] dark:bg-[#1e3b28] text-[#2d6a4f] dark:text-[#52b788]">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>Study Bunny Gamified Quest</span>
          </h1>
          <p className="text-xs text-[#526b5c] dark:text-[#8aa693] mt-1">
            Biến tài liệu học tập & PDF thành Lộ trình chinh phục mục tiêu theo ngày, làm quiz tương tác và mở khóa kiến thức.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-1 p-1 bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl text-xs font-bold overflow-x-auto shadow-2xs">
          <button
            onClick={() => setActiveTab("ROADMAP")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "ROADMAP"
                ? "bg-[#2d6a4f] text-white shadow-xs"
                : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Lộ trình của tôi</span>
          </button>

          <button
            onClick={() => setActiveTab("CREATE")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "CREATE"
                ? "bg-[#2d6a4f] text-white shadow-xs"
                : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tạo lộ trình mới</span>
          </button>

          <button
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "LEADERBOARD"
                ? "bg-[#2d6a4f] text-white shadow-xs"
                : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Bảng xếp hạng</span>
          </button>

          <button
            onClick={() => setActiveTab("WEAK_TOPICS")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "WEAK_TOPICS"
                ? "bg-[#2d6a4f] text-white shadow-xs"
                : "text-[#526b5c] hover:text-[#192e22] dark:text-[#8aa693]"
            }`}
          >
            <span>🧠</span>
            <span>Chủ đề yếu</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f] mx-auto" />
          <p className="text-xs text-[#73927d]">Đang tải dữ liệu học tập...</p>
        </div>
      ) : activeTab === "ROADMAP" ? (
        roadmaps.length === 0 ? (
          // ================= EMPTY STATE (Section 43 in prompt) =================
          <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-10 text-center space-y-5 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-[#d8ebe0] dark:bg-[#1e3827] text-[#2d6a4f] dark:text-[#52b788] mx-auto flex items-center justify-center text-3xl shadow-xs">
              🐰✨
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#192e22] dark:text-[#f0f7f2]">
                Biến tài liệu học tập thành trải nghiệm tương tác!
              </h2>
              <p className="text-xs text-[#526b5c] dark:text-[#8aa693] leading-relaxed">
                Tải lên PDF hoặc dán nội dung bài học để AI tự động trích xuất cấu trúc, tạo lộ trình theo ngày và thiết kế bộ Quiz chất lượng cao.
              </p>
            </div>
            <Button
              onClick={() => setActiveTab("CREATE")}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full px-6 text-xs font-bold space-x-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo Lộ trình Chinh phục đầu tiên</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multiple Roadmaps Selector if user has > 1 */}
            {roadmaps.length > 1 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-[#526b5c] shrink-0">Chọn môn:</span>
                {roadmaps.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoadmapId(r.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedRoadmapId === r.id
                        ? "bg-[#2d6a4f] text-white shadow-xs"
                        : "bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-[#526b5c]"
                    }`}
                  >
                    {r.title} ({r.completedStages}/{r.totalStages})
                  </button>
                ))}
              </div>
            )}

            {/* Active Roadmap Timeline Component */}
            {activeRoadmap && (
              <RoadmapTimeline
                roadmap={activeRoadmap}
                userXp={userXp}
                streakDays={streakDays}
                onSelectQuiz={handleSelectQuiz}
                onResetRoadmap={() => handleDeleteRoadmap(activeRoadmap.id)}
              />
            )}
          </div>
        )
      ) : activeTab === "CREATE" ? (
        <CreateQuestWizard
          subjects={subjects}
          onQuestCreated={handleQuestCreated}
          onCancel={() => setActiveTab("ROADMAP")}
        />
      ) : activeTab === "LEADERBOARD" ? (
        <LeaderboardTab />
      ) : (
        <WeakTopicsTab />
      )}
    </div>
  );
}

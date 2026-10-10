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

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleQuestCreated = async (newRoadmapId: string) => {
    await fetchData();
    setSelectedRoadmapId(newRoadmapId);
    setActiveTab("ROADMAP");
  };

  const handleSelectQuiz = (quizId: string) => {
    router.push(`/learning/quiz/${quizId}`);
  };

  const handleDeleteSuccess = async (message: string) => {
    setNotification({ type: "success", message });
    await fetchData();
    setSelectedRoadmapId(null);
    router.replace("/learning");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteError = (error: string) => {
    setNotification({ type: "error", message: error });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-ink)] flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-[var(--mint-bg)] dark:bg-[#1e3b28] text-[var(--mint-dark)]">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>Study Bunny Gamified Quest</span>
          </h1>
          <p className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693] mt-1">
            Biến tài liệu học tập & PDF thành Lộ trình chinh phục mục tiêu theo ngày, làm quiz tương tác và mở khóa kiến thức.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl text-xs font-bold overflow-x-auto shadow-2xs">
          <button
            onClick={() => setActiveTab("ROADMAP")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "ROADMAP"
                ? "bg-[var(--mint)] text-white shadow-xs"
                : "text-[var(--text-subtle)] hover:text-[var(--text-ink)] dark:text-[#8aa693]"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Lộ trình của tôi</span>
          </button>

          <button
            onClick={() => setActiveTab("CREATE")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "CREATE"
                ? "bg-[var(--mint)] text-white shadow-xs"
                : "text-[var(--text-subtle)] hover:text-[var(--text-ink)] dark:text-[#8aa693]"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tạo lộ trình mới</span>
          </button>

          <button
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "LEADERBOARD"
                ? "bg-[var(--mint)] text-white shadow-xs"
                : "text-[var(--text-subtle)] hover:text-[var(--text-ink)] dark:text-[#8aa693]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Bảng xếp hạng</span>
          </button>

          <button
            onClick={() => setActiveTab("WEAK_TOPICS")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeTab === "WEAK_TOPICS"
                ? "bg-[var(--mint)] text-white shadow-xs"
                : "text-[var(--text-subtle)] hover:text-[var(--text-ink)] dark:text-[#8aa693]"
            }`}
          >
            <span>🧠</span>
            <span>Chủ đề yếu</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-[#eef7ee] dark:bg-[#1a3322] text-[var(--mint-dark)] dark:text-[#7fc498] border border-[#b7d8c3] dark:border-[var(--mint)]"
              : "bg-[#fef2f2] dark:bg-[#331c1c] text-[#dc2626] dark:text-[#f87171] border border-[#fecaca] dark:border-[#522222]"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="cursor-pointer opacity-70 hover:opacity-100 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--mint-dark)] mx-auto" />
          <p className="text-xs text-[var(--text-muted)]">Đang tải dữ liệu học tập...</p>
        </div>
      ) : activeTab === "ROADMAP" ? (
        roadmaps.length === 0 ? (
          // ================= EMPTY STATE (Section 43 in prompt) =================
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-10 text-center space-y-5 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-[var(--mint-bg)] dark:bg-[#1e3827] text-[var(--mint-dark)] mx-auto flex items-center justify-center text-3xl shadow-xs">
              🐰✨
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[var(--text-ink)]">
                Biến tài liệu học tập thành trải nghiệm tương tác!
              </h2>
              <p className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693] leading-relaxed">
                Tải lên PDF hoặc dán nội dung bài học để AI tự động trích xuất cấu trúc, tạo lộ trình theo ngày và thiết kế bộ Quiz chất lượng cao.
              </p>
            </div>
            <Button
              onClick={() => setActiveTab("CREATE")}
              className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-full px-6 text-xs font-bold space-x-1.5 shadow-sm"
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
                <span className="text-xs font-bold text-[var(--text-subtle)] shrink-0">Chọn môn:</span>
                {roadmaps.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoadmapId(r.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedRoadmapId === r.id
                        ? "bg-[var(--mint)] text-white shadow-xs"
                        : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)]"
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
                onDeleteSuccess={handleDeleteSuccess}
                onDeleteError={handleDeleteError}
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

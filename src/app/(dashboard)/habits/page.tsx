"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Flame,
  Zap,
  Award,
  Crown,
  Target,
  Brain,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Moon,
  Sun,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getVNTodayKey, getVNDayOffsets } from "@/lib/date-utils";

import { toast } from "sonner";
interface Subject {
  id: string;
  name: string;
  code: string | null;
  color: string;
}

interface HabitLog {
  id: string;
  dateKey: string;
  value: number;
}

interface Habit {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  targetDays: string;
  targetValue: number;
  unit: string;
  color: string;
  icon: string;
  streak: number;
  longestStreak: number;
  subject?: Subject | null;
  habitLogs: HabitLog[];
}

interface GamificationData {
  user: {
    id: string;
    streakDays: number;
    totalStudyHours: number;
    completedSessions: number;
    completedTasks: number;
    flashcardReviews: number;
    habitLogs: number;
  };
  level: {
    level: number;
    title: string;
    currentXp: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progressPercent: number;
    xpToNextLevel: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    maxProgress: number;
    currentProgress: number;
    isUnlocked: boolean;
    progressPercent: number;
  }>;
  badgeStats: {
    unlockedCount: number;
    totalBadges: number;
    completionRate: number;
  };
}

const PRESET_COLORS = [
  "#2d6a4f",
  "#1b4332",
  "#40916c",
  "#2a9d8f",
  "#e76f51",
  "#f4a261",
  "#457b9d",
  "#7209b7",
];

const PRESET_ICONS = ["Check", "Book", "Flame", "Zap", "Brain", "Moon", "Sun", "Target"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"HABITS" | "BADGES">("HABITS");
  const [badgeCategory, setBadgeCategory] = useState<string>("ALL");

  // Week offset (0 = current week, -1 = last week)
  const [weekOffset, setWeekOffset] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [color, setColor] = useState("#2d6a4f");
  const [targetDays, setTargetDays] = useState<string[]>(["1", "2", "3", "4", "5", "6", "0"]);
  const [saving, setSaving] = useState(false);

  // Calculate dates for current viewed week
  const weekDays = useMemo(() => {
    const today = new Date();
    // Move according to weekOffset
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + weekOffset * 7);

    const days = [];
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const todayKey = getVNTodayKey();

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${date}`;
      days.push({
        name: dayNames[i],
        date: d.getDate(),
        month: d.getMonth() + 1,
        dateKey,
        isToday: dateKey === todayKey,
        dayIndex: (i + 1) % 7, // 1=Mon, 2=Tue, ..., 0=Sun
      });
    }
    return days;
  }, [weekOffset]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [habitsRes, gamifyRes, subjectsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch("/api/gamification"),
        fetch("/api/subjects"),
      ]);

      if (habitsRes.ok) {
        const hData = await habitsRes.json();
        setHabits(hData.habits || []);
      }
      if (gamifyRes.ok) {
        const gData = await gamifyRes.json();
        setGamification(gData);
      }
      if (subjectsRes.ok) {
        const sData = await subjectsRes.json();
        setSubjects(sData.subjects || []);
      }
    } catch (err) {
      console.error("Failed to load habits or gamification data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (habitId: string, dateKey: string) => {
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.habitLogs.some((l) => l.dateKey === dateKey);
        let newLogs = exists
          ? h.habitLogs.filter((l) => l.dateKey !== dateKey)
          : [...h.habitLogs, { id: "temp", dateKey, value: 1 }];
        return { ...h, habitLogs: newLogs };
      })
    );

    try {
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update habit with true streak from server
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, ...data.habit } : h))
        );
        // Refresh gamification XP
        fetch("/api/gamification")
          .then((r) => r.json())
          .then((gData) => setGamification(gData))
          .catch(() => {});
      }
    } catch (err) {
      console.error("Toggle error:", err);
      loadData();
    }
  };

  const handleOpenModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setTitle(habit.title);
      setDescription(habit.description || "");
      setSubjectId(habit.subject?.id || "");
      setColor(habit.color || "#2d6a4f");
      setTargetDays(habit.targetDays ? habit.targetDays.split(",") : ["1", "2", "3", "4", "5", "6", "0"]);
    } else {
      setEditingHabit(null);
      setTitle("");
      setDescription("");
      setSubjectId("");
      setColor("#2d6a4f");
      setTargetDays(["1", "2", "3", "4", "5", "6", "0"]);
    }
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId || null,
        color,
        targetDays: targetDays.join(","),
      };

      if (editingHabit) {
        const res = await fetch(`/api/habits/${editingHabit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Lỗi cập nhật thói quen");
      } else {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Lỗi tạo thói quen");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu thói quen");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thói quen này? Dữ liệu lịch sử sẽ bị mất.")) return;
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHabits((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err) {
      console.error("Delete habit error:", err);
    }
  };

  const toggleTargetDay = (day: string) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const filteredBadges = useMemo(() => {
    if (!gamification?.badges) return [];
    if (badgeCategory === "ALL") return gamification.badges;
    return gamification.badges.filter((b) => b.category === badgeCategory);
  }, [gamification, badgeCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Gamification Progress Banner */}
      {gamification && (
        <div className="p-6 rounded-[28px] bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left: Level & Title */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wider uppercase border border-white/20">
                  Cấp {gamification.level.level}
                </span>
                <span className="text-sm font-semibold text-[#d8ebe0]">
                  {gamification.level.title}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight">
                {gamification.level.currentXp.toLocaleString()} <span className="text-sm font-normal opacity-80">XP</span>
              </h1>

              {/* XP Progress Bar */}
              <div className="w-full md:w-80 space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium opacity-90">
                  <span>Tiến trình cấp độ</span>
                  <span>{gamification.level.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#52b788] to-[#b7e4c7] rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${gamification.level.progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] opacity-75">
                  Còn {gamification.level.xpToNextLevel} XP để lên Cấp {gamification.level.level + 1}
                </p>
              </div>
            </div>

            {/* Right: Key Stats & Badges Toggle */}
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
                <div className="flex items-center justify-center space-x-1 text-amber-300 font-bold text-lg">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{gamification.user.streakDays}</span>
                </div>
                <div className="text-[10px] font-medium text-white/80">Ngày Streak</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
                <div className="flex items-center justify-center space-x-1 text-emerald-200 font-bold text-lg">
                  <Award className="w-4 h-4" />
                  <span>{gamification.badgeStats.unlockedCount} / {gamification.badgeStats.totalBadges}</span>
                </div>
                <div className="text-[10px] font-medium text-white/80">Huy hiệu</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[90px]">
                <div className="flex items-center justify-center space-x-1 text-cyan-200 font-bold text-lg">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{gamification.user.totalStudyHours}h</span>
                </div>
                <div className="text-[10px] font-medium text-white/80">Thời gian học</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tabs Switcher: Thói quen & Kho huy hiệu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 p-1 bg-[#eef5f0] dark:bg-[#142318] rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] w-fit">
          <button
            onClick={() => setActiveTab("HABITS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "HABITS"
                ? "bg-[#2d6a4f] text-white shadow-2xs"
                : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Thói quen hàng tuần</span>
          </button>

          <button
            onClick={() => setActiveTab("BADGES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "BADGES"
                ? "bg-[#2d6a4f] text-white shadow-2xs"
                : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Kho Huy hiệu & Thành tích</span>
          </button>
        </div>

        {activeTab === "HABITS" && (
          <Button
            onClick={() => handleOpenModal()}
            className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm thói quen</span>
          </Button>
        )}
      </div>

      {/* 3. Tab Content: HABITS TRACKER */}
      {activeTab === "HABITS" && (
        <div className="space-y-4">
          {/* Week Navigator */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
              <Calendar className="w-4 h-4 text-[#2d6a4f]" />
              <span>
                Tuần: {weekDays[0].date}/{weekDays[0].month} — {weekDays[6].date}/{weekDays[6].month}
              </span>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="ml-2 text-[11px] text-[#2d6a4f] hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Về tuần này</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setWeekOffset((p) => p - 1)}
                className="w-8 h-8 rounded-full border border-[#dbe7dd] dark:border-[#263d2e] flex items-center justify-center hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset((p) => p + 1)}
                className="w-8 h-8 rounded-full border border-[#dbe7dd] dark:border-[#263d2e] flex items-center justify-center hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] text-[#526b5c]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matrix Card */}
          <div className="bg-white dark:bg-[#17261c] rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 p-4 border-b border-[#dbe7dd]/80 dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#132217] text-xs font-bold text-[#526b5c] dark:text-[#a3bda9]">
              <div className="col-span-5 md:col-span-5 flex items-center space-x-2">
                <span>Thói quen</span>
              </div>
              <div className="col-span-7 md:col-span-7 grid grid-cols-7 text-center">
                {weekDays.map((d) => (
                  <div
                    key={d.dateKey}
                    className={`flex flex-col items-center py-1 rounded-xl ${
                      d.isToday
                        ? "bg-[#2d6a4f] text-white font-bold"
                        : "text-[#526b5c] dark:text-[#a3bda9]"
                    }`}
                  >
                    <span className="text-[10px] uppercase">{d.name}</span>
                    <span className="text-xs">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Rows */}
            <div className="divide-y divide-[#dbe7dd]/60 dark:divide-[#263d2e]/60">
              {habits.map((habit) => {
                const loggedDates = new Set(habit.habitLogs.map((l) => l.dateKey));
                const completedThisWeek = weekDays.filter((d) => loggedDates.has(d.dateKey)).length;

                return (
                  <div
                    key={habit.id}
                    className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-[#fcfdfc] dark:hover:bg-[#1b2b20] transition-colors"
                  >
                    {/* Habit Info */}
                    <div className="col-span-5 md:col-span-5 flex items-center space-x-3 truncate pr-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-2xs"
                        style={{ backgroundColor: habit.color || "#2d6a4f" }}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                            {habit.title}
                          </span>
                          {habit.subject && (
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold shrink-0"
                              style={{
                                backgroundColor: `${habit.subject.color}20`,
                                color: habit.subject.color,
                              }}
                            >
                              {habit.subject.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] text-[#73927d] dark:text-[#8ba393]">
                          <span className="flex items-center space-x-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <Flame className="w-3 h-3 fill-current" />
                            <span>{habit.streak}d</span>
                          </span>
                          <span>•</span>
                          <span>{completedThisWeek}/7 tuần này</span>
                        </div>
                      </div>
                    </div>

                    {/* 7 Check Circles */}
                    <div className="col-span-7 md:col-span-7 grid grid-cols-7 items-center justify-items-center">
                      {weekDays.map((d) => {
                        const isDone = loggedDates.has(d.dateKey);
                        return (
                          <button
                            key={d.dateKey}
                            onClick={() => handleToggle(habit.id, d.dateKey)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isDone
                                ? "bg-[#2d6a4f] text-white shadow-2xs scale-105"
                                : "border-2 border-[#dbe7dd] dark:border-[#263d2e] hover:border-[#52b788] text-transparent hover:text-[#52b788]/40"
                            }`}
                            title={`${habit.title} (${d.name} ${d.date}/${d.month}) - ${isDone ? "Đã làm" : "Chưa làm"}`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {habits.length === 0 && !loading && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
                    Chưa có thói quen nào
                  </h3>
                  <p className="text-xs text-[#73927d] max-w-sm mx-auto">
                    Tạo thói quen học tập hàng ngày để rèn luyện tính kỷ luật và nhận điểm kinh nghiệm XP!
                  </p>
                  <Button
                    onClick={() => handleOpenModal()}
                    className="rounded-2xl bg-[#2d6a4f] text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Thêm thói quen đầu tiên
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab Content: BADGES & ACHIEVEMENTS */}
      {activeTab === "BADGES" && gamification && (
        <div className="space-y-4">
          {/* Badge Category Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "STUDY", label: "Học tập" },
              { id: "CONSISTENCY", label: "Kỷ luật & Streak" },
              { id: "PRODUCTIVITY", label: "Nhiệm vụ" },
              { id: "MASTERY", label: "Ghi nhớ" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setBadgeCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  badgeCategory === cat.id
                    ? "bg-[#2d6a4f] text-white"
                    : "bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-[#526b5c] hover:bg-[#f4f8f5]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const isUnlocked = badge.isUnlocked;

              return (
                <div
                  key={badge.id}
                  className={`p-5 rounded-[26px] border transition-all ${
                    isUnlocked
                      ? "bg-gradient-to-br from-[#ffffff] to-[#f4f8f5] dark:from-[#17261c] dark:to-[#122016] border-[#52b788]/60 shadow-xs"
                      : "bg-white/60 dark:bg-[#17261c]/60 border-[#dbe7dd] dark:border-[#263d2e] opacity-70"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? "bg-gradient-to-tr from-[#2d6a4f] to-[#52b788] text-white shadow-sm"
                          : "bg-[#eef5f0] dark:bg-[#1d3024] text-[#8ba393]"
                      }`}
                    >
                      {badge.icon === "Flame" && <Flame className="w-6 h-6" />}
                      {badge.icon === "Footprints" && <TrendingUp className="w-6 h-6" />}
                      {badge.icon === "Zap" && <Zap className="w-6 h-6 fill-current" />}
                      {badge.icon === "Target" && <Target className="w-6 h-6" />}
                      {badge.icon === "Award" && <Award className="w-6 h-6" />}
                      {badge.icon === "Crown" && <Crown className="w-6 h-6" />}
                      {badge.icon === "CheckCircle" && <CheckCircle2 className="w-6 h-6" />}
                      {badge.icon === "Brain" && <Brain className="w-6 h-6" />}
                      {badge.icon === "CheckCheck" && <Check className="w-6 h-6 stroke-[3]" />}
                      {badge.icon === "Moon" && <Moon className="w-6 h-6" />}
                      {badge.icon === "Sun" && <Sun className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                          {badge.name}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[10px] font-bold text-[#2d6a4f] dark:text-[#52b788] bg-[#d8ebe0] dark:bg-[#1d3827] px-2 py-0.5 rounded-full">
                            Đạt được
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] leading-tight">
                        {badge.description}
                      </p>

                      {/* Progress bar */}
                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-[#73927d]">
                          <span>Tiến độ</span>
                          <span>
                            {badge.currentProgress} / {badge.maxProgress}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#eef5f0] dark:bg-[#1d3024] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isUnlocked ? "bg-[#2d6a4f]" : "bg-[#8ba393]"
                            }`}
                            style={{ width: `${badge.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Create / Edit Habit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-2xl">
          <form onSubmit={handleSaveHabit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                {editingHabit ? "Chỉnh sửa thói quen" : "Tạo thói quen mới"}
              </DialogTitle>
            </DialogHeader>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Tên thói quen *
              </label>
              <Input
                required
                autoFocus
                placeholder="VD: Đọc sách 20 phút, Học từ vựng, Ngồi thiền..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl border-[#dbe7dd] text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Ghi chú hoặc mục tiêu cụ thể
              </label>
              <Input
                placeholder="VD: Đọc ít nhất 10 trang trước khi ngủ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-2xl border-[#dbe7dd] text-xs h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Môn học liên quan (tùy chọn)
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="">(Không gắn môn học)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Days selector */}
            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Các ngày thực hiện trong tuần
              </label>
              <div className="flex items-center space-x-1.5">
                {[
                  { id: "1", label: "T2" },
                  { id: "2", label: "T3" },
                  { id: "3", label: "T4" },
                  { id: "4", label: "T5" },
                  { id: "5", label: "T6" },
                  { id: "6", label: "T7" },
                  { id: "0", label: "CN" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleTargetDay(d.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetDays.includes(d.id)
                        ? "bg-[#2d6a4f] text-white shadow-2xs"
                        : "bg-[#eef5f0] dark:bg-[#1d3024] text-[#73927d]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector */}
            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                Màu sắc nhận diện
              </label>
              <div className="flex items-center space-x-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      color === c ? "ring-2 ring-offset-2 ring-[#2d6a4f] scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              {editingHabit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteHabit(editingHabit.id)}
                  className="rounded-2xl text-xs text-rose-600 hover:bg-rose-50 mr-auto"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Xóa
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold"
              >
                {saving ? "Đang lưu..." : "Lưu thói quen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePipTimer, TimerMode, PomodoroPhase } from "@/components/timer/pip-timer-provider";
import {
import { toast } from "sonner";
  Clock,
  History,
  CheckCircle2,
  Star,
  Calendar,
  BookOpen,
  Play,
  Pause,
  Square,
  SkipForward,
  ExternalLink,
  Flame,
  Zap,
  Coffee,
  Trash2,
  Filter,
  Sparkles,
} from "lucide-react";

export default function StudySessionsPage() {
  const {
    activeSubject,
    mode,
    pomodoroPhase,
    pomodoroCycle,
    remainingSeconds,
    secondsElapsed,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    switchPhase,
    requestDocumentPip,
    formatTime,
  } = usePipTimer();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State to launch new timer
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [launcherMode, setLauncherMode] = useState<TimerMode>("POMODORO");
  const [pomodoroPreset, setPomodoroPreset] = useState<"25_5" | "50_10">("25_5");
  const [countdownMinutes, setCountdownMinutes] = useState<number>(45);

  // Filter
  const [filterSubjectId, setFilterSubjectId] = useState<string>("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const [resSessions, resSubjects] = await Promise.all([
        fetch("/api/study-sessions").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resSessions.sessions) setSessions(resSessions.sessions);
      if (resSubjects.subjects) {
        setSubjects(resSubjects.subjects);
        if (resSubjects.subjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(resSubjects.subjects[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading study sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartLauncher = () => {
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    if (!sub) {
      toast("Vui lòng chọn một môn học!");
      return;
    }

    if (launcherMode === "POMODORO") {
      const workM = pomodoroPreset === "50_10" ? 50 : 25;
      const breakM = pomodoroPreset === "50_10" ? 10 : 5;
      startTimer(
        { id: sub.id, name: sub.name, code: sub.code, color: sub.color || "#2d6a4f" },
        {
          mode: "POMODORO",
          pomodoroWorkMinutes: workM,
          pomodoroBreakMinutes: breakM,
          pomodoroLongBreakMinutes: 15,
        }
      );
    } else if (launcherMode === "CUSTOM_COUNTDOWN") {
      startTimer(
        { id: sub.id, name: sub.name, code: sub.code, color: sub.color || "#2d6a4f" },
        {
          mode: "CUSTOM_COUNTDOWN",
          targetMinutes: countdownMinutes,
        }
      );
    } else {
      startTimer(
        { id: sub.id, name: sub.name, code: sub.code, color: sub.color || "#2d6a4f" },
        { mode: "STOPWATCH" }
      );
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi phiên học này không?")) return;
    try {
      const res = await fetch(`/api/study-sessions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa");
      await loadData();
    } catch (e) {
      toast.error("Lỗi khi xóa phiên học");
    }
  };

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h} giờ ${m} phút`;
    }
    return `${mins} phút ${secs > 0 ? `${secs}s` : ""}`;
  };

  // Stats calculation
  const todayStr = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s) => new Date(s.actualStart).toDateString() === todayStr
  );
  const totalTodaySeconds = todaySessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0);
  const completedTodayCount = todaySessions.filter((s) => s.status === "COMPLETED").length;
  const avgProductivity =
    todaySessions.filter((s) => s.productivityScore).length > 0
      ? (
          todaySessions.reduce((acc, s) => acc + (s.productivityScore || 0), 0) /
          todaySessions.filter((s) => s.productivityScore).length
        ).toFixed(1)
      : "5.0";

  const filteredSessions = sessions.filter((s) => {
    if (filterSubjectId === "ALL") return true;
    return s.subjectId === filterSubjectId;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#86e2a8] text-xs font-bold mb-2">
          <Clock className="w-3.5 h-3.5 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>CHRONOMIND FOCUS & STUDY TIMER</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
          Study Timer & Nhật ký học tập thực tế
        </h1>
        <p className="text-xs sm:text-sm text-[#526b5c] dark:text-[#a3bda9] mt-1 max-w-2xl leading-relaxed">
          Tích hợp Pomodoro, hẹn giờ đếm ngược và cửa sổ nổi Picture-in-Picture chạy liên tục khi chuyển trang hoặc ra màn hình ngoài.
        </p>
      </div>

      {/* Today Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Clock className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Học hôm nay</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {Math.floor(totalTodaySeconds / 3600)}h {Math.floor((totalTodaySeconds % 3600) / 60)}m
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Thời gian thực tế ghi nhận</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Phiên hoàn thành</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {completedTodayCount} phiên
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Hôm nay</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span>Năng suất TB</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2] flex items-baseline space-x-1">
            <span>{avgProductivity}</span>
            <span className="text-xs text-[#73927d] font-normal">/ 5.0</span>
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Đánh giá trung bình</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Pomodoro Chu kỳ</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {activeSubject && mode === "POMODORO" ? `${pomodoroCycle} chu kỳ` : "Sẵn sàng"}
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Tiến độ vòng lặp</div>
        </Card>
      </div>

      {/* Interactive Timer Hub Card */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-sm">
        {activeSubject ? (
          /* Live Active Session Panel */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#dbe7dd] dark:border-[#263d2e]">
              <div className="flex items-center space-x-3">
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: activeSubject.color || "#2d6a4f" }}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                      {activeSubject.code ? `[${activeSubject.code}] ` : ""}
                      {activeSubject.name}
                    </h2>
                    {mode === "POMODORO" ? (
                      pomodoroPhase === "WORK" ? (
                        <Badge className="bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1e3827] dark:text-[#86e2a8] text-xs">
                          🍅 Pomodoro Focus
                        </Badge>
                      ) : (
                        <Badge className="bg-[#faedcd] text-[#6b4e13] dark:bg-[#3d331e] dark:text-[#edd49d] text-xs">
                          ☕ Nghỉ ngơi
                        </Badge>
                      )
                    ) : mode === "CUSTOM_COUNTDOWN" ? (
                      <Badge className="bg-[#e8edeb] text-[#344e41] dark:bg-[#202e26] dark:text-[#a3bda9] text-xs">
                        ⏱️ Đếm ngược
                      </Badge>
                    ) : (
                      <Badge className="bg-[#d8ebe0] text-[#1b4332] text-xs">⚡ Bấm giờ tự do</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                    {isRunning && !isPaused ? "Đang đếm thời gian thực tế..." : "Đang tạm dừng"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestDocumentPip}
                  className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs font-semibold space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở PIP Ngoài Desktop</span>
                </Button>
              </div>
            </div>

            {/* Giant Monospace Timer Display */}
            <div className="text-center py-6 bg-[#f8fbf8] dark:bg-[#132217] rounded-[24px] border border-[#dbe7dd] dark:border-[#223829]">
              <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
                {mode === "STOPWATCH" ? formatTime(secondsElapsed) : formatTime(remainingSeconds)}
              </div>
              <div className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mt-2">
                {mode === "POMODORO"
                  ? `Chu kỳ hiện tại: #${pomodoroCycle + 1} • ${pomodoroPhase === "WORK" ? "25 phút tập trung" : "5 phút giải lao"}`
                  : mode === "CUSTOM_COUNTDOWN"
                  ? `Mục tiêu đếm ngược: ${countdownMinutes} phút`
                  : `Đã học liên tục: ${formatTime(secondsElapsed)}`}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 mt-6">
                {isRunning && !isPaused ? (
                  <Button
                    onClick={pauseTimer}
                    className="rounded-2xl bg-[#edf0dc] hover:bg-[#e2e6c8] text-[#595e2b] border border-[#dadfbf] font-bold text-xs px-5 h-10 space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Tạm dừng</span>
                  </Button>
                ) : (
                  <Button
                    onClick={resumeTimer}
                    className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-xs px-5 h-10 space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tiếp tục học</span>
                  </Button>
                )}

                {mode === "POMODORO" && (
                  <Button
                    variant="outline"
                    onClick={() => switchPhase()}
                    className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs font-semibold px-4 h-10 space-x-1.5 cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Chuyển pha</span>
                  </Button>
                )}

                <Button
                  onClick={stopTimer}
                  className="rounded-2xl bg-[#f7ebeb] hover:bg-[#ebd4d4] text-[#8a3c3c] border border-[#e8c6c6] font-bold text-xs px-5 h-10 space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Square className="w-4 h-4" />
                  <span>Dừng & Lưu nhật ký</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Launcher Setup Panel */
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
              <Sparkles className="w-4 h-4" />
              <span>CẤU HÌNH PHIÊN HỌC MỚI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Select Subject */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  1. Chọn môn học
                </label>
                {subjects.length === 0 ? (
                  <div className="text-xs text-[#526b5c] p-3 rounded-2xl border border-dashed border-[#dbe7dd]">
                    Chưa có môn học nào. Hãy tạo môn học trong mục Subjects.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {subjects.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubjectId(sub.id)}
                        className={`w-full flex items-center space-x-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedSubjectId === sub.id
                            ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] font-bold text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                            : "border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318] text-[#526b5c] dark:text-[#a3bda9]"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: sub.color || "#2d6a4f" }}
                        />
                        <span className="text-xs truncate">
                          {sub.code ? `[${sub.code}] ` : ""}
                          {sub.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Choose Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  2. Chế độ đếm giờ
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setLauncherMode("POMODORO")}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      launcherMode === "POMODORO"
                        ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] shadow-2xs"
                        : "border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318]"
                    }`}
                  >
                    <div className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5">
                      <span>🍅 Pomodoro (Tập trung & Nghỉ)</span>
                    </div>
                    <div className="text-[11px] text-[#73927d] mt-1">
                      Chu kỳ học 25m / nghỉ 5m khoa học giúp duy trì sự tỉnh táo.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLauncherMode("CUSTOM_COUNTDOWN")}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      launcherMode === "CUSTOM_COUNTDOWN"
                        ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] shadow-2xs"
                        : "border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318]"
                    }`}
                  >
                    <div className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5">
                      <span>⏱️ Hẹn giờ đếm ngược (Countdown)</span>
                    </div>
                    <div className="text-[11px] text-[#73927d] mt-1">
                      Đặt thời lượng cụ thể (30m, 45m, 60m, 90m).
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLauncherMode("STOPWATCH")}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      launcherMode === "STOPWATCH"
                        ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] shadow-2xs"
                        : "border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318]"
                    }`}
                  >
                    <div className="font-bold text-xs text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5">
                      <span>⚡ Bấm giờ tự do (Stopwatch)</span>
                    </div>
                    <div className="text-[11px] text-[#73927d] mt-1">
                      Đếm tăng từ 00:00 cho đến khi bạn bấm dừng.
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: Presets & Start Button */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  3. Tùy chỉnh & Bắt đầu
                </label>

                {launcherMode === "POMODORO" && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9]">
                      Chọn quy chuẩn Pomodoro:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPomodoroPreset("25_5")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                          pomodoroPreset === "25_5"
                            ? "border-[#2d6a4f] bg-[#2d6a4f] text-white shadow-2xs"
                            : "border-[#dbe7dd] text-[#526b5c] hover:bg-[#f8fbf8]"
                        }`}
                      >
                        25m học / 5m nghỉ
                      </button>
                      <button
                        type="button"
                        onClick={() => setPomodoroPreset("50_10")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                          pomodoroPreset === "50_10"
                            ? "border-[#2d6a4f] bg-[#2d6a4f] text-white shadow-2xs"
                            : "border-[#dbe7dd] text-[#526b5c] hover:bg-[#f8fbf8]"
                        }`}
                      >
                        50m học / 10m nghỉ
                      </button>
                    </div>
                  </div>
                )}

                {launcherMode === "CUSTOM_COUNTDOWN" && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9]">
                      Chọn thời lượng:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setCountdownMinutes(mins)}
                          className={`p-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                            countdownMinutes === mins
                              ? "border-[#2d6a4f] bg-[#2d6a4f] text-white shadow-2xs"
                              : "border-[#dbe7dd] text-[#526b5c] hover:bg-[#f8fbf8]"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {launcherMode === "STOPWATCH" && (
                  <div className="p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#223829] text-[11px] text-[#526b5c] dark:text-[#a3bda9]">
                    Phiên học tự do sẽ bắt đầu đếm giờ và lưu lại chính xác số giây bạn tập trung.
                  </div>
                )}

                <Button
                  onClick={handleStartLauncher}
                  disabled={!selectedSubjectId}
                  className="w-full h-11 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-sm space-x-2 shadow-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Bắt đầu phiên học ngay</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* History Log Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#dbe7dd] dark:border-[#263d2e]">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-[#2d6a4f] dark:text-[#52b788]" />
          <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Lịch sử các phiên học đã ghi nhận ({filteredSessions.length})
          </h2>
        </div>

        {/* Filter by subject */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#526b5c]" />
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] px-3 py-1.5 text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] focus:outline-none"
          >
            <option value="ALL">Tất cả môn học</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[#e8f0eb] dark:bg-[#203326] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-3xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] flex items-center justify-center mx-auto mb-3">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Chưa có phiên học nào được lưu
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-sm mx-auto mt-1 leading-relaxed">
            Hãy bắt đầu một phiên học ở trên hoặc mở widget Timer để ghi nhận thời gian thực tế.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((s) => (
            <Card
              key={s.id}
              className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 soft-card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: s.subject?.color || "#2d6a4f" }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
                      {s.subject?.name || "Phiên học tự do"}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1d3827] dark:text-[#9cd1b1]">
                      {s.status === "COMPLETED" ? "Đã hoàn thành" : s.status}
                    </span>
                    {s.source && (
                      <span className="text-[10px] font-medium text-[#73927d]">
                        • {s.source}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(s.actualStart).toLocaleString("vi-VN")}</span>
                    </span>
                    {s.notes && <span className="truncate max-w-xs italic text-[#73927d]">"{s.notes}"</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-sm font-black text-[#192e22] dark:text-[#f0f7f2]">
                    {formatSeconds(s.actualDurationSeconds)}
                  </div>
                  <div className="text-[10px] text-[#73927d]">Thời gian thực tế</div>
                </div>

                {s.productivityScore && (
                  <div className="flex items-center text-amber-500 text-xs font-bold pl-2 border-l border-[#dbe7dd] dark:border-[#263d2e]">
                    <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                    <span>{s.productivityScore}/5</span>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteSession(s.id)}
                  title="Xóa phiên học này"
                  className="p-1.5 rounded-xl text-[#a3a86c] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

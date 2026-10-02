"use client";

import React from "react";
import { usePipTimer } from "./pip-timer-provider";
import { Play, Pause, Square, ExternalLink, SkipForward } from "lucide-react";

export function PipMiniPlayer({ onDockBack }: { onDockBack?: () => void }) {
  const {
    activeSubject,
    mode,
    pomodoroPhase,
    pomodoroCycle,
    targetSeconds,
    remainingSeconds,
    secondsElapsed,
    isRunning,
    isPaused,
    pauseTimer,
    resumeTimer,
    stopTimer,
    switchPhase,
    formatTime,
    isPipOpen,
    requestDocumentPip,
  } = usePipTimer();

  if (!activeSubject) {
    return (
      <div className="text-center py-8 text-xs text-[#787774]">
        Chưa có môn học nào đang được theo dõi.
      </div>
    );
  }

  const isCountdown = mode === "POMODORO" || mode === "CUSTOM_COUNTDOWN";
  const displayTime = isCountdown ? formatTime(remainingSeconds) : formatTime(secondsElapsed);
  const progress =
    targetSeconds > 0 && isCountdown
      ? Math.min(100, Math.max(0, ((targetSeconds - remainingSeconds) / targetSeconds) * 100))
      : 0;

  const phaseLabel =
    mode === "POMODORO"
      ? pomodoroPhase === "WORK"
        ? "🍅 Tập trung"
        : pomodoroPhase === "SHORT_BREAK"
        ? "☕ Nghỉ ngắn (5m)"
        : "🌿 Nghỉ dài (15m)"
      : mode === "CUSTOM_COUNTDOWN"
      ? "⏱️ Đếm ngược"
      : "⚡ Bấm giờ";

  return (
    <div className="flex flex-col h-full justify-between select-none p-1">
      {/* Header: Subject name and status */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2e2e2e]/50">
        <div className="flex items-center space-x-2 truncate">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: activeSubject.color || "#52b788" }}
          />
          <span className="font-semibold text-xs tracking-tight text-[#f0f0f0] truncate max-w-[140px]">
            {activeSubject.code ? `[${activeSubject.code}] ` : ""}
            {activeSubject.name}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isRunning && !isPaused ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="text-[10px] text-[#9b9a97]">
            {isRunning && !isPaused ? "Đang chạy" : "Tạm dừng"}
          </span>
          {!isPipOpen && (
            <button
              onClick={requestDocumentPip}
              title="Bật cửa sổ nổi Picture-in-Picture ngoài desktop"
              className="p-1 hover:bg-[#2c2c2c] rounded text-[#9b9a97] hover:text-white transition-colors cursor-pointer ml-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Display */}
      <div className="py-2 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1e2e22] text-[#86e2a8] text-[10px] font-bold mb-1">
          {phaseLabel}
        </div>

        <div className="font-mono text-3xl font-black tracking-tight text-white drop-shadow-sm my-0.5">
          {displayTime}
        </div>

        {/* Progress Bar for Countdown / Pomodoro */}
        {isCountdown && (
          <div className="w-full bg-[#2a3a2e] rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-[#52b788] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Pomodoro Dots */}
        {mode === "POMODORO" && (
          <div className="flex items-center space-x-1.5 mt-2">
            {[0, 1, 2, 3].map((cycleIdx) => (
              <span
                key={cycleIdx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  cycleIdx < (pomodoroCycle % 4)
                    ? "bg-[#52b788]"
                    : "bg-[#2a3a2e] border border-[#3e5645]"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: Control Buttons */}
      <div className="flex items-center justify-center space-x-2 pt-2 border-t border-[#2e2e2e]/50">
        {isRunning && !isPaused ? (
          <button
            onClick={pauseTimer}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#2c2c2c] hover:bg-[#383838] text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <Pause className="w-3 h-3" />
            <span>Tạm dừng</span>
          </button>
        ) : (
          <button
            onClick={resumeTimer}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#1e5235] hover:bg-[#256641] text-emerald-100 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Tiếp tục</span>
          </button>
        )}

        {mode === "POMODORO" && (
          <button
            onClick={() => switchPhase()}
            title="Chuyển pha tiếp theo"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#223528] hover:bg-[#2c4735] text-[#9cd1b1] text-[11px] font-medium transition-colors cursor-pointer"
          >
            <SkipForward className="w-3 h-3" />
            <span>Chuyển pha</span>
          </button>
        )}

        <button
          onClick={stopTimer}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#4a1f1f] hover:bg-[#612828] text-rose-200 text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Square className="w-3 h-3" />
          <span>Dừng & Lưu</span>
        </button>
      </div>
    </div>
  );
}

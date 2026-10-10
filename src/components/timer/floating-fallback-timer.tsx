"use client";

import React, { useState } from "react";
import { usePipTimer } from "./pip-timer-provider";
import { Play, Pause, Square, ExternalLink, ChevronDown, ChevronUp, SkipForward, Coffee, Sparkles, Maximize2 } from "lucide-react";
import { SmartFocusModeModal } from "./smart-focus-mode-modal";

export function FloatingFallbackTimer() {
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
    isPipOpen,
    pauseTimer,
    resumeTimer,
    stopTimer,
    switchPhase,
    requestDocumentPip,
    formatTime,
  } = usePipTimer();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);

  // If no timer is active or if user is currently using the native OS Document PiP window
  if (!activeSubject || isPipOpen) {
    return null;
  }

  const isCountdown = mode === "POMODORO" || mode === "CUSTOM_COUNTDOWN";
  const displayTime = isCountdown ? formatTime(remainingSeconds) : formatTime(secondsElapsed);
  const progress =
    targetSeconds > 0 && isCountdown
      ? Math.min(100, Math.max(0, ((targetSeconds - remainingSeconds) / targetSeconds) * 100))
      : 0;

  const isBreak = mode === "POMODORO" && pomodoroPhase !== "WORK";

  return (
    <>
      <aside
        aria-label="Bộ đếm giờ học nổi ChronoMind"
      className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 transition-all duration-300 select-none drop-shadow-2xl max-w-[calc(100vw-24px)]"
    >
      <div
        className={`w-[calc(100vw-24px)] max-w-[336px] sm:w-84 rounded-[28px] border transition-all ${
          isBreak
            ? "border-[#d8e2dc] dark:border-[#2d3a33] bg-[#fbfdfc]/95 dark:bg-[#15231c]/95"
            : "border-[var(--border)] bg-white/95 dark:bg-[#17261c]/95"
        } text-[var(--text-ink)] p-4 shadow-2xl backdrop-blur-md`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2.5 truncate">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: activeSubject.color || "#2d6a4f" }}
            />
            <span className="font-bold text-xs truncate max-w-[145px] text-[var(--text-ink)]">
              {activeSubject.code ? `[${activeSubject.code}] ` : ""}
              {activeSubject.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsFocusModeOpen(true)}
              title="Bật Chế độ tập trung (Focus Mode)"
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--mint-soft)] hover:text-[var(--mint-dark)] transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={requestDocumentPip}
              title="Bật cửa sổ nổi Picture-in-Picture ngoài desktop"
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--mint-soft)] hover:text-[var(--mint-dark)] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--mint-soft)] transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="py-3 text-center">
            {/* Phase Tag */}
            <div className="flex items-center justify-center space-x-1.5 mb-1.5">
              {mode === "POMODORO" ? (
                pomodoroPhase === "WORK" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--mint-bg)] dark:bg-[#1e3827] text-[var(--mint-dark)] text-[10px] font-bold">
                    🍅 Focus Session
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#faedcd] dark:bg-[#3d331e] text-[#6b4e13] dark:text-[#edd49d] text-[10px] font-bold">
                    <Coffee className="w-3 h-3" />
                    <span>{pomodoroPhase === "SHORT_BREAK" ? "Nghỉ ngắn (5m)" : "Nghỉ dài (15m)"}</span>
                  </span>
                )
              ) : mode === "CUSTOM_COUNTDOWN" ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e8edeb] dark:bg-[#202e26] text-[#344e41] dark:text-[#a3bda9] text-[10px] font-bold">
                  ⏱️ Đếm ngược
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--mint-bg)] dark:bg-[#1e3827] text-[var(--mint-dark)] text-[10px] font-bold">
                  ⚡ Bấm giờ tự do
                </span>
              )}
            </div>

            {/* Time display */}
            <div className="font-mono text-3xl font-black tracking-tight text-[var(--text-ink)]">
              {displayTime}
            </div>

            {/* Progress bar */}
            {isCountdown && (
              <div className="w-full bg-[var(--mint-bg)] dark:bg-[#223528] rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isBreak ? "bg-amber-400" : "bg-[#52b788]"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Pomodoro Cycles */}
            {mode === "POMODORO" && (
              <div className="flex items-center justify-center space-x-2 mt-2">
                {[0, 1, 2, 3].map((cycleIdx) => (
                  <span
                    key={cycleIdx}
                    title={`Chu kỳ ${cycleIdx + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      cycleIdx < (pomodoroCycle % 4)
                        ? "bg-[var(--mint)] ring-2 ring-[#d8ebe0] dark:ring-[#263d2e]"
                        : "bg-[#dbe7dd] dark:bg-[#263d2e]"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 mt-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isRunning && !isPaused ? "bg-[#52b788] animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] font-semibold text-[var(--text-subtle)]">
                {isRunning && !isPaused ? (isBreak ? "Thời gian nghỉ ngơi" : "Đang tính giờ học tập") : "Đang tạm dừng"}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-[var(--border)]">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#edf0dc] hover:bg-[#e2e6c8] text-[#595e2b] border border-[#dadfbf] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tiếp tục</span>
                </button>
              )}

              {mode === "POMODORO" && (
                <button
                  onClick={() => switchPhase()}
                  title="Chuyển pha ngay (bỏ qua nghỉ hoặc bắt đầu học tiếp)"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-[var(--mint-bg)] hover:bg-[var(--mint-bg)] text-[var(--mint-dark)] border border-[var(--border)] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Chuyển pha</span>
                </button>
              )}

              <button
                onClick={stopTimer}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#f7ebeb] hover:bg-[#ebd4d4] text-[#8a3c3c] border border-[#e8c6c6] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Dừng & Lưu</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-[var(--text-subtle)]">
                {mode === "POMODORO" ? (isBreak ? "☕" : "🍅") : "⏱️"}
              </span>
              <span className="font-mono text-sm font-bold">{displayTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="p-1.5 rounded-full hover:bg-[var(--mint-soft)] cursor-pointer text-[#a3a86c]"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1.5 rounded-full hover:bg-[var(--mint-soft)] cursor-pointer text-[var(--mint-dark)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
              {mode === "POMODORO" && (
                <button
                  onClick={() => switchPhase()}
                  title="Chuyển pha"
                  className="p-1.5 rounded-full hover:bg-[var(--mint-soft)] cursor-pointer text-[#52b788]"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={stopTimer}
                className="p-1.5 rounded-full hover:bg-[var(--mint-soft)] cursor-pointer text-[#b87474]"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
    {isFocusModeOpen && (
      <SmartFocusModeModal
        open={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        taskTitle={activeSubject?.name || "Phiên học tập"}
        subjectName={activeSubject?.name}
      />
    )}
  </>
  );
}

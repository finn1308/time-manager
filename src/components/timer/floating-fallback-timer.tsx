"use client";

import React, { useState } from "react";
import { usePipTimer } from "./pip-timer-provider";
import { Play, Pause, Square, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export function FloatingFallbackTimer() {
  const {
    activeSubject,
    secondsElapsed,
    isRunning,
    isPaused,
    isPipOpen,
    pauseTimer,
    resumeTimer,
    stopTimer,
    requestDocumentPip,
    formatTime,
  } = usePipTimer();

  const [isMinimized, setIsMinimized] = useState(false);

  // If no timer is active or if user is currently using the native OS Document PiP window, don't show the redundant on-screen widget
  if (!activeSubject || isPipOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Bộ đếm giờ học nổi"
      className="fixed bottom-6 right-6 z-40 transition-all duration-200 select-none drop-shadow-xl"
    >
      <div className="w-80 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] text-[#37352f] dark:text-[#f0f0f0] p-3.5 shadow-2xl backdrop-blur-md">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
          <div className="flex items-center space-x-2 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeSubject.color }}
            />
            <span className="font-semibold text-xs truncate max-w-[140px]">
              {activeSubject.code ? `[${activeSubject.code}] ` : ""}
              {activeSubject.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={requestDocumentPip}
              title="Mở chế độ Picture-in-Picture nổi ngoài màn hình"
              className="p-1 rounded text-[#787774] hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-[#787774] hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="py-3 text-center">
            <div className="font-mono text-2xl font-bold tracking-tight text-[#171717] dark:text-white">
              {formatTime(secondsElapsed)}
            </div>
            <div className="flex items-center justify-center space-x-1.5 mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isRunning && !isPaused ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] text-[#787774] dark:text-[#9b9a97]">
                {isRunning && !isPaused ? "Đang ghi nhận giờ học" : "Đang tạm dừng"}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-2.5 mt-3 pt-2 border-t border-[#e9e9e7] dark:border-[#2e2e2e]">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-[#f1f1ef] dark:bg-[#2c2c2c] hover:bg-[#e8e8e6] text-amber-600 dark:text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Tiếp tục</span>
                </button>
              )}

              <button
                onClick={stopTimer}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Dừng & Lưu</span>
              </button>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-sm font-semibold">{formatTime(secondsElapsed)}</span>
            <div className="flex items-center space-x-1">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="p-1 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] cursor-pointer"
                >
                  <Pause className="w-3 h-3 text-amber-500" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] cursor-pointer"
                >
                  <Play className="w-3 h-3 text-emerald-500" />
                </button>
              )}
              <button
                onClick={stopTimer}
                className="p-1 rounded hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] cursor-pointer"
              >
                <Square className="w-3 h-3 text-rose-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

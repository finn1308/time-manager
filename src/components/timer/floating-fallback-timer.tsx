"use client";

import React, { useState } from "react";
import { usePipTimer } from "./pip-timer-provider";
import { Play, Pause, Square, ExternalLink, ChevronDown, ChevronUp, Clock } from "lucide-react";

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

  // If no timer is active or if user is currently using the native OS Document PiP window
  if (!activeSubject || isPipOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Bộ đếm giờ học nổi"
      className="fixed bottom-6 right-6 z-40 transition-all duration-300 select-none drop-shadow-2xl"
    >
      <div className="w-84 rounded-[28px] border-2 border-slate-900/10 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 p-4 shadow-2xl backdrop-blur-md">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5 truncate">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: activeSubject.color }}
            />
            <span className="font-bold text-xs truncate max-w-[150px] text-slate-900 dark:text-white">
              {activeSubject.code ? `[${activeSubject.code}] ` : ""}
              {activeSubject.name}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={requestDocumentPip}
              title="Bật cửa sổ nổi Picture-in-Picture ngoài desktop"
              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="py-4 text-center">
            <div className="font-mono text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatTime(secondsElapsed)}
            </div>
            <div className="flex items-center justify-center space-x-2 mt-1.5">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isRunning && !isPaused ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-200" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isRunning && !isPaused ? "Đang ghi nhận thời gian học" : "Đang tạm dừng"}
              </span>
            </div>

            {/* Pill Controls */}
            <div className="flex items-center justify-center space-x-2.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tiếp tục</span>
                </button>
              )}

              <button
                onClick={stopTimer}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Dừng & Lưu</span>
              </button>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-sm font-bold">{formatTime(secondsElapsed)}</span>
            <div className="flex items-center space-x-1.5">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                </button>
              )}
              <button
                onClick={stopTimer}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-rose-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

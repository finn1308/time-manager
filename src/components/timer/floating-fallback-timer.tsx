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
      <div className="w-80 rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white/95 dark:bg-[#17261c]/95 text-[#192e22] dark:text-[#f0f7f2] p-4 shadow-2xl backdrop-blur-md">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#dbe7dd]/80 dark:border-[#263d2e]">
          <div className="flex items-center space-x-2.5 truncate">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: activeSubject.color || "#2d6a4f" }}
            />
            <span className="font-bold text-xs truncate max-w-[150px] text-[#192e22] dark:text-[#f0f7f2]">
              {activeSubject.code ? `[${activeSubject.code}] ` : ""}
              {activeSubject.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={requestDocumentPip}
              title="Bật cửa sổ nổi Picture-in-Picture ngoài desktop"
              className="p-1.5 rounded-full text-[#73927d] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] hover:text-[#2d6a4f] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-full text-[#73927d] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="py-4 text-center">
            <div className="font-mono text-3xl font-black tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
              {formatTime(secondsElapsed)}
            </div>
            <div className="flex items-center justify-center space-x-2 mt-1.5">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isRunning && !isPaused ? "bg-[#52b788] animate-pulse ring-2 ring-[#d8ebe0]" : "bg-[#a3a86c]"
                }`}
              />
              <span className="text-[11px] font-semibold text-[#526b5c] dark:text-[#a3bda9]">
                {isRunning && !isPaused ? "Đang ghi nhận thời gian thực tế" : "Đang tạm dừng"}
              </span>
            </div>

            {/* Pill Controls */}
            <div className="flex items-center justify-center space-x-2.5 mt-4 pt-3 border-t border-[#dbe7dd]/80 dark:border-[#263d2e]">
              {isRunning && !isPaused ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#edf0dc] hover:bg-[#e2e6c8] text-[#595e2b] border border-[#dadfbf] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tiếp tục</span>
                </button>
              )}

              <button
                onClick={stopTimer}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#f7ebeb] hover:bg-[#ebd4d4] text-[#8a3c3c] border border-[#e8c6c6] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
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
                  className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 text-[#a3a86c]" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#2d6a4f] fill-current" />
                </button>
              )}
              <button
                onClick={stopTimer}
                className="p-1.5 rounded-full hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-[#b87474]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

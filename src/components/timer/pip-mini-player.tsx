"use client";

import React from "react";
import { usePipTimer } from "./pip-timer-provider";
import { Play, Pause, Square, ExternalLink } from "lucide-react";

export function PipMiniPlayer({ onDockBack }: { onDockBack?: () => void }) {
  const {
    activeSubject,
    secondsElapsed,
    isRunning,
    isPaused,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    isPipOpen,
    requestDocumentPip,
  } = usePipTimer();

  if (!activeSubject) {
    return (
      <div className="text-center py-6 text-sm text-[#787774]">
        Chưa có môn học nào đang được theo dõi.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Header: Subject name and status */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2e2e2e]/50">
        <div className="flex items-center space-x-2 truncate">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: activeSubject.color }}
          />
          <span className="font-semibold text-xs tracking-tight text-[#f0f0f0] truncate">
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
            {isRunning && !isPaused ? "Đang học" : "Tạm dừng"}
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

      {/* Main: Big Monospace Clock */}
      <div className="py-4 text-center">
        <div className="font-mono text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          {formatTime(secondsElapsed)}
        </div>
        <p className="text-[11px] text-[#9b9a97] mt-1">ChronoMind Focus Session</p>
      </div>

      {/* Footer: Control Buttons */}
      <div className="flex items-center justify-center space-x-3 pt-2 border-t border-[#2e2e2e]/50">
        {isRunning && !isPaused ? (
          <button
            onClick={pauseTimer}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#2c2c2c] hover:bg-[#383838] text-amber-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Tạm dừng</span>
          </button>
        ) : (
          <button
            onClick={resumeTimer}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-700/70 hover:bg-emerald-600 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Tiếp tục</span>
          </button>
        )}

        <button
          onClick={stopTimer}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Dừng & Lưu</span>
        </button>
      </div>
    </div>
  );
}

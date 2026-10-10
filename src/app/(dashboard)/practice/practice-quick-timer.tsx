"use client";

import React from "react";
import { Play, Pause, Flame, Clock } from "lucide-react";
import { usePipTimer } from "@/components/timer/pip-timer-provider";

interface PracticeQuickTimerProps {
  subject: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  };
}

export function PracticeQuickTimer({ subject }: PracticeQuickTimerProps) {
  const { startTimer, isRunning, activeSubject, pauseTimer } = usePipTimer();

  const isCurrentRunning = isRunning && activeSubject?.id === subject.id;

  const handleClick = () => {
    if (isCurrentRunning) {
      pauseTimer();
    } else {
      startTimer({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        color: subject.color || "#2d6a4f",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer active:scale-95 ${
        isCurrentRunning
          ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
          : "bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white"
      }`}
      title={isCurrentRunning ? "Tạm dừng Study Timer" : `Bắt đầu bấm giờ học môn ${subject.name}`}
    >
      {isCurrentRunning ? (
        <>
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>Đang học ({subject.code || "IELTS"})</span>
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          <span>Bấm giờ luyện {subject.code || "IELTS"}</span>
        </>
      )}
    </button>
  );
}

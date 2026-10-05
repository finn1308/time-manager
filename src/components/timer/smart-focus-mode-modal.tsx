"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  Volume2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SmartFocusModeModalProps {
  open: boolean;
  onClose: () => void;
  subjectName?: string;
  taskTitle?: string;
}

export function SmartFocusModeModal({
  open,
  onClose,
  subjectName = "Học tập trung",
  taskTitle,
}: SmartFocusModeModalProps) {
  const stages = [
    {
      name: "1. Khởi động & Gợi nhớ (Warm-up Recall)",
      durationMinutes: 5,
      guidance: "Không mở tài liệu. Dành 5 phút nhớ lại và ghi nhanh các ý chính của buổi học trước.",
      color: "from-amber-500 to-orange-500",
    },
    {
      name: "2. Tiếp thu kiến thức cốt lõi (Learn)",
      durationMinutes: 20,
      guidance: "Tập trung 100% vào tài liệu, giáo trình hoặc video bài giảng mà không để điện thoại làm gián đoạn.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "3. Tự kiểm tra chủ động (Active Recall)",
      durationMinutes: 10,
      guidance: "Gấp tài liệu lại. Hãy tự giải thích định nghĩa hoặc viết lại công thức bằng chính ngôn ngữ của bạn.",
      color: "from-blue-500 to-indigo-500",
    },
    {
      name: "4. Luyện tập giải bài (Practice)",
      durationMinutes: 10,
      guidance: "Áp dụng công thức vào giải 2-3 bài tập mẫu hoặc lật bộ flashcard ôn tập.",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "5. Rà soát & Bắt lỗi (Review)",
      durationMinutes: 5,
      guidance: "Đối chiếu câu trả lời với lời giải chuẩn. Ghi lại các lỗi sai vào Ngân hàng lỗi sai (Mistake Bank).",
      color: "from-rose-500 to-red-500",
    },
    {
      name: "6. Chiêm nghiệm & Đúc kết (Reflection)",
      durationMinutes: 5,
      guidance: "Ghi ra một bài học then chốt bạn tâm đắc nhất trong phiên học này.",
      color: "from-teal-500 to-emerald-600",
    },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(stages[0].durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    setSecondsLeft(stages[currentStageIdx].durationMinutes * 60);
  }, [currentStageIdx]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      // Stage finished
      setIsRunning(false);
      setCompletedStages((prev) => [...prev, currentStageIdx]);
      if (currentStageIdx + 1 < stages.length) {
        setCurrentStageIdx((prev) => prev + 1);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, currentStageIdx]);

  if (!open) return null;

  const currentStage = stages[currentStageIdx];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1a13]/95 backdrop-blur-md text-[#f0f7f2] flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-600/80 text-white font-semibold px-3 py-1">
            FOCUS MODE 6-PHASE
          </Badge>
          <span className="text-sm text-emerald-300 font-medium">Môn: {subjectName}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white rounded-xl"
        >
          <X className="w-5 h-5 mr-1" />
          Thoát chế độ tập trung
        </Button>
      </div>

      {/* Main Focus Stage & Timer Display */}
      <div className="max-w-xl mx-auto w-full text-center space-y-6 my-auto">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block">
          GIAI ĐOẠN {currentStageIdx + 1} / {stages.length}
        </span>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {currentStage.name}
        </h1>

        {/* Big Digital Timer */}
        <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-emerald-300 drop-shadow-lg my-4">
          {timeFormatted}
        </div>

        {/* Guidance Box */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-200 leading-relaxed max-w-md mx-auto backdrop-blur-sm">
          {currentStage.guidance}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className="w-36 py-7 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-[#0f1a13] font-bold text-lg shadow-lg"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" /> Tạm dừng
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" /> Bắt đầu
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              if (currentStageIdx + 1 < stages.length) {
                setCurrentStageIdx((prev) => prev + 1);
              }
            }}
            className="py-7 px-5 rounded-2xl border-white/20 text-white hover:bg-white/10"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stage Dots Matrix */}
      <div className="max-w-md mx-auto w-full flex items-center justify-center gap-2 pt-4">
        {stages.map((st, i) => (
          <div
            key={i}
            onClick={() => setCurrentStageIdx(i)}
            className={`h-2 rounded-full cursor-pointer transition-all ${
              i === currentStageIdx
                ? "w-8 bg-emerald-400"
                : completedStages.includes(i)
                ? "w-4 bg-emerald-600"
                : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

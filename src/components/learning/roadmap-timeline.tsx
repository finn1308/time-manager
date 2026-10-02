"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  Play,
  BookOpen,
  Award,
  Flame,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Calendar,
  X,
  Trash2,
} from "lucide-react";
import { StudyBunnyMascot } from "./study-bunny-mascot";
import { DeleteRoadmapModal } from "./delete-roadmap-modal";
import { Button } from "@/components/ui/button";

export interface RoadmapStageData {
  id: string;
  dayNumber: number;
  title: string;
  description?: string | null;
  estimatedMinutes: number;
  xpReward: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  lessonContent?: string | null;
  keyConcepts?: string | null; // JSON array
  quizzes?: Array<{
    id: string;
    questionCount: number;
    difficulty: string;
    attempts?: Array<{ score: number }>;
  }>;
}

export interface RoadmapData {
  id: string;
  title: string;
  targetDays: number;
  targetGrade: string;
  dailyMinutes: number;
  totalStages: number;
  completedStages: number;
  totalXp: number;
  stages: RoadmapStageData[];
}

interface RoadmapTimelineProps {
  roadmap: RoadmapData;
  userXp: number;
  streakDays: number;
  onSelectQuiz: (quizId: string) => void;
  onDeleteSuccess?: (message: string) => void;
  onDeleteError?: (error: string) => void;
  onResetRoadmap?: () => void;
}

export function RoadmapTimeline({
  roadmap,
  userXp,
  streakDays,
  onSelectQuiz,
  onDeleteSuccess,
  onDeleteError,
  onResetRoadmap,
}: RoadmapTimelineProps) {
  const [selectedLessonStage, setSelectedLessonStage] = useState<RoadmapStageData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const completedCount = roadmap.stages.filter((s) => s.isCompleted).length;
  const progressPercent =
    roadmap.totalStages > 0 ? Math.round((completedCount / roadmap.totalStages) * 100) : 0;

  // Find next actionable stage
  const currentActionableStage =
    roadmap.stages.find((s) => s.isUnlocked && !s.isCompleted) ||
    roadmap.stages[roadmap.stages.length - 1];

  const currentDayNum = currentActionableStage?.dayNumber || 1;

  return (
    <div className="space-y-6">
      {/* ================= TOP HEADER CARD (PDF Page 3) ================= */}
      <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] mb-0.5">
              <span>HÀNH TRÌNH {roadmap.targetDays} NGÀY</span>
              <span>•</span>
              <span>MỤC TIÊU {roadmap.targetGrade}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
              <span>Hi, Study Bunny! Let&apos;s continue!</span>
            </h1>
            <p className="text-xs text-[#526b5c] dark:text-[#8aa693] mt-0.5">
              Bạn đã hoàn thành{" "}
              <strong className="text-[#192e22] dark:text-[#f0f7f2]">
                {completedCount} / {roadmap.totalStages} chặng
              </strong>
              . Cố lên nhé!
            </p>
          </div>

          {/* Quick Metrics Badges & Actions */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#fcedeb] dark:bg-[#381c1c] text-[#d9483b] text-xs font-bold shadow-2xs">
              <Flame className="w-4 h-4 fill-[#d9483b]" />
              <span>{streakDays} Ngày Streak</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#eef7ee] dark:bg-[#1c3623] text-[#2d6a4f] dark:text-[#7fc498] text-xs font-bold shadow-2xs">
              <Zap className="w-4 h-4 fill-[#2d6a4f] dark:fill-[#7fc498]" />
              <span>{userXp} XP</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="rounded-full text-xs text-[#b91c1c] dark:text-[#f87171] border-[#fecaca] dark:border-[#522222] hover:bg-[#fef2f2] dark:hover:bg-[#2b1616] space-x-1 cursor-pointer transition-all shadow-2xs"
              title="Delete this learning roadmap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete roadmap</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#526b5c] dark:text-[#8aa693]">
            <span>Tiến độ tổng thể</span>
            <span className="text-[#2d6a4f] dark:text-[#52b788]">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#eef5f0] dark:bg-[#1f3325] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#52b788] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements / Badges Strip */}
        <div className="flex items-center space-x-2 pt-1 overflow-x-auto text-[11px] font-semibold text-[#526b5c]">
          <span className="shrink-0 text-xs">Thành tựu:</span>
          <span className="px-2.5 py-1 rounded-full bg-[#f8fbf8] dark:bg-[#192b1f] border border-[#dbe7dd] dark:border-[#263d2e] flex items-center space-x-1 shrink-0">
            <span>🎗️</span>
            <span>First Quest</span>
          </span>
          {streakDays >= 3 && (
            <span className="px-2.5 py-1 rounded-full bg-[#f8fbf8] dark:bg-[#192b1f] border border-[#dbe7dd] dark:border-[#263d2e] flex items-center space-x-1 shrink-0">
              <span>🔥</span>
              <span>3-Day Streak</span>
            </span>
          )}
          {progressPercent >= 50 && (
            <span className="px-2.5 py-1 rounded-full bg-[#f8fbf8] dark:bg-[#192b1f] border border-[#dbe7dd] dark:border-[#263d2e] flex items-center space-x-1 shrink-0">
              <span>⭐</span>
              <span>Halfway Hero</span>
            </span>
          )}
        </div>

        {/* Mascot Motivational Dialogue */}
        <StudyBunnyMascot
          message={`Hôm nay chúng ta tiếp tục với Day ${currentDayNum < 10 ? "0" + currentDayNum : currentDayNum}. Hãy sẵn sàng nạp thêm kiến thức và nhận XP nhé!`}
          mood={progressPercent === 100 ? "celebrating" : "happy"}
        />
      </div>

      {/* ================= TIMELINE SECTION (PDF Page 3 & 6) ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-extrabold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
            <span>🗺️ Bản đồ Chinh phục Lộ trình</span>
          </h2>
          <span className="text-xs text-[#73927d]">
            {completedCount}/{roadmap.totalStages} hoàn thành
          </span>
        </div>

        <div className="space-y-3">
          {roadmap.stages.map((stage) => {
            const isCompleted = stage.isCompleted;
            const isUnlocked = stage.isUnlocked;
            const isCurrent = isUnlocked && !isCompleted;
            const quiz = stage.quizzes && stage.quizzes[0];
            const bestScore = quiz?.attempts?.[0]?.score;

            return (
              <div
                key={stage.id}
                className={`p-4 sm:p-5 rounded-[26px] border transition-all ${
                  isCurrent
                    ? "bg-[#f2f8f4] dark:bg-[#162e20] border-[#52b788] shadow-sm ring-1 ring-[#52b788]/50"
                    : isCompleted
                    ? "bg-white dark:bg-[#17261c] border-[#dbe7dd] dark:border-[#263d2e]"
                    : "bg-[#fbfdfb] dark:bg-[#132017]/70 border-[#e5ede7] dark:border-[#1f3326] opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Day Badge & Title */}
                  <div className="flex items-start space-x-3.5">
                    {/* Status Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-2xs ${
                        isCompleted
                          ? "bg-[#2d6a4f] text-white"
                          : isCurrent
                          ? "bg-[#52b788] text-white animate-pulse"
                          : "bg-[#e5ede7] dark:bg-[#1e3024] text-[#8aa693]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Play className="w-5 h-5 fill-current" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#73927d]">
                        <span
                          className={`font-black uppercase tracking-wider ${
                            isCurrent
                              ? "text-[#2d6a4f] dark:text-[#7fc498]"
                              : isCompleted
                              ? "text-[#2d6a4f]"
                              : ""
                          }`}
                        >
                          DAY {stage.dayNumber < 10 ? "0" + stage.dayNumber : stage.dayNumber}
                        </span>
                        <span>•</span>
                        <span>{stage.estimatedMinutes} phút</span>
                        <span>•</span>
                        <span>{quiz?.questionCount || 10} câu hỏi</span>
                        <span>•</span>
                        <span className="text-[#2d6a4f] font-bold">+{stage.xpReward} XP</span>
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold mt-0.5 ${
                          isCompleted
                            ? "text-[#192e22] dark:text-[#f0f7f2]"
                            : isCurrent
                            ? "text-[#1b4332] dark:text-[#9fe3ba]"
                            : "text-[#526b5c] dark:text-[#75917e]"
                        }`}
                      >
                        {stage.title}
                      </h3>

                      {stage.description && (
                        <p className="text-xs text-[#73927d] mt-1 line-clamp-1">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2.5 sm:self-center ml-13 sm:ml-0">
                    {/* Read Lesson Notes Button */}
                    {stage.lessonContent && isUnlocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLessonStage(stage)}
                        className="rounded-full text-xs space-x-1 border-[#b7d8c3] hover:bg-[#eef5f0]"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#2d6a4f]" />
                        <span>Tóm tắt bài học</span>
                      </Button>
                    )}

                    {/* Quiz Action Button */}
                    {isCompleted ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#2d6a4f] flex items-center space-x-1 bg-[#d8ebe0] dark:bg-[#1d3b27] px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã hoàn thành {bestScore ? `(${bestScore}%)` : ""}</span>
                        </span>
                        {quiz && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectQuiz(quiz.id)}
                            className="rounded-full text-xs text-[#526b5c] hover:text-[#192e22]"
                            title="Luyện tập lại"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : isUnlocked ? (
                      quiz && (
                        <Button
                          size="sm"
                          onClick={() => onSelectQuiz(quiz.id)}
                          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full text-xs px-5 space-x-1.5 font-bold shadow-xs cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Vào làm bài</span>
                        </Button>
                      )
                    ) : (
                      <div className="flex items-center space-x-1 text-xs text-[#8aa693] bg-[#f0f4f1] dark:bg-[#1b2b20] px-3.5 py-1.5 rounded-full font-semibold">
                        <Lock className="w-3 h-3" />
                        <span>Khóa</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Destination Node (PDF Page 7) */}
          <div className="p-4 sm:p-5 rounded-[26px] border border-dashed border-[#b7d8c3] dark:border-[#2d6a4f] bg-[#eef7ee]/40 dark:bg-[#16291c]/30 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2d6a4f] to-[#52b788] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              🎯
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                Đích đến! Chinh phục mục tiêu {roadmap.targetGrade}
              </h4>
              <p className="text-xs text-[#73927d]">
                Hoàn thành tất cả các chặng để sẵn sàng 100% cho kỳ thi và kiến thức chuyên sâu!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= LESSON CONTENT DRAWER MODAL ================= */}
      {selectedLessonStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101c14]/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#2d6a4f] uppercase tracking-wider">
                  DAY {selectedLessonStage.dayNumber < 10 ? "0" + selectedLessonStage.dayNumber : selectedLessonStage.dayNumber} • TÓM TẮT TRỌNG TÂM
                </span>
                <h3 className="text-base font-extrabold text-[#192e22] dark:text-[#f0f7f2] mt-0.5">
                  {selectedLessonStage.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLessonStage(null)}
                className="p-1.5 rounded-full hover:bg-[#eef5f0] text-[#73927d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Markdown Lesson Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-[#2d4734] dark:text-[#d3e6d8] bg-[#f8fbf8] dark:bg-[#142318] p-4 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e]">
              <div className="whitespace-pre-wrap">{selectedLessonStage.lessonContent}</div>
            </div>

            {/* Key Concepts Tags */}
            {selectedLessonStage.keyConcepts && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#526b5c]">Khái niệm cốt lõi:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    try {
                      const concepts: string[] = JSON.parse(selectedLessonStage.keyConcepts);
                      return concepts.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-[#eef5f0] dark:bg-[#1d3624] text-[11px] font-semibold text-[#1b4332] dark:text-[#7fc498]"
                        >
                          #{c}
                        </span>
                      ));
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedLessonStage(null)}
                className="rounded-2xl text-xs"
              >
                Đóng
              </Button>
              {selectedLessonStage.quizzes && selectedLessonStage.quizzes[0] && (
                <Button
                  onClick={() => {
                    const qId = selectedLessonStage.quizzes![0].id;
                    setSelectedLessonStage(null);
                    onSelectQuiz(qId);
                  }}
                  className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Vào làm Quiz ngay</span>
                </Button>
              )}
            </div>
          </div>
      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <DeleteRoadmapModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        roadmapTitle={roadmap.title}
        roadmapId={roadmap.id}
        onSuccess={(msg) => onDeleteSuccess?.(msg)}
        onError={(err) => onDeleteError?.(err)}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  Award,
  ChevronRight,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyBunnyMascot } from "./study-bunny-mascot";
import { usePipTimer } from "@/components/timer/pip-timer-provider";

export interface QuizQuestionData {
  id: string;
  question: string;
  options: string[];
  hint?: boolean | string;
  difficulty: string;
  questionType: string;
  topic: string;
  sourceReference?: string | null;
  sourcePage?: number | null;
}

export interface QuizData {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string;
  questionCount: number;
  mode: string;
  stage?: {
    id: string;
    dayNumber: number;
    title: string;
    xpReward: number;
    roadmapId: string;
  } | null;
  subject?: {
    id: string;
    name: string;
    color: string;
  } | null;
  questions: QuizQuestionData[];
}

interface QuizPlayerProps {
  quiz: QuizData;
  onFinish: () => void;
  onScheduleStudy?: (topic: string) => void;
}

interface InstantFeedback {
  isCorrect: boolean;
  correctAnswer: number;
  rationale: string;
  sourceReference?: string;
  sourcePage?: number;
  xpEarned: number;
}

export function QuizPlayer({ quiz, onFinish, onScheduleStudy }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"PRACTICE" | "EXAM">("PRACTICE");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [hintContent, setHintContent] = useState<string | null>(null);

  // Practice mode instant feedback
  const [feedback, setFeedback] = useState<Record<string, InstantFeedback>>({});
  const [verifying, setVerifying] = useState(false);

  // Time tracker
  const [seconds, setSeconds] = useState(0);
  const { isRunning: isTimerRunning } = usePipTimer();

  // Final submission state
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    isPassed: boolean;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    timeSpentSeconds: number;
    xpEarned: number;
    unlockedNextDay: boolean;
    nextDayNumber?: number | null;
    weakTopics: Array<{ topic: string; wrongCount: number; accuracy: number }>;
    recommendations: string[];
    answers: Array<{
      questionId: string;
      questionText: string;
      selectedAnswer: number;
      correctAnswer: number;
      isCorrect: boolean;
      rationale: string;
      topic: string;
      sourceReference?: string | null;
    }>;
  } | null>(null);

  // Timer effect
  useEffect(() => {
    if (results) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [results]);

  const currentQ = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const selectedOpt = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const currentFeedback = currentQ ? feedback[currentQ.id] : undefined;

  // Handle Option Selection in Practice Mode
  const handleSelectOption = async (optionIndex: number) => {
    if (!currentQ) return;
    if (mode === "PRACTICE" && currentFeedback) return; // Prevent re-picking after verified

    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));

    if (mode === "PRACTICE") {
      setVerifying(true);
      try {
        const res = await fetch(`/api/quiz/${quiz.id}/submit-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQ.id,
            selectedAnswer: optionIndex,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setFeedback((prev) => ({
            ...prev,
            [currentQ.id]: {
              isCorrect: data.isCorrect,
              correctAnswer: data.correctAnswer,
              rationale: data.rationale,
              sourceReference: data.sourceReference,
              sourcePage: data.sourcePage,
              xpEarned: data.xpEarned,
            },
          }));
        }
      } catch (e) {
        console.error("Verification error:", e);
      } finally {
        setVerifying(false);
      }
    }
  };

  // Submit complete quiz to server
  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: typeof selectedAnswers[q.id] === "number" ? selectedAnswers[q.id] : -1,
        timeSpentSeconds: 15,
      }));

      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          answers: formattedAnswers,
          isTimerRunning,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi nộp bài");

      setResults(data);
    } catch (err: any) {
      alert(err.message || "Lỗi nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" + s : s}`;
  };

  const optionLabels = ["A", "B", "C", "D"];

  // ================= RESULTS SCREEN (PDF Page 6) =================
  if (results) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs text-center">
          <div className="w-16 h-16 rounded-full bg-[#d8ebe0] dark:bg-[#1c3826] text-[#2d6a4f] dark:text-[#52b788] mx-auto flex items-center justify-center text-3xl shadow-xs">
            {results.isPassed ? "🎉" : "📚"}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#2d6a4f] dark:text-[#52b788]">
              {results.isPassed ? "XUẤT SẮC HOÀN THÀNH!" : "CỐ GẮNG LÊN NHÉ!"}
            </span>
            <h1 className="text-3xl font-black text-[#192e22] dark:text-[#f0f7f2]">
              {results.score}% Điểm
            </h1>
            <p className="text-xs text-[#526b5c] dark:text-[#8aa693]">
              {results.correctCount} / {results.totalQuestions} câu chính xác • Thời gian hoàn thành:{" "}
              {formatTimer(results.timeSpentSeconds)}
            </p>
          </div>

          {/* Gamified Rewards */}
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#eef7ee] dark:bg-[#1c3623] text-[#2d6a4f] dark:text-[#7fc498] text-sm font-bold shadow-2xs">
              <Zap className="w-4 h-4 fill-current" />
              <span>+{results.xpEarned} XP</span>
            </div>
            {results.unlockedNextDay && results.nextDayNumber && (
              <div className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#fbf3d5] dark:bg-[#382f14] text-[#916b14] text-xs font-bold shadow-2xs">
                <span>🔓 Mở khóa Day {results.nextDayNumber < 10 ? "0" + results.nextDayNumber : results.nextDayNumber}!</span>
              </div>
            )}
          </div>

          {/* Mascot feedback */}
          <StudyBunnyMascot
            message={
              results.isPassed
                ? results.unlockedNextDay
                  ? `Tuyệt vời ông mặt trời! Bạn đã xuất sắc hoàn thành chặng này và mở khóa Day ${results.nextDayNumber}! Hãy duy trì phong độ nhé!`
                  : `Chúc mừng bạn đã đạt ${results.score}% điểm! Bạn nắm kiến thức rất chắc đấy!`
                : "Đừng nản lòng nhé! Xem kỹ các câu sai bên dưới và bấm nút làm lại bài để cùng mở khóa chặng tiếp theo nào!"
            }
            mood={results.isPassed ? "celebrating" : "cheering"}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={onFinish}
              className="w-full sm:w-auto bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full px-6 text-xs font-bold"
            >
              <span>Về Bản đồ Lộ trình</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setResults(null);
                setCurrentIndex(0);
                setSelectedAnswers({});
                setFeedback({});
                setSeconds(0);
              }}
              className="w-full sm:w-auto rounded-full text-xs space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại bài Quiz</span>
            </Button>
          </div>
        </div>

        {/* ================= MISTAKES & WEAK TOPICS REVIEW ================= */}
        {results.weakTopics.length > 0 && (
          <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-sm text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
              <span>⚠️ Chủ đề cần củng cố (Weak Topics)</span>
            </h3>

            <div className="space-y-2.5">
              {results.weakTopics.map((wt, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">{wt.topic}</span>
                    <p className="text-[11px] text-[#73927d]">
                      Chính xác: {wt.accuracy}% ({wt.wrongCount} câu sai)
                    </p>
                  </div>
                  {onScheduleStudy && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onScheduleStudy(wt.topic)}
                      className="rounded-full text-[11px] space-x-1"
                    >
                      <Calendar className="w-3 h-3 text-[#2d6a4f]" />
                      <span>Thêm vào Lịch học</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Question Review List */}
        <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-[#192e22] dark:text-[#f0f7f2]">
            📝 Chi tiết câu trả lời
          </h3>

          <div className="space-y-3">
            {results.answers.map((ans, idx) => (
              <div
                key={ans.questionId}
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  ans.isCorrect
                    ? "bg-[#f2f8f4] dark:bg-[#14261b] border-[#b7d8c3] dark:border-[#284a34]"
                    : "bg-[#fdf4f4] dark:bg-[#2b1717] border-[#e8c6c6] dark:border-[#4a2222]"
                }`}
              >
                <div className="flex items-center space-x-2 font-bold">
                  {ans.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2d6a4f]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#b87474]" />
                  )}
                  <span className="text-[#192e22] dark:text-[#f0f7f2]">
                    Câu {idx + 1}: {ans.questionText}
                  </span>
                </div>
                <div className="pl-6 text-[#526b5c] dark:text-[#a3bda9] text-[11px] space-y-1">
                  <p>
                    <strong>Đáp án đúng:</strong> Phương án {optionLabels[ans.correctAnswer]}
                  </p>
                  <p>
                    <strong>Giải thích:</strong> {ans.rationale}
                  </p>
                  {ans.sourceReference && (
                    <p className="text-[10px] text-[#73927d]">
                      📖 <strong>Nguồn:</strong> {ans.sourceReference}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= QUIZ PLAY SCREEN (PDF Page 4 & 5) =================
  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Bar: Stage Info, Difficulty, Timer, Mode */}
      <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[26px] p-4 px-5 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-1 rounded-full bg-[#d8ebe0] dark:bg-[#1e3b28] text-[#1b4332] dark:text-[#7fc498] font-black uppercase text-[10px] tracking-wider">
            {currentQ.topic || "CẤU TRÚC BÀI HỌC"}
          </span>
          <span className="text-[10px] font-bold text-[#73927d]">
            ĐỘ KHÓ: {currentQ.difficulty}
          </span>
        </div>

        <div className="flex items-center space-x-3 font-mono font-bold text-xs text-[#526b5c]">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#2d6a4f]" />
            <span>{formatTimer(seconds)}</span>
          </div>
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setMode(mode === "PRACTICE" ? "EXAM" : "PRACTICE")}
            className="px-2.5 py-0.5 rounded-full border border-[#dbe7dd] dark:border-[#263d2e] text-[10px] hover:border-[#2d6a4f] text-[#2d6a4f] dark:text-[#52b788] cursor-pointer"
          >
            {mode === "PRACTICE" ? "🟢 Practice Mode" : "🔴 Exam Mode"}
          </button>
        </div>
      </div>

      {/* Main Question Card (PDF Page 4) */}
      <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Progress indicator */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#526b5c]">
            <span>
              Câu hỏi {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-[#2d6a4f]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#eef5f0] dark:bg-[#1e3325] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2d6a4f] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Text */}
        <div className="pt-2">
          <h2 className="text-base sm:text-lg font-extrabold text-[#192e22] dark:text-[#f0f7f2] leading-snug">
            {currentQ.question}
          </h2>
        </div>

        {/* 4 Options (A, B, C, D) with soft pill rounded styling */}
        <div className="space-y-3">
          {currentQ.options.map((optText, idx) => {
            const isSelected = selectedOpt === idx;
            let optStyle =
              "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882]";

            if (mode === "PRACTICE" && currentFeedback) {
              if (idx === currentFeedback.correctAnswer) {
                // Correct option
                optStyle = "border-[#52b788] bg-[#eef8f2] dark:bg-[#163321] text-[#1b4332] dark:text-[#9fe3ba] font-bold";
              } else if (isSelected && !currentFeedback.isCorrect) {
                // Incorrect user pick
                optStyle = "border-[#e58a8a] bg-[#fcf2f2] dark:bg-[#331818] text-[#8a3c3c] font-bold";
              }
            } else if (isSelected) {
              optStyle = "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1a3324] ring-1 ring-[#2d6a4f]";
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={verifying}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-[22px] border text-left text-xs transition-all flex items-center space-x-3.5 cursor-pointer ${optStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? "bg-[#2d6a4f] text-white"
                      : "bg-[#e5ede7] dark:bg-[#203627] text-[#526b5c] dark:text-[#8aa693]"
                  }`}
                >
                  {optionLabels[idx]}
                </div>
                <span className="flex-1 leading-relaxed text-[#192e22] dark:text-[#f0f7f2]">
                  {optText}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= INSTANT FEEDBACK CARD (PDF Page 5) ================= */}
        {mode === "PRACTICE" && currentFeedback && (
          <div
            className={`p-4 rounded-[22px] border text-xs space-y-1.5 transition-all animate-in fade-in-50 ${
              currentFeedback.isCorrect
                ? "bg-[#eef8f2] dark:bg-[#14301f] border-[#b7d8c3] dark:border-[#295237] text-[#1b4332] dark:text-[#a0e6bc]"
                : "bg-[#fcf2f2] dark:bg-[#2d1818] border-[#f0c2c2] dark:border-[#4d2626] text-[#8a3c3c] dark:text-[#f0a8a8]"
            }`}
          >
            <div className="flex items-center space-x-2 font-bold text-sm">
              {currentFeedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#2d6a4f]" />
                  <span>🟢 Tuyệt vời! Chính xác! (+10 XP)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-[#b87474]" />
                  <span>🔴 Ôi không! Chưa chính xác rồi.</span>
                </>
              )}
            </div>
            <p className="leading-relaxed text-[11px] text-[#2d4734] dark:text-[#cde4d3]">
              <strong>Giải thích:</strong> {currentFeedback.rationale}
            </p>
            {currentFeedback.sourceReference && (
              <p className="text-[10px] text-[#526b5c] dark:text-[#8aa693] pt-0.5">
                📖 <strong>Nguồn tài liệu:</strong> {currentFeedback.sourceReference}
                {currentFeedback.sourcePage ? ` (Trang ${currentFeedback.sourcePage})` : ""}
              </p>
            )}
          </div>
        )}

        {/* Hint Section */}
        {showHint && (
          <div className="p-3.5 rounded-2xl bg-[#fbf9ed] dark:bg-[#2a2614] border border-[#f0e6b6] text-xs text-[#735d10] dark:text-[#e0cb6e] flex items-start space-x-2.5">
            <Lightbulb className="w-4 h-4 shrink-0 text-[#b59218] mt-0.5" />
            <div>
              <span className="font-bold">Gợi ý tư duy:</span>
              <p className="mt-0.5 leading-relaxed">
                {typeof currentQ.hint === "string"
                  ? currentQ.hint
                  : "Hãy chú ý đến các từ khóa mục tiêu và bối cảnh thực tế trong câu hỏi để loại trừ phương án sai."}
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between pt-2">
          {/* Hint Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHint(!showHint)}
            className="rounded-full text-xs text-[#526b5c] hover:text-[#2d6a4f] space-x-1"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? "Ẩn gợi ý" : "Hint (Gợi ý)"}</span>
          </Button>

          {/* Next / Submit Button */}
          {currentIndex < totalQuestions - 1 ? (
            <Button
              type="button"
              onClick={() => {
                setShowHint(false);
                setCurrentIndex((prev) => prev + 1);
              }}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full px-6 text-xs font-bold space-x-1.5"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmitQuiz}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-full px-6 text-xs font-bold space-x-1.5 shadow-sm"
            >
              <span>{submitting ? "Đang chấm điểm..." : "Hoàn thành & Nộp bài"}</span>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

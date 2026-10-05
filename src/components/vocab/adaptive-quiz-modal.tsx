"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  Brain,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  RotateCcw,
  Flame,
  Award,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { AdaptiveQuestionPayload, AdaptiveQuestionType } from "@/lib/learning/types";

interface AdaptiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordSetId?: string;
  courseId?: string;
  onSessionComplete?: () => void;
}

export function AdaptiveQuizModal({
  isOpen,
  onClose,
  wordSetId,
  courseId,
  onSessionComplete,
}: AdaptiveQuizModalProps) {
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestionPayload | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spellingInput, setSpellingInput] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    previousKnowledge: number;
    newKnowledge: number;
    deltaKnowledge: number;
    forgettingRisk: number;
    responseTime: number;
    explanation?: string;
  } | null>(null);

  // Session Tracking
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [recentVocabularyIds, setRecentVocabularyIds] = useState<string[]>([]);

  const questionStartTimeRef = useRef<number>(0);
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, []);

  // Web Speech Audio
  const playAudio = useCallback((text?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text || currentQuestion?.term || "");
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [currentQuestion]);

  // Fetch Next Adaptive Question
  const fetchNextQuestion = useCallback(async () => {
    try {
      setLoadingQuestion(true);
      setSelectedOption(null);
      setSpellingInput("");
      setAnswerFeedback(null);

      const res = await fetch("/api/learning/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          courseId,
          recentlyShownIds: recentVocabularyIds.slice(-8),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo câu hỏi thích ứng");

      setCurrentQuestion(data.question);
      questionStartTimeRef.current = Date.now();

      // Automatically play audio for listening mode
      if (data.question.questionType === "LISTENING") {
        setTimeout(() => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(data.question.term);
            u.lang = "en-US";
            window.speechSynthesis.speak(u);
          }
        }, 300);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi lấy câu hỏi");
    } finally {
      setLoadingQuestion(false);
    }
  }, [wordSetId, courseId, recentVocabularyIds]);

  useEffect(() => {
    if (isOpen) {
      setQuestionsAnswered(0);
      setSessionCorrect(0);
      setSessionXpEarned(0);
      setRecentVocabularyIds([]);
      fetchNextQuestion();
    }
  }, [isOpen, fetchNextQuestion]);

  // Handle Answer Submission
  const handleSubmitAnswer = async (userAnswer: string) => {
    if (!currentQuestion || submitting || answerFeedback) return;

    const responseDurationSeconds = Math.max(
      0.5,
      (Date.now() - questionStartTimeRef.current) / 1000
    );

    const isCorrect =
      userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    try {
      setSubmitting(true);
      const res = await fetch("/api/learning/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabularyId: currentQuestion.vocabularyId,
          isCorrect,
          responseTimeSeconds: responseDurationSeconds,
          questionType: currentQuestion.questionType,
          answer: userAnswer,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu kết quả");

      const newScore = data.mastery?.newKnowledgeScore ?? currentQuestion.currentKnowledgeScore;
      const delta = Math.round((newScore - currentQuestion.currentKnowledgeScore) * 1000) / 1000;

      setAnswerFeedback({
        isCorrect,
        previousKnowledge: currentQuestion.currentKnowledgeScore,
        newKnowledge: newScore,
        deltaKnowledge: delta,
        forgettingRisk: data.forgettingRisk ?? 0.0,
        responseTime: Math.round(responseDurationSeconds * 10) / 10,
        explanation: currentQuestion.exampleSentence
          ? `Ví dụ: "${currentQuestion.exampleSentence}"`
          : undefined,
      });

      setQuestionsAnswered((p) => p + 1);
      if (isCorrect) {
        setSessionCorrect((p) => p + 1);
        setSessionXpEarned((p) => p + 15);
      }

      setRecentVocabularyIds((prev) => [...prev, currentQuestion.vocabularyId]);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#15251a] rounded-[36px] max-w-2xl w-full border border-gray-200/90 dark:border-[#263d2e] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-auto">
        {/* Top Control Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[#263d2e]/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black flex items-center space-x-1.5 shadow-sm">
                <Brain className="w-3.5 h-3.5" />
                <span>AI ADAPTIVE ENGINE</span>
              </div>

              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Câu {questionsAnswered + 1} • Đúng {sessionCorrect}/{questionsAnswered}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" /> +{sessionXpEarned} XP
              </span>

              <button
                onClick={() => {
                  onClose();
                  onSessionComplete?.();
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col justify-center">
          {loadingQuestion ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-gray-500">
                AI đang tính toán độ thành thạo và chọn câu hỏi tối ưu...
              </p>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6 max-w-lg mx-auto w-full">
              {/* Question Metadata Header */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] ${
                      currentQuestion.category === "WEAK"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : currentQuestion.category === "MEDIUM"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : currentQuestion.category === "STRONG"
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {currentQuestion.category === "WEAK"
                      ? "⚡ Cần củng cố"
                      : currentQuestion.category === "MEDIUM"
                      ? "Đang ghi nhớ"
                      : currentQuestion.category === "STRONG"
                      ? "Vững vàng"
                      : "Thành thạo"}
                  </span>

                  <span className="text-[11px] text-gray-400 font-medium">
                    Độ khó: {Math.round(currentQuestion.difficulty * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-gray-500">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Mastery: {Math.round(currentQuestion.currentKnowledgeScore * 100)}%
                  </span>
                </div>
              </div>

              {/* Question Prompt Card */}
              <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-center space-y-3 relative">
                <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-white dark:bg-[#132217] border border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">
                  <span>Dạng bài: {currentQuestion.questionType}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-snug">
                  {currentQuestion.prompt}
                </h3>

                {/* Pronunciation & Audio button */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <button
                    onClick={() => playAudio(currentQuestion.term)}
                    className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {currentQuestion.phonetic && (
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {currentQuestion.phonetic}
                    </span>
                  )}
                </div>
              </div>

              {/* Multiple Choice Options */}
              {currentQuestion.questionType !== "SPELLING" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === currentQuestion.correctAnswer;

                    let btnStyle =
                      "border-gray-200 dark:border-gray-700 hover:border-emerald-400 bg-white dark:bg-[#132217] text-gray-800 dark:text-gray-100";

                    if (answerFeedback) {
                      if (isCorrect) {
                        btnStyle =
                          "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-200";
                      } else if (isSelected) {
                        btnStyle =
                          "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={Boolean(answerFeedback) || submitting}
                        onClick={() => {
                          setSelectedOption(opt);
                          handleSubmitAnswer(opt);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left text-xs font-bold transition-all shadow-2xs flex items-center space-x-2.5 cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 inline-flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Spelling / Typing Input */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (spellingInput.trim()) handleSubmitAnswer(spellingInput);
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={spellingInput}
                    onChange={(e) => setSpellingInput(e.target.value)}
                    disabled={Boolean(answerFeedback) || submitting}
                    placeholder="Gõ từ tiếng Anh chính xác..."
                    autoFocus
                    className="w-full text-center px-4 py-3 rounded-full border-2 border-emerald-300 focus:border-emerald-500 bg-white dark:bg-[#132217] text-base font-extrabold outline-none"
                  />

                  {!answerFeedback && (
                    <button
                      type="submit"
                      disabled={!spellingInput.trim() || submitting}
                      className="w-full py-3 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      Kiểm tra câu trả lời
                    </button>
                  )}
                </form>
              )}

              {/* Answer Feedback & Live Mastery Adjustment */}
              {answerFeedback && (
                <div
                  className={`p-4 rounded-3xl border animate-in zoom-in-95 space-y-3 ${
                    answerFeedback.isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {answerFeedback.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h4
                          className={`font-black text-sm ${
                            answerFeedback.isCorrect ? "text-emerald-800" : "text-rose-800"
                          }`}
                        >
                          {answerFeedback.isCorrect ? "Chính xác! 🎉" : "Chưa chính xác!"}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Đáp án đúng: <strong>{currentQuestion.correctAnswer}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black ${
                          answerFeedback.deltaKnowledge >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {answerFeedback.deltaKnowledge >= 0 ? "+" : ""}
                        {Math.round(answerFeedback.deltaKnowledge * 100)}% Mastery
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {answerFeedback.responseTime}s phản hồi
                      </span>
                    </div>
                  </div>

                  {answerFeedback.explanation && (
                    <p className="text-xs italic text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200/50 dark:border-gray-800">
                      {answerFeedback.explanation}
                    </p>
                  )}

                  <button
                    onClick={fetchNextQuestion}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Câu tiếp theo (Thích ứng AI)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

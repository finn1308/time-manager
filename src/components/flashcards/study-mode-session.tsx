"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { speakWord } from "@/lib/tts";
import {
  StudyQuestion,
  validateAnswer,
  normalizeString,
  CardData,
  createFlashcardQuestion,
  createEnToViQuiz,
  createListeningQuestion,
  createViTypingEnQuestion,
} from "@/lib/flashcard-study/engine";
import {
  Volume2,
  Volume1,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Award,
  Sparkles,
  Flame,
  Brain,
  Timer,
  BookOpen,
  Headphones,
  Keyboard,
  Check,
  ChevronRight,
  RefreshCw,
  Coins,
} from "lucide-react";

interface StudyModeSessionProps {
  deckTitle: string;
  deckId: string;
  questions: StudyQuestion[];
  allCards: CardData[];
  onExit: () => void;
  onFinish?: () => void;
}

interface QuestionResult {
  questionId: string;
  cardId: string;
  type: string;
  targetWord: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export function StudyModeSession({
  deckTitle,
  deckId,
  questions: initialQuestions,
  allCards,
  onExit,
  onFinish,
}: StudyModeSessionProps) {
  const [questions, setQuestions] = useState<StudyQuestion[]>(initialQuestions);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User input states
  const [userText, setUserText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false); // for flashcards
  const [showHint, setShowHint] = useState(false);

  // Matching game state
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedVi, setSelectedVi] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);

  // Submission & evaluation state
  const [isChecked, setIsChecked] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  // Session history & stats
  const [history, setHistory] = useState<QuestionResult[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // End screen & saving
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<any>(null);

  // Confirm exit modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Timer interval for total study duration
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, startTime]);

  // Current Question
  const currentQ = questions[currentIdx];

  // Auto-focus input on question change
  useEffect(() => {
    setUserText("");
    setSelectedOption(null);
    setIsFlipped(false);
    setShowHint(false);
    setIsChecked(false);
    setIsCurrentCorrect(false);
    setFeedbackText("");
    setSelectedEn(null);
    setSelectedVi(null);
    setMatchedPairIds([]);
    setQuestionStartTime(Date.now());

    // Auto-play audio for Listening question
    if (currentQ?.type === "LISTENING_TYPING") {
      setTimeout(() => {
        speakWord(currentQ.targetWord, 1.0);
      }, 300);
    }

    // Auto-focus text input if typing mode
    if (
      currentQ?.type === "LISTENING_TYPING" ||
      currentQ?.type === "EN_TYPING_VI" ||
      currentQ?.type === "VI_TYPING_EN"
    ) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentIdx, currentQ]);

  // Handle Play TTS
  const handlePlayAudio = (rate: number = 1.0) => {
    if (!currentQ) return;
    speakWord(currentQ.targetWord, rate);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showExitConfirm || isCompleted) return;

      if (currentQ?.type === "FLASHCARD") {
        if (e.code === "Space") {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (isFlipped) {
          if (e.key === "1") handleFlashcardAnswer("AGAIN");
          else if (e.key === "2") handleFlashcardAnswer("KNOW");
        }
      } else if (!isChecked) {
        if (e.key === "Enter") {
          // If option is selected or text is typed
          if (
            selectedOption ||
            userText.trim() ||
            currentQ?.type === "MATCHING"
          ) {
            e.preventDefault();
            handleCheckAnswer();
          }
        }
      } else {
        // If checked, pressing Enter moves to Next
        if (e.key === "Enter") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChecked, isFlipped, selectedOption, userText, currentQ, isCompleted, showExitConfirm]);

  // Flashcard Rating Handler
  const handleFlashcardAnswer = (rating: "AGAIN" | "KNOW") => {
    if (!currentQ || isChecked) return;

    const isCorrect = rating === "KNOW";
    const responseTimeMs = Date.now() - questionStartTime;

    const result: QuestionResult = {
      questionId: currentQ.id,
      cardId: currentQ.cardId,
      type: currentQ.type,
      targetWord: currentQ.targetWord,
      userAnswer: rating,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      responseTimeMs,
    };

    setHistory((prev) => [...prev, result]);
    setIsCurrentCorrect(isCorrect);
    setFeedbackText(isCorrect ? "Đã nhớ thẻ này!" : "Cần ôn tập lại thẻ này.");
    setIsChecked(true);

    // Adaptive repeat: if user doesn't remember, append a review quiz to queue
    if (!isCorrect) {
      const card = allCards.find((c) => c.id === currentQ.cardId);
      if (card) {
        setQuestions((prev) => [...prev, createEnToViQuiz(card, allCards)]);
      }
    }
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (!currentQ || isChecked) return;

    let submittedAnswer = "";
    if (
      currentQ.type === "EN_TO_VI" ||
      currentQ.type === "VI_TO_EN" ||
      currentQ.type === "CONTEXT_IMAGE"
    ) {
      if (!selectedOption) return;
      submittedAnswer = selectedOption;
    } else if (currentQ.type === "MATCHING") {
      submittedAnswer =
        matchedPairIds.length === (currentQ.matchingPairs?.length || 0)
          ? "MATCH_ALL"
          : "FAIL";
    } else {
      if (!userText.trim()) return;
      submittedAnswer = userText.trim();
    }

    const { isCorrect, feedback } = validateAnswer(currentQ, submittedAnswer);
    const responseTimeMs = Date.now() - questionStartTime;

    const result: QuestionResult = {
      questionId: currentQ.id,
      cardId: currentQ.cardId,
      type: currentQ.type,
      targetWord: currentQ.targetWord,
      userAnswer: submittedAnswer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      responseTimeMs,
    };

    setHistory((prev) => [...prev, result]);
    setIsCurrentCorrect(isCorrect);
    setFeedbackText(feedback);
    setIsChecked(true);

    // Play pronunciation if correct
    if (isCorrect && currentQ.targetWord) {
      speakWord(currentQ.targetWord, 1.0);
    }

    // Adaptive reinforcement: if wrong, add a reinforcement question later in queue
    if (!isCorrect && currentQ.cardId) {
      const card = allCards.find((c) => c.id === currentQ.cardId);
      if (card) {
        // Reinforce with listening or typing question later
        setQuestions((prev) => [
          ...prev,
          createViTypingEnQuestion(card),
        ]);
      }
    }
  };

  // Next Question Handler
  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishSession();
    }
  };

  // Skip Question Handler
  const handleSkipQuestion = () => {
    if (!currentQ) return;
    const responseTimeMs = Date.now() - questionStartTime;
    const result: QuestionResult = {
      questionId: currentQ.id,
      cardId: currentQ.cardId,
      type: currentQ.type,
      targetWord: currentQ.targetWord,
      userAnswer: "SKIP",
      correctAnswer: currentQ.correctAnswer,
      isCorrect: false,
      responseTimeMs,
    };
    setHistory((prev) => [...prev, result]);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishSession();
    }
  };

  // Finish Session & Submit to DB
  const finishSession = async () => {
    setIsCompleted(true);
    setIsSaving(true);

    try {
      const totalQ = history.length;
      const correctQ = history.filter((h) => h.isCorrect).length;
      const wrongQ = totalQ - correctQ;

      const res = await fetch("/api/flashcards/study/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId,
          mode: "ALL",
          durationSeconds: Math.max(15, elapsedSeconds),
          totalQuestions: totalQ,
          correctAnswers: correctQ,
          wrongAnswers: wrongQ,
          questions: history.map((h) => ({
            cardId: h.cardId,
            questionType: h.type,
            question: h.targetWord,
            userAnswer: h.userAnswer,
            correctAnswer: h.correctAnswer,
            isCorrect: h.isCorrect,
            responseTimeMs: h.responseTimeMs,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSavedResult(data);
      }
    } catch (err) {
      console.error("Error saving study session:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Practice Again only wrong cards
  const handlePracticeAgainWrongCards = () => {
    const wrongCardIds = Array.from(
      new Set(history.filter((h) => !h.isCorrect).map((h) => h.cardId))
    );
    const wrongCards = allCards.filter((c) => wrongCardIds.includes(c.id));

    if (wrongCards.length === 0) return;

    const newQuestions: StudyQuestion[] = [];
    wrongCards.forEach((c) => {
      newQuestions.push(createFlashcardQuestion(c));
      newQuestions.push(createEnToViQuiz(c, allCards));
      newQuestions.push(createViTypingEnQuestion(c));
    });

    setQuestions(newQuestions);
    setCurrentIdx(0);
    setHistory([]);
    setIsCompleted(false);
    setSavedResult(null);
  };

  // Helper stats for end screen
  const totalAnswered = history.length;
  const correctCount = history.filter((h) => h.isCorrect).length;
  const wrongCount = totalAnswered - correctCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // Breakdown by question skill
  const statsByType = {
    vocabulary: {
      total: history.filter((h) => h.type === "EN_TO_VI" || h.type === "VI_TO_EN").length,
      correct: history.filter(
        (h) => (h.type === "EN_TO_VI" || h.type === "VI_TO_EN") && h.isCorrect
      ).length,
    },
    listening: {
      total: history.filter((h) => h.type === "LISTENING_TYPING").length,
      correct: history.filter((h) => h.type === "LISTENING_TYPING" && h.isCorrect).length,
    },
    typing: {
      total: history.filter((h) => h.type === "EN_TYPING_VI" || h.type === "VI_TYPING_EN").length,
      correct: history.filter(
        (h) => (h.type === "EN_TYPING_VI" || h.type === "VI_TYPING_EN") && h.isCorrect
      ).length,
    },
    context: {
      total: history.filter((h) => h.type === "CONTEXT_IMAGE").length,
      correct: history.filter((h) => h.type === "CONTEXT_IMAGE" && h.isCorrect).length,
    },
    flashcard: {
      total: history.filter((h) => h.type === "FLASHCARD").length,
      correct: history.filter((h) => h.type === "FLASHCARD" && h.isCorrect).length,
    },
  };

  // Distinct wrong cards for review list
  const wrongCardsList = Array.from(
    new Set(history.filter((h) => !h.isCorrect).map((h) => h.cardId))
  )
    .map((cardId) => {
      const card = allCards.find((c) => c.id === cardId);
      const wrongInstances = history.filter((h) => h.cardId === cardId && !h.isCorrect);
      return {
        card,
        wrongCount: wrongInstances.length,
        types: Array.from(new Set(wrongInstances.map((w) => w.type))),
      };
    })
    .filter((w) => w.card !== undefined);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Progress percentage
  const progressPct =
    questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  // Render question type badge
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "FLASHCARD":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
            <BookOpen className="w-3 h-3" />
            <span>Flashcard Ghi nhớ</span>
          </span>
        );
      case "EN_TO_VI":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Quiz EN → VI</span>
          </span>
        );
      case "VI_TO_EN":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Quiz VI → EN</span>
          </span>
        );
      case "LISTENING_TYPING":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold">
            <Headphones className="w-3 h-3" />
            <span>Listening & Typing</span>
          </span>
        );
      case "EN_TYPING_VI":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
            <Keyboard className="w-3 h-3" />
            <span>Gõ nghĩa tiếng Việt</span>
          </span>
        );
      case "VI_TYPING_EN":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold">
            <Keyboard className="w-3 h-3" />
            <span>Gõ từ tiếng Anh</span>
          </span>
        );
      case "CONTEXT_IMAGE":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>Ngữ cảnh & Hình ảnh</span>
          </span>
        );
      case "MATCHING":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
            <RefreshCw className="w-3 h-3" />
            <span>Ghép cặp từ vựng</span>
          </span>
        );
      default:
        return null;
    }
  };

  // ==============================================================================
  // VIEW: COMPLETION SCREEN (Session Complete 🎉)
  // ==============================================================================
  if (isCompleted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8 px-4 animate-in fade-in duration-300">
        <Card className="rounded-[32px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
          {/* Top Celebration Icon */}
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-4xl shadow-inner mb-4">
            🎉
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
            Session Complete!
          </h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9] mt-1">
            Bạn đã hoàn thành phiên học bộ thẻ <strong>{deckTitle}</strong>
          </p>

          {/* XP & Coin Reward Badge */}
          <div className="flex items-center justify-center space-x-3 mt-4">
            <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>+{savedResult?.earnedXp || Math.round(accuracy * 0.25) + correctCount * 5} XP</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>+{savedResult?.earnedCoins || Math.max(2, Math.round(accuracy / 10))} Coin</span>
            </div>
          </div>

          {/* Master Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="p-4 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#e5efe7] dark:border-[#1e3424]">
              <div className="text-[11px] font-bold text-[#526b5c] dark:text-[#a3bda9]">Words Practiced</div>
              <div className="text-2xl font-black text-[#192e22] dark:text-[#f0f7f2] mt-1">
                {totalAnswered}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#e5efe7] dark:border-[#1e3424]">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Correct</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {correctCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#e5efe7] dark:border-[#1e3424]">
              <div className="text-[11px] font-bold text-rose-500">Wrong</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{wrongCount}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#e5efe7] dark:border-[#1e3424]">
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Accuracy</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {accuracy}%
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-[#73927d] flex items-center justify-center space-x-1.5">
            <Timer className="w-3.5 h-3.5" />
            <span>Thời gian hoàn thành: <strong>{formatTime(elapsedSeconds)}</strong></span>
          </div>

          {/* Skill Breakdown */}
          <div className="mt-8 pt-6 border-t border-[#dbe7dd]/80 dark:border-[#263d2e] text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9] mb-3">
              Phân tích theo kỹ năng
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {statsByType.vocabulary.total > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50">
                  <div className="font-bold text-amber-900 dark:text-amber-200">Vocabulary Quiz</div>
                  <div className="text-base font-black text-amber-700 mt-0.5">
                    {statsByType.vocabulary.correct} / {statsByType.vocabulary.total}
                  </div>
                </div>
              )}

              {statsByType.listening.total > 0 && (
                <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/50">
                  <div className="font-bold text-cyan-900 dark:text-cyan-200">Listening</div>
                  <div className="text-base font-black text-cyan-700 mt-0.5">
                    {statsByType.listening.correct} / {statsByType.listening.total}
                  </div>
                </div>
              )}

              {statsByType.typing.total > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">Typing & Spell</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    {statsByType.typing.correct} / {statsByType.typing.total}
                  </div>
                </div>
              )}

              {statsByType.context.total > 0 && (
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50">
                  <div className="font-bold text-purple-900 dark:text-purple-200">Context & Image</div>
                  <div className="text-base font-black text-purple-700 mt-0.5">
                    {statsByType.context.correct} / {statsByType.context.total}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Words You Need to Review */}
          {wrongCardsList.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#dbe7dd]/80 dark:border-[#263d2e] text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Words you need to review ({wrongCardsList.length} từ)</span>
                </h3>

                <Button
                  onClick={handlePracticeAgainWrongCards}
                  size="sm"
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice Again</span>
                </Button>
              </div>

              <div className="space-y-2">
                {wrongCardsList.map(({ card, wrongCount, types }) => (
                  <div
                    key={card!.id}
                    className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-[#192e22] dark:text-[#f0f7f2] text-sm">
                          {card!.word}
                        </span>
                        {card!.phonetic && (
                          <span className="text-[11px] text-[#73927d]">{card!.phonetic}</span>
                        )}
                      </div>
                      <p className="text-[#526b5c] dark:text-[#a3bda9] mt-0.5 line-clamp-1">
                        {card!.meaning}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                        Sai {wrongCount} lần
                      </span>
                      <button
                        onClick={() => speakWord(card!.word, 1.0)}
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-3 pt-8">
            <Button
              variant="outline"
              onClick={onExit}
              className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-xs font-bold h-11 px-6"
            >
              Về chi tiết bộ thẻ
            </Button>
            <Button
              onClick={() => {
                setQuestions(initialQuestions);
                setCurrentIdx(0);
                setHistory([]);
                setIsCompleted(false);
                setSavedResult(null);
              }}
              className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold h-11 px-6 space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Học lại từ đầu</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ==============================================================================
  // VIEW: ACTIVE QUESTION RUNNER
  // ==============================================================================
  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4 px-3 sm:px-0">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] px-1">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitConfirm(true)}
            className="rounded-xl text-[#526b5c] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] p-1.5 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
          <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] truncate max-w-[200px] sm:max-w-xs">
            {deckTitle}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Question {currentIdx + 1} / {questions.length}
          </span>
          <span className="text-[11px] text-[#73927d]">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#eef5f0] dark:bg-[#1d3024] rounded-full h-2 overflow-hidden shadow-2xs">
        <div
          className="bg-[#2d6a4f] dark:bg-[#52b788] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Focus Area Container */}
      <Card className="rounded-[30px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[420px] relative">
        {/* Top Meta: Badge & Audio */}
        <div className="flex items-center justify-between mb-4">
          {renderTypeBadge(currentQ.type)}

          {currentQ.targetWord && currentQ.type !== "LISTENING_TYPING" && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePlayAudio(1.0)}
                title="Phát âm chuẩn (1.0x)"
                className="p-1.5 rounded-xl bg-[#f0f7f2] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] hover:bg-[#d8ebe0] transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePlayAudio(0.75)}
                title="Phát âm chậm (0.75x)"
                className="px-1.5 py-1 rounded-xl bg-[#f0f7f2] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] hover:bg-[#d8ebe0] text-[10px] font-bold cursor-pointer"
              >
                0.75x
              </button>
            </div>
          )}
        </div>

        {/* Center: Dynamic Question Content */}
        <div className="my-auto py-2">
          {/* ========================================================================= */}
          {/* DẠNG 1: FLASHCARD TRUYỀN THỐNG (FLIP + BIẾT / CHƯA NHỚ) */}
          {/* ========================================================================= */}
          {currentQ.type === "FLASHCARD" && (
            <div className="space-y-6 text-center">
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                className={`p-8 sm:p-10 rounded-[28px] border-2 cursor-pointer transition-all duration-300 select-none ${
                  isFlipped
                    ? "bg-[#f4faf6] dark:bg-[#14281b] border-[#2d6a4f]/40 shadow-md"
                    : "bg-[#fbfdfb] dark:bg-[#18281e] border-dashed border-[#c5dcd0] hover:border-[#2d6a4f] shadow-2xs"
                }`}
              >
                {!isFlipped ? (
                  /* Mặt trước */
                  <div className="space-y-3">
                    <div className="text-3xl sm:text-4xl font-black text-[#192e22] dark:text-[#f0f7f2] tracking-tight">
                      {currentQ.targetWord}
                    </div>
                    {currentQ.phonetic && (
                      <div className="text-sm font-semibold text-[#526b5c] dark:text-[#a3bda9]">
                        {currentQ.phonetic} {currentQ.partOfSpeech && `(${currentQ.partOfSpeech})`}
                      </div>
                    )}
                    <div className="pt-4 text-xs font-bold text-[#73927d] flex items-center justify-center space-x-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Bấm hoặc nhấn Space để lật mặt sau</span>
                    </div>
                  </div>
                ) : (
                  /* Mặt sau */
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-2xl sm:text-3xl font-black text-[#2d6a4f] dark:text-[#52b788]">
                      {currentQ.correctAnswer}
                    </div>
                    {currentQ.contextSentence && (
                      <div className="mt-4 p-3 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-left text-xs space-y-1">
                        <div className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                          "{currentQ.contextSentence}"
                        </div>
                        {currentQ.contextTranslation && (
                          <div className="text-[#526b5c] dark:text-[#a3bda9]">
                            {currentQ.contextTranslation}
                          </div>
                        )}
                      </div>
                    )}
                    {currentQ.hint && (
                      <p className="text-[11px] text-[#73927d] italic">Gợi ý: {currentQ.hint}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Nút đánh giá Biết / Chưa nhớ */}
              {isFlipped && !isChecked && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => handleFlashcardAnswer("AGAIN")}
                    variant="outline"
                    className="rounded-2xl border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-bold h-12 space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Chưa nhớ (Phím 1)</span>
                  </Button>
                  <Button
                    onClick={() => handleFlashcardAnswer("KNOW")}
                    className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold h-12 space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Biết (Phím 2)</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* DẠNG 2 & 3: QUIZ 4 LỰA CHỌN (EN → VI & VI → EN) */}
          {/* ========================================================================= */}
          {(currentQ.type === "EN_TO_VI" || currentQ.type === "VI_TO_EN") && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
                  {currentQ.prompt}
                </h2>
                {currentQ.phonetic && currentQ.type === "EN_TO_VI" && (
                  <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">{currentQ.phonetic}</p>
                )}
              </div>

              {/* 4 Choices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options?.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === opt;
                  const isCorrectAnswer =
                    isChecked && normalizeString(opt) === normalizeString(currentQ.correctAnswer);
                  const isWrongSelected = isChecked && isSelected && !isCorrectAnswer;

                  let cardStyle =
                    "border-[#dbe7dd] dark:border-[#263d2e] bg-[#fbfdfb] dark:bg-[#18281e] hover:border-[#2d6a4f]/60";
                  if (isSelected && !isChecked) {
                    cardStyle = "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1b3524] shadow-xs";
                  } else if (isCorrectAnswer) {
                    cardStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900";
                  } else if (isWrongSelected) {
                    cardStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center space-x-3 cursor-pointer ${cardStyle}`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] flex items-center justify-center text-xs font-black shrink-0">
                        {letter}
                      </span>
                      <span className="text-xs sm:text-sm font-bold flex-1 leading-snug">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DẠNG 4: CONTEXT + IMAGE */}
          {/* ========================================================================= */}
          {currentQ.type === "CONTEXT_IMAGE" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  {currentQ.prompt}
                </h2>
              </div>

              {/* Context box */}
              <div className="p-5 rounded-2xl bg-[#f4faf6] dark:bg-[#14281b] border border-[#2d6a4f]/30 space-y-2 text-center">
                <div className="text-lg sm:text-xl font-black text-[#192e22] dark:text-[#f0f7f2]">
                  "{currentQ.contextSentence}"
                </div>
                {currentQ.contextTranslation && (
                  <div className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                    ({currentQ.contextTranslation})
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectAnswer =
                    isChecked && normalizeString(opt) === normalizeString(currentQ.correctAnswer);
                  const isWrongSelected = isChecked && isSelected && !isCorrectAnswer;

                  let style = "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]";
                  if (isSelected && !isChecked) style = "border-[#2d6a4f] bg-[#eef5f0]";
                  if (isCorrectAnswer) style = "border-emerald-500 bg-emerald-50 text-emerald-900";
                  if (isWrongSelected) style = "border-rose-500 bg-rose-50 text-rose-900";

                  return (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3.5 rounded-2xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DẠNG 5: LISTENING → GÕ LẠI TỪ */}
          {/* ========================================================================= */}
          {currentQ.type === "LISTENING_TYPING" && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Listen and type the word
                </h2>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
                  Bấm vào loa để nghe phát âm, sau đó gõ lại từ vựng bạn nghe được
                </p>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center space-x-3 py-2">
                <Button
                  onClick={() => handlePlayAudio(1.0)}
                  className="w-16 h-16 rounded-3xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-md flex items-center justify-center p-0 cursor-pointer"
                >
                  <Volume2 className="w-8 h-8" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePlayAudio(0.75)}
                  className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-xs font-bold h-10 px-3 space-x-1"
                >
                  <Volume1 className="w-4 h-4" />
                  <span>Nghe chậm (0.75x)</span>
                </Button>
              </div>

              {/* Input text box */}
              <div className="max-w-md mx-auto">
                <Input
                  ref={inputRef}
                  disabled={isChecked}
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Gõ từ tiếng Anh bạn nghe được..."
                  className="rounded-2xl h-12 text-center text-base sm:text-lg font-bold border-2 border-[#dbe7dd] focus:border-[#2d6a4f]"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DẠNG 6: TYPING ENGLISH → VIETNAMESE */}
          {/* ========================================================================= */}
          {currentQ.type === "EN_TYPING_VI" && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#73927d] uppercase tracking-wider">
                  Type the Vietnamese meaning
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#192e22] dark:text-[#f0f7f2]">
                  {currentQ.targetWord}
                </div>
                {currentQ.phonetic && (
                  <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">{currentQ.phonetic}</p>
                )}
              </div>

              {/* Input box */}
              <div className="max-w-md mx-auto space-y-2">
                <Input
                  ref={inputRef}
                  disabled={isChecked}
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Nhập nghĩa tiếng Việt (vd: cái bàn, bàn)..."
                  className="rounded-2xl h-12 text-center text-base font-bold border-2 border-[#dbe7dd] focus:border-[#2d6a4f]"
                />
                {currentQ.hint && (
                  <p className="text-[11px] text-[#73927d] italic">Gợi ý: {currentQ.hint}</p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DẠNG 7: TYPING VIETNAMESE → ENGLISH */}
          {/* ========================================================================= */}
          {currentQ.type === "VI_TYPING_EN" && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#73927d] uppercase tracking-wider">
                  Translate and type the English word
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#2d6a4f] dark:text-[#52b788]">
                  "{currentQ.prompt.replace(/Dịch và gõ từ tiếng Anh cho "/, "").replace(/":/, "")}"
                </div>
              </div>

              {/* Input box */}
              <div className="max-w-md mx-auto space-y-2">
                <Input
                  ref={inputRef}
                  disabled={isChecked}
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Gõ từ vựng tiếng Anh tương ứng..."
                  className="rounded-2xl h-12 text-center text-base font-bold border-2 border-[#dbe7dd] focus:border-[#2d6a4f]"
                />
                {currentQ.hint && (
                  <p className="text-[11px] text-[#73927d] italic">Gợi ý: {currentQ.hint}</p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DẠNG 8: MATCHING GAME (Ghép cặp từ với nghĩa) */}
          {/* ========================================================================= */}
          {currentQ.type === "MATCHING" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  {currentQ.prompt}
                </h2>
                <p className="text-xs text-[#73927d] mt-1">
                  Chọn 1 từ tiếng Anh và 1 nghĩa tiếng Việt để ghép cặp
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-bold">
                {/* Column EN */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase text-[#73927d] px-1">
                    English
                  </div>
                  {currentQ.matchingPairs?.map((pair) => {
                    const isMatched = matchedPairIds.includes(pair.id);
                    const isSelected = selectedEn === pair.id;

                    return (
                      <button
                        key={`en-${pair.id}`}
                        disabled={isMatched || isChecked}
                        onClick={() => {
                          if (selectedVi) {
                            // Check match
                            if (selectedVi === pair.id) {
                              setMatchedPairIds((prev) => [...prev, pair.id]);
                              setSelectedVi(null);
                              setSelectedEn(null);
                            } else {
                              setSelectedEn(pair.id);
                            }
                          } else {
                            setSelectedEn(pair.id);
                          }
                        }}
                        className={`w-full p-3 rounded-2xl border-2 text-left transition-all ${
                          isMatched
                            ? "bg-emerald-100/60 border-emerald-400 text-emerald-800 line-through opacity-70"
                            : isSelected
                            ? "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-xs"
                            : "bg-white dark:bg-[#17261c] border-[#dbe7dd] hover:border-[#2d6a4f]"
                        }`}
                      >
                        {pair.en}
                      </button>
                    );
                  })}
                </div>

                {/* Column VI */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase text-[#73927d] px-1">
                    Vietnamese
                  </div>
                  {currentQ.matchingPairs?.map((pair) => {
                    const isMatched = matchedPairIds.includes(pair.id);
                    const isSelected = selectedVi === pair.id;

                    return (
                      <button
                        key={`vi-${pair.id}`}
                        disabled={isMatched || isChecked}
                        onClick={() => {
                          if (selectedEn) {
                            // Check match
                            if (selectedEn === pair.id) {
                              setMatchedPairIds((prev) => [...prev, pair.id]);
                              setSelectedEn(null);
                              setSelectedVi(null);
                            } else {
                              setSelectedVi(pair.id);
                            }
                          } else {
                            setSelectedVi(pair.id);
                          }
                        }}
                        className={`w-full p-3 rounded-2xl border-2 text-left transition-all ${
                          isMatched
                            ? "bg-emerald-100/60 border-emerald-400 text-emerald-800 line-through opacity-70"
                            : isSelected
                            ? "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-xs"
                            : "bg-white dark:bg-[#17261c] border-[#dbe7dd] hover:border-[#2d6a4f]"
                        }`}
                      >
                        {pair.vi}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Feedback & Navigation Controls */}
        <div className="mt-6 pt-4 border-t border-[#dbe7dd]/80 dark:border-[#263d2e] space-y-3">
          {/* Feedback bar if checked */}
          {isChecked && (
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                isCurrentCorrect
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                {isCurrentCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{feedbackText}</span>
              </div>

              {currentQ.targetWord && (
                <button
                  onClick={() => speakWord(currentQ.targetWord, 1.0)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipQuestion}
              disabled={isChecked}
              className="rounded-xl text-[#73927d] hover:bg-[#eef5f0] text-xs font-semibold"
            >
              Bỏ qua (Skip)
            </Button>

            {!isChecked ? (
              currentQ.type !== "FLASHCARD" && (
                <Button
                  onClick={handleCheckAnswer}
                  disabled={
                    (!selectedOption && !userText.trim() && currentQ.type !== "MATCHING") ||
                    (currentQ.type === "MATCHING" &&
                      matchedPairIds.length !== (currentQ.matchingPairs?.length || 0))
                  }
                  className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold h-11 px-8 space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Kiểm tra (Check)</span>
                </Button>
              )
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold h-11 px-8 space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>Tiếp theo (Next)</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="rounded-[28px] max-w-sm w-full p-6 bg-white dark:bg-[#17261c] border border-[#dbe7dd] space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Dừng phiên học?
            </h3>
            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
              Bạn đang ở câu {currentIdx + 1} / {questions.length}. Bạn có chắc muốn thoát ra trang chi tiết bộ thẻ không?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-xl text-xs font-bold"
              >
                Tiếp tục học
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExit();
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Thoát
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

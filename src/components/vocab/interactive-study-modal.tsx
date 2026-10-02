"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Coins,
  ArrowRight,
  RotateCcw,
  Clock,
  Shuffle,
  Trophy,
  Brain,
  HelpCircle,
} from "lucide-react";

export type StudyMode =
  | "FLASHCARD"
  | "QUIZ"
  | "LISTENING"
  | "TYPING"
  | "MATCHING"
  | "SPECIAL";

export interface StudyWord {
  id: string;
  term: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaning: string;
  explanation: string | null;
  exampleSentence: string | null;
  exampleMeaning: string | null;
  audioUrl: string | null;
}

interface InteractiveStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordSetId: string;
  wordSetTitle: string;
  mode: StudyMode;
  words: StudyWord[];
  onSessionComplete?: () => void;
}

export function InteractiveStudyModal({
  isOpen,
  onClose,
  wordSetId,
  wordSetTitle,
  mode,
  words,
  onSessionComplete,
}: InteractiveStudyModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);

  // Mode: Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Mode: Listening & Typing state
  const [typedInput, setTypedInput] = useState("");
  const [typingResult, setTypingResult] = useState<"CORRECT" | "INCORRECT" | null>(null);
  const [listenTimerSeconds, setListenTimerSeconds] = useState(30);

  // Mode: Matching Pairs state
  const [matchingPairs, setMatchingPairs] = useState<
    Array<{ id: string; text: string; type: "TERM" | "MEANING"; pairId: string; matched: boolean }>
  >([]);
  const [selectedMatchingId, setSelectedMatchingId] = useState<string | null>(null);
  const [wrongMatchPair, setWrongMatchPair] = useState<string[]>([]);

  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentWord = words[currentIndex] || null;

  // Speak word using Web Speech API
  const playAudio = useCallback((textToSpeak?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak || currentWord?.term || "");
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [currentWord]);

  // Setup question when index or mode changes
  useEffect(() => {
    if (!currentWord || isCompleted) return;

    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setTypedInput("");
    setTypingResult(null);

    // Auto-play pronunciation in Listening or Flashcard mode
    if (mode === "LISTENING" || mode === "FLASHCARD") {
      playAudio(currentWord.term);
    }

    // Generate 4 multiple-choice options for Quiz
    if (mode === "QUIZ" || mode === "SPECIAL") {
      const otherMeanings = words
        .filter((w) => w.id !== currentWord.id)
        .map((w) => w.meaning);

      const shuffledOthers = [...otherMeanings].sort(() => Math.random() - 0.5).slice(0, 3);
      const combined = [...shuffledOthers, currentWord.meaning].sort(() => Math.random() - 0.5);
      setQuizOptions(combined);
    }

    // Countdown for Listening mode (30s)
    if (mode === "LISTENING") {
      setListenTimerSeconds(30);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setListenTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, mode, currentWord, words, isCompleted, playAudio]);

  // Setup Matching mode grid once
  useEffect(() => {
    if (mode === "MATCHING" && words.length > 0) {
      const terms = words.slice(0, 6).map((w) => ({
        id: `term-${w.id}`,
        text: w.term,
        type: "TERM" as const,
        pairId: w.id,
        matched: false,
      }));
      const meanings = words.slice(0, 6).map((w) => ({
        id: `meaning-${w.id}`,
        text: w.meaning,
        type: "MEANING" as const,
        pairId: w.id,
        matched: false,
      }));

      const combined = [...terms, ...meanings].sort(() => Math.random() - 0.5);
      setMatchingPairs(combined);
    }
  }, [mode, words]);

  // Save progress of current word
  const reportWordProgress = async (wordId: string, isCorrect: boolean, qualityRating: number) => {
    try {
      await fetch(`/api/vocab/words/${wordId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCorrect,
          quality: qualityRating,
          status: isCorrect ? "MASTERED" : "LEARNING",
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Complete entire session
  const finishSession = async (finalCorrect: number, finalIncorrect: number) => {
    setIsCompleted(true);
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      setSavingSession(true);
      const res = await fetch("/api/vocab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          mode,
          totalItems: words.length,
          correctItems: finalCorrect,
          durationSeconds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.rewards) {
        setEarnedCoins(data.rewards.coinsEarned);
        setEarnedXp(data.rewards.xpEarned);
      }
      onSessionComplete?.();
    } catch (err) {
      console.error("Lỗi lưu phiên học:", err);
    } finally {
      setSavingSession(false);
    }
  };

  // Next Question Handler
  const handleNextQuestion = (wasCorrect: boolean, quality = 4) => {
    const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
    const newIncorrect = !wasCorrect ? incorrectCount + 1 : incorrectCount;

    setCorrectCount(newCorrect);
    setIncorrectCount(newIncorrect);

    if (currentWord) {
      reportWordProgress(currentWord.id, wasCorrect, wasCorrect ? quality : 1);
    }

    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession(newCorrect, newIncorrect);
    }
  };

  // Handler: Quiz Option Select
  const handleSelectQuizOption = (option: string) => {
    if (isAnswerSubmitted || !currentWord) return;
    setSelectedOption(option);
    setIsAnswerSubmitted(true);

    const isRight = option === currentWord.meaning;
    if (isRight) {
      playAudio(currentWord.term);
    }

    setTimeout(() => {
      handleNextQuestion(isRight, isRight ? 4 : 1);
    }, 1200);
  };

  // Handler: Typing / Listening Submit
  const handleCheckTyping = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || typingResult !== null) return;

    const normalizedInput = typedInput.trim().toLowerCase();
    const normalizedTarget = currentWord.term.trim().toLowerCase();

    const isMatch = normalizedInput === normalizedTarget;
    setTypingResult(isMatch ? "CORRECT" : "INCORRECT");

    if (isMatch) {
      playAudio(currentWord.term);
    }

    setTimeout(() => {
      handleNextQuestion(isMatch, isMatch ? 5 : 2);
    }, 1200);
  };

  // Handler: Matching Tile Click
  const handleTileClick = (item: (typeof matchingPairs)[0]) => {
    if (item.matched) return;

    if (!selectedMatchingId) {
      setSelectedMatchingId(item.id);
      return;
    }

    if (selectedMatchingId === item.id) {
      setSelectedMatchingId(null);
      return;
    }

    const firstItem = matchingPairs.find((p) => p.id === selectedMatchingId);
    if (!firstItem) return;

    // Check if one is TERM and other is MEANING and pairId matches
    if (firstItem.pairId === item.pairId && firstItem.type !== item.type) {
      // MATCH!
      setMatchingPairs((prev) =>
        prev.map((p) => (p.pairId === item.pairId ? { ...p, matched: true } : p))
      );
      setSelectedMatchingId(null);
      setCorrectCount((prev) => prev + 1);
      playAudio(item.type === "TERM" ? item.text : firstItem.text);

      // Check if all matched
      const allDone = matchingPairs.filter((p) => !p.matched).length <= 2;
      if (allDone) {
        setTimeout(() => {
          finishSession(correctCount + 1, incorrectCount);
        }, 1000);
      }
    } else {
      // WRONG MATCH
      setWrongMatchPair([selectedMatchingId, item.id]);
      setTimeout(() => {
        setWrongMatchPair([]);
        setSelectedMatchingId(null);
      }, 700);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#132217] rounded-3xl max-w-xl w-full border border-gray-200 dark:border-[#263d2e] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[#263d2e] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#10b981]">
              Chế độ {mode} • {wordSetTitle}
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Câu {currentIndex + 1} / {words.length}
              </span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#10b981] h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Active Engine or Completed Screen */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col justify-center items-center">
          {isCompleted ? (
            /* COMPLETION SCREEN */
            <div className="text-center space-y-5 animate-in zoom-in-95 duration-300 w-full max-w-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                  Hoàn thành phiên học! 🎉
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Bạn đã xuất sắc luyện tập xong bộ từ vựng <strong>{wordSetTitle}</strong>.
                </p>
              </div>

              {/* Reward Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
                  <div className="flex items-center justify-center space-x-1 text-amber-600 dark:text-amber-300">
                    <Coins className="w-4 h-4" />
                    <span className="text-base font-extrabold">+{earnedCoins} Xu</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Thưởng hoàn thành</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-center">
                  <div className="flex items-center justify-center space-x-1 text-purple-600 dark:text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-base font-extrabold">+{earnedXp} XP</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Điểm kinh nghiệm</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] flex items-center justify-around text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Đúng</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {correctCount}
                  </span>
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <div>
                  <span className="text-gray-400 block text-[10px]">Chưa nhớ</span>
                  <span className="font-extrabold text-red-500">
                    {incorrectCount}
                  </span>
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <div>
                  <span className="text-gray-400 block text-[10px]">Độ chính xác</span>
                  <span className="font-extrabold text-[#10b981]">
                    {words.length > 0 ? Math.round((correctCount / words.length) * 100) : 100}%
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Xác nhận & Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : mode === "FLASHCARD" ? (
            /* 1. FLASHCARD ENGINE (3D Card Flip) */
            <div className="w-full flex flex-col items-center space-y-6">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[260px] cursor-pointer rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-[#f8fbf8] to-white dark:from-[#18281d] dark:to-[#132217] border-2 border-emerald-200 dark:border-[#263d2e] hover:border-[#10b981] transition-all flex flex-col items-center justify-center text-center relative group shadow-sm select-none"
              >
                <span className="absolute top-4 right-4 text-[10px] font-semibold text-gray-400">
                  {isFlipped ? "Mặt sau (Nghĩa)" : "Chạm để lật thẻ ↻"}
                </span>

                {!isFlipped ? (
                  /* Card Front: Term + Phonetic + Audio */
                  <div className="space-y-3 animate-in fade-in">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                      {currentWord?.term}
                    </span>
                    {currentWord?.phonetic && (
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                        {currentWord.phonetic}
                      </p>
                    )}
                    {currentWord?.partOfSpeech && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {currentWord.partOfSpeech}
                      </span>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio();
                        }}
                        className="p-2.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 transition-transform active:scale-95"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Card Back: Vietnamese Meaning + Example */
                  <div className="space-y-3 animate-in fade-in">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {currentWord?.meaning}
                    </span>
                    {currentWord?.exampleSentence && (
                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1e3425] text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <p className="font-semibold">{currentWord.exampleSentence}</p>
                        {currentWord.exampleMeaning && (
                          <p className="text-gray-500 dark:text-gray-400">
                            {currentWord.exampleMeaning}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Chưa thuộc vs Đã thuộc */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => handleNextQuestion(false, 1)}
                  className="py-3 px-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Chưa thuộc (1)</span>
                </button>

                <button
                  onClick={() => handleNextQuestion(true, 4)}
                  className="py-3 px-4 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã thuộc (2)</span>
                </button>
              </div>
            </div>
          ) : mode === "QUIZ" || mode === "SPECIAL" ? (
            /* 2. QUIZ ENGINE (4-option MCQ) */
            <div className="w-full space-y-5">
              <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-center space-y-2">
                <span className="text-xs uppercase font-extrabold text-amber-600 dark:text-amber-400">
                  Từ này có nghĩa là gì?
                </span>
                <div className="flex items-center justify-center space-x-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {currentWord?.term}
                  </h3>
                  <button
                    onClick={() => playAudio()}
                    className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                {currentWord?.phonetic && (
                  <p className="text-xs font-mono text-gray-500">{currentWord.phonetic}</p>
                )}
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizOptions.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isRight = opt === currentWord?.meaning;

                  let btnStyle =
                    "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18281d] hover:border-[#10b981]";
                  if (isAnswerSubmitted) {
                    if (isRight) {
                      btnStyle =
                        "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold";
                    } else if (isSelected) {
                      btnStyle =
                        "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold";
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectQuizOption(opt)}
                      className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswerSubmitted && isRight && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                      )}
                      {isAnswerSubmitted && isSelected && !isRight && (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : mode === "LISTENING" ? (
            /* 3. LISTENING ENGINE (30s countdown + typing) */
            <div className="w-full space-y-6 flex flex-col items-center">
              <div className="flex items-center space-x-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Thời gian: {listenTimerSeconds}s</span>
              </div>

              <div className="w-24 h-24 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border-2 border-cyan-200 dark:border-cyan-800 flex items-center justify-center shadow-inner">
                <button
                  onClick={() => playAudio()}
                  className="p-4 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-transform active:scale-95 shadow-md"
                >
                  <Volume2 className="w-8 h-8" />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Bấm vào loa để nghe lại từ tiếng Anh và gõ lại chính xác từ bạn vừa nghe.
              </p>

              <form onSubmit={handleCheckTyping} className="w-full space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Gõ từ bạn nghe được..."
                  disabled={typingResult !== null}
                  className={`w-full px-4 py-3 rounded-2xl border text-center font-bold text-lg focus:outline-none transition-all ${
                    typingResult === "CORRECT"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800"
                      : typingResult === "INCORRECT"
                      ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-800"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18281d] focus:ring-2 focus:ring-cyan-500"
                  }`}
                />

                {typingResult === "INCORRECT" && (
                  <p className="text-xs text-red-500 text-center font-bold">
                    Đáp án đúng: {currentWord?.term} ({currentWord?.meaning})
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!typedInput.trim() || typingResult !== null}
                  className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Kiểm tra đáp án
                </button>
              </form>
            </div>
          ) : mode === "TYPING" ? (
            /* 4. TYPING ENGINE */
            <div className="w-full space-y-6">
              <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-[#18281d] border border-emerald-200 dark:border-[#263d2e] text-center space-y-2">
                <span className="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-400">
                  Xem nghĩa & Gõ từ tiếng Anh
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  {currentWord?.meaning}
                </h3>
                {currentWord?.phonetic && (
                  <p className="text-xs font-mono text-gray-500">{currentWord.phonetic}</p>
                )}
              </div>

              <form onSubmit={handleCheckTyping} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Gõ từ tiếng Anh..."
                  disabled={typingResult !== null}
                  className={`w-full px-4 py-3 rounded-2xl border text-center font-bold text-lg focus:outline-none transition-all ${
                    typingResult === "CORRECT"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800"
                      : typingResult === "INCORRECT"
                      ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-800"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18281d] focus:ring-2 focus:ring-[#10b981]"
                  }`}
                />

                {typingResult === "INCORRECT" && (
                  <p className="text-xs text-red-500 text-center font-bold">
                    Đáp án đúng: {currentWord?.term}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!typedInput.trim() || typingResult !== null}
                  className="w-full py-3 rounded-2xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Kiểm tra
                </button>
              </form>
            </div>
          ) : (
            /* 5. MATCHING PAIRS ENGINE (Ghép Cặp) */
            <div className="w-full space-y-4">
              <div className="text-center">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Chọn 1 từ tiếng Anh và 1 nghĩa tiếng Việt tương ứng
                </h4>
                <p className="text-xs text-gray-400">Nối chính xác các cặp thẻ để hoàn thành.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {matchingPairs.map((item) => {
                  const isSelected = selectedMatchingId === item.id;
                  const isWrong = wrongMatchPair.includes(item.id);

                  if (item.matched) {
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 text-gray-400 opacity-40 text-center text-xs font-bold select-none"
                      >
                        ✓ Đã ghép
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTileClick(item)}
                      className={`p-3.5 rounded-2xl border text-center text-xs font-bold transition-all select-none shadow-2xs ${
                        isWrong
                          ? "border-red-500 bg-red-100 text-red-800 animate-shake"
                          : isSelected
                          ? "border-sky-500 bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 scale-102"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18281d] text-gray-800 dark:text-gray-200 hover:border-sky-300"
                      }`}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  Headphones,
  Edit3,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  VolumeX,
} from "lucide-react";

export type StudyMode =
  | "FLASHCARD"
  | "QUIZ"
  | "LISTENING"
  | "TYPING"
  | "MATCHING"
  | "SPECIAL";

export type QuizSubType = "TERM_TO_MEANING" | "CONTEXT" | "MEANING_TO_TERM";

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
  isEmbedded?: boolean;
}

export function InteractiveStudyModal({
  isOpen,
  onClose,
  wordSetId,
  wordSetTitle,
  mode,
  words,
  onSessionComplete,
  isEmbedded = false,
}: InteractiveStudyModalProps) {
  // Navigation & Progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [gameScore, setGameScore] = useState(0);

  // Direction Toggle: EN->VN or VN->EN
  const [directionEnToVn, setDirectionEnToVn] = useState(true);

  // Audio Playback Speed: 1x or 0.75x
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Hints and Examples toggles
  const [hintsLeft, setHintsLeft] = useState(3);
  const [revealedHint, setRevealedHint] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);

  // Mode: Quiz sub-mode modal state
  const [showQuizTypeModal, setShowQuizTypeModal] = useState(false);
  const [quizSubType, setQuizSubType] = useState<QuizSubType>("TERM_TO_MEANING");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // Mode: Listening & Typing state
  const [typedInput, setTypedInput] = useState("");
  const [checkFeedback, setCheckFeedback] = useState<"CORRECT" | "INCORRECT" | null>(null);

  // Countdown timer for timed modes (Listening, Typing, Matching)
  const [countdownSeconds, setCountdownSeconds] = useState(30);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mode: Matching Pairs (Ghép cặp) State
  const [matchingRound, setMatchingRound] = useState(1);
  const [matchingHearts, setMatchingHearts] = useState(5);
  const [matchedCount, setMatchedCount] = useState(0);
  const [leftSelectedId, setLeftSelectedId] = useState<string | null>(null);
  const [rightSelectedId, setRightSelectedId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPairIds, setWrongPairIds] = useState<string[]>([]);
  const [matchingLeftList, setMatchingLeftList] = useState<StudyWord[]>([]);
  const [matchingRightList, setMatchingRightList] = useState<StudyWord[]>([]);

  const startTimeRef = useRef<number>(Date.now());
  const currentWord = words[currentIndex] || null;

  // Web Speech API Voice synthesis
  const playAudio = useCallback(
    (textToSpeak?: string, customRate?: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak || currentWord?.term || "");
      utterance.lang = "en-US";
      utterance.rate = customRate ?? speechRate;
      window.speechSynthesis.speak(utterance);
    },
    [currentWord, speechRate]
  );

  // Toggle audio speed 1x <-> 0.75x
  const toggleSpeechSpeed = () => {
    setSpeechRate((prev) => (prev === 1.0 ? 0.75 : 1.0));
  };

  // Reset entire session
  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsCompleted(false);
    setGameScore(0);
    setTypedInput("");
    setCheckFeedback(null);
    setRevealedHint(null);
    setShowExample(false);
    setHintsLeft(3);
    setMatchingRound(1);
    setMatchingHearts(5);
    setMatchedCount(0);
    setMatchedIds(new Set());
    setLeftSelectedId(null);
    setRightSelectedId(null);
    startTimeRef.current = Date.now();
  };

  // Trigger quiz sub-type modal when opening in Quiz mode
  useEffect(() => {
    if (isOpen && mode === "QUIZ") {
      setShowQuizTypeModal(true);
    }
  }, [isOpen, mode]);

  // Setup per-word state
  useEffect(() => {
    if (!currentWord || isCompleted) return;

    setIsFlipped(false);
    setTypedInput("");
    setCheckFeedback(null);
    setRevealedHint(null);
    setShowExample(false);
    setSelectedQuizOption(null);
    setIsQuizSubmitted(false);

    // Auto-play audio for Listening or Flashcard
    if (mode === "LISTENING" || mode === "FLASHCARD") {
      playAudio(currentWord.term);
    }

    // Prepare Quiz choices
    if (mode === "QUIZ" || mode === "SPECIAL") {
      if (quizSubType === "TERM_TO_MEANING") {
        const otherMeanings = words.filter((w) => w.id !== currentWord.id).map((w) => w.meaning);
        const distractors = [...otherMeanings].sort(() => Math.random() - 0.5).slice(0, 3);
        const choices = [...distractors, currentWord.meaning].sort(() => Math.random() - 0.5);
        setQuizOptions(choices);
      } else if (quizSubType === "MEANING_TO_TERM") {
        const otherTerms = words.filter((w) => w.id !== currentWord.id).map((w) => w.term);
        const distractors = [...otherTerms].sort(() => Math.random() - 0.5).slice(0, 3);
        const choices = [...distractors, currentWord.term].sort(() => Math.random() - 0.5);
        setQuizOptions(choices);
      } else {
        // CONTEXT mode
        const otherTerms = words.filter((w) => w.id !== currentWord.id).map((w) => w.term);
        const distractors = [...otherTerms].sort(() => Math.random() - 0.5).slice(0, 3);
        const choices = [...distractors, currentWord.term].sort(() => Math.random() - 0.5);
        setQuizOptions(choices);
      }
    }

    // Countdown Timer (30s) for Listening, Typing, Matching
    if (mode === "LISTENING" || mode === "TYPING" || mode === "MATCHING") {
      setCountdownSeconds(30);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [currentIndex, mode, currentWord, words, isCompleted, playAudio, quizSubType]);

  // Setup Matching mode pool (up to 8 pairs per round)
  useEffect(() => {
    if (mode === "MATCHING" && words.length > 0) {
      const roundWords = words.slice(0, 8);
      setMatchingLeftList([...roundWords]);
      setMatchingRightList([...roundWords].sort(() => Math.random() - 0.5));
      setMatchedIds(new Set());
      setMatchedCount(0);
      setMatchingHearts(5);
    }
  }, [mode, words]);

  // Report word progress via SM-2 API
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

  // Complete session and save rewards
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

  // Advance question
  const handleNextQuestion = (wasCorrect: boolean, quality = 4) => {
    const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
    const newIncorrect = !wasCorrect ? incorrectCount + 1 : incorrectCount;

    setCorrectCount(newCorrect);
    setIncorrectCount(newIncorrect);

    if (wasCorrect) {
      setGameScore((prev) => prev + 10);
    }

    if (currentWord) {
      reportWordProgress(currentWord.id, wasCorrect, wasCorrect ? quality : 1);
    }

    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession(newCorrect, newIncorrect);
    }
  };

  // Flashcard Actions
  const handleMarkMemorized = () => {
    handleNextQuestion(true, 5);
  };

  const handleMarkForgot = () => {
    handleNextQuestion(false, 1);
  };

  // Check Flashcard typed meaning
  const handleCheckFlashcardInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !typedInput.trim()) return;

    const inputClean = typedInput.trim().toLowerCase();
    const meaningClean = currentWord.meaning.trim().toLowerCase();

    // Check if input matches or is contained in meaning
    const isMatch = meaningClean.includes(inputClean) || inputClean.includes(meaningClean);
    if (isMatch) {
      setCheckFeedback("CORRECT");
      playAudio(currentWord.term);
      setTimeout(() => {
        handleMarkMemorized();
      }, 1000);
    } else {
      setCheckFeedback("INCORRECT");
      setIsFlipped(true); // Flip to show correct meaning
    }
  };

  // Handle Typing & Listening Verification
  const handleCheckInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || checkFeedback !== null) return;

    const cleanInput = typedInput.trim().toLowerCase();
    const cleanTarget = currentWord.term.trim().toLowerCase();

    const isMatch = cleanInput === cleanTarget;
    setCheckFeedback(isMatch ? "CORRECT" : "INCORRECT");

    if (isMatch) {
      playAudio(currentWord.term);
    }

    setTimeout(() => {
      handleNextQuestion(isMatch, isMatch ? 5 : 2);
    }, 1200);
  };

  // Handle Hint Request (reveals letters)
  const handleRequestHint = () => {
    if (!currentWord || hintsLeft <= 0) return;
    setHintsLeft((prev) => prev - 1);

    const term = currentWord.term;
    const len = term.length;
    // Reveal first letter and vowels/last
    const hintArray = term.split("").map((ch, idx) => {
      if (ch === " ") return "  ";
      if (idx === 0 || (hintsLeft === 1 && idx === len - 1)) return ch;
      return "_";
    });
    setRevealedHint(hintArray.join(" "));
  };

  // Handle Quiz Option Click
  const handleSelectQuizChoice = (option: string) => {
    if (isQuizSubmitted || !currentWord) return;
    setSelectedQuizOption(option);
    setIsQuizSubmitted(true);

    let isCorrect = false;
    if (quizSubType === "TERM_TO_MEANING") {
      isCorrect = option === currentWord.meaning;
    } else {
      isCorrect = option === currentWord.term;
    }

    if (isCorrect) {
      playAudio(currentWord.term);
    }

    setTimeout(() => {
      handleNextQuestion(isCorrect, isCorrect ? 4 : 1);
    }, 1200);
  };

  // Handle Matching item selection
  const handleLeftMatchingSelect = (word: StudyWord) => {
    if (matchedIds.has(word.id)) return;
    setLeftSelectedId(word.id);
    playAudio(word.term);

    // If right was already selected, check match
    if (rightSelectedId) {
      checkMatching(word.id, rightSelectedId);
    }
  };

  const handleRightMatchingSelect = (word: StudyWord) => {
    if (matchedIds.has(word.id)) return;
    setRightSelectedId(word.id);

    // If left was already selected, check match
    if (leftSelectedId) {
      checkMatching(leftSelectedId, word.id);
    }
  };

  const checkMatching = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      // Correct Match!
      const newMatched = new Set(matchedIds);
      newMatched.add(leftId);
      setMatchedIds(newMatched);
      setMatchedCount((prev) => prev + 1);
      setGameScore((prev) => prev + 5);
      setLeftSelectedId(null);
      setRightSelectedId(null);

      // Check if all 8 in round are matched
      if (newMatched.size >= matchingLeftList.length) {
        setTimeout(() => {
          finishSession(matchingLeftList.length, 5 - matchingHearts);
        }, 1000);
      }
    } else {
      // Wrong Match
      setWrongPairIds([leftId, rightId]);
      setMatchingHearts((prev) => Math.max(0, prev - 1));

      setTimeout(() => {
        setWrongPairIds([]);
        setLeftSelectedId(null);
        setRightSelectedId(null);
      }, 700);
    }
  };

  // Keyboard Shortcuts (Window Event Listener)
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Flip card in Flashcard mode
      if (e.code === "Space" && mode === "FLASHCARD" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      // Ctrl + S: Play Audio
      if (e.ctrlKey && e.code === "KeyS") {
        e.preventDefault();
        playAudio();
        return;
      }

      // Ctrl + X: Play Audio (Listening shortcut)
      if (e.ctrlKey && e.code === "KeyX") {
        e.preventDefault();
        playAudio();
        return;
      }

      // Ctrl + H: Toggle speed
      if (e.ctrlKey && e.code === "KeyH") {
        e.preventDefault();
        toggleSpeechSpeed();
        return;
      }

      // Ctrl + E: View Example
      if (e.ctrlKey && e.code === "KeyE") {
        e.preventDefault();
        setShowExample((prev) => !prev);
        return;
      }

      // Ctrl + Space: Request Hint
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        handleRequestHint();
        return;
      }

      // Ctrl + 1 or Ctrl + X: Mark Forgot in Flashcard
      if (e.ctrlKey && (e.code === "Digit1" || e.code === "KeyX") && mode === "FLASHCARD") {
        e.preventDefault();
        handleMarkForgot();
        return;
      }

      // Ctrl + 2 or Ctrl + C: Mark Memorized in Flashcard
      if (e.ctrlKey && (e.code === "Digit2" || e.code === "KeyC") && mode === "FLASHCARD") {
        e.preventDefault();
        handleMarkMemorized();
        return;
      }

      // Ctrl + ArrowRight: Next
      if (e.ctrlKey && e.code === "ArrowRight") {
        e.preventDefault();
        if (currentIndex + 1 < words.length) {
          setCurrentIndex((prev) => prev + 1);
        }
        return;
      }

      // Ctrl + ArrowLeft: Previous
      if (e.ctrlKey && e.code === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCompleted, mode, currentIndex, words.length, playAudio]);

  if (!isOpen) return null;

  return (
    <div
      className={
        isEmbedded
          ? "w-full flex items-center justify-center p-0"
          : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto"
      }
    >
      {/* Quiz Sub-Type Selector Modal matching Image 2 */}
      {showQuizTypeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white dark:bg-[#15251a] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Chọn chế độ Quiz
              </h2>
              <button
                onClick={() => {
                  setShowQuizTypeModal(false);
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Sub-mode Cards matching Image 2 */}
            <div className="space-y-3.5">
              {/* Card 1: Từ -> Nghĩa */}
              <button
                onClick={() => {
                  setQuizSubType("TERM_TO_MEANING");
                  setShowQuizTypeModal(false);
                }}
                className="w-full text-left p-4 rounded-3xl border-2 border-sky-300 bg-sky-50 dark:bg-sky-950/30 hover:border-sky-400 hover:shadow-md transition-all group cursor-pointer"
              >
                <h3 className="text-base font-black text-sky-600 dark:text-sky-400">
                  Từ -&gt; Nghĩa
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Nhìn từ tiếng Anh, chọn nghĩa đúng
                </p>
              </button>

              {/* Card 2: Ngữ cảnh */}
              <button
                onClick={() => {
                  setQuizSubType("CONTEXT");
                  setShowQuizTypeModal(false);
                }}
                className="w-full text-left p-4 rounded-3xl border-2 border-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:border-purple-400 hover:shadow-md transition-all group cursor-pointer"
              >
                <h3 className="text-base font-black text-purple-600 dark:text-purple-400">
                  Ngữ cảnh
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Che từ trong ví dụ, chọn đáp án phù hợp với câu
                </p>
              </button>

              {/* Card 3: Nghĩa -> Từ */}
              <button
                onClick={() => {
                  setQuizSubType("MEANING_TO_TERM");
                  setShowQuizTypeModal(false);
                }}
                className="w-full text-left p-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer"
              >
                <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  Nghĩa -&gt; Từ
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Nhìn nghĩa tiếng Việt, chọn từ đúng
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div
        className={`bg-white dark:bg-[#15251a] rounded-[28px] sm:rounded-[36px] max-w-2xl w-full border border-gray-200/90 dark:border-[#263d2e] shadow-2xl flex flex-col overflow-hidden my-auto ${
          isEmbedded ? "max-h-none" : "max-h-[92dvh] sm:max-h-[95vh]"
        }`}
      >
        {/* Top Control Bar matching Screenshots 1, 3, 4, 5 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[#263d2e]/80 space-y-2.5">
          <div className="flex items-center justify-between">
            {/* Left: Gold Badge & Progress Number */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black shadow-2xs">
                <span>🟡</span>
                <span>~{gameScore} GAME</span>
              </div>

              {mode === "MATCHING" ? (
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[11px]">
                    VÒNG {matchingRound}/2
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Đã ghép {matchedCount} / {matchingLeftList.length} • tổng {matchedCount}/{words.length}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                  {mode === "FLASHCARD" ? `${currentIndex + 1} / ${words.length}` : `Câu ${currentIndex + 1} / ${words.length}`}
                </span>
              )}
            </div>

            {/* Right: Toggles & Navigation buttons */}
            <div className="flex items-center space-x-3">
              {/* Direction Toggle (EN->VN) in Flashcard or Typing */}
              {(mode === "FLASHCARD" || mode === "TYPING") && (
                <button
                  onClick={() => setDirectionEnToVn(!directionEnToVn)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                >
                  <span>{directionEnToVn ? "EN→VN" : "VN→EN"}</span>
                  <div className={`w-3.5 h-3.5 rounded-full ${directionEnToVn ? "bg-sky-500" : "bg-emerald-500"}`} />
                </button>
              )}

              {/* Chơi lại button */}
              <button
                onClick={restartSession}
                className="flex items-center space-x-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Chơi lại</span>
              </button>

              {/* Thoát button */}
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                Thoát
              </button>
            </div>
          </div>

          {/* Green Progress Bar & Countdown Timer */}
          <div className="flex items-center space-x-3">
            {(mode === "LISTENING" || mode === "TYPING" || mode === "MATCHING") && (
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                {countdownSeconds}s
              </span>
            )}
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#10b981] h-full rounded-full transition-all duration-300"
                style={{
                  width:
                    mode === "MATCHING"
                      ? `${(matchedCount / matchingLeftList.length) * 100}%`
                      : `${((currentIndex + 1) / words.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col justify-center items-center">
          {isCompleted ? (
            /* COMPLETION SCREEN */
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 w-full max-w-sm py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto shadow-lg">
                <Trophy className="w-10 h-10 text-white animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  Hoàn thành xuất sắc! 🎉
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Bạn đã hoàn thành phiên luyện tập bộ từ <strong>{wordSetTitle}</strong>.
                </p>
              </div>

              {/* Reward Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-amber-600 dark:text-amber-300">
                    <Coins className="w-5 h-5" />
                    <span className="text-lg font-black">+{earnedCoins} XP</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Thưởng hoàn thành</span>
                </div>

                <div className="p-4 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-purple-600 dark:text-purple-300">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-lg font-black">+{earnedXp} XP</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">Kinh nghiệm</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-around text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Đúng</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {correctCount}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Chưa nhớ</span>
                  <span className="text-base font-black text-red-500">
                    {incorrectCount}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Điểm game</span>
                  <span className="text-base font-black text-amber-500">
                    {gameScore}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={restartSession}
                  className="w-full py-3 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  Luyện tập lại
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Quay lại bộ từ
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE LEARNING ENGINE MODES */
            <div className="w-full max-w-lg space-y-6">
              {/* ========================================================= */}
              {/* 1. FLASHCARD MODE (Exact Screenshot 1) */}
              {/* ========================================================= */}
              {mode === "FLASHCARD" && currentWord && (
                <div className="space-y-5">
                  {/* Purple Gradient 3D Flashcard matching Image 1 */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full min-h-[260px] sm:min-h-[290px] rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#5b51d8] to-[#7c3aed] text-white p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-xl cursor-pointer select-none transition-transform duration-300 active:scale-99"
                  >
                    {/* Header tag inside card */}
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">
                      {isFlipped ? "NGHĨA TIẾNG VIỆT" : "TỪ TIẾNG ANH"}
                    </span>

                    {/* Word display */}
                    <div className="my-auto space-y-2">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                        {isFlipped ? currentWord.meaning : currentWord.term}
                      </h2>

                      {/* Part of Speech Pill badge */}
                      <div className="inline-block px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase text-white/90">
                        {currentWord.partOfSpeech || "THÁN TỪ"}
                      </div>

                      {/* Phonetic transcription */}
                      {!isFlipped && currentWord.phonetic && (
                        <p className="text-sm italic text-white/80 tracking-wide font-sans">
                          {currentWord.phonetic}
                        </p>
                      )}

                      {/* Example sentence when flipped */}
                      {isFlipped && currentWord.exampleSentence && (
                        <div className="pt-2 text-xs text-white/90 max-w-xs mx-auto">
                          <p className="italic">"{currentWord.exampleSentence}"</p>
                          {currentWord.exampleMeaning && (
                            <p className="text-white/70 text-[11px] mt-0.5">
                              ({currentWord.exampleMeaning})
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Hint */}
                    <span className="text-[11px] font-medium text-white/75 flex items-center gap-1">
                      ⚡ Nhấn Space hoặc click để lật
                    </span>
                  </div>

                  {/* Input Check Bar matching Image 1 */}
                  <form onSubmit={handleCheckFlashcardInput} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="Gõ nghĩa(Đánh dấu đã thuộc nếu thấy đúng)"
                      className="flex-1 px-4 py-2.5 rounded-full border-2 border-sky-300 focus:border-sky-500 dark:border-sky-700 bg-white dark:bg-[#132217] text-xs font-medium text-gray-800 dark:text-gray-100 outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Check
                    </button>
                  </form>

                  {/* 5 Action Buttons matching Image 1 */}
                  <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1">
                    {/* < Trước */}
                    <button
                      type="button"
                      onClick={() => currentIndex > 0 && setCurrentIndex((p) => p - 1)}
                      disabled={currentIndex === 0}
                      className="flex flex-col items-center text-[11px] sm:text-xs font-bold text-sky-500 disabled:opacity-30 cursor-pointer min-w-[44px]"
                    >
                      <span>&lt; Trước</span>
                      <span className="hidden sm:inline text-[9px] text-gray-400 font-normal">Ctrl+← khi nhập</span>
                    </button>

                    {/* Circular Sound Button */}
                    <button
                      type="button"
                      onClick={() => playAudio()}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                      title="Nghe phát âm (Ctrl+S)"
                    >
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* ✕ Quên */}
                    <button
                      type="button"
                      onClick={handleMarkForgot}
                      className="flex flex-col items-center px-2.5 sm:px-4 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-[11px] sm:text-xs shadow-xs cursor-pointer active:scale-95 min-h-[36px] justify-center"
                    >
                      <span>✕ Quên</span>
                      <span className="hidden sm:inline text-[9px] text-white/80 font-normal">Ctrl+1/X</span>
                    </button>

                    {/* ✓ Thuộc */}
                    <button
                      type="button"
                      onClick={handleMarkMemorized}
                      className="flex flex-col items-center px-2.5 sm:px-4 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-[11px] sm:text-xs shadow-xs cursor-pointer active:scale-95 min-h-[36px] justify-center"
                    >
                      <span>✓ Thuộc</span>
                      <span className="hidden sm:inline text-[9px] text-white/80 font-normal">Ctrl+2/C</span>
                    </button>

                    {/* Tiếp > */}
                    <button
                      type="button"
                      onClick={() => currentIndex + 1 < words.length && setCurrentIndex((p) => p + 1)}
                      disabled={currentIndex + 1 >= words.length}
                      className="flex flex-col items-center text-[11px] sm:text-xs font-bold text-sky-500 disabled:opacity-30 cursor-pointer min-w-[44px]"
                    >
                      <span>Tiếp &gt;</span>
                      <span className="hidden sm:inline text-[9px] text-gray-400 font-normal">Ctrl+→ khi nhập</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. QUIZ MODE (with 3 Sub-types) */}
              {/* ========================================================= */}
              {mode === "QUIZ" && currentWord && (
                <div className="space-y-5">
                  {/* Prompt Card */}
                  <div className="p-6 rounded-3xl bg-gray-50 dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-center space-y-2">
                    <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold uppercase">
                      {quizSubType === "CONTEXT" ? "Ngữ cảnh câu" : currentWord.partOfSpeech || "THÁN TỪ"}
                    </div>

                    {quizSubType === "TERM_TO_MEANING" && (
                      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                        {currentWord.term}
                      </h2>
                    )}

                    {quizSubType === "MEANING_TO_TERM" && (
                      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                        {currentWord.meaning}
                      </h2>
                    )}

                    {quizSubType === "CONTEXT" && (
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 italic">
                        "{currentWord.exampleSentence?.replace(new RegExp(currentWord.term, "gi"), "_______") || `Good _______!`}"
                      </h2>
                    )}

                    <p className="text-xs text-gray-400">Chọn đáp án chính xác nhất</p>
                  </div>

                  {/* 4 MCQ Option Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizOptions.map((opt, idx) => {
                      const isSelected = selectedQuizOption === opt;
                      const isCorrect =
                        quizSubType === "TERM_TO_MEANING"
                          ? opt === currentWord.meaning
                          : opt === currentWord.term;

                      let btnStyle = "border-gray-200 dark:border-gray-700 hover:border-sky-400 bg-white dark:bg-[#132217]";
                      if (isQuizSubmitted) {
                        if (isCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold";
                        } else if (isSelected) {
                          btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectQuizChoice(opt)}
                          disabled={isQuizSubmitted}
                          className={`p-4 rounded-2xl border-2 text-left text-xs font-semibold transition-all shadow-xs cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 inline-flex items-center justify-center mr-2 text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. LISTENING MODE (Exact Screenshot 3) */}
              {/* ========================================================= */}
              {mode === "LISTENING" && currentWord && (
                <div className="space-y-6 text-center">
                  <div className="flex justify-end">
                    <button
                      onClick={toggleSpeechSpeed}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    >
                      Nghe: {speechRate}x | Ctrl+H
                    </button>
                  </div>

                  {/* Big Headphones Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => playAudio()}
                      className="w-16 h-16 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center mx-auto shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      <Headphones className="w-8 h-8" />
                    </button>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      CTRL + X
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                      Nghe và gõ từ tiếng Anh
                    </h2>
                    <div className="inline-block px-3 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold uppercase">
                      {currentWord.partOfSpeech || "THÁN TỪ"}
                    </div>
                    <p className="text-xs italic text-gray-400 pt-1">
                      {revealedHint ? revealedHint : "Chưa có gợi ý"}
                    </p>
                  </div>

                  {/* Example display if opened */}
                  {showExample && currentWord.exampleSentence && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs italic">
                      Ví dụ: "{currentWord.exampleSentence.replace(new RegExp(currentWord.term, "gi"), "_______")}"
                    </div>
                  )}

                  {/* Input field matching Image 3 */}
                  <form onSubmit={handleCheckInput} className="space-y-4">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="Gõ từ bạn nghe được..."
                      autoFocus
                      className="w-full text-center px-4 py-3 rounded-full border-2 border-sky-300 focus:border-sky-500 bg-white dark:bg-[#132217] text-sm font-bold text-gray-900 dark:text-white outline-none"
                    />

                    {/* 3 Action Buttons matching Image 3 */}
                    <div className="flex items-center justify-center space-x-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowExample(!showExample)}
                        className="flex flex-col items-center px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Xem ví dụ
                        </span>
                        <span className="text-[9px] text-gray-400 font-normal">Ctrl + E</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRequestHint}
                        disabled={hintsLeft <= 0}
                        className="flex flex-col items-center px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-400" /> Gợi ý ({hintsLeft})
                        </span>
                        <span className="text-[9px] text-gray-400 font-normal">Ctrl + Space</span>
                      </button>

                      <button
                        type="submit"
                        className="flex flex-col items-center px-6 py-2 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold shadow-sm active:scale-95 cursor-pointer"
                      >
                        <span>Kiểm tra</span>
                        <span className="text-[9px] text-white/80 font-normal">Enter</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. TYPING MODE (Exact Screenshot 4) */}
              {/* ========================================================= */}
              {mode === "TYPING" && currentWord && (
                <div className="space-y-6 text-center">
                  <div className="space-y-1.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                      {currentWord.meaning}
                    </h2>

                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => playAudio()}
                        className="text-sky-500 hover:text-sky-600 cursor-pointer"
                        title="Nghe mẫu"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="inline-block px-3 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold uppercase">
                        {currentWord.partOfSpeech || "THÁN TỪ"}
                      </div>
                    </div>

                    <p className="text-xs italic text-gray-400 pt-1">
                      {revealedHint ? revealedHint : "Chưa có gợi ý"}
                    </p>
                  </div>

                  {showExample && currentWord.exampleSentence && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs italic">
                      Ví dụ: "{currentWord.exampleSentence.replace(new RegExp(currentWord.term, "gi"), "_______")}"
                    </div>
                  )}

                  {/* Input field matching Image 4 */}
                  <form onSubmit={handleCheckInput} className="space-y-4">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="Gõ từ tiếng Anh..."
                      autoFocus
                      className="w-full text-center px-4 py-3 rounded-full border-2 border-sky-300 focus:border-sky-500 bg-white dark:bg-[#132217] text-sm font-bold text-gray-900 dark:text-white outline-none"
                    />

                    {/* 3 Action Buttons matching Image 4 */}
                    <div className="flex items-center justify-center space-x-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowExample(!showExample)}
                        className="flex flex-col items-center px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Xem ví dụ
                        </span>
                        <span className="text-[9px] text-gray-400 font-normal">Ctrl + E</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRequestHint}
                        disabled={hintsLeft <= 0}
                        className="flex flex-col items-center px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-400" /> Gợi ý ({hintsLeft})
                        </span>
                        <span className="text-[9px] text-gray-400 font-normal">Ctrl + Space</span>
                      </button>

                      <button
                        type="submit"
                        className="flex flex-col items-center px-6 py-2 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold shadow-sm active:scale-95 cursor-pointer"
                      >
                        <span>Kiểm tra</span>
                        <span className="text-[9px] text-white/80 font-normal">Enter</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* 5. MATCHING PAIRS (GHÉP CẶP) MODE (Exact Screenshot 5) */}
              {/* ========================================================= */}
              {mode === "MATCHING" && (
                <div className="space-y-4">
                  {/* Hearts header matching Image 5 */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-5 h-5 ${i < matchingHearts ? "fill-rose-500 text-rose-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdownSeconds}S</span>
                    </div>
                  </div>

                  {/* 2 Columns: Tiếng Anh & Tiếng Việt matching Image 5 */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Column 1: Tiếng Anh */}
                    <div className="space-y-2">
                      <h4 className="text-center font-extrabold text-xs text-gray-700 dark:text-gray-300 pb-1">
                        Tiếng Anh
                      </h4>
                      {matchingLeftList.map((item) => {
                        const isMatched = matchedIds.has(item.id);
                        const isSelected = leftSelectedId === item.id;
                        const isWrong = wrongPairIds.includes(item.id);

                        let pillStyle = "border-gray-200 dark:border-gray-700 hover:border-sky-300 bg-white dark:bg-[#132217] text-gray-800 dark:text-gray-200";
                        if (isMatched) {
                          pillStyle = "opacity-30 border-emerald-500 bg-emerald-50 text-emerald-800 pointer-events-none line-through";
                        } else if (isWrong) {
                          pillStyle = "border-rose-500 bg-rose-50 text-rose-800 animate-shake";
                        } else if (isSelected) {
                          pillStyle = "border-sky-500 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold ring-2 ring-sky-200";
                        }

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleLeftMatchingSelect(item)}
                            disabled={isMatched}
                            className={`w-full py-2 px-3 rounded-full border-2 text-center text-xs font-bold transition-all shadow-2xs truncate cursor-pointer ${pillStyle}`}
                          >
                            {item.term}
                          </button>
                        );
                      })}
                    </div>

                    {/* Column 2: Tiếng Việt */}
                    <div className="space-y-2">
                      <h4 className="text-center font-extrabold text-xs text-gray-700 dark:text-gray-300 pb-1">
                        Tiếng Việt
                      </h4>
                      {matchingRightList.map((item) => {
                        const isMatched = matchedIds.has(item.id);
                        const isSelected = rightSelectedId === item.id;
                        const isWrong = wrongPairIds.includes(item.id);

                        let pillStyle = "border-gray-200 dark:border-gray-700 hover:border-sky-300 bg-white dark:bg-[#132217] text-gray-800 dark:text-gray-200";
                        if (isMatched) {
                          pillStyle = "opacity-30 border-emerald-500 bg-emerald-50 text-emerald-800 pointer-events-none line-through";
                        } else if (isWrong) {
                          pillStyle = "border-rose-500 bg-rose-50 text-rose-800 animate-shake";
                        } else if (isSelected) {
                          pillStyle = "border-sky-500 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold ring-2 ring-sky-200";
                        }

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleRightMatchingSelect(item)}
                            disabled={isMatched}
                            className={`w-full py-2 px-3 rounded-full border-2 text-center text-xs font-bold transition-all shadow-2xs truncate cursor-pointer ${pillStyle}`}
                          >
                            {item.meaning}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-center text-xs font-bold text-gray-500 pt-2">
                    Đã ghép: {matchedCount} / {matchingLeftList.length}
                  </p>
                </div>
              )}

              {/* ========================================================= */}
              {/* 6. SPECIAL (HOT) CHALLENGE MODE */}
              {/* ========================================================= */}
              {mode === "SPECIAL" && currentWord && (
                <div className="space-y-5 text-center">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-black animate-pulse">
                    <span>🔥 THỬ THÁCH ĐẶC BIỆT (+20 XP)</span>
                  </div>

                  <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-2 border-rose-200 dark:border-rose-900/40 space-y-2">
                    <h2 className="text-2xl font-black text-rose-900 dark:text-rose-100">
                      {currentWord.term}
                    </h2>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {currentWord.meaning}
                    </p>
                    <p className="text-xs italic text-gray-500 pt-1">
                      "{currentWord.exampleSentence}"
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => handleNextQuestion(false, 1)}
                      className="px-6 py-2.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold text-xs"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={() => handleNextQuestion(true, 5)}
                      className="px-8 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md"
                    >
                      Tôi đã nắm chắc từ này!
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

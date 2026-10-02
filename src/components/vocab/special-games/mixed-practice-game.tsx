"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Coins,
  ArrowRight,
  RotateCcw,
  Trophy,
  Shuffle,
  Headphones,
  Keyboard,
  Layers,
  Check,
} from "lucide-react";
import { StudyWord } from "@/components/vocab/interactive-study-modal";

interface MixedPracticeGameProps {
  words: StudyWord[];
  wordSetId: string;
  wordSetTitle: string;
  onClose: () => void;
  onFinish?: (results: { correct: number; total: number; coins: number }) => void;
}

type QuestionType = "QUIZ" | "LISTENING" | "TYPING" | "FLASHCARD";

export function MixedPracticeGame({
  words,
  wordSetId,
  wordSetTitle,
  onClose,
  onFinish,
}: MixedPracticeGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current Question Type
  const currentWord = words[currentIndex] || null;
  const currentType: QuestionType = questionTypes[currentIndex] || "QUIZ";

  // Mode: Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Mode: Typing & Listening state
  const [typedInput, setTypedInput] = useState("");
  const [feedback, setFeedback] = useState<"CORRECT" | "INCORRECT" | null>(null);

  // Mode: Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  // Initialize random question types
  useEffect(() => {
    if (words.length === 0) return;
    const types: QuestionType[] = ["QUIZ", "LISTENING", "TYPING", "FLASHCARD"];
    const randomized = words.map(() => types[Math.floor(Math.random() * types.length)]);
    setQuestionTypes(randomized);
  }, [words]);

  // Audio synthesis
  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Generate quiz options for current word
  useEffect(() => {
    if (!currentWord) return;
    setIsAnswered(false);
    setSelectedOption(null);
    setTypedInput("");
    setFeedback(null);
    setIsFlipped(false);

    if (currentType === "LISTENING") {
      playAudio(currentWord.term);
    }

    if (currentType === "QUIZ") {
      const distractors = words
        .filter((w) => w.id !== currentWord.id)
        .map((w) => w.meaning)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [...distractors, currentWord.meaning].sort(
        () => 0.5 - Math.random()
      );
      setQuizOptions(options);
    }
  }, [currentIndex, currentWord, currentType, words]);

  // Handle Quiz selection
  const handleSelectQuizOption = (option: string) => {
    if (isAnswered || !currentWord) return;
    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option === currentWord.meaning;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      playAudio(currentWord.term);
    } else {
      setStreak(0);
    }
  };

  // Handle Typing / Listening check
  const handleCheckTyping = () => {
    if (!currentWord || feedback !== null) return;
    const cleanTyped = typedInput.trim().toLowerCase();
    const cleanTarget = currentWord.term.trim().toLowerCase();
    const isCorrect = cleanTyped === cleanTarget;

    setFeedback(isCorrect ? "CORRECT" : "INCORRECT");
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      playAudio(currentWord.term);
    } else {
      setStreak(0);
    }
  };

  // Handle Flashcard self assessment
  const handleFlashcardAssess = (isMastered: boolean) => {
    if (isMastered) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
    handleNext();
  };

  // Next Question
  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  // Finish Game & Record API
  const finishGame = async () => {
    setIsCompleted(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const coinsReward = 20;

    try {
      setIsSubmitting(true);
      await fetch("/api/vocab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          mode: "SPECIAL",
          specialGameMode: "MIXED",
          totalItems: words.length,
          correctItems: correctCount,
          durationSeconds: duration,
          coinsDelta: coinsReward,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      if (onFinish) {
        onFinish({
          correct: correctCount,
          total: words.length,
          coins: coinsReward,
        });
      }
    }
  };

  if (!currentWord && !isCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-2xl rounded-3xl shadow-2xl border border-pink-200 dark:border-pink-900/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#263d2e] flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
              <Shuffle className="w-3 h-3" />
              <span>Luyện tập Hỗn hợp</span>
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {currentIndex + 1} / {words.length}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {streak > 1 && (
              <span className="text-xs font-black text-amber-500 flex items-center space-x-1 animate-bounce">
                <span>🔥 {streak} Streak</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5">
          <div
            className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / words.length) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {!isCompleted ? (
            <div className="space-y-6">
              {/* Question Badge */}
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-bold flex items-center space-x-1.5">
                  {currentType === "QUIZ" && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Trắc nghiệm nhanh</span>
                    </>
                  )}
                  {currentType === "LISTENING" && (
                    <>
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Nghe & Gõ lại từ</span>
                    </>
                  )}
                  {currentType === "TYPING" && (
                    <>
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Xem nghĩa & Gõ từ tiếng Anh</span>
                    </>
                  )}
                  {currentType === "FLASHCARD" && (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Thẻ ghi nhớ Flashcard</span>
                    </>
                  )}
                </span>
              </div>

              {/* 1. QUIZ MODE */}
              {currentType === "QUIZ" && (
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {currentWord.term}
                    </h3>
                    {currentWord.phonetic && (
                      <p className="text-sm font-mono text-pink-600 dark:text-pink-400">
                        {currentWord.phonetic}
                      </p>
                    )}
                    <button
                      onClick={() => playAudio(currentWord.term)}
                      className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 hover:scale-105 transition-all inline-flex"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {quizOptions.map((opt, i) => {
                      const isCorrect = opt === currentWord.meaning;
                      const isChosen = selectedOption === opt;
                      let btnStyle = "border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] hover:border-pink-300";

                      if (isAnswered) {
                        if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200";
                        else if (isChosen) btnStyle = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200";
                        else btnStyle = "opacity-50 border-gray-200 dark:border-gray-800";
                      }

                      return (
                        <button
                          key={i}
                          disabled={isAnswered}
                          onClick={() => handleSelectQuizOption(opt)}
                          className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all ${btnStyle}`}
                        >
                          <span className="inline-block w-6 text-xs text-gray-400">{String.fromCharCode(65 + i)}.</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleNext}
                        className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                      >
                        <span>Tiếp tục</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. LISTENING MODE */}
              {currentType === "LISTENING" && (
                <div className="space-y-6 text-center">
                  <div className="p-6 rounded-3xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/30 flex flex-col items-center space-y-3">
                    <button
                      onClick={() => playAudio(currentWord.term)}
                      className="w-16 h-16 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                    >
                      <Volume2 className="w-8 h-8" />
                    </button>
                    <p className="text-xs text-pink-700 dark:text-pink-300 font-semibold">
                      Bấm loa để nghe lại âm thanh
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-3">
                    <input
                      type="text"
                      autoFocus
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (feedback ? handleNext() : handleCheckTyping())}
                      placeholder="Gõ lại từ tiếng Anh bạn nghe được..."
                      disabled={feedback !== null}
                      className="w-full px-5 py-3 text-center text-sm font-bold rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />

                    {feedback === null ? (
                      <button
                        onClick={handleCheckTyping}
                        disabled={!typedInput.trim()}
                        className="w-full py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className={`p-3 rounded-xl text-xs font-bold ${
                            feedback === "CORRECT"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {feedback === "CORRECT" ? (
                            <span>Chính xác! Từ đúng là: <strong>{currentWord.term}</strong></span>
                          ) : (
                            <span>Chưa chính xác! Đáp án đúng: <strong>{currentWord.term}</strong> ({currentWord.meaning})</span>
                          )}
                        </div>
                        <button
                          onClick={handleNext}
                          className="w-full py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold"
                        >
                          Tiếp tục
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. TYPING MODE */}
              {currentType === "TYPING" && (
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-bold text-gray-400">Nghĩa tiếng Việt</span>
                    <h3 className="text-2xl font-extrabold text-pink-600 dark:text-pink-400">
                      {currentWord.meaning}
                    </h3>
                    {currentWord.partOfSpeech && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-semibold text-gray-500">
                        {currentWord.partOfSpeech}
                      </span>
                    )}
                  </div>

                  <div className="max-w-md mx-auto space-y-3">
                    <input
                      type="text"
                      autoFocus
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (feedback ? handleNext() : handleCheckTyping())}
                      placeholder="Gõ từ tiếng Anh tương ứng..."
                      disabled={feedback !== null}
                      className="w-full px-5 py-3 text-center text-sm font-bold rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />

                    {feedback === null ? (
                      <button
                        onClick={handleCheckTyping}
                        disabled={!typedInput.trim()}
                        className="w-full py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className={`p-3 rounded-xl text-xs font-bold ${
                            feedback === "CORRECT"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {feedback === "CORRECT" ? (
                            <span>Chính xác! 🎉 ({currentWord.phonetic})</span>
                          ) : (
                            <span>Từ đúng là: <strong>{currentWord.term}</strong> ({currentWord.phonetic})</span>
                          )}
                        </div>
                        <button
                          onClick={handleNext}
                          className="w-full py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold"
                        >
                          Tiếp tục
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. FLASHCARD MODE */}
              {currentType === "FLASHCARD" && (
                <div className="space-y-6">
                  <div
                    onClick={() => {
                      setIsFlipped(!isFlipped);
                      if (!isFlipped) playAudio(currentWord.term);
                    }}
                    className="cursor-pointer min-h-[200px] p-6 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center text-center shadow-lg hover:scale-101 transition-all"
                  >
                    {!isFlipped ? (
                      <div className="space-y-2">
                        <h3 className="text-3xl font-extrabold">{currentWord.term}</h3>
                        {currentWord.phonetic && (
                          <p className="text-sm text-pink-200 font-mono">{currentWord.phonetic}</p>
                        )}
                        <p className="text-xs text-white/70 pt-4">Bấm để lật xem nghĩa</p>
                      </div>
                    ) : (
                      <div className="space-y-2 animate-in zoom-in-95 duration-150">
                        <h3 className="text-2xl font-bold">{currentWord.meaning}</h3>
                        {currentWord.exampleSentence && (
                          <p className="text-xs italic text-pink-100 max-w-sm pt-2">
                            "{currentWord.exampleSentence}"
                          </p>
                        )}
                        <p className="text-xs text-white/70 pt-3">Bấm để lật lại</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      onClick={() => handleFlashcardAssess(false)}
                      className="px-6 py-2.5 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs"
                    >
                      Chưa thuộc
                    </button>
                    <button
                      onClick={() => handleFlashcardAssess(true)}
                      className="px-6 py-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-md"
                    >
                      Đã thuộc!
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Complete screen */
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 mx-auto flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Hoàn thành Thử thách Hỗn Hợp!
                </h3>
                <p className="text-xs text-gray-500">
                  Bạn đã trả lời đúng {correctCount}/{words.length} câu hỏi
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>+20 Xu thưởng & 50 XP</span>
              </div>

              <div className="pt-4 flex justify-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 shadow-md"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

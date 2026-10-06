"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Target,
  Bomb,
  Heart,
  Volume2,
  Sparkles,
  RotateCcw,
  Trophy,
  Coins,
  Flame,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PracticeItem } from "@/components/practice/types";

interface MonkeyRescueGameProps {
  words: PracticeItem[];
  wordSetId: string;
  onClose: () => void;
  onFinish?: (won: boolean) => void;
}

export function MonkeyRescueGame({
  words,
  wordSetId,
  onClose,
  onFinish,
}: MonkeyRescueGameProps) {
  const [yetiHp, setYetiHp] = useState(100);
  const [monkeyHearts, setMonkeyHearts] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [distance, setDistance] = useState(12); // meters
  const [inputMode, setInputMode] = useState<"CHOICE" | "TYPING">("CHOICE");
  const [options, setOptions] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [battleState, setBattleState] = useState<"IDLE" | "BOMB_THROW" | "YETI_LAUGH">("IDLE");
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);

  const currentWord = words[currentIndex % words.length] || null;

  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Generate options
  useEffect(() => {
    if (!currentWord) return;
    setIsAnswered(false);
    setTypedAnswer("");
    setBattleState("IDLE");

    const distractors = words
      .filter((w) => w.id !== currentWord.id)
      .map((w) => w.meaning)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const shuffled = [...distractors, currentWord.meaning].sort(
      () => 0.5 - Math.random()
    );
    setOptions(shuffled);
  }, [currentIndex, currentWord, words]);

  // Handle Answer
  const handleAnswer = (answer: string) => {
    if (isAnswered || !currentWord) return;
    setIsAnswered(true);

    const isCorrect =
      inputMode === "CHOICE"
        ? answer === currentWord.meaning
        : answer.trim().toLowerCase() === currentWord.term.trim().toLowerCase();

    if (isCorrect) {
      playAudio(currentWord.term);
      setBattleState("BOMB_THROW");
      const nextHp = Math.max(0, yetiHp - 25);
      const nextDistance = Math.min(25, distance + 4);
      setYetiHp(nextHp);
      setDistance(nextDistance);

      if (nextHp <= 0) {
        setTimeout(() => handleEndBattle(true), 1200);
      } else {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 1200);
      }
    } else {
      setBattleState("YETI_LAUGH");
      const nextHearts = monkeyHearts - 1;
      const nextDistance = Math.max(2, distance - 3);
      setMonkeyHearts(nextHearts);
      setDistance(nextDistance);

      if (nextHearts <= 0) {
        setTimeout(() => handleEndBattle(false), 1200);
      } else {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 1200);
      }
    }
  };

  const handleEndBattle = async (won: boolean) => {
    if (won) setIsWon(true);
    else setIsLost(true);

    try {
      await fetch("/api/vocab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          mode: "SPECIAL",
          specialGameMode: "GIAI_CUU_KHI",
          totalItems: 4,
          correctItems: won ? 4 : 2,
          coinsDelta: won ? 25 : 5,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    if (onFinish) onFinish(won);
  };

  const restartBattle = () => {
    setYetiHp(100);
    setMonkeyHearts(3);
    setDistance(12);
    setIsWon(false);
    setIsLost(false);
    setCurrentIndex(0);
  };

  if (!currentWord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-emerald-300 dark:border-emerald-900/60 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Arena Header with Battle Banner Image */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-slate-900">
          <Image
            src="/images/special-modes/giai-cuu-khi.jpg"
            alt="Giải cứu khỉ"
            fill
            className="object-cover object-center opacity-85 hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top HP Gauge Bar */}
          <div className="absolute top-3 left-4 right-14 flex items-center justify-between text-white text-xs">
            {/* Monkey Hearts */}
            <div className="flex items-center space-x-1.5 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="font-bold text-[10px] uppercase text-emerald-400">Khỉ:</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < monkeyHearts ? "text-red-500 fill-current" : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Yeti HP Bar */}
            <div className="flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="font-bold text-[10px] uppercase text-red-400">Yeti HP:</span>
              <div className="w-24 bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${yetiHp}%` }}
                />
              </div>
              <span className="text-[10px] font-black">{yetiHp}%</span>
            </div>
          </div>

          {/* Bottom Title & Distance Meter */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">💣</span>
                <h3 className="text-xl font-black drop-shadow-md">Giải Cứu Khỉ vs Yeti</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase">
                  MỚI
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Đúng: Ném bom đẩy lùi Yeti (-25 HP). Sai: Yeti cười và tiến tới!
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-amber-300 font-bold text-xs">
              Khoảng cách: {distance}m
            </span>
          </div>
        </div>

        {/* Action Content */}
        <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-6">
          {!isWon && !isLost ? (
            <>
              {/* Battle Animation Status Feedback */}
              {battleState === "BOMB_THROW" && (
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-center text-xs font-black animate-bounce flex items-center justify-center space-x-2">
                  <Bomb className="w-4 h-4 text-emerald-700 animate-spin" />
                  <span>BÙM! 💥 Khỉ ném bom trúng Yeti! Yeti văng lùi lại -25 HP!</span>
                </div>
              )}

              {battleState === "YETI_LAUGH" && (
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/40 border border-red-300 text-red-800 dark:text-red-200 text-center text-xs font-black flex items-center justify-center space-x-2 animate-shake">
                  <span>❄️ Hahaha! Yeti cười lớn và bước tới gần hơn! Mất 1 Tim!</span>
                </div>
              )}

              {/* Mode Toggle (Trắc nghiệm hoặc Gõ từ) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setInputMode("CHOICE")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      inputMode === "CHOICE"
                        ? "bg-white dark:bg-[#132217] text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Trắc nghiệm
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("TYPING")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      inputMode === "TYPING"
                        ? "bg-white dark:bg-[#132217] text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Gõ từ
                  </button>
                </div>

                <span className="text-xs text-gray-400 font-medium">
                  Lượt {currentIndex + 1}
                </span>
              </div>

              {/* Target Word Prompt */}
              <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {inputMode === "CHOICE" ? "Chọn nghĩa đúng của từ vựng:" : "Gõ từ tiếng Anh tương ứng với nghĩa:"}
                </span>
                <div className="flex items-center justify-center space-x-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    {inputMode === "CHOICE" ? currentWord.term : currentWord.meaning}
                  </h3>
                  <button
                    onClick={() => playAudio(currentWord.term)}
                    className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                {inputMode === "CHOICE" && currentWord.phonetic && (
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    {currentWord.phonetic}
                  </p>
                )}
              </div>

              {/* Choice or Typing inputs */}
              {inputMode === "CHOICE" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={isAnswered}
                      onClick={() => handleAnswer(opt)}
                      className="p-3.5 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-bold text-gray-800 dark:text-gray-200 text-left hover:border-emerald-500 hover:shadow-md transition-all active:scale-98 flex items-center space-x-2.5"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[11px] shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-w-md mx-auto">
                  <input
                    type="text"
                    autoFocus
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && typedAnswer.trim() && handleAnswer(typedAnswer)}
                    placeholder="Gõ từ tiếng Anh để ném bom..."
                    disabled={isAnswered}
                    className="w-full px-5 py-3 text-center text-sm font-bold rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleAnswer(typedAnswer)}
                    disabled={!typedAnswer.trim() || isAnswered}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    <Bomb className="w-4 h-4" />
                    <span>Ném bom ngay!</span>
                  </button>
                </div>
              )}
            </>
          ) : isWon ? (
            /* Victory Screen */
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-4xl shadow-lg animate-bounce">
                🎉
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  Chiến Thắng! Yeti Đã Bị Đánh Bại!
                </h3>
                <p className="text-xs text-gray-500">
                  Chú khỉ thông minh đã giải cứu thành công ngôi làng tuyết!
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>+25 Xu thưởng & 50 XP</span>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : (
            /* Defeat Screen */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center text-3xl">
                ❄️
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                Yeti Quá Hung Hãn!
              </h3>
              <p className="text-xs text-gray-500">
                Hãy luyện tập thêm từ vựng để chuẩn bị ném bom chính xác hơn nhé!
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={restartBattle}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử lại</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-300"
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

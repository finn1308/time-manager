"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Coins,
  Sparkles,
  Trophy,
  Volume2,
  TrendingUp,
  TrendingDown,
  Store,
  UtensilsCrossed,
  Flame,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { StudyWord } from "@/components/vocab/interactive-study-modal";

interface ComTamGameProps {
  words: StudyWord[];
  wordSetId: string;
  initialCoins?: number;
  onClose: () => void;
  onUpdateCoins?: (newCoins: number) => void;
}

interface CustomerPersona {
  name: string;
  avatar: string;
  title: string;
  orderText: string;
}

const CUSTOMERS: CustomerPersona[] = [
  {
    name: "Chú Ba Grab",
    avatar: "🛵",
    title: "Tài xế công nghệ",
    orderText: "Chủ quán ơi, cho dĩa sườn trứng ốp la! Khách Tây vừa hỏi tôi từ này nghĩa là gì?",
  },
  {
    name: "Cô Bảy Chợ Lớn",
    avatar: "🧺",
    title: "Tiểu thương vui tính",
    orderText: "Cho một dĩa bì chả nhiều mỡ hành nha! Đố đầu bếp dịch chuẩn từ này!",
  },
  {
    name: "Bạn Vy Sinh Viên",
    avatar: "🎒",
    title: "Sinh viên năm 2",
    orderText: "Anh chủ ơi, cho em dĩa sườn bì nhiều cơm! Đố anh giải nghĩa từ này giúp em ôn thi!",
  },
  {
    name: "Mr. David Khách Tây",
    avatar: "✈️",
    title: "Du khách nước ngoài",
    orderText: "Hello chef! The broken rice smells amazing! Could you tell me what this word means?",
  },
  {
    name: "Bác Năm Hưu Trí",
    avatar: "📰",
    title: "Bác tổ trưởng dân phố",
    orderText: "Quán hôm nay đông khách ghê! Này chủ quán, từ này trong tiếng Việt nghĩa là gì?",
  },
];

const DISH_NAMES = [
  "Cơm tấm Sườn nướng mật ong",
  "Cơm tấm Chả trứng hấp",
  "Cơm tấm Bì giòn mỡ hành",
  "Cơm tấm Trứng ốp la lòng đào",
];

export function ComTamGame({
  words,
  wordSetId,
  initialCoins = 150,
  onClose,
  onUpdateCoins,
}: ComTamGameProps) {
  const [currentCoins, setCurrentCoins] = useState(initialCoins);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ordersServed, setOrdersServed] = useState(0);
  const [correctOrders, setCorrectOrders] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [streak, setStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isServing, setIsServing] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<"PROFIT" | "LOSS" | null>(null);
  const [isShiftEnded, setIsShiftEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentWord = words[currentIndex] || null;
  const currentCustomer = CUSTOMERS[currentIndex % CUSTOMERS.length];

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
    setSelectedOption(null);
    setIsServing(false);
    setLastOutcome(null);

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

  // Handle dish selection
  const handleServeDish = (chosenMeaning: string) => {
    if (isServing || !currentWord) return;
    setIsServing(true);
    setSelectedOption(chosenMeaning);

    const isCorrect = chosenMeaning === currentWord.meaning;
    setOrdersServed((prev) => prev + 1);

    if (isCorrect) {
      const profitEarned = 15;
      playAudio(currentWord.term);
      setCorrectOrders((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setNetProfit((prev) => prev + profitEarned);
      setCurrentCoins((prev) => prev + profitEarned);
      setLastOutcome("PROFIT");
    } else {
      const lossDeducted = 10;
      setStreak(0);
      setNetProfit((prev) => prev - lossDeducted);
      setCurrentCoins((prev) => Math.max(0, prev - lossDeducted));
      setLastOutcome("LOSS");
    }
  };

  const handleNextCustomer = () => {
    if (currentIndex + 1 < Math.min(10, words.length)) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishShift();
    }
  };

  const finishShift = async () => {
    setIsShiftEnded(true);
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/vocab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          mode: "SPECIAL",
          specialGameMode: "COM_TAM",
          totalItems: ordersServed + 1,
          correctItems: correctOrders,
          coinsDelta: netProfit,
        }),
      });
      const data = await res.json();
      if (data.user?.coins !== undefined && onUpdateCoins) {
        onUpdateCoins(data.user.coins);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-orange-300 dark:border-orange-900/60 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Shop Banner Image */}
        <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-gradient-to-r from-orange-400 to-amber-500">
          <Image
            src="/images/special-modes/com-tam.jpg"
            alt="Quán Cơm Tấm"
            fill
            className="object-cover object-center opacity-90 hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Overlays */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🍛</span>
                <h2 className="text-xl sm:text-2xl font-black drop-shadow-md">
                  Quán Cơm Tấm LUYENTU
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase">
                  MỚI
                </span>
              </div>
              <p className="text-[11px] text-orange-200 drop-shadow-sm">
                Vốn là xu của bạn: Đĩa ngon cộng lời, đĩa sai trừ lỗ!
              </p>
            </div>

            {/* Live Wallet Chip */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-black/50 backdrop-blur-md border border-amber-400/40 text-amber-300 flex items-center space-x-2 shadow-lg">
              <Coins className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-gray-300">Vốn quán</p>
                <p className="text-xs font-black">{currentCoins} Xu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-6">
          {!isShiftEnded && currentWord ? (
            <>
              {/* Customer dialogue booth */}
              <div className="p-4 sm:p-5 rounded-3xl bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-start space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#121c14] border border-orange-200 dark:border-orange-900/50 flex flex-col items-center justify-center text-3xl shadow-sm shrink-0">
                  <span>{currentCustomer.avatar}</span>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {currentCustomer.name}
                    </h4>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full">
                      {currentCustomer.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{currentCustomer.orderText}"
                  </p>

                  {/* Target Word Callout */}
                  <div className="pt-2 flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl bg-orange-500 text-white font-mono font-black text-sm tracking-wide shadow-xs flex items-center space-x-1.5">
                      <span>{currentWord.term}</span>
                    </span>
                    {currentWord.phonetic && (
                      <span className="text-xs font-mono text-gray-500">
                        {currentWord.phonetic}
                      </span>
                    )}
                    <button
                      onClick={() => playAudio(currentWord.term)}
                      className="p-1.5 rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Dish Selection Trays */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                    <span>Chọn đĩa cơm mang ra cho khách:</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    Khách #{currentIndex + 1} / {Math.min(10, words.length)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((option, idx) => {
                    const isCorrect = option === currentWord.meaning;
                    const isChosen = selectedOption === option;

                    let btnStyle = "border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] hover:border-orange-400 hover:shadow-md";

                    if (isServing) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200";
                      } else if (isChosen) {
                        btnStyle = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200";
                      } else {
                        btnStyle = "opacity-40 border-gray-200";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isServing}
                        onClick={() => handleServeDish(option)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span className="text-xl mt-0.5">🍽️</span>
                        <div className="space-y-0.5 flex-1">
                          <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">
                            {DISH_NAMES[idx % DISH_NAMES.length]}
                          </p>
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white">
                            {option}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outcome Feedback Bar */}
              {isServing && lastOutcome && (
                <div
                  className={`p-4 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-150 ${
                    lastOutcome === "PROFIT"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300"
                      : "bg-red-100 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-300"
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs font-extrabold">
                    {lastOutcome === "PROFIT" ? (
                      <>
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <span>Xèo xèo! Khách tấm tắc khen ngon! (+15 Xu lãi)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span>Sai công thức gia vị! Khách trả lại dĩa (-10 Xu lỗ)</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleNextCustomer}
                    className="px-5 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md"
                  >
                    Khách tiếp theo ➔
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Shift End Summary */
            <div className="py-6 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center text-4xl shadow-inner">
                🍛
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  Tổng Kết Doanh Thu Quán Cơm Tấm!
                </h3>
                <p className="text-xs text-gray-500">
                  Hôm nay bạn đã phục vụ {ordersServed} khách hàng ghé quán.
                </p>
              </div>

              {/* Financial Balance Sheet */}
              <div className="max-w-sm mx-auto p-4 rounded-2xl bg-gray-50 dark:bg-[#121c14] border border-gray-200 dark:border-[#263d2e] space-y-2.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vốn khởi điểm:</span>
                  <span className="font-bold">{initialCoins} Xu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dĩa cơm làm đúng:</span>
                  <span className="font-bold text-emerald-600">{correctOrders} dĩa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dĩa cơm làm sai:</span>
                  <span className="font-bold text-red-500">{ordersServed - correctOrders} dĩa</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-black text-sm">
                  <span>Lợi nhuận ròng:</span>
                  <span className={netProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {netProfit >= 0 ? `+${netProfit}` : netProfit} Xu
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm text-amber-500">
                  <span>Tổng vốn hiện tại:</span>
                  <span>{currentCoins} Xu</span>
                </div>
              </div>

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md"
                >
                  Đóng quán nghỉ ngơi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

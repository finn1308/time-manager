"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Shuffle,
  Lock,
  Utensils,
  Play,
  Target,
  Sparkles,
  AlertCircle,
  Coins,
} from "lucide-react";
import { StudyWord } from "@/components/vocab/interactive-study-modal";
import { MixedPracticeGame } from "./special-games/mixed-practice-game";
import { SentenceCraftGame } from "./special-games/sentence-craft-game";
import { ComTamGame } from "./special-games/com-tam-game";
import { FlappyBirdGame } from "./special-games/flappy-bird-game";
import { MonkeyRescueGame } from "./special-games/monkey-rescue-game";

export type SpecialGameType =
  | "MIXED"
  | "SENTENCE"
  | "COM_TAM"
  | "CHIM_CHAM_CHI"
  | "GIAI_CUU_KHI";

interface SpecialModesModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordSetId: string;
  wordSetTitle: string;
  words: StudyWord[];
  userCoins?: number;
  isUserPro?: boolean;
  onCoinsUpdated?: (coins: number) => void;
  onSessionComplete?: () => void;
}

export function SpecialModesModal({
  isOpen,
  onClose,
  wordSetId,
  wordSetTitle,
  words,
  userCoins = 150,
  isUserPro = true,
  onCoinsUpdated,
  onSessionComplete,
}: SpecialModesModalProps) {
  const [activeGame, setActiveGame] = useState<SpecialGameType | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [coins, setCoins] = useState(userCoins);

  useEffect(() => {
    setCoins(userCoins);
  }, [userCoins]);

  // Handle Game Selection with Requirement Checks matching Image 3
  const handleSelectMode = (type: SpecialGameType) => {
    setWarningMessage(null);

    if (type === "COM_TAM") {
      if (coins < 150) {
        setWarningMessage(
          `Bạn cần có tối thiểu 150 Xu để mở Quán cơm tấm (hiện bạn có ${coins} Xu). Hãy luyện tập các chế độ khác để kiếm thêm Xu nhé!`
        );
        return;
      }
      if (words.length < 10) {
        setWarningMessage(
          `Bộ từ này hiện có ${words.length} từ. Quán cơm tấm yêu cầu bộ từ có tối thiểu 10 từ vựng để mở bán!`
        );
        return;
      }
    }

    if (type === "CHIM_CHAM_CHI") {
      if (words.length < 4) {
        setWarningMessage(
          `Chế độ Chim Chăm Chỉ yêu cầu ít nhất 4 từ vựng trong bộ từ!`
        );
        return;
      }
    }

    setActiveGame(type);
  };

  const handleCoinsChanged = (newCoins: number) => {
    setCoins(newCoins);
    if (onCoinsUpdated) onCoinsUpdated(newCoins);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Active Game Renders */}
      {activeGame === "MIXED" && (
        <MixedPracticeGame
          words={words}
          wordSetId={wordSetId}
          wordSetTitle={wordSetTitle}
          onClose={() => {
            setActiveGame(null);
            if (onSessionComplete) onSessionComplete();
          }}
        />
      )}

      {activeGame === "SENTENCE" && (
        <SentenceCraftGame
          words={words}
          wordSetId={wordSetId}
          isUserPro={isUserPro}
          onClose={() => {
            setActiveGame(null);
            if (onSessionComplete) onSessionComplete();
          }}
        />
      )}

      {activeGame === "COM_TAM" && (
        <ComTamGame
          words={words}
          wordSetId={wordSetId}
          initialCoins={coins}
          onUpdateCoins={handleCoinsChanged}
          onClose={() => {
            setActiveGame(null);
            if (onSessionComplete) onSessionComplete();
          }}
        />
      )}

      {activeGame === "CHIM_CHAM_CHI" && (
        <FlappyBirdGame
          words={words}
          wordSetId={wordSetId}
          onClose={() => {
            setActiveGame(null);
            if (onSessionComplete) onSessionComplete();
          }}
        />
      )}

      {activeGame === "GIAI_CUU_KHI" && (
        <MonkeyRescueGame
          words={words}
          wordSetId={wordSetId}
          onClose={() => {
            setActiveGame(null);
            if (onSessionComplete) onSessionComplete();
          }}
        />
      )}

      {/* Main Special Modes Selection Modal matching Image 3 */}
      {!activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18281d] w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-[#263d2e] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header matching Image 3 */}
            <div className="px-6 py-4.5 border-b border-gray-100 dark:border-[#263d2e] flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Đặc Biệt
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning requirement popover if conditions not met */}
            {warningMessage && (
              <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2 animate-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">{warningMessage}</p>
                </div>
                <button
                  onClick={() => setWarningMessage(null)}
                  className="text-amber-700 hover:text-amber-900 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 5 Gamified Special Mode Cards matching Image 3 */}
            <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
              {/* 1. Luyện tập Hỗn hợp (MẶC ĐỊNH) */}
              <div
                onClick={() => handleSelectMode("MIXED")}
                className="p-3 sm:p-3.5 rounded-3xl border-2 border-pink-400 hover:border-pink-500 bg-white dark:bg-[#132217] flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group active:scale-[0.99]"
              >
                <div className="relative w-36 sm:w-44 h-22 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src="/images/special-modes/mixed-practice.jpg"
                    alt="Luyện tập Hỗn hợp"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <Shuffle className="w-4 h-4 text-pink-500 shrink-0" />
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      Luyện tập Hỗn hợp
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[10px] font-black uppercase tracking-wider">
                      MẶC ĐỊNH
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                    Random trắc nghiệm, nghe viết, gõ từ
                  </p>
                </div>
              </div>

              {/* 2. Luyện Đặt câu (PRO) */}
              <div
                onClick={() => handleSelectMode("SENTENCE")}
                className="p-3 sm:p-3.5 rounded-3xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-[#132217] flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group active:scale-[0.99]"
              >
                <div className="relative w-36 sm:w-44 h-22 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src="/images/special-modes/sentence-craft.jpg"
                    alt="Luyện Đặt câu"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <Lock className="w-4 h-4 text-sky-500 shrink-0" />
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      Luyện Đặt câu
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase tracking-wider">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                    Chỉ dùng cho gói Pro
                  </p>
                </div>
              </div>

              {/* 3. Quán cơm tấm (MỚI) */}
              <div
                onClick={() => handleSelectMode("COM_TAM")}
                className="p-3 sm:p-3.5 rounded-3xl border-2 border-orange-400 hover:border-orange-500 bg-white dark:bg-[#132217] flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group active:scale-[0.99]"
              >
                <div className="relative w-36 sm:w-44 h-22 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src="/images/special-modes/com-tam.jpg"
                    alt="Quán cơm tấm"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-base leading-none">🍛</span>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      Quán cơm tấm
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider">
                      MỚI
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Vốn là xu của bạn: lãi cộng xu, lỗ trừ xu. Mỗi khách hỏi 1 từ, đúng thì dĩa cơm có lời. Cần ≥150 xu, ≥10 từ
                  </p>
                </div>
              </div>

              {/* 4. Chim Chăm Chỉ (ARCADE) */}
              <div
                onClick={() => handleSelectMode("CHIM_CHAM_CHI")}
                className="p-3 sm:p-3.5 rounded-3xl border-2 border-amber-400 hover:border-amber-500 bg-white dark:bg-[#132217] flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group active:scale-[0.99]"
              >
                <div className="relative w-36 sm:w-44 h-22 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src="/images/special-modes/chim-cham-chi.jpg"
                    alt="Chim Chăm Chỉ"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <Play className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      Chim Chăm Chỉ
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      ARCADE
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                    Bay qua cột và trả lời nghĩa đúng (cần ít nhất 4 từ)
                  </p>
                </div>
              </div>

              {/* 5. Giải cứu khỉ (MỚI) */}
              <div
                onClick={() => handleSelectMode("GIAI_CUU_KHI")}
                className="p-3 sm:p-3.5 rounded-3xl border-2 border-emerald-500 hover:border-emerald-600 bg-white dark:bg-[#132217] flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group active:scale-[0.99]"
              >
                <div className="relative w-36 sm:w-44 h-22 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src="/images/special-modes/giai-cuu-khi.jpg"
                    alt="Giải cứu khỉ"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      Giải cứu khỉ
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      MỚI
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                    Đúng: khỉ ném bom đẩy lùi Yeti. Sai: Yeti cười. Trắc nghiệm hoặc gõ từ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

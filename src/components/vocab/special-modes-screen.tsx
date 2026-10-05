"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Utensils,
  Sparkles,
  Shuffle,
  Lock,
  Target,
  Flame,
  Coins,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { VocabIndexNav } from "./vocab-index-nav";
import { StudyWord } from "./interactive-study-modal";
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

export interface SpecialModesScreenProps {
  initialSetId?: string;
  onNavigateStep?: (step: 1 | 2 | 3 | 4 | 5) => void;
  hideNav?: boolean;
}

export function SpecialModesScreen({
  initialSetId,
  onNavigateStep,
  hideNav = false,
}: SpecialModesScreenProps = {}) {
  const [activeGame, setActiveGame] = useState<SpecialGameType | null>(null);
  const [words, setWords] = useState<StudyWord[]>([]);
  const [wordSetTitle, setWordSetTitle] = useState("1. Lời chào hỏi");
  const [wordSetId, setWordSetId] = useState<string>(initialSetId || "");
  const [userCoins, setUserCoins] = useState(250);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const targetSetId = initialSetId || wordSetId;
      if (targetSetId) {
        const [setRes, shopRes] = await Promise.all([
          fetch(`/api/vocab/sets/${targetSetId}`),
          fetch("/api/vocab/shop").catch(() => null),
        ]);

        if (setRes.ok) {
          const setData = await setRes.json();
          if (setData.set) {
            setWordSetTitle(`${setData.set.orderNumber || 1}. ${setData.set.title}`);
          }
          setWords(setData.allWords || []);
        }

        if (shopRes && shopRes.ok) {
          const shopData = await shopRes.json();
          if (typeof shopData.userCoins === "number") {
            setUserCoins(shopData.userCoins);
          }
        }
        return;
      }

      const [res, shopRes] = await Promise.all([
        fetch("/api/vocab/courses/a1-0-3-0"),
        fetch("/api/vocab/shop").catch(() => null),
      ]);

      if (res.ok) {
        const data = await res.json();
        const set1 = data.course?.wordSets?.[0];
        if (set1) {
          setWordSetTitle(`${set1.orderNumber}. ${set1.title}`);
          setWordSetId(set1.id);
          const setRes = await fetch(`/api/vocab/sets/${set1.id}`);
          if (setRes.ok) {
            const setData = await setRes.json();
            setWords(setData.allWords || []);
          }
        }
      }

      if (shopRes && shopRes.ok) {
        const shopData = await shopRes.json();
        if (typeof shopData.userCoins === "number") {
          setUserCoins(shopData.userCoins);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectGame = (type: SpecialGameType) => {
    setWarningMessage(null);

    if (type === "COM_TAM") {
      if (userCoins < 150) {
        setWarningMessage(
          `Bạn cần tối thiểu 150 Xu để mở Quán cơm tấm (hiện có ${userCoins} Xu). Hãy làm bài tập để tích lũy thêm Xu nhé!`
        );
        return;
      }
    }

    if (type === "CHIM_CHAM_CHI") {
      if (words.length < 4) {
        setWarningMessage("Cần tối thiểu 4 từ vựng để chơi Chim chăm chỉ!");
        return;
      }
    }

    setActiveGame(type);
  };

  const games = [
    {
      type: "MIXED" as SpecialGameType,
      title: "Luyện tập hỗn hợp",
      desc: "Xáo trộn ngẫu nhiên tất cả câu hỏi Trắc nghiệm, Nghe chép chính tả và Gõ từ phản xạ.",
      badge: "+20 Xu Chrono",
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      icon: Shuffle,
      bg: "from-purple-500 to-indigo-600",
    },
    {
      type: "SENTENCE" as SpecialGameType,
      title: "Luyện đặt câu PRO",
      desc: "Thử thách ghép từ thành câu hoàn chỉnh và đặt câu theo ngữ cảnh thực tế chuẩn CEFR.",
      badge: "PRO ONLY",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      icon: Target,
      bg: "from-emerald-500 to-teal-600",
    },
    {
      type: "COM_TAM" as SpecialGameType,
      title: "Quán cơm tấm (Mini-game)",
      desc: "Phục vụ thực khách bằng cách ghép đúng nghĩa từ vựng, kiếm doanh thu Xu phát triển quán.",
      badge: "Cần ≥150 Xu",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      icon: Utensils,
      bg: "from-amber-500 to-orange-600",
    },
    {
      type: "CHIM_CHAM_CHI" as SpecialGameType,
      title: "Chim chăm chỉ (Arcade)",
      desc: "Bay qua các chướng ngại vật bằng cách chọn đúng nghĩa từ vựng tiếng Anh trong thời gian thực.",
      badge: "HOT ARCADE",
      badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
      icon: Gamepad2,
      bg: "from-sky-500 to-blue-600",
    },
    {
      type: "GIAI_CUU_KHI" as SpecialGameType,
      title: "Giải cứu khỉ leo cây",
      desc: "Giúp chú khỉ leo lên đỉnh ngọn cây bằng cách vượt qua các câu hỏi thử thách từ vựng.",
      badge: "VUI NHỘN",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
      icon: Sparkles,
      bg: "from-rose-500 to-pink-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Web Index Switcher */}
      {!hideNav && <VocabIndexNav currentStep={5} onStepChange={onNavigateStep} />}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400">LUYENTU Mini-Games</span>
            <span className="text-gray-300">•</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold px-2 py-0.2 rounded-full uppercase">
              Web 5 • Special Arcade
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Chế độ học đặc biệt & Mini-Games</span>
            <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Các chế độ game hóa độc quyền giúp ghi nhớ từ vựng tiếng Anh vui vẻ và phản xạ tự nhiên.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-extrabold text-amber-800 dark:text-amber-300 shadow-2xs">
            <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Ví Xu: {userCoins} Xu</span>
          </div>
          <Link
            href="/vocab/index/4"
            onClick={(e) => {
              if (onNavigateStep) {
                e.preventDefault();
                onNavigateStep(4);
              }
            }}
            className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-1 shadow-2xs cursor-pointer min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Web 4</span>
          </Link>
        </div>
      </div>

      {warningMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {warningMessage}</span>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-amber-900 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Render Active Game or Game List Grid */}
      {activeGame ? (
        <div className="rounded-3xl bg-white dark:bg-[#15251a] border border-gray-200 dark:border-[#263d2e] p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setActiveGame(null)}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại menu game</span>
            </button>
            <span className="text-xs font-extrabold text-gray-500">
              Đang chơi: {games.find((g) => g.type === activeGame)?.title}
            </span>
          </div>

          {activeGame === "MIXED" && (
            <MixedPracticeGame
              words={words}
              wordSetId={wordSetId}
              wordSetTitle={wordSetTitle}
              onClose={() => {
                setActiveGame(null);
                loadData();
              }}
            />
          )}

          {activeGame === "SENTENCE" && (
            <SentenceCraftGame
              words={words}
              wordSetId={wordSetId}
              isUserPro={true}
              onClose={() => {
                setActiveGame(null);
                loadData();
              }}
            />
          )}

          {activeGame === "COM_TAM" && (
            <ComTamGame
              words={words}
              wordSetId={wordSetId}
              initialCoins={userCoins}
              onUpdateCoins={(newCoins: number) => setUserCoins(newCoins)}
              onClose={() => {
                setActiveGame(null);
                loadData();
              }}
            />
          )}

          {activeGame === "CHIM_CHAM_CHI" && (
            <FlappyBirdGame
              words={words}
              wordSetId={wordSetId}
              onClose={() => {
                setActiveGame(null);
                loadData();
              }}
            />
          )}

          {activeGame === "GIAI_CUU_KHI" && (
            <MonkeyRescueGame
              words={words}
              wordSetId={wordSetId}
              onClose={() => {
                setActiveGame(null);
                loadData();
              }}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.type}
                className="p-5 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-xs hover:shadow-md hover:border-rose-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${g.bg} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${g.badgeColor}`}>
                      {g.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {g.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleSelectGame(g.type)}
                    className="w-full py-2 rounded-xl bg-gray-50 hover:bg-rose-500 hover:text-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-rose-500 dark:hover:text-white text-xs font-black transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-98"
                  >
                    <span>Vào chơi ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

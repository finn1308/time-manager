"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MixedPracticeGame } from "@/components/vocab/special-games/mixed-practice-game";
import { SentenceCraftGame } from "@/components/vocab/special-games/sentence-craft-game";
import { ComTamGame } from "@/components/vocab/special-games/com-tam-game";
import { FlappyBirdGame } from "@/components/vocab/special-games/flappy-bird-game";
import { MonkeyRescueGame } from "@/components/vocab/special-games/monkey-rescue-game";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GameSpacePage({
  params,
}: {
  params: { gameId: string };
}) {
  const { gameId } = params;
  const searchParams = useSearchParams();
  const wordSetId = searchParams.get("setId") || "";
  const wordSetTitle = searchParams.get("title") || "Khởi động";
  
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadWords() {
      if (!wordSetId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/vocab/sets/${wordSetId}`);
        if (res.ok) {
          const data = await res.json();
          setWords(data.allWords || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadWords();
  }, [wordSetId]);

  const renderGame = () => {
    switch (gameId) {
      case "MIXED":
        return <MixedPracticeGame words={words} wordSetId={wordSetId} wordSetTitle={wordSetTitle} onClose={() => router.push("/index/5")} />;
      case "SENTENCE":
        return <SentenceCraftGame words={words} wordSetId={wordSetId} isUserPro={true} onClose={() => router.push("/index/5")} />;
      case "COM_TAM":
        return (
          <ComTamGame
            words={words}
            wordSetId={wordSetId}
            initialCoins={150}
            onUpdateCoins={() => {}}
            onClose={() => router.push("/index/5")}
          />
        );
      case "CHIM_CHAM_CHI":
        return <FlappyBirdGame words={words} wordSetId={wordSetId} onClose={() => router.push("/index/5")} />;
      case "GIAI_CUU_KHI":
        return <MonkeyRescueGame words={words} wordSetId={wordSetId} onClose={() => router.push("/index/5")} />;
      default:
        return <div>Không tìm thấy trò chơi.</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/index/5"
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Menu</span>
        </Link>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          LUYENTU • KHÔNG GIAN RIÊNG
        </span>
      </div>
      
      <div className="bg-white dark:bg-[#15251a] border border-gray-200 dark:border-[#263d2e] rounded-3xl p-4 sm:p-6 shadow-sm min-h-[70vh]">
        {loading ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Đang tải dữ liệu trò chơi...</h2>
            <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-red-500">Lỗi tải dữ liệu</h2>
            <p className="text-sm text-gray-500 mt-2">Không tìm thấy từ vựng nào để chơi.</p>
          </div>
        ) : (
          renderGame()
        )}
      </div>
    </div>
  );
}

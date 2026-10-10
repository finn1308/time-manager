"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Gamepad2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeItem } from "@/components/practice/types";
import { ComTamGame } from "@/components/practice/games/com-tam-game";
import { FlappyBirdGame } from "@/components/practice/games/flappy-bird-game";
import { MonkeyRescueGame } from "@/components/practice/games/monkey-rescue-game";
import { SentenceCraftGame } from "@/components/practice/games/sentence-craft-game";

export default function PracticeGamePlayerPage(props: {
  params: Promise<{ gameId: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const gameId = params.gameId;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [coins, setCoins] = useState(100);

  useEffect(() => {
    async function loadPracticeItems() {
      try {
        setLoading(true);
        // Load items from review queue
        const res = await fetch("/api/review/today");
        const json = await res.json();

        let loadedItems: PracticeItem[] = [];

        if (json.success && json.items) {
          const rawItems = [
            ...(json.items.vocabulary || []),
            ...(json.items.flashcards || []),
            ...(json.items.mistakes || []),
          ];

          loadedItems = rawItems.map((item: any) => ({
            id: item.id || String(Math.random()),
            term: item.front || item.title || "Khái niệm",
            meaning: item.back || item.meaning || "Nội dung ôn tập",
            phonetic: item.subtitle || null,
            partOfSpeech: item.partOfSpeech || null,
            exampleSentence: item.example || null,
            exampleMeaning: null,
            subjectName: item.subjectName || null,
            source: item.reviewType || "PRACTICE",
          }));
        }

        // If user has no active items due today, fetch from mistakes or flashcards
        if (loadedItems.length < 4) {
          const resMistakes = await fetch("/api/mistakes?limit=20");
          const mistakesJson = await resMistakes.json();
          if (mistakesJson.success && mistakesJson.mistakes) {
            const moreItems: PracticeItem[] = mistakesJson.mistakes.map((m: any) => ({
              id: m.id,
              term: m.question,
              meaning: m.correctAnswer,
              phonetic: m.concept || null,
              partOfSpeech: m.errorType || null,
              exampleSentence: m.explanation || null,
              subjectName: m.subject?.name || null,
              source: "MISTAKE",
            }));
            loadedItems = [...loadedItems, ...moreItems];
          }
        }

        // Fallback defaults if database is completely empty
        if (loadedItems.length === 0) {
          loadedItems = [
            {
              id: "item-1",
              term: "Persevere",
              meaning: "Kiên trì, bền chí dù gặp khó khăn",
              phonetic: "/ˌpɜː.sɪˈvɪər/",
              partOfSpeech: "verb",
              exampleSentence: "She persevered in her studies and graduated with honors.",
            },
            {
              id: "item-2",
              term: "Diligent",
              meaning: "Chăm chỉ, cần cù và cẩn thận",
              phonetic: "/ˈdɪl.ɪ.dʒənt/",
              partOfSpeech: "adjective",
              exampleSentence: "A diligent student always finishes assignments on time.",
            },
            {
              id: "item-3",
              term: "Resilient",
              meaning: "Có khả năng phục hồi nhanh chóng sau thất bại",
              phonetic: "/rɪˈzɪl.jənt/",
              partOfSpeech: "adjective",
              exampleSentence: "Human memory becomes resilient through spaced repetition.",
            },
            {
              id: "item-4",
              term: "Comprehend",
              meaning: "Hiểu thấu đáo, lĩnh hội đầy đủ",
              phonetic: "/ˌkɒm.prɪˈhend/",
              partOfSpeech: "verb",
              exampleSentence: "Active recall helps you comprehend complex subjects faster.",
            },
          ];
        }

        setItems(loadedItems);
      } catch (err) {
        console.error("Error loading items for game:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPracticeItems();
  }, []);

  const handleFinish = (wonOrScore?: any) => {
    // Record study session
    fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actualDurationSeconds: 120,
        source: "PRACTICE_SESSION",
        notes: `Mini-game luyện tập: ${gameId}`,
        productivityScore: 95,
      }),
    }).catch(() => {});

    router.push("/practice/games");
  };

  const handleClose = () => {
    router.push("/practice/games");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-[var(--text-subtle)]">
          Đang tải dữ liệu trò chơi luyện tập...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {gameId === "com-tam" && (
        <ComTamGame
          words={items}
          wordSetId="practice-game"
          initialCoins={coins}
          onClose={handleClose}
          onUpdateCoins={(c) => setCoins(c)}
        />
      )}

      {gameId === "monkey-rescue" && (
        <MonkeyRescueGame
          words={items}
          wordSetId="practice-game"
          onClose={handleClose}
          onFinish={handleFinish}
        />
      )}

      {gameId === "flappy-bird" && (
        <FlappyBirdGame
          words={items}
          wordSetId="practice-game"
          onClose={handleClose}
          onFinish={handleFinish}
        />
      )}

      {gameId === "sentence-craft" && (
        <SentenceCraftGame
          words={items}
          wordSetId="practice-game"
          isUserPro={true}
          onClose={handleClose}
          onFinish={handleFinish}
        />
      )}

      {!["com-tam", "monkey-rescue", "flappy-bird", "sentence-craft"].includes(gameId) && (
        <div className="p-12 text-center rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
          <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto" />
          <h2 className="text-xl font-bold text-[var(--text-ink)]">
            Không tìm thấy trò chơi
          </h2>
          <Link href="/practice/games">
            <Button className="bg-[var(--mint)] text-white rounded-xl">Quay lại danh sách</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { previewNextIntervals } from "@/lib/anki/sm2";
import {
  Brain,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Eye,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Clock,
  Layers,
  Flame,
  Award,
} from "lucide-react";

export default function FlashcardDeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params?.id as string;

  const [deck, setDeck] = useState<any | null>(null);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Review State
  const [activeTab, setActiveTab] = useState<"REVIEW" | "MANAGE">("REVIEW");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedSessionCount, setReviewedSessionCount] = useState(0);
  const [isReviewFinished, setIsReviewFinished] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Add Card State
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newHint, setNewHint] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);

  const loadDeck = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/flashcards/decks/${deckId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải bộ thẻ");

      setDeck(data.deck);
      setAllCards(data.deck.flashcards || []);
      setDueCards(data.dueCards || []);
      if (!data.dueCards || data.dueCards.length === 0) {
        setIsReviewFinished(true);
      } else {
        setIsReviewFinished(false);
        setCurrentIdx(0);
        setIsFlipped(false);
        setShowHint(false);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lỗi tải bộ thẻ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deckId) loadDeck();
  }, [deckId]);

  const currentCard = dueCards[currentIdx];

  const handleRateCard = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!currentCard || isSubmittingRating) return;

      setIsSubmittingRating(true);
      try {
        const res = await fetch(`/api/flashcards/cards/${currentCard.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });

        if (!res.ok) throw new Error("Lỗi lưu kết quả");

        setReviewedSessionCount((prev) => prev + 1);

        // Next card or finish
        if (currentIdx + 1 < dueCards.length) {
          setCurrentIdx((prev) => prev + 1);
          setIsFlipped(false);
          setShowHint(false);
        } else {
          setIsReviewFinished(true);
        }
      } catch (err: any) {
        alert(err.message || "Lỗi khi ghi nhận đánh giá");
      } finally {
        setIsSubmittingRating(false);
      }
    },
    [currentCard, currentIdx, dueCards.length, isSubmittingRating]
  );

  // Keyboard navigation: Space = Flip; 1, 2, 3, 4 = Rating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "REVIEW" || isReviewFinished || !currentCard) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleRateCard(1);
        else if (e.key === "2") handleRateCard(2);
        else if (e.key === "3") handleRateCard(3);
        else if (e.key === "4") handleRateCard(4);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, isReviewFinished, currentCard, isFlipped, handleRateCard]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || isAddingCard) return;

    setIsAddingCard(true);
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: newFront.trim(),
          back: newBack.trim(),
          hint: newHint.trim() || null,
          topic: newTopic.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Không thể thêm thẻ");
      setNewFront("");
      setNewBack("");
      setNewHint("");
      setNewTopic("");
      await loadDeck();
      alert("Đã thêm thẻ mới vào bộ thành công!");
    } catch (e: any) {
      alert(e.message || "Lỗi khi thêm thẻ");
    } finally {
      setIsAddingCard(false);
    }
  };

  const intervals = currentCard
    ? previewNextIntervals(
        currentCard.intervalDays || 1,
        currentCard.repetitionCount || 0,
        currentCard.easeFactor || 2.5
      )
    : { again: "1 ngày", hard: "2 ngày", good: "5 ngày", easy: "10 ngày" };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#526b5c] animate-pulse">
        Đang tải bộ thẻ...
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="py-24 text-center text-xs text-rose-600">
        Không tìm thấy bộ thẻ.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dbe7dd] dark:border-[#263d2e]">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/flashcards")}
            className="rounded-xl text-[#526b5c] hover:bg-[#eef5f0] dark:hover:bg-[#1d3024] p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
                {deck.title}
              </h1>
              {deck.subject && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: deck.subject.color || "#2d6a4f" }}
                >
                  {deck.subject.name}
                </span>
              )}
            </div>
            {deck.description && (
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                {deck.description}
              </p>
            )}
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-1 p-1 bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl text-xs font-bold shadow-2xs">
          <button
            onClick={() => setActiveTab("REVIEW")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "REVIEW"
                ? "bg-[#2d6a4f] text-white shadow-xs"
                : "text-[#526b5c] hover:text-[#192e22]"
            }`}
          >
            <span>Ôn tập ({dueCards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("MANAGE")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "MANAGE"
                ? "bg-[#2d6a4f] text-white shadow-xs"
                : "text-[#526b5c] hover:text-[#192e22]"
            }`}
          >
            <span>Quản lý thẻ ({allCards.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "REVIEW" ? (
        isReviewFinished ? (
          /* Completion Screen */
          <Card className="rounded-[32px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#d8ebe0] dark:bg-[#1e3827] text-[#2d6a4f] dark:text-[#52b788] mx-auto flex items-center justify-center text-3xl shadow-xs">
              🎉
            </div>
            <h2 className="text-xl font-black text-[#192e22] dark:text-[#f0f7f2]">
              Xuất sắc! Đã hoàn thành ôn tập
            </h2>
            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto leading-relaxed">
              Bạn đã ôn tập xong tất cả các thẻ đến hạn trong bộ này theo thuật toán Spaced Repetition (SM-2). Hãy quay lại vào ngày mai khi có thẻ mới đến hạn!
            </p>

            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#eef5f0] dark:bg-[#132217] text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
              <Award className="w-4 h-4" />
              <span>+{reviewedSessionCount * 10} XP tích lũy vào tài khoản</span>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDueCards(allCards);
                  setIsReviewFinished(false);
                  setCurrentIdx(0);
                  setIsFlipped(false);
                }}
                className="rounded-2xl border-[#dbe7dd] text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                <span>Ôn lại toàn bộ ({allCards.length} thẻ)</span>
              </Button>
              <Button
                onClick={() => router.push("/flashcards")}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold"
              >
                <span>Về trang Flashcard</span>
              </Button>
            </div>
          </Card>
        ) : (
          /* Active Card Review Player */
          <div className="space-y-4">
            {/* Progress Bar & Header */}
            <div className="flex items-center justify-between text-xs text-[#526b5c] dark:text-[#a3bda9] px-1 font-semibold">
              <div className="flex items-center space-x-2">
                <span>
                  Thẻ <strong>{currentIdx + 1}</strong> / {dueCards.length}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] text-[10px] font-bold">
                  {currentCard.status}
                </span>
              </div>
              <div className="text-[11px] text-[#73927d]">
                Phím tắt: [Space] lật thẻ • [1, 2, 3, 4] đánh giá
              </div>
            </div>

            <div className="w-full bg-[#eef5f0] dark:bg-[#1d3024] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#2d6a4f] dark:bg-[#52b788] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / dueCards.length) * 100}%` }}
              />
            </div>

            {/* 3D Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[280px] sm:min-h-[320px] rounded-[30px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-8 shadow-sm flex flex-col justify-between cursor-pointer select-none transition-all hover:border-[#2d6a4f]/50 relative"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#dbe7dd]/60 dark:border-[#263d2e]">
                <span className="font-bold text-[#2d6a4f] dark:text-[#52b788] uppercase tracking-wider text-[11px]">
                  {isFlipped ? "Mặt sau (Câu trả lời)" : "Mặt trước (Câu hỏi / Khái niệm)"}
                </span>
                {currentCard.topic && (
                  <span className="text-[11px] text-[#73927d] bg-[#f4f8f5] dark:bg-[#142318] px-2.5 py-0.5 rounded-full">
                    {currentCard.topic}
                  </span>
                )}
              </div>

              {/* Card Center Content */}
              <div className="py-6 flex flex-col items-center justify-center text-center">
                {!isFlipped ? (
                  <div className="space-y-3">
                    <p className="text-lg sm:text-xl font-black text-[#192e22] dark:text-[#f0f7f2] leading-relaxed max-w-lg">
                      {currentCard.front}
                    </p>

                    {currentCard.hint && (
                      <div className="pt-2">
                        {showHint ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs italic max-w-sm mx-auto">
                            💡 Gợi ý: {currentCard.hint}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowHint(true);
                            }}
                            className="inline-flex items-center space-x-1 text-xs text-[#73927d] hover:text-[#2d6a4f] transition-colors"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Hiện gợi ý</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-left w-full max-w-xl mx-auto">
                    <div className="p-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#263d2e]">
                      <p className="text-base sm:text-lg font-bold text-[#192e22] dark:text-[#f0f7f2] leading-relaxed whitespace-pre-wrap">
                        {currentCard.back}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer prompt */}
              <div className="text-center text-[11px] text-[#73927d] pt-3 border-t border-[#dbe7dd]/60 dark:border-[#263d2e]">
                {!isFlipped
                  ? "Nhấn vào thẻ hoặc phím Space để xem câu trả lời"
                  : "Chọn mức độ ghi nhớ bên dưới để lên lịch chu kỳ tiếp theo"}
              </div>
            </div>

            {/* SM-2 Rating 4-Button Bar */}
            {isFlipped && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 animate-in fade-in duration-200">
                <Button
                  onClick={() => handleRateCard(1)}
                  disabled={isSubmittingRating}
                  className="rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60 h-14 flex flex-col justify-center items-center cursor-pointer shadow-2xs"
                >
                  <div className="font-extrabold text-xs flex items-center space-x-1">
                    <span>1. Lặp lại (Again)</span>
                  </div>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                    +{intervals.again}
                  </span>
                </Button>

                <Button
                  onClick={() => handleRateCard(2)}
                  disabled={isSubmittingRating}
                  className="rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 h-14 flex flex-col justify-center items-center cursor-pointer shadow-2xs"
                >
                  <div className="font-extrabold text-xs flex items-center space-x-1">
                    <span>2. Khó (Hard)</span>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                    +{intervals.hard}
                  </span>
                </Button>

                <Button
                  onClick={() => handleRateCard(3)}
                  disabled={isSubmittingRating}
                  className="rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/60 h-14 flex flex-col justify-center items-center cursor-pointer shadow-2xs"
                >
                  <div className="font-extrabold text-xs flex items-center space-x-1">
                    <span>3. Tốt (Good)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{intervals.good}
                  </span>
                </Button>

                <Button
                  onClick={() => handleRateCard(4)}
                  disabled={isSubmittingRating}
                  className="rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 h-14 flex flex-col justify-center items-center cursor-pointer shadow-2xs"
                >
                  <div className="font-extrabold text-xs flex items-center space-x-1">
                    <span>4. Dễ (Easy)</span>
                  </div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                    +{intervals.easy}
                  </span>
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        /* Manage Cards Tab */
        <div className="space-y-6">
          {/* Add New Card Form */}
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-5 shadow-2xs">
            <form onSubmit={handleCreateCard} className="space-y-3">
              <h3 className="text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] flex items-center space-x-1.5">
                <Plus className="w-4 h-4" />
                <span>THÊM THẺ MỚI VÀO BỘ NÀY</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Mặt trước (Câu hỏi / Thuật ngữ) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="VD: Định lý Pytago phát biểu thế nào?"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Mặt sau (Câu trả lời / Lời giải) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="VD: a^2 + b^2 = c^2 trong tam giác vuông..."
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Gợi ý (Tùy chọn)
                  </label>
                  <Input
                    placeholder="Gợi ý nếu quên..."
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    className="rounded-xl border-[#dbe7dd] text-xs h-8"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    Chủ đề con (Topic)
                  </label>
                  <Input
                    placeholder="VD: Hình học phẳng..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="rounded-xl border-[#dbe7dd] text-xs h-8"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={isAddingCard}
                  className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold h-8 px-4"
                >
                  {isAddingCard ? "Đang lưu..." : "Thêm thẻ"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Table of cards */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Tất cả thẻ trong bộ ({allCards.length})
            </h3>

            {allCards.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#526b5c]">
                Bộ thẻ này chưa có thẻ nào.
              </div>
            ) : (
              allCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 text-xs flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#73927d]">#{idx + 1}</span>
                      <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] truncate">
                        {card.front}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#eef5f0] text-[#1b4332]">
                        {card.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] line-clamp-2">
                      {card.back}
                    </p>
                  </div>

                  <div className="text-right text-[10px] text-[#73927d] shrink-0">
                    <div>Lặp: {card.intervalDays} ngày</div>
                    <div>Độ nhớ: cấp {card.masteryLevel}/5</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

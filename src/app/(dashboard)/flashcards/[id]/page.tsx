"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudyModeSession } from "@/components/flashcards/study-mode-session";
import {
  extractCardData,
  generateStudySessionQuestions,
  CardData,
  StudyQuestion,
} from "@/lib/flashcard-study/engine";
import { speakWord } from "@/lib/tts";
import {
import { toast } from "sonner";
  ArrowLeft,
  Sparkles,
  Volume2,
  Settings,
  BookOpen,
  CheckSquare,
  Headphones,
  Keyboard,
  LayoutGrid,
  Shuffle,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  RotateCcw,
  Flame,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function FlashcardDeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params?.id as string;

  const [deck, setDeck] = useState<any | null>(null);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Customization settings (Matching Image 1)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEW" | "LEARNING" | "MASTERED">("ALL");
  const [countLimit, setCountLimit] = useState<number>(0); // 0 = all
  const [sortOrder, setSortOrder] = useState<"RANDOM" | "DEFAULT">("DEFAULT");

  // Search & filter in card list
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("ALL");

  // Active Study Session state
  const [activeSessionMode, setActiveSessionMode] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<StudyQuestion[]>([]);

  // Add Card Modal
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newPartOfSpeech, setNewPartOfSpeech] = useState("noun");
  const [newMeaning, setNewMeaning] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newExampleMeaning, setNewExampleMeaning] = useState("");
  const [newHint, setNewHint] = useState("");
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const loadDeck = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/flashcards/decks/${deckId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải bộ thẻ");

      setDeck(data.deck);
      setAllCards(data.deck.flashcards || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Lỗi tải bộ thẻ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deckId) loadDeck();
  }, [deckId]);

  // Convert raw cards to structured CardData
  const parsedCards: CardData[] = useMemo(() => {
    return allCards.map(extractCardData);
  }, [allCards]);

  // Filtered cards based on statusFilter
  const customizedCards = useMemo(() => {
    let result = [...parsedCards];
    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [parsedCards, statusFilter]);

  // Launch Study Session in chosen mode
  const handleStartStudy = (mode: "ALL" | "FLASHCARD" | "QUIZ" | "LISTENING" | "TYPING" | "MATCHING") => {
    if (parsedCards.length === 0) {
      toast("Bộ thẻ chưa có từ vựng nào. Hãy thêm từ vựng để bắt đầu học!");
      return;
    }

    const questions = generateStudySessionQuestions(customizedCards, {
      mode,
      count: countLimit > 0 ? countLimit : undefined,
      order: sortOrder,
    });

    if (questions.length === 0) {
      toast("Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.");
      return;
    }

    setSessionQuestions(questions);
    setActiveSessionMode(mode);
  };

  // Handle Add New Card
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim() || isSubmittingCard) return;

    setIsSubmittingCard(true);
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: newWord.trim(),
          back: newMeaning.trim(),
          phonetic: newPhonetic.trim() || null,
          partOfSpeech: newPartOfSpeech.trim() || null,
          exampleSentence: newExample.trim() || null,
          exampleMeaning: newExampleMeaning.trim() || null,
          hint: newHint.trim() || null,
          topic: deck?.title || "Vocabulary",
        }),
      });

      if (!res.ok) throw new Error("Không thể thêm thẻ");
      setNewWord("");
      setNewPhonetic("");
      setNewMeaning("");
      setNewExample("");
      setNewExampleMeaning("");
      setNewHint("");
      setIsAddCardOpen(false);
      await loadDeck();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi thêm thẻ");
    } finally {
      setIsSubmittingCard(false);
    }
  };

  // Handle Delete Card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;
    try {
      const res = await fetch(`/api/flashcards/cards/${cardId}`, { method: "DELETE" });
      if (res.ok) {
        await loadDeck();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered cards for the table list
  const displayTableCards = useMemo(() => {
    return parsedCards.filter((card) => {
      const matchSearch =
        searchQuery === "" ||
        card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.meaning.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFilter =
        tableFilter === "ALL" ||
        (tableFilter === "MASTERED" && card.masteryLevel >= 4) ||
        (tableFilter === "LEARNING" && card.masteryLevel > 0 && card.masteryLevel < 4) ||
        (tableFilter === "NEW" && card.masteryLevel === 0);

      return matchSearch && matchFilter;
    });
  }, [parsedCards, searchQuery, tableFilter]);

  // Overall statistics
  const totalCount = parsedCards.length;
  const learnedCount = parsedCards.filter((c) => c.masteryLevel > 0).length;
  const learnedPercentage = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#526b5c] animate-pulse">
        Đang tải thông tin bộ thẻ...
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

  // If study session is currently running, render StudyModeSession player
  if (activeSessionMode) {
    return (
      <StudyModeSession
        deckTitle={deck.title}
        deckId={deck.id}
        questions={sessionQuestions}
        allCards={parsedCards}
        onExit={() => {
          setActiveSessionMode(null);
          loadDeck();
        }}
        onFinish={() => {
          setActiveSessionMode(null);
          loadDeck();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 px-3 sm:px-0">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PROGRESS BAR (Matching Reference Image 1) */}
      {/* ========================================================================= */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/flashcards")}
              className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#526b5c] hover:bg-[#eef5f0] w-10 h-10 p-0 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2] tracking-tight">
                {deck.title}
              </h1>
              {deck.description && (
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-0.5 line-clamp-1">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges: Total vocab & Learned progress */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
              {totalCount} từ vựng
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
              {learnedCount}/{totalCount} đã học ({learnedPercentage}%)
            </span>
          </div>
        </div>

        {/* Green progress bar */}
        <div className="w-full bg-[#eef5f0] dark:bg-[#1d3024] rounded-full h-2 overflow-hidden shadow-inner">
          <div
            className="bg-[#2d6a4f] dark:bg-[#52b788] h-2 rounded-full transition-all duration-500"
            style={{ width: `${learnedPercentage}%` }}
          />
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. SECTION TÙY CHỈNH (SETTINGS / FILTERS - Matching Reference Image 1) */}
      {/* ========================================================================= */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
            <Settings className="w-4 h-4 text-[#526b5c]" />
            <span>Tùy chỉnh</span>
          </div>

          <span className="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
            {customizedCards.length}/{totalCount} từ
          </span>
        </div>

        {/* 3 Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* TRẠNG THÁI */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#73927d] tracking-wider">
              TRẠNG THÁI
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-11 px-3.5 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#263d2e] text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] focus:outline-hidden focus:border-[#2d6a4f] cursor-pointer"
            >
              <option value="ALL">Toàn bộ</option>
              <option value="NEW">Chưa học (Mới)</option>
              <option value="LEARNING">Đang học</option>
              <option value="MASTERED">Đã thuộc</option>
            </select>
          </div>

          {/* SỐ LƯỢNG */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#73927d] tracking-wider">
              SỐ LƯỢNG
            </label>
            <select
              value={countLimit}
              onChange={(e) => setCountLimit(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#263d2e] text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] focus:outline-hidden focus:border-[#2d6a4f] cursor-pointer"
            >
              <option value={0}>Tất cả ({customizedCards.length} từ)</option>
              <option value={10}>10 từ</option>
              <option value={20}>20 từ</option>
              <option value={30}>30 từ</option>
            </select>
          </div>

          {/* THỨ TỰ */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#73927d] tracking-wider">
              THỨ TỰ
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full h-11 px-3.5 rounded-2xl bg-[#f8faf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#263d2e] text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] focus:outline-hidden focus:border-[#2d6a4f] cursor-pointer"
            >
              <option value="DEFAULT">Mặc định (Theo thứ tự)</option>
              <option value="RANDOM">Ngẫu nhiên (Xáo trộn)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3. SECTION CHỌN CHẾ ĐỘ HỌC (6 STUDY MODES - Matching Reference Image 1) */}
      {/* ========================================================================= */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#192e22] dark:text-[#f0f7f2]">
            Chọn chế độ học
          </h2>
          <span className="text-xs text-[#73927d]">6 phương pháp luyện tập</span>
        </div>

        {/* 6 Colorful Gradient Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Flashcard (Tím) */}
          <button
            onClick={() => handleStartStudy("FLASHCARD")}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white flex flex-col justify-between items-start text-left space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">Flashcard</div>
              <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">Lật thẻ để nhớ...</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black">
                +5 🪙
              </span>
            </div>
          </button>

          {/* 2. Quiz (Cam) */}
          <button
            onClick={() => handleStartStudy("QUIZ")}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white flex flex-col justify-between items-start text-left space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">Quiz</div>
              <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">Trắc nghiệm 4 đáp án...</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black">
                +10 🪙
              </span>
            </div>
          </button>

          {/* 3. Listening (Xanh ngọc) */}
          <button
            onClick={() => handleStartStudy("LISTENING")}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white flex flex-col justify-between items-start text-left space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">Listening</div>
              <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">Nghe từ và gõ lại...</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black">
                +15 🪙
              </span>
            </div>
          </button>

          {/* 4. Typing (Xanh lá) */}
          <button
            onClick={() => handleStartStudy("TYPING")}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#10b981] to-[#059669] text-white flex flex-col justify-between items-start text-left space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">Typing</div>
              <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">Xem nghĩa, gõ từ...</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black">
                +10 🪙
              </span>
            </div>
          </button>

          {/* 5. Ghép cặp (Xanh dương) */}
          <button
            onClick={() => handleStartStudy("MATCHING")}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white flex flex-col justify-between items-start text-left space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">Ghép cặp</div>
              <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">Nối từ với nghĩa...</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black">
                +10 🪙
              </span>
            </div>
          </button>

          {/* 6. Đặc biệt / Tổng hợp (Hồng tím HOT 🔥) */}
          <button
            onClick={() => handleStartStudy("ALL")}
            className="p-4 rounded-3xl bg-gradient-to-br from-[#ec4899] to-[#d946ef] text-white flex flex-col justify-between items-start text-left space-y-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md group min-h-[140px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Shuffle className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black shadow-xs">
                HOT 🔥
              </span>
            </div>

            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight">Đặc biệt</div>
              <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5">Hỗn hợp tất cả...</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black">
                +20 🪙
              </span>
            </div>
          </button>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 4. SECTION DANH SÁCH TỪ VỰNG (VOCABULARY TABLE - Matching Reference Image 1) */}
      {/* ========================================================================= */}
      <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-black text-[#192e22] dark:text-[#f0f7f2]">
              Danh sách từ vựng
            </h2>
            <span className="text-xs text-[#73927d]">({parsedCards.length} từ)</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#73927d]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm từ vựng..."
                className="pl-8 h-9 text-xs rounded-xl border-[#dbe7dd] w-48 sm:w-56"
              />
            </div>

            {/* Filter select */}
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] text-xs font-bold text-[#192e22] cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="NEW">Mới</option>
              <option value="LEARNING">Đang học</option>
              <option value="MASTERED">Đã thuộc</option>
            </select>

            {/* Add new card button */}
            <Button
              onClick={() => setIsAddCardOpen(true)}
              size="sm"
              className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold h-9 px-3 space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm từ</span>
            </Button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#eef5f0] dark:border-[#263d2e] text-[10px] font-black uppercase text-[#73927d] tracking-wider">
                <th className="py-3 px-3">TỪ VỰNG</th>
                <th className="py-3 px-3">NGHĨA</th>
                <th className="py-3 px-3">LOẠI TỪ</th>
                <th className="py-3 px-3">VÍ DỤ</th>
                <th className="py-3 px-3">THUỘC</th>
                <th className="py-3 px-2 text-right">XÓA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7f2] dark:divide-[#203326]">
              {displayTableCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#73927d]">
                    Không có từ vựng nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                displayTableCards.map((card) => {
                  const masteryPercent = Math.min(100, Math.round((card.masteryLevel / 5) * 100));

                  return (
                    <tr
                      key={card.id}
                      className="hover:bg-[#fbfdfb] dark:hover:bg-[#1b3022] transition-colors"
                    >
                      {/* Cột 1: Word + Loa audio */}
                      <td className="py-3 px-3 font-extrabold text-[#192e22] dark:text-[#f0f7f2] whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => speakWord(card.word, 1.0)}
                            className="p-1 rounded-lg text-[#2d6a4f] hover:bg-[#eef5f0] transition-colors cursor-pointer"
                            title="Phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <span>{card.word}</span>
                        </div>
                      </td>

                      {/* Cột 2: Meaning */}
                      <td className="py-3 px-3 font-semibold text-[#2d6a4f] dark:text-[#52b788]">
                        {card.meaning}
                      </td>

                      {/* Cột 3: Loại từ & Phiên âm */}
                      <td className="py-3 px-3 text-[#526b5c] dark:text-[#a3bda9] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{card.partOfSpeech || "noun"}</span>
                          {card.phonetic && (
                            <span className="text-[10px] text-[#73927d]">{card.phonetic}</span>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Ví dụ */}
                      <td className="py-3 px-3 text-[#526b5c] dark:text-[#a3bda9] max-w-xs">
                        {card.exampleSentence ? (
                          <div className="line-clamp-2">
                            <span className="font-medium text-[#192e22] dark:text-[#f0f7f2]">
                              "{card.exampleSentence}"
                            </span>
                            {card.exampleMeaning && (
                              <span className="text-[11px] text-[#73927d] block">
                                {card.exampleMeaning}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Cột 5: Trạng thái thuộc (%) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {masteryPercent >= 80 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                            ✓ {masteryPercent}%
                          </span>
                        ) : masteryPercent > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            {masteryPercent}%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                            Mới
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Xóa */}
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa thẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* DIALOG: THÊM TỪ MỚI */}
      {/* ========================================================================= */}
      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="rounded-[28px] max-w-lg p-6 bg-white dark:bg-[#17261c] border border-[#dbe7dd]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#192e22] dark:text-[#f0f7f2]">
              Thêm từ vựng mới vào bộ thẻ
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCard} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Từ tiếng Anh *
                </label>
                <Input
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Ví dụ: table"
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Phiên âm IPA
                </label>
                <Input
                  value={newPhonetic}
                  onChange={(e) => setNewPhonetic(e.target.value)}
                  placeholder="Ví dụ: /ˈteɪ.bəl/"
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Nghĩa tiếng Việt *
                </label>
                <Input
                  required
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="Ví dụ: cái bàn, bàn"
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Từ loại
                </label>
                <select
                  value={newPartOfSpeech}
                  onChange={(e) => setNewPartOfSpeech(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-xl border border-[#dbe7dd] text-xs font-bold bg-white dark:bg-[#17261c]"
                >
                  <option value="noun">noun (danh từ)</option>
                  <option value="verb">verb (động từ)</option>
                  <option value="adj">adjective (tính từ)</option>
                  <option value="adv">adverb (trạng từ)</option>
                  <option value="phrase">phrase (cụm từ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Câu ví dụ tiếng Anh
              </label>
              <Input
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                placeholder="Ví dụ: I put my laptop on the table."
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Dịch nghĩa câu ví dụ
              </label>
              <Input
                value={newExampleMeaning}
                onChange={(e) => setNewExampleMeaning(e.target.value)}
                placeholder="Ví dụ: Tôi đặt máy tính xách tay của mình trên bàn."
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Gợi ý ghi nhớ (Hint)
              </label>
              <Input
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Gợi ý ngữ cảnh hoặc hình ảnh..."
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCardOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCard}
                className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold px-5"
              >
                {isSubmittingCard ? "Đang lưu..." : "Thêm vào bộ thẻ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

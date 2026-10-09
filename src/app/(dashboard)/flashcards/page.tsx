"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles,
  BookOpen,
  Plus,
  Flame,
  Clock,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
  Brain,
  FileText,
  RotateCcw,
} from "lucide-react";

export default function FlashcardsIndexPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Deck Modal
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckSubjectId, setDeckSubjectId] = useState("");
  const [isSubmittingDeck, setIsSubmittingDeck] = useState(false);

  // AI Generator Modal
  const [isAiGenOpen, setIsAiGenOpen] = useState(false);
  const [aiSourceType, setAiSourceType] = useState<"DOCUMENT" | "TEXT">("DOCUMENT");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [aiSubjectId, setAiSubjectId] = useState("");
  const [aiPromptText, setAiPromptText] = useState("");
  const [aiCardCount, setAiCardCount] = useState(10);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resDecks, resSubs] = await Promise.all([
        fetch("/api/flashcards/decks").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (resDecks.decks) setDecks(resDecks.decks);
      if (resSubs.subjects) setSubjects(resSubs.subjects);

      // Load documents for AI generator
      const resDocs = await fetch("/api/learning/roadmaps").then((r) => r.json()).catch(() => ({}));
      // Also fetch raw documents if available
      try {
        const docRes = await fetch("/api/resources").then((r) => r.json());
        if (docRes.documents) setDocuments(docRes.documents);
      } catch {}
    } catch (err) {
      console.error("Error loading flashcards data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitle.trim() || isSubmittingDeck) return;

    setIsSubmittingDeck(true);
    try {
      const res = await fetch("/api/flashcards/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deckTitle.trim(),
          description: deckDescription.trim() || null,
          subjectId: deckSubjectId || null,
        }),
      });

      if (!res.ok) throw new Error("Không thể tạo bộ thẻ");
      setIsNewDeckOpen(false);
      setDeckTitle("");
      setDeckDescription("");
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo bộ thẻ");
    } finally {
      setIsSubmittingDeck(false);
    }
  };

  const handleGenerateAiCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGeneratingAi) return;

    setIsGeneratingAi(true);
    try {
      const payload: any = {
        count: aiCardCount,
        subjectId: aiSubjectId || null,
      };

      if (aiSourceType === "DOCUMENT" && selectedDocId) {
        payload.documentId = selectedDocId;
      } else {
        payload.customText = aiPromptText.trim();
      }

      const res = await fetch("/api/flashcards/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo flashcard bằng AI");

      setIsAiGenOpen(false);
      setAiPromptText("");
      await loadData();
      router.push(`/flashcards/${data.deckId}`);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo flashcard AI");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa toàn bộ bộ thẻ này và lịch sử ôn tập không?")) return;

    try {
      const res = await fetch(`/api/flashcards/decks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xóa bộ thẻ");
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi xóa bộ thẻ");
    }
  };

  // Stats
  const totalCards = decks.reduce((acc, d) => acc + (d.cardCount || 0), 0);
  const totalDue = decks.reduce((acc, d) => acc + (d.dueCount || 0), 0);
  const totalMastered = decks.reduce((acc, d) => acc + (d.masteredCount || 0), 0);
  const masteredPercentage = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#86e2a8] text-xs font-bold mb-2">
            <Brain className="w-3.5 h-3.5 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>ANKI SPACED REPETITION (SM-2)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            Flashcard & Trí nhớ dài hạn
          </h1>
          <p className="text-xs sm:text-sm text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
            Ghi nhớ kiến thức bền vững theo thuật toán SuperMemo SM-2 chuẩn Anki, tự động tính toán chu kỳ ôn tập.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <Button
            onClick={() => setIsAiGenOpen(true)}
            variant="outline"
            className="rounded-2xl border-[#dbe7dd] dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#52b788] text-xs font-bold space-x-1.5 h-9"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Tạo Flashcard</span>
          </Button>

          <Button
            onClick={() => setIsNewDeckOpen(true)}
            className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold space-x-1.5 h-9"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bộ thẻ mới</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Cần ôn hôm nay</span>
          </div>
          <div className={`text-xl sm:text-2xl font-black ${totalDue > 0 ? "text-rose-600" : "text-[#192e22] dark:text-[#f0f7f2]"}`}>
            {totalDue} thẻ
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Chu kỳ lặp lại đến hạn</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <Layers className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>Tổng số thẻ</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {totalCards} thẻ
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Trong {decks.length} bộ thẻ</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã thuần thục (Mastered)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {totalMastered} thẻ
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Khoảng cách lặp {">"} 30 ngày</div>
        </Card>

        <Card className="rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] mb-1">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <span>Tỷ lệ nhớ bền vững</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#192e22] dark:text-[#f0f7f2]">
            {masteredPercentage}%
          </div>
          <div className="text-[11px] text-[#73927d] mt-0.5">Độ bao phủ bộ nhớ</div>
        </Card>
      </div>

      {/* Decks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-[#e8f0eb] dark:bg-[#203326] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Chưa có bộ thẻ Flashcard nào
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto mt-2 leading-relaxed">
            Tạo bộ thẻ thủ công hoặc dùng tính năng AI Tạo Flashcard để biến tài liệu PDF thành các câu hỏi Active Recall chất lượng cao.
          </p>
          <div className="flex items-center justify-center space-x-3 mt-6">
            <Button
              onClick={() => setIsAiGenOpen(true)}
              className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold space-x-1.5 h-10 px-5"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Tạo Flashcard từ tài liệu</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-[#192e22] dark:text-[#f0f7f2]">
              Các bộ từ vựng & Thẻ học ({decks.length})
            </h2>
            <span className="text-xs font-bold text-[#2d6a4f] dark:text-[#52b788]">
              Tự động cá nhân hóa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck, idx) => {
              const masteredPct =
                deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;
              const isFinished = masteredPct >= 80;

              return (
                <div
                  key={deck.id}
                  onClick={() => router.push(`/flashcards/${deck.id}`)}
                  className={`p-5 rounded-[28px] border-2 transition-all duration-200 cursor-pointer group flex items-center justify-between gap-4 shadow-2xs hover:shadow-md ${
                    isFinished
                      ? "bg-[#f8fdf9] dark:bg-[#14281b] border-[#c2e2cc] hover:border-[#2d6a4f]"
                      : "bg-white dark:bg-[#17261c] border-dashed border-[#d5e5da] dark:border-[#263d2e] hover:border-[#2d6a4f]"
                  }`}
                >
                  {/* Left: Trophy or Number Icon */}
                  <div className="shrink-0">
                    {isFinished ? (
                      <div className="w-13 h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 flex flex-col items-center justify-center text-xl shadow-xs">
                        <span>🏆</span>
                        <span className="text-[9px] font-black mt-0.5 text-amber-700">#{idx + 1}</span>
                      </div>
                    ) : (
                      <div className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black flex items-center justify-center text-sm">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Middle: Title, Stats & Progress */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#192e22] dark:text-[#f0f7f2] group-hover:text-[#2d6a4f] dark:group-hover:text-[#52b788] transition-colors truncate">
                        {deck.title}
                      </h3>
                      {isFinished && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9]">
                      <span>{deck.cardCount} từ vựng</span>
                      <span>•</span>
                      <span className={isFinished ? "text-emerald-600 font-bold" : ""}>
                        {masteredPct}% hoàn thành
                      </span>
                      {deck.dueCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600 font-bold">{deck.dueCount} cần ôn</span>
                        </>
                      )}
                    </div>

                    {/* Green progress bar */}
                    <div className="w-full bg-[#eef5f0] dark:bg-[#1d3024] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#2d6a4f] dark:bg-[#52b788] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${masteredPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Round Play Button */}
                  <div className="shrink-0 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeck(deck.id, e);
                      }}
                      className="p-2 rounded-xl text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa bộ thẻ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#f0f7f2] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] group-hover:bg-[#2d6a4f] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create Deck */}
      <Dialog open={isNewDeckOpen} onOpenChange={setIsNewDeckOpen}>
        <DialogContent onClose={() => setIsNewDeckOpen(false)} className="max-w-md rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
          <form onSubmit={handleCreateDeck} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Tạo bộ thẻ Flashcard mới
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Tổ chức thẻ ghi nhớ theo môn học hoặc chủ đề ôn tập riêng biệt.
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Tên bộ thẻ *
              </label>
              <Input
                required
                placeholder="VD: Từ vựng IELTS Writing Task 2, Công thức Vật lý 12..."
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                className="rounded-2xl border-[#dbe7dd] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Mô tả
              </label>
              <textarea
                rows={2}
                placeholder="Mục tiêu ghi nhớ, phạm vi kiến thức..."
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                Môn học liên quan
              </label>
              <select
                value={deckSubjectId}
                onChange={(e) => setDeckSubjectId(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="">(Không gắn môn)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewDeckOpen(false)}
                className="rounded-2xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDeck}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold"
              >
                {isSubmittingDeck ? "Đang tạo..." : "Tạo bộ thẻ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: AI Flashcard Generator */}
      <Dialog open={isAiGenOpen} onOpenChange={setIsAiGenOpen}>
        <DialogContent onClose={() => setIsAiGenOpen(false)} className="max-w-lg rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-6 shadow-xl">
          <form onSubmit={handleGenerateAiCards} className="space-y-4">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-bold text-[#2d6a4f] dark:text-[#52b788] mb-1">
                <Sparkles className="w-4 h-4" />
                <span>AI FLASHCARD ENGINE</span>
              </div>
              <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Trích xuất Flashcard tự động bằng AI
              </DialogTitle>
              <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                AI đọc tài liệu, xác định các định nghĩa, thuật ngữ trọng tâm và tự động tạo thẻ Spaced Repetition.
              </DialogDescription>
            </DialogHeader>

            {/* Source Type Toggle */}
            <div className="flex items-center space-x-2 p-1 bg-[#f4f8f5] dark:bg-[#101c14] rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e]">
              <button
                type="button"
                onClick={() => setAiSourceType("DOCUMENT")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aiSourceType === "DOCUMENT"
                    ? "bg-[#2d6a4f] text-white shadow-2xs"
                    : "text-[#526b5c]"
                }`}
              >
                Từ tài liệu đã tải lên
              </button>
              <button
                type="button"
                onClick={() => setAiSourceType("TEXT")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aiSourceType === "TEXT"
                    ? "bg-[#2d6a4f] text-white shadow-2xs"
                    : "text-[#526b5c]"
                }`}
              >
                Dán văn bản / Chủ đề
              </button>
            </div>

            {aiSourceType === "DOCUMENT" ? (
              <div>
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Chọn tài liệu
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                >
                  <option value="">-- Chọn tài liệu đã tải lên trong Quest/Roadmap --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.filename}
                    </option>
                  ))}
                </select>
                {documents.length === 0 && (
                  <p className="text-[11px] text-[#73927d] mt-1">
                    Chưa có tài liệu tải lên. Bạn có thể chuyển sang tab "Dán văn bản / Chủ đề".
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Nội dung kiến thức cần tạo thẻ
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Dán đoạn văn bản bài học, các công thức, thuật ngữ cần ghi nhớ..."
                  value={aiPromptText}
                  onChange={(e) => setAiPromptText(e.target.value)}
                  className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                />
              </div>
            )}

            {/* Subject Link & Card Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Gắn với môn học
                </label>
                <select
                  value={aiSubjectId}
                  onChange={(e) => setAiSubjectId(e.target.value)}
                  className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                >
                  <option value="">(Tự động xác định)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">
                  Số lượng thẻ cần tạo
                </label>
                <select
                  value={aiCardCount}
                  onChange={(e) => setAiCardCount(parseInt(e.target.value, 10))}
                  className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-2.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                >
                  <option value={5}>5 thẻ (Nhanh)</option>
                  <option value={10}>10 thẻ (Khuyến nghị)</option>
                  <option value={15}>15 thẻ (Chi tiết)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAiGenOpen(false)}
                className="rounded-2xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isGeneratingAi}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingAi ? "AI đang phân tích & tạo thẻ..." : "Bắt đầu tạo"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

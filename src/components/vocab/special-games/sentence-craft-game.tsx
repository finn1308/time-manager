"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Feather,
  Coins,
  Crown,
  Lock,
} from "lucide-react";
import { StudyWord } from "@/components/vocab/interactive-study-modal";

interface SentenceCraftGameProps {
  words: StudyWord[];
  wordSetId: string;
  isUserPro?: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

export function SentenceCraftGame({
  words,
  wordSetId,
  isUserPro = true, // Default to true or allow all users to try
  onClose,
  onFinish,
}: SentenceCraftGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSentence, setUserSentence] = useState("");
  const [feedback, setFeedback] = useState<{
    status: "SUCCESS" | "WARNING" | "ERROR";
    message: string;
    details?: string;
  } | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentWord = words[currentIndex] || null;

  const playAudio = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleEvaluateSentence = () => {
    if (!currentWord || !userSentence.trim()) return;

    const trimmed = userSentence.trim();
    const term = currentWord.term.toLowerCase();
    const lowerSentence = trimmed.toLowerCase();

    // Check if target word exists in sentence (or common derivatives)
    const baseWord = term.replace(/^(to\s+)/i, "");
    const wordExists =
      lowerSentence.includes(baseWord) ||
      lowerSentence.includes(baseWord.replace(/e$/, "") + "ing") ||
      lowerSentence.includes(baseWord + "ed") ||
      lowerSentence.includes(baseWord + "s");

    if (!wordExists) {
      setFeedback({
        status: "WARNING",
        message: `Câu của bạn chưa chứa từ vựng mục tiêu "${currentWord.term}". Hãy thử kết hợp từ này vào câu nhé!`,
      });
      return;
    }

    if (trimmed.split(/\s+/).length < 3) {
      setFeedback({
        status: "WARNING",
        message: "Câu hơi ngắn! Hãy thử mở rộng câu để diễn đạt ý trọn vẹn hơn (tối thiểu 3 từ).",
      });
      return;
    }

    const startsWithCapital = /^[A-Z]/.test(trimmed);
    const endsWithPunctuation = /[.!?]$/.test(trimmed);

    let message = "Tuyệt vời! Câu của bạn rất chuẩn ngữ cảnh và đúng từ!";
    if (!startsWithCapital || !endsWithPunctuation) {
      message = "Rất tốt! Lưu ý viết hoa chữ cái đầu câu và có dấu kết câu (., !, ?) để hoàn hảo nhé.";
    }

    setFeedback({
      status: "SUCCESS",
      message,
      details: `Đã sử dụng chính xác từ: "${currentWord.term}"`,
    });
    setCompletedCount((prev) => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserSentence("");
      setFeedback(null);
      setShowExample(false);
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    setIsFinished(true);
    try {
      await fetch("/api/vocab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          mode: "SPECIAL",
          specialGameMode: "SENTENCE",
          totalItems: words.length,
          correctItems: completedCount + 1,
          coinsDelta: 25,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentWord && !isFinished) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-2xl rounded-3xl shadow-2xl border border-blue-200 dark:border-blue-900/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#263d2e] flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
              <Feather className="w-3 h-3" />
              <span>Luyện Đặt Câu</span>
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {currentIndex + 1} / {words.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          {!isFinished ? (
            <>
              {/* Word Prompter */}
              <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                      {currentWord.term}
                    </h3>
                    {currentWord.partOfSpeech && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                        {currentWord.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Nghĩa: <strong>{currentWord.meaning}</strong>
                  </p>
                </div>

                <button
                  onClick={() => playAudio(currentWord.term)}
                  className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* User Input Area */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Hãy viết một câu tiếng Anh hoàn chỉnh chứa từ trên:</span>
                  <button
                    type="button"
                    onClick={() => setShowExample(!showExample)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{showExample ? "Ẩn câu mẫu" : "Xem câu mẫu gợi ý"}</span>
                  </button>
                </label>

                {showExample && currentWord.exampleSentence && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121f16] border border-gray-200 dark:border-[#263d2e] text-xs space-y-1 animate-in fade-in duration-150">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      💡 Mẫu: "{currentWord.exampleSentence}"
                    </p>
                    {currentWord.exampleMeaning && (
                      <p className="text-gray-500 italic">
                        Dịch: {currentWord.exampleMeaning}
                      </p>
                    )}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  placeholder={`Ví dụ: She decided to ${currentWord.term.toLowerCase()} her plan...`}
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {feedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in duration-150 ${
                      feedback.status === "SUCCESS"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200"
                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200"
                    }`}
                  >
                    {feedback.status === "SUCCESS" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{feedback.message}</p>
                      {feedback.details && (
                        <p className="text-[11px] opacity-80 mt-0.5">{feedback.details}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => playAudio(userSentence)}
                  disabled={!userSentence.trim()}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#263d2e] text-gray-600 dark:text-gray-300 text-xs font-semibold disabled:opacity-40 flex items-center space-x-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe câu của bạn</span>
                </button>

                <div className="flex items-center space-x-2">
                  {feedback?.status === "SUCCESS" ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleEvaluateSentence}
                      disabled={!userSentence.trim()}
                      className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md"
                    >
                      Kiểm tra câu
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Finished screen */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Hoàn thành Luyện Đặt Câu!
              </h3>
              <p className="text-xs text-gray-500">
                Bạn đã luyện đặt câu thành công cho {completedCount} từ vựng.
              </p>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>+25 Xu thưởng & 60 XP</span>
              </div>
              <div className="pt-4 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
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

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizPlayer, QuizData } from "@/components/learning/quiz-player";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
export default function QuizPlayPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    fetch(`/api/quiz/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.quiz) {
          setQuiz(data.quiz);
        } else {
          setError(data.error || "Không thể tải bài kiểm tra");
        }
      })
      .catch((err) => setError("Lỗi kết nối máy chủ"))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleScheduleStudy = async (topic: string) => {
    try {
      const res = await fetch("/api/learning/schedule-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, durationMinutes: 45 }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || `Đã thêm buổi học "${topic}" vào Calendar!`);
      }
    } catch {
      toast.error("Không thể lên lịch học");
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/learning")}
          className="rounded-full text-xs text-[#526b5c] hover:text-[#192e22] space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Lộ trình</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f] mx-auto" />
          <p className="text-xs text-[#73927d]">Đang chuẩn bị đề thi & câu hỏi...</p>
        </div>
      ) : error || !quiz ? (
        <div className="p-8 text-center space-y-3 bg-white dark:bg-[#17261c] rounded-[30px] border border-[#dbe7dd] dark:border-[#263d2e]">
          <p className="text-xs text-[#8a3c3c] font-semibold">{error || "Không tìm thấy bài Quiz"}</p>
          <Button onClick={() => router.push("/learning")} className="rounded-full text-xs">
            Quay về danh sách
          </Button>
        </div>
      ) : (
        <QuizPlayer
          quiz={quiz}
          onFinish={() => router.push("/learning")}
          onScheduleStudy={handleScheduleStudy}
        />
      )}
    </div>
  );
}

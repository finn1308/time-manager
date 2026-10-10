"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PracticeSubject } from "./types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AddMistakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: PracticeSubject[];
  onSuccess?: () => void;
}

export function AddMistakeDialog({
  open,
  onOpenChange,
  subjects,
  onSuccess,
}: AddMistakeDialogProps) {
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [errorType, setErrorType] = useState("KNOWLEDGE_GAP");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errorTypeLabels: Record<string, string> = {
    KNOWLEDGE_GAP: "Hổng kiến thức cơ bản",
    CARELESS: "Bất cẩn / Đọc nhầm đề",
    CONCEPTUAL: "Hiểu sai bản chất khái niệm",
    TIME_MANAGEMENT: "Hết giờ / Làm quá vội",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          userAnswer,
          correctAnswer,
          subjectId: subjectId || undefined,
          errorType,
          explanation: explanation || undefined,
          sourceType: "MANUAL_PRACTICE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu lỗi sai");
      }

      // Reset form
      setQuestion("");
      setUserAnswer("");
      setCorrectAnswer("");
      setExplanation("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi lưu lỗi sai");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[var(--text-ink)] flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </span>
            <span>Ghi nhận lỗi sai vào ngân hàng</span>
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-subtle)]">
              Câu hỏi / Bài toán / Khái niệm sai *
            </label>
            <Input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="VD: Đạo hàm của hàm số y = ln(x) là gì?"
              className="rounded-xl border-[var(--border)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Câu bạn đã làm sai *
              </label>
              <Input
                required
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="VD: 1/x^2"
                className="rounded-xl border-rose-200 dark:border-rose-900/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Đáp án chính xác *
              </label>
              <Input
                required
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="VD: 1/x"
                className="rounded-xl border-emerald-200 dark:border-emerald-900/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-subtle)]">
                Môn học liên quan
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-ink)]"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-subtle)]">
                Phân loại nguyên nhân lỗi
              </label>
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-ink)]"
              >
                {Object.entries(errorTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-subtle)]">
              Giải thích & Ghi chú để tránh lặp lại
            </label>
            <Input
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="VD: Đạo hàm ln(u) = u'/u, với u = x thì u' = 1 nên kết quả là 1/x..."
              className="rounded-xl border-[var(--border)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              {saving ? "Đang lưu..." : "Lưu vào ngân hàng"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

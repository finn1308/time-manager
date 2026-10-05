"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  BookOpen,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SubjectAiTutorModalProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
}

export function SubjectAiTutorModal({
  open,
  onClose,
  subjectId,
  subjectName,
}: SubjectAiTutorModalProps) {
  const [messages, setMessages] = useState<
    Array<{ role: "assistant" | "user"; text: string; time: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: `Chào bạn! Tôi là Gia sư AI môn **${subjectName}**. Tôi đã đồng bộ toàn bộ đề cương, ghi chú và các câu hỏi trong Ngân hàng lỗi sai của bạn đối với môn này.\n\nBạn có thể hỏi tôi về:\n- Các lỗ hổng kiến thức cần ôn tập\n- Giải thích chuyên sâu một định nghĩa hoặc công thức\n- Chiến lược ôn thi đạt điểm cao`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [open, subjectName]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newHistory = [
      ...messages,
      {
        role: "user" as const,
        text: userMsg,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/subject-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          message: userMsg,
          chatHistory: newHistory.slice(-6),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: json.reply,
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Error in Subject Tutor:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl h-[85vh] max-h-[640px] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-emerald-100 dark:border-[#263d2e] bg-emerald-50/50 dark:bg-[#1a2f22] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  Gia sư AI: {subjectName}
                </h3>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5">
                  Đã kết nối ngữ cảnh
                </Badge>
              </div>
              <p className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">
                Đồng bộ tài liệu, ghi chú và lỗi sai thực tế
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  m.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700"
                }`}
              >
                {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#408257] text-white rounded-tr-none"
                    : "bg-gray-100 dark:bg-[#1a2f22] text-[#192e22] dark:text-[#f0f7f2] rounded-tl-none border border-emerald-50 dark:border-[#263d2e]"
                }`}
              >
                {m.text}
                <span className="text-[9px] block text-right mt-1 opacity-70">{m.time}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#526b5c] dark:text-[#a3bda9] pl-9">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200" />
              <span className="text-[11px]">Gia sư AI đang tra cứu tài liệu môn học...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-emerald-50 dark:border-[#263d2e] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <button
            onClick={() => {
              setInput("Chỉ ra các lỗ hổng kiến thức tôi đang gặp phải trong môn này?");
            }}
            className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100 shrink-0"
          >
            ⚠️ Xem lỗ hổng kiến thức
          </button>
          <button
            onClick={() => {
              setInput("Gợi ý chiến lược ôn thi đạt điểm cao cho môn này?");
            }}
            className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 shrink-0"
          >
            🎯 Chiến lược ôn thi
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-emerald-100 dark:border-[#263d2e] flex items-center gap-2 bg-white dark:bg-[#17261c]">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Hỏi gia sư về môn ${subjectName}...`}
            className="rounded-xl text-xs py-4 flex-1 border-emerald-100 dark:border-[#263d2e]"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="icon"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

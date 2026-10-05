"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sparkles, Send, Bot, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "coach";
  text: string;
}

interface AiStudyCoachModalProps {
  open: boolean;
  onClose: () => void;
}

export function AiStudyCoachModal({ open, onClose }: AiStudyCoachModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text: "Xin chào! Tôi là AI Study Coach của bạn. Tôi có thể đọc trực tiếp tiến độ học tập thực tế từ Database để phân tích, cảnh báo thiếu giờ hoặc tư vấn chiến lược học tập tối ưu. Bạn muốn kiểm tra điều gì?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    "Tuần này tôi học thế nào?",
    "Môn nào đang thiếu giờ nhất?",
    "Mục tiêu nào sắp đến hạn deadline?",
    "Tuần sau nên phân bổ ra sao?",
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi AI Coach");

      setMessages((prev) => [...prev, { role: "coach", text: data.answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: `⚠️ Đã xảy ra lỗi: ${err.message || "Không thể kết nối máy chủ"}. Vui lòng thử lại.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-xl rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 sm:p-6 shadow-2xl flex flex-col h-[min(600px,85dvh)] max-h-[85dvh]">
        <DialogHeader className="shrink-0 pb-3 border-b border-[#dbe7dd]/60 dark:border-[#263d2e]">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#2d6a4f] dark:text-[#52b788] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>ChronoMind AI Study Coach</span>
          </div>
          <DialogTitle className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Cố vấn học tập thông minh cá nhân
          </DialogTitle>
          <DialogDescription className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
            Phân tích 100% dựa trên nhật ký học thực tế, chỉ tiêu môn học và hạn mức ngân sách tuần.
          </DialogDescription>
        </DialogHeader>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                m.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                  m.role === "user"
                    ? "bg-[#2d6a4f] text-white"
                    : "bg-[#d8ebe0] dark:bg-[#1d3827] text-[#2d6a4f] dark:text-[#9cd1b1]"
                }`}
              >
                {m.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-line leading-relaxed break-words ${
                  m.role === "user"
                    ? "bg-[#2d6a4f] text-white rounded-tr-xs"
                    : "bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2] rounded-tl-xs"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-[#526b5c] dark:text-[#a3bda9] p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-[#2d6a4f]" />
              <span>AI Coach đang phân tích số liệu thực tế...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="shrink-0 pt-2 pb-2 flex flex-wrap gap-1.5 border-t border-[#dbe7dd]/60 dark:border-[#263d2e]">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#9cd1b1] hover:bg-[#d8ebe0] transition-colors cursor-pointer border border-[#dbe7dd]/80 dark:border-[#263d2e]"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="shrink-0 flex items-center space-x-2 pt-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi AI Coach về lịch trình, môn học, thời gian..."
            disabled={isLoading}
            className="flex-1 rounded-2xl border-[#dbe7dd] focus:ring-[#2d6a4f] text-xs h-10"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-xs h-10 px-4 space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

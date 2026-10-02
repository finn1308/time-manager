"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatVN } from "@/lib/date-utils";
import { Sparkles, Search, Plus, Bot, Calendar, BookOpen, Target, Play, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { CommandPalette } from "./command-palette";
import { AiStudyCoachModal } from "../ai/ai-study-coach-modal";
import { QuickCaptureModal } from "./quick-capture-modal";
import { usePipTimer } from "../timer/pip-timer-provider";

interface TopBarProps {
  user: {
    name: string | null;
    email: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  const [now] = useState(new Date());
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isQuickAddMenuOpen, setIsQuickAddMenuOpen] = useState(false);
  const { startTimer } = usePipTimer();

  // Global keyboard shortcut: Cmd+K or Ctrl+K, and 'c' for Quick Capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger 'c' if typing in input/textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#f4f8f5]/85 dark:bg-[#101c14]/85 backdrop-blur-md border-b border-[#dbe7dd]/80 dark:border-[#263d2e]">
        {/* Left: Date Display */}
        <div className="flex items-center space-x-3">
          <div className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9]">
            <span>{formatVN(now, "EEEE, dd 'thg' MM, yyyy")}</span>
          </div>
        </div>

        {/* Right: Quick Search (Cmd+K), AI Coach, Quick Add (+), User Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Cmd+K Search Button */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center space-x-2 h-8 px-3 rounded-full bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-[#73927d] hover:text-[#192e22] dark:hover:text-[#f0f7f2] text-xs transition-colors shadow-2xs cursor-pointer"
            title="Mở Command Palette (Ctrl+K / ⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">Tìm kiếm nhanh</span>
            <kbd className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#eef5f0] dark:bg-[#1d3024] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]">
              ⌘K
            </kbd>
          </button>

          {/* AI Study Coach Button */}
          <Button
            size="sm"
            onClick={() => setIsCoachOpen(true)}
            className="bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] hover:bg-[#b7d8c3] rounded-2xl text-xs space-x-1.5 shadow-2xs font-semibold border border-[#b7d8c3]/60 dark:border-[#263d2e]"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </Button>

          {/* AI Scheduler Link */}
          <Link href="/calendar">
            <Button
              size="sm"
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs space-x-1.5 shadow-2xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lập lịch AI</span>
            </Button>
          </Link>

          {/* Quick Capture Pill Button (Zap) */}
          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center space-x-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-[#f4f8f5] dark:bg-[#1d3024] hover:bg-[#d8ebe0] dark:hover:bg-[#254231] text-[#2d6a4f] dark:text-[#52b788] border border-[#dbe7dd] dark:border-[#263d2e] text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Ghi nhận nhanh (Nhấn C)"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Ghi nhanh</span>
            <kbd className="hidden md:inline text-[9px] font-mono px-1 py-0.2 rounded bg-white dark:bg-[#17261c] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]">
              C
            </kbd>
          </button>

          {/* Quick Add Menu (+) (Section 42) */}
          <div className="relative">
            <button
              onClick={() => setIsQuickAddMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white flex items-center justify-center shadow-2xs cursor-pointer transition-transform active:scale-95"
              title="Thêm nhanh (Quick Add)"
            >
              <Plus className="w-4 h-4" />
            </button>

            {isQuickAddMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQuickAddMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-1.5 shadow-xl z-50 text-xs font-semibold space-y-0.5">
                  <button
                    onClick={() => {
                      setIsQuickAddMenuOpen(false);
                      setIsQuickCaptureOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f8f5] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2] cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Ghi nhận nhanh (C)</span>
                  </button>

                  <Link
                    href="/calendar"
                    onClick={() => setIsQuickAddMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f8f5] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Tạo lịch học mới</span>
                  </Link>

                  <Link
                    href="/subjects"
                    onClick={() => setIsQuickAddMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f8f5] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2]"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Thêm môn học</span>
                  </Link>

                  <Link
                    href="/goals"
                    onClick={() => setIsQuickAddMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f8f5] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2]"
                  >
                    <Target className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Thêm mục tiêu</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsQuickAddMenuOpen(false);
                      startTimer({
                        id: "quick",
                        name: "Phiên học tự do",
                        code: "STUDY",
                        color: "#2d6a4f",
                      });
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f8f5] dark:hover:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Bật Timer ngay</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] flex items-center justify-center font-bold text-xs shadow-2xs border border-[#b7d8c3]/60 dark:border-[#263d2e]">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </header>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        open={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenCoach={() => setIsCoachOpen(true)}
      />

      {/* Quick Capture Modal (C) */}
      <QuickCaptureModal
        open={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      {/* AI Study Coach Modal */}
      <AiStudyCoachModal
        open={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </>
  );
}

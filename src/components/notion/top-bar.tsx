"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatVN } from "@/lib/date-utils";
import { Sparkles, Search, Plus, Bot, Calendar, BookOpen, Target, Play, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { CommandPalette } from "./command-palette";
import { AiStudyCoachModal } from "../ai/ai-study-coach-modal";
import { QuickCaptureModal } from "./quick-capture-modal";
import { NotificationCenter } from "../notifications/notification-center";
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
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-[#f4f8f5]/90 dark:bg-[#101c14]/90 backdrop-blur-md border-b border-[#dbe7dd]/80 dark:border-[#263d2e] pt-safe transition-all">
        {/* Left: Date Display & Gamification Streak/Coins */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="text-[11px] sm:text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] truncate">
            {/* Desktop / Tablet full date */}
            <span className="hidden md:inline">{formatVN(now, "EEEE, dd 'thg' MM, yyyy")}</span>
            {/* Mobile medium */}
            <span className="hidden sm:inline md:hidden">{formatVN(now, "dd 'thg' MM, yyyy")}</span>
            {/* iPhone 15 / Small mobile */}
            <span className="inline sm:hidden font-mono text-[11px]">{formatVN(now, "dd/MM")}</span>
          </div>


        </div>

        {/* Right: Quick Search (Cmd+K), AI Coach, Quick Add (+), User Avatar */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Cmd+K Search Button */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center justify-center sm:space-x-2 h-8 w-8 sm:w-auto sm:px-3 rounded-full bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-[#73927d] hover:text-[#192e22] dark:hover:text-[#f0f7f2] text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Mở Command Palette (Ctrl+K / ⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">Tìm kiếm</span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#eef5f0] dark:bg-[#1d3024] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]">
              ⌘K
            </kbd>
          </button>

          {/* AI Study Coach Button (Tablet / Desktop) */}
          <Button
            size="sm"
            onClick={() => setIsCoachOpen(true)}
            className="hidden sm:inline-flex bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] hover:bg-[#b7d8c3] rounded-2xl text-xs space-x-1.5 shadow-2xs font-semibold border border-[#b7d8c3]/60 dark:border-[#263d2e] active:scale-95"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Coach</span>
          </Button>

          {/* AI Scheduler Link (Desktop only to conserve space) */}
          <Link href="/calendar" className="hidden lg:inline-flex">
            <Button
              size="sm"
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl text-xs space-x-1.5 shadow-2xs font-semibold active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lập lịch AI</span>
            </Button>
          </Link>

          {/* Quick Capture Pill Button (Zap) */}
          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center justify-center sm:space-x-1.5 h-8 w-8 sm:w-auto sm:px-2.5 rounded-full bg-[#f4f8f5] dark:bg-[#1d3024] hover:bg-[#d8ebe0] dark:hover:bg-[#254231] text-[#2d6a4f] dark:text-[#52b788] border border-[#dbe7dd] dark:border-[#263d2e] text-xs font-semibold transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Ghi nhận nhanh (Nhấn C)"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Ghi nhanh</span>
          </button>

          {/* Quick Add Menu (+) */}
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
                <div className="absolute right-0 mt-2 w-52 rounded-[22px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-1.5 shadow-xl z-50 text-xs font-semibold space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
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

                  <button
                    onClick={() => {
                      setIsQuickAddMenuOpen(false);
                      setIsCoachOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f8f5] dark:hover:bg-[#1d3024] text-[#192e22] dark:text-[#f0f7f2] cursor-pointer sm:hidden"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                    <span>Hỏi AI Coach</span>
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

          {/* Notification Center */}
          <NotificationCenter />

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#9cd1b1] flex items-center justify-center font-bold text-xs shadow-2xs border border-[#b7d8c3]/60 dark:border-[#263d2e] shrink-0">
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

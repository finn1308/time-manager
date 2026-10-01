"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Target,
  History,
  Settings,
  Play,
  Sparkles,
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";
import { usePipTimer } from "../timer/pip-timer-provider";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenCoach?: () => void;
}

export function CommandPalette({ open, onClose, onOpenCoach }: CommandPaletteProps) {
  const router = useRouter();
  const { startTimer } = usePipTimer();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      id: "dashboard",
      title: "Đi tới Tổng quan (Dashboard)",
      category: "Điều hướng",
      icon: LayoutDashboard,
      run: () => {
        router.push("/");
        onClose();
      },
    },
    {
      id: "calendar",
      title: "Mở Lịch học tuần (Calendar)",
      category: "Điều hướng",
      icon: Calendar,
      run: () => {
        router.push("/calendar");
        onClose();
      },
    },
    {
      id: "subjects",
      title: "Quản lý môn học (Subjects)",
      category: "Điều hướng",
      icon: BookOpen,
      run: () => {
        router.push("/subjects");
        onClose();
      },
    },
    {
      id: "goals",
      title: "Mục tiêu & Deadline (Goals)",
      category: "Điều hướng",
      icon: Target,
      run: () => {
        router.push("/goals");
        onClose();
      },
    },
    {
      id: "sessions",
      title: "Nhật ký phiên học (Study Sessions)",
      category: "Điều hướng",
      icon: History,
      run: () => {
        router.push("/study-sessions");
        onClose();
      },
    },
    {
      id: "settings",
      title: "Cài đặt & Khóa AI (Settings)",
      category: "Điều hướng",
      icon: Settings,
      run: () => {
        router.push("/settings");
        onClose();
      },
    },
    {
      id: "timer",
      title: "Bật Study Timer học ngay (PiP Player)",
      category: "Thao tác",
      icon: Play,
      run: () => {
        startTimer({
          id: "general",
          name: "Phiên học tự do",
          code: "STUDY",
          color: "#2d6a4f",
        });
        onClose();
      },
    },
    {
      id: "coach",
      title: "Hỏi AI Study Coach về tuần này",
      category: "AI",
      icon: Sparkles,
      run: () => {
        onClose();
        if (onOpenCoach) onOpenCoach();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg rounded-[28px] border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-0 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#dbe7dd]/80 dark:border-[#263d2e]">
          <Search className="w-4 h-4 text-[#73927d] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ lệnh hoặc tìm kiếm (VD: Lịch, Môn học, Timer, AI...)"
            className="flex-1 bg-transparent border-none text-xs text-[#192e22] dark:text-[#f0f7f2] placeholder:text-[#8ba393] focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#eef5f0] dark:bg-[#1d3024] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.map((action, idx) => {
            const Icon = action.icon;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={action.id}
                onClick={action.run}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer text-xs transition-colors ${
                  isSelected
                    ? "bg-[#d8ebe0] dark:bg-[#1d3827] text-[#192e22] dark:text-[#f0f7f2]"
                    : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#f8fbf8] dark:hover:bg-[#142318]"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-[#2d6a4f] text-white"
                        : "bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold truncate">{action.title}</span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-medium text-[#73927d] dark:text-[#8ba393]">
                    {action.category}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-[#73927d]">
              Không tìm thấy lệnh hoặc trang phù hợp với "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] flex items-center justify-between text-[10px] text-[#73927d]">
          <span>Dùng phím ↑ ↓ để di chuyển • Nhấn Enter để chọn</span>
          <span className="font-mono">ChronoMind Palette</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

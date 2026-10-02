"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Flame,
  BookOpen,
  Target,
  History,
  Settings,
  Play,
  Sparkles,
  CheckSquare,
  Brain,
  FileText,
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

  const [serverResults, setServerResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      id: "tasks",
      title: "Nhiệm vụ & Quick Inbox (Tasks & Todo)",
      category: "Điều hướng",
      icon: CheckSquare,
      run: () => {
        router.push("/tasks");
        onClose();
      },
    },
    {
      id: "deadlines",
      title: "Quản lý Deadline & Bài tập (Anti-Cramming)",
      category: "Điều hướng",
      icon: Flame,
      run: () => {
        router.push("/deadlines");
        onClose();
      },
    },
    {
      id: "flashcards",
      title: "Flashcards & Spaced Repetition (Anki SM-2)",
      category: "Điều hướng",
      icon: Brain,
      run: () => {
        router.push("/flashcards");
        onClose();
      },
    },
    {
      id: "notes",
      title: "Ghi chú & Wiki bài học (Notion Notes)",
      category: "Điều hướng",
      icon: FileText,
      run: () => {
        router.push("/notes");
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

  // Debounced search for database items
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setServerResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setServerResults(data.results || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  // Map server result icons
  const getItemIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return CheckSquare;
      case "NOTE":
        return FileText;
      case "SUBJECT":
        return BookOpen;
      case "GOAL":
        return Target;
      case "EVENT":
        return Calendar;
      case "CARD":
        return Brain;
      default:
        return Sparkles;
    }
  };

  // Combined list for keyboard navigation
  const allItems = [
    ...serverResults.map((item) => ({
      id: `server-${item.type}-${item.id}`,
      title: item.title,
      subtitle: item.subtitle,
      badge: item.badge,
      icon: getItemIcon(item.type),
      run: () => {
        router.push(item.url);
        onClose();
      },
    })),
    ...filteredActions.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: undefined,
      badge: a.category,
      icon: a.icon,
      run: a.run,
    })),
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, serverResults]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].run();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, allItems, selectedIndex]);

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
            placeholder="Tìm kiếm Task, Note, Môn học, Thẻ bài hoặc Gõ lệnh..."
            className="flex-1 bg-transparent border-none text-xs text-[#192e22] dark:text-[#f0f7f2] placeholder:text-[#8ba393] focus:outline-none"
            autoFocus
          />
          {isSearching && (
            <span className="text-[10px] text-[#2d6a4f] dark:text-[#52b788] animate-pulse mr-2">
              Đang tìm...
            </span>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#eef5f0] dark:bg-[#1d3024] text-[#526b5c] dark:text-[#a3bda9] border border-[#dbe7dd] dark:border-[#263d2e]">
            ESC
          </kbd>
        </div>

        {/* Action & Result List */}
        <div className="p-2 max-h-84 overflow-y-auto space-y-1">
          {serverResults.length > 0 && (
            <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-[#2d6a4f] dark:text-[#52b788] uppercase tracking-wider">
              Kết quả dữ liệu ({serverResults.length})
            </div>
          )}

          {allItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={item.run}
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
                  <div className="truncate">
                    <p className="font-semibold truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-[#73927d] dark:text-[#8ba393] truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {item.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#eef5f0] dark:bg-[#1d3024] text-[#73927d] dark:text-[#8ba393]">
                      {item.badge}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
            );
          })}

          {allItems.length === 0 && !isSearching && (
            <div className="py-8 text-center text-xs text-[#73927d]">
              Không tìm thấy lệnh hoặc dữ liệu phù hợp với "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#dbe7dd]/60 dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] flex items-center justify-between text-[10px] text-[#73927d]">
          <span>Dùng phím ↑ ↓ để di chuyển • Nhấn Enter để mở</span>
          <span className="font-mono">ChronoMind Global Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

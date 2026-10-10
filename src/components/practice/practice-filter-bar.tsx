"use client";

import React from "react";
import { Search, X, Pin } from "lucide-react";
import { PracticeSubject } from "./types";

interface PracticeFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  subjects: PracticeSubject[];
}

export function PracticeFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  subjects,
}: PracticeFilterBarProps) {
  const standardFilters = [
    { id: "ALL", label: "Tất cả" },
    { id: "REVIEW", label: "Ôn tập hôm nay" },
    { id: "MISTAKES", label: "Ngân hàng lỗi sai" },
    { id: "FLASHCARDS", label: "Flashcards" },
    { id: "QUIZ", label: "Trắc nghiệm Quiz" },
    { id: "GAMES", label: "Mini-games" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm chế độ, môn học hoặc câu hỏi luyện tập..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-ink)] placeholder-[#73927d] dark:placeholder-[#526b5c] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar matching LuyenTu reference screenshot */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {standardFilters.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isActive
                  ? "bg-[var(--mint)] text-white shadow-sm font-extrabold"
                  : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)] hover:bg-[var(--mint-bg)] dark:hover:bg-[#1d3024] hover:text-[var(--text-ink)] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Dynamic Subjects Chips */}
        {subjects.map((sub) => {
          const filterId = `SUBJECT_${sub.id}`;
          const isActive = activeFilter === filterId;
          return (
            <button
              key={sub.id}
              onClick={() => onFilterChange(filterId)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center space-x-1.5 ${
                isActive
                  ? "bg-[var(--mint)] text-white shadow-sm font-extrabold"
                  : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-subtle)] hover:bg-[var(--mint-bg)] dark:hover:bg-[#1d3024]"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: sub.color || "#2d6a4f" }}
              />
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

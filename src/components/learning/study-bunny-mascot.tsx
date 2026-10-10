"use client";

import React from "react";
import { Sparkles, Heart } from "lucide-react";

interface StudyBunnyProps {
  message: string;
  mood?: "happy" | "thinking" | "cheering" | "celebrating";
  className?: string;
}

export function StudyBunnyMascot({ message, mood = "happy", className = "" }: StudyBunnyProps) {
  const getMascotEmoji = () => {
    switch (mood) {
      case "celebrating":
        return "🐰🎉";
      case "cheering":
        return "🐱✨";
      case "thinking":
        return "🐰💭";
      case "happy":
      default:
        return "🐰🌸";
    }
  };

  return (
    <div className={`flex items-start space-x-3.5 ${className}`}>
      {/* Mascot Avatar Container */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-[#d8ebe0] via-[#c2e2cc] to-[#a3d9b5] dark:from-[#1b3d28] dark:to-[#2d6a4f] flex items-center justify-center text-2xl shadow-sm border border-[#b7d8c3] dark:border-[var(--mint)] transition-transform hover:scale-105">
          <span>{getMascotEmoji()}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--mint)] text-white flex items-center justify-center text-[10px] shadow-xs">
          <Sparkles className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative flex-1 bg-white/95 dark:bg-[#1a2e21]/95 border border-[var(--border)] dark:border-[#2d4734] rounded-[22px] p-3.5 px-4 text-xs text-[var(--text-ink)] shadow-xs">
        <div className="flex items-center space-x-1.5 font-semibold text-[var(--mint-dark)] mb-1 text-[11px]">
          <span>Study Bunny AI</span>
          <Heart className="w-3 h-3 fill-[#52b788] text-[#52b788]" />
        </div>
        <p className="leading-relaxed text-[#2d4734] dark:text-[#d3e6d8]">
          {message}
        </p>
      </div>
    </div>
  );
}

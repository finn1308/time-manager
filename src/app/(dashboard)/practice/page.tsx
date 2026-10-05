import React from "react";
import Link from "next/link";
import { Brain, Sparkles, PlaySquare, Gamepad2, Layers, AlertCircle, Award, Languages } from "lucide-react";

export default function PracticeHubPage() {
  const practiceModules = [
    {
      title: "Ôn tập tổng hợp hôm nay (Today's Review)",
      description: "Tổng hợp từ vựng đến hạn, flashcards và lỗi sai trong 1 phiên tập trung",
      href: "/practice/review",
      icon: Award,
      color: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-300 ring-2 ring-emerald-500/20",
      badge: "KHUYÊN DÙNG"
    },
    {
      title: "Ngân hàng lỗi sai (Mistake Bank)",
      description: "Quản lý và ôn tập các câu hỏi từng làm sai từ quiz, flashcard và đề thi",
      href: "/practice/mistakes",
      icon: AlertCircle,
      color: "bg-rose-100 text-rose-700",
      border: "border-rose-200",
      badge: "TRỌNG TÂM"
    },
    {
      title: "LUYENTU - TUVUNGPRO",
      description: "Nền tảng học từ vựng toàn diện & Hệ thống Flashcards Anki-style",
      href: "/vocab",
      icon: Languages,
      color: "bg-indigo-100 text-indigo-700",
      border: "border-indigo-200"
    },
    {
      title: "Study Quest & Quiz",
      description: "Làm bài tập trắc nghiệm và thử thách",
      href: "/learning",
      icon: Sparkles,
      color: "bg-amber-100 text-amber-700",
      border: "border-amber-200"
    },
    {
      title: "Chế độ học đặc biệt",
      description: "Mini-games: Luyện đặt câu, Quán cơm tấm, Giải cứu khỉ...",
      href: "/index/5", 
      icon: Gamepad2,
      color: "bg-rose-100 text-rose-700",
      border: "border-rose-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">Luyện tập (Practice)</h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Học tập chủ động, ôn tập ngắt quãng và mini-games
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practiceModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Link key={index} href={module.href}>
              <div className={`p-5 rounded-3xl bg-white dark:bg-[#17261c] border ${module.border} dark:border-[#263d2e] hover:shadow-md transition-all cursor-pointer flex items-start space-x-4 h-full`}>
                <div className={`p-3 rounded-xl ${module.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2] mb-1">{module.title}</h3>
                  <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">{module.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

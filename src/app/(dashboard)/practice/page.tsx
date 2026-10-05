import React from "react";
import Link from "next/link";
import { Brain, Sparkles, PlaySquare, Gamepad2, Layers, AlertCircle, Award, Languages } from "lucide-react";

export const metadata = {
  title: "Luyện tập (Practice Hub) • ChronoMind",
  description: "Trung tâm luyện tập chủ động, ôn tập ngắt quãng và mini-games",
};

export default function PracticeHubPage() {
  const practiceModules = [
    {
      title: "Ôn tập tổng hợp hôm nay (Today's Review)",
      description: "Tổng hợp từ vựng đến hạn, flashcards và lỗi sai trong 1 phiên tập trung",
      href: "/practice/review",
      icon: Award,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      border: "border-emerald-300 ring-2 ring-emerald-500/20 dark:border-emerald-800",
      badge: "KHUYÊN DÙNG"
    },
    {
      title: "Ngân hàng lỗi sai (Mistake Bank)",
      description: "Quản lý và ôn tập các câu hỏi từng làm sai từ quiz, flashcard và đề thi",
      href: "/practice/mistakes",
      icon: AlertCircle,
      color: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-900/50",
      badge: "TRỌNG TÂM"
    },
    {
      title: "LUYENTU - TUVUNGPRO",
      description: "Nền tảng học từ vựng toàn diện, Game Engine & Flashcards Anki-style",
      href: "/vocab",
      icon: Languages,
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
      border: "border-indigo-200 dark:border-indigo-900/50"
    },
    {
      title: "Study Quest & Quiz",
      description: "Làm bài tập trắc nghiệm và thử thách",
      href: "/learning",
      icon: Sparkles,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-900/50"
    },
    {
      title: "Chế độ học đặc biệt & Mini-games",
      description: "Luyện đặt câu, Quán cơm tấm, Giải cứu khỉ, Chim chăm chỉ...",
      href: "/vocab/index/5", 
      icon: Gamepad2,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-900/50"
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">Luyện tập (Practice)</h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Học tập chủ động, ôn tập ngắt quãng và mini-games tương tác
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practiceModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Link key={index} href={module.href}>
              <div className={`p-5 rounded-3xl bg-white dark:bg-[#17261c] border ${module.border} dark:border-[#263d2e] hover:shadow-md transition-all cursor-pointer flex items-start space-x-4 h-full relative group`}>
                <div className={`p-3 rounded-xl ${module.color} shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">{module.title}</h3>
                    {module.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {module.badge}
                      </span>
                    )}
                  </div>
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

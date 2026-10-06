import React from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Sparkles, Play, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Mini-games Luyện Tập • ChronoMind",
  description: "Các mini-games học tập tương tác: Quán Cơm Tấm, Giải Cứu Khỉ, Chim Chăm Chỉ, Luyện Đặt Câu",
};

export default function PracticeGamesHubPage() {
  const games = [
    {
      id: "com-tam",
      title: "Quán Cơm Tấm",
      emoji: "🍱",
      desc: "Vào vai chủ quán cơm tấm Sài Gòn, phục vụ đúng món ăn theo nghĩa của từ vựng hoặc khái niệm để kiếm tiền lời và giữ chân khách hàng.",
      badge: "PHẢN XẠ & TRÍ NHỚ",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      skills: ["Phản xạ nhanh", "Nhớ nghĩa từ", "Tăng độ tập trung"],
    },
    {
      id: "monkey-rescue",
      title: "Giải Cứu Khỉ",
      emoji: "🐒",
      desc: "Vượt qua các câu hỏi trắc nghiệm kiến thức để thu thập nải chuối vàng và giải cứu chú khỉ con vượt ngục an toàn.",
      badge: "TRẮC NGHIỆM VUI NHỘN",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      skills: ["Trắc nghiệm kiến thức", "Quyết định dưới áp lực", "Cải thiện độ chính xác"],
    },
    {
      id: "flappy-bird",
      title: "Chim Chăm Chỉ",
      emoji: "🐦",
      desc: "Điều khiển chú chim bay qua các cột chướng ngại vật bằng cách chọn đúng nghĩa hoặc đáp án chính xác.",
      badge: "TỐC ĐỘ CAO",
      badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
      skills: ["Tốc độ phản hồi", "Phản xạ thị giác", "Định vị nghĩa chuẩn"],
    },
    {
      id: "sentence-craft",
      title: "Luyện Đặt Câu (AI Writing)",
      emoji: "✍️",
      desc: "Luyện đặt câu hoàn chỉnh với các khái niệm hoặc từ vựng mới học, được AI chấm điểm ngữ pháp và nhận xét tức thì.",
      badge: "AI HỖ TRỢ",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      skills: ["Cấu trúc ngữ pháp", "Vận dụng ngữ cảnh", "Sửa lỗi tức thì"],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link href="/practice">
          <Button variant="ghost" size="icon" className="rounded-2xl text-[#526b5c] hover:text-[#192e22]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="p-3 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-2xl shadow-xs">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#192e22] dark:text-[#f0f7f2]">
            Mini-games Luyện Tập Tương Tác
          </h1>
          <p className="text-xs sm:text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Học tập chủ động kết hợp trò chơi phản xạ giúp biến việc ghi nhớ thành trải nghiệm thú vị
          </p>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {games.map((g) => (
          <div
            key={g.id}
            className="p-6 rounded-[28px] bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">{g.emoji}</span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${g.badgeColor}`}>
                  {g.badge}
                </span>
              </div>

              <h3 className="text-lg font-black text-[#192e22] dark:text-[#f0f7f2] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {g.title}
              </h3>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-2 leading-relaxed">
                {g.desc}
              </p>

              {/* Skill tags */}
              <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                {g.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    • {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5" />
                <span>+20 XP mỗi ván</span>
              </span>

              <Link href={`/practice/games/${g.id}`}>
                <Button className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl font-bold px-5 shadow-xs">
                  <Play className="w-4 h-4 mr-1.5 fill-white" />
                  Chơi ngay
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

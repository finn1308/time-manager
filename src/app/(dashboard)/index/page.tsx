"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  ListOrdered,
  Sliders,
  Layers,
  Gamepad2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Coins,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";
import { VocabIndexNav } from "@/components/vocab/vocab-index-nav";

export default function IndexHubPage() {
  const screens = [
    {
      id: "1",
      route: "/index/1",
      name: "Web 1: Lộ trình học (Roadmap Screen)",
      tag: "Bản đồ & Lộ trình",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      icon: Compass,
      gradient: "from-emerald-500 to-teal-700",
      description:
        "Giao diện tổng quan các khóa học & lộ trình chuẩn Luyện Từ (A1-A2, Cambridge IELTS, THPT QG, TOEIC). Có banner khóa đang ghim, bộ lọc danh mục & độ khó, thanh tìm kiếm và thẻ khóa học kèm % tiến độ.",
      features: [
        "Header & Breadcrumbs điều hướng chuẩn",
        "Banner khóa học ghim ưu tiên nổi bật",
        "Bộ lọc danh mục (THPT, IELTS, TOEIC, CEFR)",
        "Bộ lọc 3 thang đo độ khó: Dễ, Trung bình, Nâng cao",
        "Grid thẻ lộ trình kèm tiến độ realtime & nút vào học",
      ],
    },
    {
      id: "2",
      route: "/index/2",
      name: "Web 2: Chi tiết lộ trình / Danh sách bài học (Topic Set Overview)",
      tag: "Danh sách bài học",
      badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
      icon: ListOrdered,
      gradient: "from-sky-500 to-blue-700",
      description:
        "Giao diện hiển thị trọn bộ các bài học trong lộ trình (như Lời chào hỏi, Số đếm, Màu sắc...). Thanh công cụ với nút Ghim, BXH, Học ngắt quãng SM-2, mở khóa PRO bằng Xu Chrono.",
      features: [
        "Topic Header: Icon, tiêu đề, % hoàn thành, số từ",
        "Thanh nút bấm: Thêm từ vựng, Đã ghim toggle, BXH, Học ngắt quãng",
        "Grid danh sách bài học: Thẻ cúp vàng cho bài #1, số thứ tự cho bài khác",
        "Modal mở khóa PRO bằng Xu Chrono lưu trực tiếp database",
        "Nút 'Vào học' chuyển trực tiếp sang Web 3",
      ],
    },
    {
      id: "3",
      route: "/index/3",
      name: "Web 3: Cài đặt học & Bảng từ vựng (Lesson Detail & Mode Selection)",
      tag: "Cấu hình & Bảng từ",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      icon: Sliders,
      gradient: "from-purple-500 to-indigo-700",
      description:
        "Giao diện cấu hình bài học theo 3 bộ lọc (Trạng thái, Số lượng, Thứ tự), 6 thẻ gradient chọn chế độ luyện tập (+5 đến +20 Xu), và Data Table từ vựng chi tiết tích hợp loa phát âm Web Speech API.",
      features: [
        "3 dropdowns cấu hình: Trạng thái từ, Số lượng học, Thứ tự xuất hiện",
        "6 thẻ gradient chế độ luyện tập: Flashcard, Quiz, Listening, Typing, Ghép cặp, Đặc biệt",
        "Data Table từ vựng: Loa phát âm, phiên âm IPA, loại từ, giải nghĩa, ví dụ câu",
        "Đánh dấu sao từ vựng yêu thích & trạng thái thuộc realtime",
        "Modal popup trắc nghiệm & mini-games chuyên sâu",
      ],
    },
    {
      id: "4",
      route: "/index/4",
      name: "Web 4: Giao diện & Engine luyện tập (Interactive Study Engine)",
      tag: "Engine luyện tập",
      badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
      icon: Layers,
      gradient: "from-amber-500 to-orange-700",
      description:
        "Màn hình engine luyện tập tương tác đa năng: Flashcard lật 3D, Quiz trắc nghiệm 3 dạng câu hỏi, Listening nghe chép chính tả với hotkeys Ctrl+X, Typing gõ từ đảo chiều Anh-Việt, và Matching Game 5 trái tim.",
      features: [
        "Top bar chuẩn: Progress bar, bộ đếm câu, điểm thưởng Xu, nút Chơi lại",
        "Flashcard 3D flip: Phím tắt [Space], [Ctrl+S], [Ctrl+1/2], ô gõ nghĩa",
        "Listening: Tùy chỉnh tốc độ 1.0x/0.75x, hotkey [Ctrl+X], gợi ý [Ctrl+Space]",
        "Typing: Autofocus input, kiểm tra phím Enter, chuyển đổi chiều EN-VN",
        "Matching game: 5 trái tim, đếm ngược 60s, hiệu ứng ghép cặp",
      ],
    },
    {
      id: "5",
      route: "/index/5",
      name: "Web 5: Mini-games Arcade & Chế độ học đặc biệt (Special Modes)",
      tag: "Arcade Games HOT",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
      icon: Gamepad2,
      gradient: "from-rose-500 to-pink-700",
      description:
        "Không gian các mini-games luyện từ vựng độc quyền: Quán cơm tấm (nhận đơn gọi món tiếng Anh), Chim chăm chỉ (Flappy Bird arcade né chướng ngại), Luyện tập hỗn hợp, Đặt câu PRO và Giải cứu khỉ.",
      features: [
        "Quán cơm tấm: Khách hàng order từ vựng, chọn món đúng để tích Xu",
        "Chim chăm chỉ: Arcade canvas bay qua cột từ vựng đạt high score",
        "Luyện tập hỗn hợp: Kết hợp câu hỏi Flashcard + Quiz + Listening",
        "Luyện đặt câu: Ghép cụm từ thành câu hoàn chỉnh theo cấu trúc ngữ pháp",
        "Lưu kết quả học tập và cộng điểm Xu realtime vào tài khoản",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Navigation Index Bar */}
      <VocabIndexNav currentStep={1} />

      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white p-7 sm:p-9 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Chronomind • Luyện Từ Full-Stack Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Hệ Thống 5 Giao Diện Học Từ Vựng Độc Lập
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 font-medium leading-relaxed">
            Mỗi giao diện tương ứng với một màn hình web riêng biệt (từ <code className="bg-black/20 px-2 py-0.5 rounded text-amber-300 font-bold">/index/1</code> đến <code className="bg-black/20 px-2 py-0.5 rounded text-amber-300 font-bold">/index/5</code>), được kết nối trực tiếp với Database Prisma, lưu tiến độ realtime, hỗ trợ phím tắt bàn phím và gamification Xu Chrono.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/index/1"
              className="px-5 py-3 rounded-2xl bg-white text-emerald-800 text-xs font-black shadow-md hover:bg-emerald-50 transition-all flex items-center space-x-2 active:scale-95"
            >
              <span>Bắt đầu từ Web 1 (Lộ trình học)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href="/vocab/spaced-repetition"
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold backdrop-blur-xs transition-all flex items-center space-x-2"
            >
              <span>Thuật toán SM-2 Lặp ngắt quãng</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Screen Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>Danh Sách 5 Web Độc Lập</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              index/1 ➔ index/5
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => {
            const Icon = screen.icon;
            return (
              <div
                key={screen.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#18281d] border border-gray-200 dark:border-[#263d2e] shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${screen.gradient} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${screen.badgeColor}`}>
                      {screen.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {screen.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-3">
                      {screen.description}
                    </p>
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-1.5 pt-1">
                    {screen.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-[11px] text-gray-600 dark:text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="line-clamp-1">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href={screen.route}
                    className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white text-xs font-black transition-all flex items-center justify-center space-x-1.5 active:scale-98 shadow-2xs"
                  >
                    <span>Mở màn hình {screen.route}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

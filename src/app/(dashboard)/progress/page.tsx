import React from "react";
import Link from "next/link";
import { TrendingUp, BarChart3, Target, CheckCircle2, History, Briefcase, Award } from "lucide-react";

export default function ProgressHubPage() {
  const progressModules = [
    {
      title: "Thống kê (Analytics)",
      description: "Biểu đồ học tập, thời gian phân bổ và hiệu suất",
      href: "/analytics",
      icon: BarChart3,
      color: "bg-teal-100 text-teal-700",
      border: "border-teal-200"
    },
    {
      title: "Nhật ký phiên học",
      description: "Lịch sử các phiên tập trung Study Timer",
      href: "/study-sessions",
      icon: History,
      color: "bg-blue-100 text-blue-700",
      border: "border-blue-200"
    },
    {
      title: "Đánh giá tuần (Weekly Review)",
      description: "AI tổng kết kết quả và đề xuất cải thiện hàng tuần",
      href: "/weekly-review",
      icon: TrendingUp,
      color: "bg-indigo-100 text-indigo-700",
      border: "border-indigo-200"
    },
    {
      title: "Mục tiêu & OKRs",
      description: "Thiết lập và theo dõi mục tiêu học tập dài hạn",
      href: "/goals",
      icon: Target,
      color: "bg-rose-100 text-rose-700",
      border: "border-rose-200"
    },
    {
      title: "Thói quen (Habits & XP)",
      description: "Theo dõi thói quen tốt và tích lũy điểm kinh nghiệm",
      href: "/habits",
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-200"
    },
    {
      title: "Hồ sơ & Nghề nghiệp",
      description: "Xây dựng Portfolio và kỹ năng chuyên môn",
      href: "/career",
      icon: Briefcase,
      color: "bg-orange-100 text-orange-700",
      border: "border-orange-200"
    },
    {
      title: "Trung tâm Luyện tập (Practice Hub)",
      description: "Hệ thống ôn tập ngắt quãng và ngân hàng lỗi sai",
      href: "/practice",
      icon: Award,
      color: "bg-amber-100 text-amber-700",
      border: "border-amber-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-2xl">
          <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">Tiến độ (Progress)</h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Phân tích số liệu, đánh giá và thành tích học tập
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {progressModules.map((module, index) => {
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

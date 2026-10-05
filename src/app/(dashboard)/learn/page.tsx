import React from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, FileText, Library, Languages, Target, FileCheck, GitBranch, Brain } from "lucide-react";

export default function LearnHubPage() {
  const learningModules = [
    {
      title: "Chế độ Luyện thi (Exam Mode)",
      description: "Chiến lược ôn thi 5 giai đoạn, đo độ sẵn sàng và dự báo điểm số",
      href: "/exams",
      icon: Target,
      color: "bg-amber-100 text-amber-700",
      border: "border-amber-300 ring-2 ring-amber-500/20",
      badge: "TRỌNG TÂM"
    },
    {
      title: "Bài tập lớn & Đồ án (Assignments)",
      description: "Quản lý tiến độ đồ án và phân rã nhiệm vụ 5 bước bằng AI",
      href: "/academic/assignments",
      icon: FileCheck,
      color: "bg-blue-100 text-blue-700",
      border: "border-blue-200"
    },
    {
      title: "Cây tri thức & Tiên quyết (Knowledge Graph)",
      description: "Sơ đồ liên kết logic giữa các chuyên đề và cảnh báo điều kiện tiên quyết",
      href: "/academic/knowledge-graph",
      icon: GitBranch,
      color: "bg-purple-100 text-purple-700",
      border: "border-purple-200"
    },
    {
      title: "Hồ sơ Nhận thức AI (Learning Memory)",
      description: "Mô hình hóa trí nhớ, phản xạ và phân tích lỗi sai của sinh viên",
      href: "/academic/learning-profile",
      icon: Brain,
      color: "bg-teal-100 text-teal-700",
      border: "border-teal-200"
    },
    {
      title: "Học thuật & GPA (Academic OS)",
      description: "Theo dõi điểm số 4 năm, tín chỉ và quản lý kỳ học",
      href: "/academic",
      icon: GraduationCap,
      color: "bg-orange-100 text-orange-700",
      border: "border-orange-200"
    },
    {
      title: "Quản lý môn học (Subjects)",
      description: "Danh sách các môn học, đề cương và tài liệu liên quan",
      href: "/subjects",
      icon: Library,
      color: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-200"
    },
    {
      title: "Ghi chú & Wiki bài học",
      description: "Hệ thống quản lý kiến thức cá nhân kiểu Notion",
      href: "/notes",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-700",
      border: "border-indigo-200"
    },
    {
      title: "Lộ trình học từ vựng (LUYENTU)",
      description: "Các khóa học từ vựng được thiết kế chuẩn theo các cấp độ",
      href: "/vocab/courses/a1-0-3-0",
      icon: Languages,
      color: "bg-teal-100 text-teal-700",
      border: "border-teal-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
          <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">Học tập (Learn)</h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Khám phá kiến thức, lộ trình học và quản lý tài liệu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {learningModules.map((module, index) => {
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

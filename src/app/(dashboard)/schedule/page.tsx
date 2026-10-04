import React from "react";
import Link from "next/link";
import { Calendar, CheckSquare, Flame, Clock } from "lucide-react";

export default function ScheduleHubPage() {
  const scheduleModules = [
    {
      title: "Lịch học (Calendar)",
      description: "Xem và quản lý thời khóa biểu học tập",
      href: "/calendar",
      icon: Calendar,
      color: "bg-blue-100 text-blue-700",
      border: "border-blue-200"
    },
    {
      title: "Nhiệm vụ & Inbox",
      description: "Quản lý công việc cần làm, chia nhỏ nhiệm vụ",
      href: "/tasks",
      icon: CheckSquare,
      color: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-200"
    },
    {
      title: "Deadlines",
      description: "Theo dõi bài tập và báo động các hạn chót",
      href: "/deadlines",
      icon: Flame,
      color: "bg-red-100 text-red-700",
      border: "border-red-200"
    },
    {
      title: "Chặn thời gian (Time Blocking)",
      description: "Thiết lập các khung giờ học tập tập trung",
      href: "/blocked-slots",
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
      border: "border-amber-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
          <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">Lập lịch (Schedule)</h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Quản lý thời gian, nhiệm vụ và sự kiện học tập
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduleModules.map((module, index) => {
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

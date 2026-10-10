import React from "react";
import Link from "next/link";
import { ShieldCheck, Database, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminHubPage() {
  const user = await getCurrentUser();
  
  // In a real app, check for 'ADMIN' role here.
  // if (user?.role !== 'ADMIN') redirect("/");

  const adminModules = [
    {
      title: "Quản lý môn học & Luyện tập",
      description: "Quản lý môn học, mục tiêu và dữ liệu luyện tập",
      href: "/subjects",
      icon: Database,
      color: "bg-indigo-100 text-indigo-700",
      border: "border-indigo-200"
    },
    {
      title: "Quản trị người dùng",
      description: "Xem danh sách và phân quyền tài khoản (Demo)",
      href: "/admin/users",
      icon: Users,
      color: "bg-slate-100 text-slate-700",
      border: "border-slate-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-ink)]">Admin Console</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            Hệ thống quản trị nội dung dành cho Developer / Admin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Link key={index} href={module.href}>
              <div className={`p-5 rounded-3xl bg-[var(--bg-surface)] border ${module.border} dark:border-[#263d2e] hover:shadow-md transition-all cursor-pointer flex items-start space-x-4 h-full`}>
                <div className={`p-3 rounded-xl ${module.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-ink)] mb-1">{module.title}</h3>
                  <p className="text-xs text-[var(--text-subtle)]">{module.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

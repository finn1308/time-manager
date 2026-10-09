import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldCheck, User as UserIcon } from "lucide-react";

export const metadata = {
  title: "Admin - Quản trị người dùng",
};

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // In a real app, check for 'ADMIN' role here.
  // if (user.role !== 'ADMIN') redirect("/");

  // Fetch all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      xp: true,
      createdAt: true,
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <ShieldCheck className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">Quản trị người dùng</h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Danh sách tất cả người dùng trong hệ thống
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#526b5c] uppercase bg-[#f4f8f5] dark:bg-[#1d3024] dark:text-[#a3bda9] border-b border-[#dbe7dd] dark:border-[#263d2e]">
              <tr>
                <th className="px-6 py-4 font-semibold">Tài khoản</th>
                <th className="px-6 py-4 font-semibold">Vai trò</th>
                <th className="px-6 py-4 font-semibold">Kinh nghiệm (XP)</th>
                <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#dbe7dd] dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#1b2b1f] transition-colors last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-[#192e22] dark:text-[#f0f7f2]">{u.name || "Chưa cập nhật"}</div>
                        <div className="text-xs text-[#526b5c] dark:text-[#a3bda9]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-[#2d6a4f] dark:text-[#52b788]">
                    {u.xp} XP
                  </td>
                  <td className="px-6 py-4 text-[#526b5c] dark:text-[#a3bda9]">
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

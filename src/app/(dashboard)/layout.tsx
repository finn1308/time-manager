import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/notion/sidebar";
import { PipTimerProvider } from "@/components/timer/pip-timer-provider";
import { FloatingFallbackTimer } from "@/components/timer/floating-fallback-timer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch subjects for sidebar quick access
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      code: true,
      color: true,
      icon: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <PipTimerProvider>
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 flex bg-reference-grid">
        {/* Rounded Pill Sidebar */}
        <Sidebar user={user} subjects={subjects} />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-72 flex flex-col min-w-0 transition-all duration-300">
          <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Floating PIP / In-App Fallback Timer Widget */}
        <FloatingFallbackTimer />
      </div>
    </PipTimerProvider>
  );
}

import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/notion/sidebar";
import { TopBar } from "@/components/notion/top-bar";
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
    },
    orderBy: { priority: "desc" },
  });

  return (
    <PipTimerProvider>
      <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#101c14] text-[#192e22] dark:text-[#f0f7f2] flex bg-pastel-grid">
        {/* Rounded Pill Sidebar */}
        <Sidebar user={user} subjects={subjects} />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <TopBar user={user} />

          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Floating PIP / In-App Fallback Timer Widget */}
        <FloatingFallbackTimer />
      </div>
    </PipTimerProvider>
  );
}

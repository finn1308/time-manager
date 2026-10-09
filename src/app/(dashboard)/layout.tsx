import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/notion/sidebar";
import { TopBar } from "@/components/notion/top-bar";
import { PipTimerProvider } from "@/components/timer/pip-timer-provider";
import { FloatingFallbackTimer } from "@/components/timer/floating-fallback-timer";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch subjects for sidebar quick-start
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
      <div
        className="min-h-screen flex bg-pastel-grid"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-ink)",
        }}
      >
        {/* Sidebar (desktop) */}
        <Sidebar user={user} subjects={subjects} />

        {/* Main Content */}
        <div className="flex-1 lg:pl-[240px] flex flex-col min-w-0 w-full overflow-x-hidden transition-all duration-300">
          <TopBar user={user} />

          <main className="flex-1 max-w-[1440px] w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 transition-all">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Floating PIP / In-App Fallback Timer */}
        <FloatingFallbackTimer />
      </div>
    </PipTimerProvider>
  );
}

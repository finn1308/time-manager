"use client";

import React, { useState } from "react";
import { PracticeHeader } from "./practice-header";
import { PracticeHeroStats } from "./practice-hero-stats";
import { PracticeQuickAccess } from "./practice-quick-access";
import { PracticeFilterBar } from "./practice-filter-bar";
import { PracticePinnedCard } from "./practice-pinned-card";
import { PracticeCatalogGrid } from "./practice-catalog-grid";
import { PracticeGamesGrid } from "./practice-games-grid";
import { AddMistakeDialog } from "./add-mistake-dialog";
import { PracticeStats, PracticeSubject } from "./types";
import { useRouter } from "next/navigation";

interface PracticeWorkspaceProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    coins?: number;
    xp?: number;
  };
  stats: PracticeStats;
  activeSubject: PracticeSubject | null;
  subjects: PracticeSubject[];
  subjectSessionSummaries?: Record<
    string,
    { subjectId: string; totalSeconds: number; sessionCount: number }
  >;
}

export function PracticeWorkspace({
  user,
  stats,
  activeSubject,
  subjects,
  subjectSessionSummaries = {},
}: PracticeWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showAddMistake, setShowAddMistake] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* 1. Header with Title, Streaks, Coins & PIP Timer */}
      <PracticeHeader
        user={user}
        streakDays={stats.streakDays}
        activeSubject={activeSubject}
      />

      {/* 2. Top Stats Overview Banner matching LuyenTu screenshot */}
      <PracticeHeroStats
        stats={stats}
        activeSubject={activeSubject}
        allSubjects={subjects}
      />

      {/* 3. Quick Access 4-Card Row */}
      <PracticeQuickAccess onOpenAddMistake={() => setShowAddMistake(true)} />

      {/* 4. Pinned Practice Mode Card */}
      <PracticePinnedCard
        dueCount={stats.dueCount}
        totalReviewItems={stats.totalItems}
      />

      {/* 5. Filter Chips & Search Bar */}
      <PracticeFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        subjects={subjects}
      />

      {/* 6. Practice Modules & Subjects Grid */}
      <PracticeCatalogGrid
        stats={stats}
        subjects={subjects}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        subjectSessionSummaries={subjectSessionSummaries}
      />

      {/* 7. Mini-Games / Special Interactive Modes Grid */}
      <PracticeGamesGrid />

      {/* 8. Modal to add mistakes */}
      <AddMistakeDialog
        open={showAddMistake}
        onOpenChange={setShowAddMistake}
        subjects={subjects}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

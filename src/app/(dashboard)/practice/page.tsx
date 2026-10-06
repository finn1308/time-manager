import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PracticeWorkspace } from "@/components/practice/practice-workspace";
import { PracticeStats, PracticeSubject } from "@/components/practice/types";

export const metadata = {
  title: "Luyện tập (Practice Hub) • ChronoMind",
  description: "Trung tâm luyện tập chủ động, ôn tập ngắt quãng và mini-games tương tác",
};

export default async function PracticePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  // Fetch real database records in parallel
  const [dbSubjects, dbMistakes, dbFlashcards, dbSessions] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.mistakeRecord.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        subjectId: true,
        isResolved: true,
        nextReviewDate: true,
      },
    }),
    prisma.flashcard.findMany({
      where: { deck: { userId: user.id } },
      select: {
        id: true,
        status: true,
        nextReview: true,
      },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        subjectId: true,
        actualStart: true,
        actualDurationSeconds: true,
        source: true,
      },
      orderBy: { actualStart: "desc" },
    }),
  ]);

  // Active subject selection
  const activeSubject: PracticeSubject | null =
    dbSubjects.find((s) => s.code === "IELTS" || s.name.toLowerCase().includes("ielts")) ||
    dbSubjects[0] ||
    null;

  // Calculate Real Mistake & Review Stats
  const dueMistakes = dbMistakes.filter(
    (m) => !m.isResolved && (!m.nextReviewDate || m.nextReviewDate <= now)
  ).length;

  const resolvedMistakes = dbMistakes.filter((m) => m.isResolved).length;

  const dueFlashcards = dbFlashcards.filter(
    (f) => !f.nextReview || f.nextReview <= now || f.status === "LEARNING"
  ).length;

  const masteredFlashcards = dbFlashcards.filter((f) => f.status === "REVIEW").length;

  const totalItems = dbMistakes.length + dbFlashcards.length;
  const totalResolved = resolvedMistakes + masteredFlashcards;
  const totalDue = dueMistakes + dueFlashcards;

  const completionRate =
    totalItems > 0 ? Math.min(100, Math.round((totalResolved / totalItems) * 100)) : 100;

  // Calculate total practice seconds
  const practiceSessions = dbSessions.filter(
    (s) =>
      s.source === "PRACTICE_SESSION" ||
      s.source === "PRACTICE_VOCAB" ||
      s.source === "PIP_TIMER" ||
      s.source === "CALENDAR_CHECKBOX"
  );

  const totalPracticeSeconds = practiceSessions.reduce(
    (sum, s) => sum + (s.actualDurationSeconds || 0),
    0
  );

  // Group study sessions by subject
  const subjectSessionSummaries: Record<
    string,
    { subjectId: string; totalSeconds: number; sessionCount: number }
  > = {};

  for (const s of dbSessions) {
    if (s.subjectId) {
      if (!subjectSessionSummaries[s.subjectId]) {
        subjectSessionSummaries[s.subjectId] = {
          subjectId: s.subjectId,
          totalSeconds: 0,
          sessionCount: 0,
        };
      }
      subjectSessionSummaries[s.subjectId].totalSeconds += s.actualDurationSeconds || 0;
      subjectSessionSummaries[s.subjectId].sessionCount += 1;
    }
  }

  // Calculate 7-day streak indicators
  const streakWeekDays = [false, false, false, false, false, false, false];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - ((today.getDay() + 6) % 7) + i);
    const dayStart = new Date(d.setHours(0, 0, 0, 0));
    const dayEnd = new Date(d.setHours(23, 59, 59, 999));

    const hadSession = dbSessions.some(
      (s) => s.actualStart >= dayStart && s.actualStart <= dayEnd
    );
    streakWeekDays[i] = hadSession;
  }

  // Calculate streak days count
  let calculatedStreak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let d = 0; d < 30; d++) {
    const start = new Date(checkDate);
    start.setDate(checkDate.getDate() - d);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const active = dbSessions.some((s) => s.actualStart >= start && s.actualStart <= end);
    if (active) {
      calculatedStreak++;
    } else if (d > 0) {
      break;
    }
  }

  const streakDays = Math.max(1, calculatedStreak);

  const stats: PracticeStats = {
    totalItems,
    dueCount: totalDue,
    resolvedCount: totalResolved,
    mistakeCount: dbMistakes.length,
    streakDays,
    streakWeekDays,
    totalPracticeSeconds,
    coins: user.coins ?? 100,
    completionRate,
  };

  const formattedSubjects: PracticeSubject[] = dbSubjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    color: s.color,
  }));

  return (
    <PracticeWorkspace
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        coins: user.coins ?? 100,
      }}
      stats={stats}
      activeSubject={
        activeSubject
          ? {
              id: activeSubject.id,
              name: activeSubject.name,
              code: activeSubject.code,
              color: activeSubject.color,
            }
          : null
      }
      subjects={formattedSubjects}
      subjectSessionSummaries={subjectSessionSummaries}
    />
  );
}

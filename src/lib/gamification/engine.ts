import { prisma } from "@/lib/prisma";

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  xpToNextLevel: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "STUDY" | "CONSISTENCY" | "MASTERY" | "PRODUCTIVITY";
  maxProgress: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "FIRST_STEP",
    name: "Bước khởi đầu",
    description: "Hoàn thành phiên học tập trung đầu tiên",
    icon: "Footprints",
    category: "STUDY",
    maxProgress: 1,
  },
  {
    id: "POMODORO_10",
    name: "Chiến binh Pomodoro",
    description: "Hoàn thành 10 phiên Pomodoro tập trung",
    icon: "Flame",
    category: "STUDY",
    maxProgress: 10,
  },
  {
    id: "POMODORO_50",
    name: "Bậc thầy Tập trung",
    description: "Tích lũy 50 phiên học tập trung",
    icon: "Zap",
    category: "STUDY",
    maxProgress: 50,
  },
  {
    id: "STREAK_3",
    name: "Bắt nhịp Kỷ luật",
    description: "Duy trì chuỗi học 3 ngày liên tiếp",
    icon: "Target",
    category: "CONSISTENCY",
    maxProgress: 3,
  },
  {
    id: "STREAK_7",
    name: "Chiến binh Kỷ luật",
    description: "Duy trì chuỗi học 7 ngày liên tiếp",
    icon: "Award",
    category: "CONSISTENCY",
    maxProgress: 7,
  },
  {
    id: "STREAK_30",
    name: "Huyền thoại Bền bỉ",
    description: "Duy trì chuỗi học 30 ngày liên tục",
    icon: "Crown",
    category: "CONSISTENCY",
    maxProgress: 30,
  },
  {
    id: "TASK_CRUSHER",
    name: "Diệt Deadline",
    description: "Hoàn thành 15 nhiệm vụ học tập",
    icon: "CheckCircle",
    category: "PRODUCTIVITY",
    maxProgress: 15,
  },
  {
    id: "FLASHCARD_WIZARD",
    name: "Siêu trí nhớ",
    description: "Ôn tập 50 lượt thẻ ghi nhớ Spaced Repetition",
    icon: "Brain",
    category: "MASTERY",
    maxProgress: 50,
  },
  {
    id: "HABIT_CHAMPION",
    name: "Bản lĩnh Thói quen",
    description: "Tích lũy 25 lượt tích thói quen hàng ngày",
    icon: "CheckCheck",
    category: "CONSISTENCY",
    maxProgress: 25,
  },
  {
    id: "NIGHT_OWL",
    name: "Cú đêm Chăm chỉ",
    description: "Hoàn thành phiên học vào ban đêm (sau 22h00)",
    icon: "Moon",
    category: "STUDY",
    maxProgress: 1,
  },
  {
    id: "EARLY_BIRD",
    name: "Hừng đông Tỏa sáng",
    description: "Hoàn thành phiên học vào sáng sớm (trước 07h00)",
    icon: "Sun",
    category: "STUDY",
    maxProgress: 1,
  },
];

const LEVEL_TITLES: { [level: number]: string } = {
  1: "Tân binh Khám phá",
  2: "Học viên Chăm chỉ",
  3: "Học giả Kiên trì",
  4: "Chiến binh Tập trung",
  5: "Chuyên gia Kỷ luật",
  6: "Bậc thầy Pomodoro",
  7: "Hiền triết Chrono",
  8: "Đại kiện tướng Tư duy",
  9: "Chiêm tinh gia Tri thức",
  10: "Huyền thoại Siêu trí tuệ",
};

/**
 * Calculates level and progress info from total XP.
 * Formula: Level = floor(sqrt(xp / 60)) + 1
 * Each level requires incrementally more XP.
 */
export function calculateLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp || 0);
  const level = Math.floor(Math.sqrt(safeXp / 60)) + 1;
  const currentLevelMinXp = Math.round(Math.pow(level - 1, 2) * 60);
  const nextLevelMinXp = Math.round(Math.pow(level, 2) * 60);
  
  const span = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const earnedInLevel = safeXp - currentLevelMinXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInLevel / span) * 100)));
  const xpToNextLevel = Math.max(0, nextLevelMinXp - safeXp);

  const title = LEVEL_TITLES[level] || `Huyền thoại Siêu trí tuệ (Cấp ${level})`;

  return {
    level,
    title,
    currentXp: safeXp,
    currentLevelXp: currentLevelMinXp,
    nextLevelXp: nextLevelMinXp,
    progressPercent,
    xpToNextLevel,
  };
}

/**
 * Awards XP to user
 */
export async function awardUserXp(userId: string, amount: number, reason?: string) {
  if (amount <= 0) return;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: amount },
    },
    select: { id: true, xp: true, streakDays: true },
  });
  return user;
}

/**
 * Evaluates all user achievements dynamically from database metrics
 */
export async function getUserGamificationData(userId: string) {
  const [
    user,
    sessionStats,
    tasksCompletedCount,
    flashcardReviewsCount,
    habitLogsCount,
    nightSessionsCount,
    earlySessionsCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, streakDays: true, createdAt: true },
    }),
    prisma.studySession.aggregate({
      where: { userId, status: "COMPLETED" },
      _count: { id: true },
      _sum: { actualDurationMinutes: true },
    }),
    prisma.task.count({
      where: { userId, status: "DONE" },
    }),
    prisma.flashcardReview.count({
      where: { userId },
    }),
    prisma.habitLog.count({
      where: { habit: { userId } },
    }),
    // Sessions completed after 22:00
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "StudySession"
      WHERE "userId" = ${userId}
        AND "status" = 'COMPLETED'
        AND EXTRACT(HOUR FROM "startTime" AT TIME ZONE 'Asia/Ho_Chi_Minh') >= 22
    `.catch(() => [{ count: BigInt(0) }]),
    // Sessions completed before 07:00
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "StudySession"
      WHERE "userId" = ${userId}
        AND "status" = 'COMPLETED'
        AND EXTRACT(HOUR FROM "startTime" AT TIME ZONE 'Asia/Ho_Chi_Minh') < 7
    `.catch(() => [{ count: BigInt(0) }]),
  ]);

  const totalXp = user?.xp || 0;
  const streakDays = user?.streakDays || 1;
  const completedSessions = sessionStats._count.id || 0;
  const totalStudyMinutes = sessionStats._sum.actualDurationMinutes || 0;
  const nightOwlCount = Number(nightSessionsCount[0]?.count || 0);
  const earlyBirdCount = Number(earlySessionsCount[0]?.count || 0);

  const levelInfo = calculateLevelInfo(totalXp);

  // Compute progress for each badge
  const badges = BADGE_DEFINITIONS.map((badge) => {
    let currentProgress = 0;
    switch (badge.id) {
      case "FIRST_STEP":
        currentProgress = completedSessions;
        break;
      case "POMODORO_10":
        currentProgress = completedSessions;
        break;
      case "POMODORO_50":
        currentProgress = completedSessions;
        break;
      case "STREAK_3":
        currentProgress = streakDays;
        break;
      case "STREAK_7":
        currentProgress = streakDays;
        break;
      case "STREAK_30":
        currentProgress = streakDays;
        break;
      case "TASK_CRUSHER":
        currentProgress = tasksCompletedCount;
        break;
      case "FLASHCARD_WIZARD":
        currentProgress = flashcardReviewsCount;
        break;
      case "HABIT_CHAMPION":
        currentProgress = habitLogsCount;
        break;
      case "NIGHT_OWL":
        currentProgress = nightOwlCount;
        break;
      case "EARLY_BIRD":
        currentProgress = earlyBirdCount;
        break;
    }

    const isUnlocked = currentProgress >= badge.maxProgress;
    const progressPercent = Math.min(100, Math.round((currentProgress / badge.maxProgress) * 100));

    return {
      ...badge,
      currentProgress,
      isUnlocked,
      progressPercent,
    };
  });

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return {
    user: {
      id: userId,
      streakDays,
      totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
      completedSessions,
      completedTasks: tasksCompletedCount,
      flashcardReviews: flashcardReviewsCount,
      habitLogs: habitLogsCount,
    },
    level: levelInfo,
    badges,
    badgeStats: {
      unlockedCount,
      totalBadges: badges.length,
      completionRate: Math.round((unlockedCount / badges.length) * 100),
    },
  };
}

import { prisma } from "@/lib/prisma";

export interface GoalForecastItem {
  id: string;
  title: string;
  subjectName: string;
  subjectColor: string;
  targetDate: string | null;
  daysRemaining: number;
  targetHours: number;
  completedHours: number;
  remainingHours: number;
  currentVelocityHoursPerDay: number;
  requiredVelocityHoursPerDay: number;
  completionProbabilityPercent: number;
  riskStatus: "ON_TRACK" | "AT_RISK" | "HIGH_RISK" | "BEHIND";
  riskLabel: string;
  projectedCompletionDate: string;
  recommendation: string;
}

export interface SystemForecast {
  averageDailyVelocityHours: number;
  totalActiveGoals: number;
  onTrackCount: number;
  atRiskCount: number;
  highRiskCount: number;
  goals: GoalForecastItem[];
}

export async function calculateProgressForecast(userId: string): Promise<SystemForecast> {
  const now = new Date();
  const past14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 1. Calculate user's actual study velocity over the last 14 days
  const recentSessions = await prisma.studySession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      actualEnd: { gte: past14Days },
    },
    select: {
      actualDurationSeconds: true,
      subjectId: true,
    },
  });

  const totalStudySeconds = recentSessions.reduce(
    (acc, s) => acc + (s.actualDurationSeconds || 0),
    0
  );
  const totalStudyHours14D = totalStudySeconds / 3600;
  const overallDailyVelocity = Math.max(0.2, Math.round((totalStudyHours14D / 14) * 10) / 10);

  // Calculate velocity per subject
  const subjectVelocityMap: Record<string, number> = {};
  for (const s of recentSessions) {
    if (s.subjectId) {
      const h = (s.actualDurationSeconds || 0) / 3600;
      subjectVelocityMap[s.subjectId] = (subjectVelocityMap[s.subjectId] || 0) + h;
    }
  }
  for (const k in subjectVelocityMap) {
    subjectVelocityMap[k] = Math.max(0.1, Math.round((subjectVelocityMap[k] / 14) * 10) / 10);
  }

  // 2. Fetch active Goals & Milestones
  const activeGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "IN_PROGRESS", "TODO"] },
    },
    include: {
      subject: true,
      milestoneRecords: true,
      tasks: true,
    },
    orderBy: { deadline: "asc" },
  });

  const forecastItems: GoalForecastItem[] = [];

  for (const goal of activeGoals) {
    const targetDate = goal.deadline ? new Date(goal.deadline) : null;
    const daysRemaining = targetDate
      ? Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 30; // default 30 days if unspecified

    // Estimate total required hours (from milestones or targetHours, default 20 hours per goal)
    const targetHours = goal.targetHours || Math.max(10, goal.milestoneRecords.length * 4);
    const completedMilestones = goal.milestoneRecords.filter((m) => m.isCompleted).length;
    const milestoneRatio = goal.milestoneRecords.length > 0 ? completedMilestones / goal.milestoneRecords.length : 0;
    const completedHours = Math.round(targetHours * milestoneRatio * 10) / 10;
    const remainingHours = Math.max(0.5, Math.round((targetHours - completedHours) * 10) / 10);

    // Subject velocity or shared overall velocity
    const subjectVelocity = goal.subjectId && subjectVelocityMap[goal.subjectId]
      ? subjectVelocityMap[goal.subjectId]
      : overallDailyVelocity;

    const requiredVelocity = Math.round((remainingHours / daysRemaining) * 10) / 10;

    // Probability & Risk Estimation
    let ratio = subjectVelocity / Math.max(0.1, requiredVelocity);
    let probability = Math.min(98, Math.max(5, Math.round(ratio * 75)));
    let riskStatus: "ON_TRACK" | "AT_RISK" | "HIGH_RISK" | "BEHIND";
    let riskLabel: string;
    let recommendation: string;

    if (targetDate && targetDate.getTime() < now.getTime()) {
      riskStatus = "BEHIND";
      riskLabel = "Quá hạn";
      probability = 10;
      recommendation = "Mục tiêu đã quá hạn. Cần gia hạn target date hoặc hoàn thành khẩn cấp.";
    } else if (ratio >= 1.1) {
      riskStatus = "ON_TRACK";
      riskLabel = "Đúng tiến độ";
      probability = Math.min(96, Math.max(80, Math.round(70 + ratio * 15)));
      recommendation = "Tiến độ rất tốt! Tiếp tục duy trì nhịp học hiện tại.";
    } else if (ratio >= 0.75) {
      riskStatus = "AT_RISK";
      riskLabel = "Có rủi ro trễ";
      probability = Math.round(55 + (ratio - 0.75) * 60);
      const extraMinutes = Math.round((requiredVelocity - subjectVelocity) * 60);
      recommendation = `Cần tăng thêm ~${extraMinutes} phút học mỗi ngày để bảo đảm kịp mục tiêu.`;
    } else {
      riskStatus = "HIGH_RISK";
      riskLabel = "Nguy cơ trễ cao";
      probability = Math.max(15, Math.round(ratio * 40));
      const extraHours = Math.round((requiredVelocity - subjectVelocity) * 10) / 10;
      recommendation = `Thiếu hụt đáng kể (~${extraHours} giờ/ngày). Hãy dùng AI Scheduler để bổ sung phiên học tập trung.`;
    }

    // Projected completion date
    const projectedDays = Math.ceil(remainingHours / Math.max(0.1, subjectVelocity));
    const projectedDate = new Date(now.getTime() + projectedDays * 24 * 60 * 60 * 1000);
    const projectedDateStr = projectedDate.toISOString().split("T")[0];

    forecastItems.push({
      id: goal.id,
      title: goal.title,
      subjectName: goal.subject?.name || "Chung",
      subjectColor: goal.subject?.color || "#2d6a4f",
      targetDate: targetDate ? targetDate.toISOString().split("T")[0] : null,
      daysRemaining,
      targetHours,
      completedHours,
      remainingHours,
      currentVelocityHoursPerDay: subjectVelocity,
      requiredVelocityHoursPerDay: requiredVelocity,
      completionProbabilityPercent: probability,
      riskStatus,
      riskLabel,
      projectedCompletionDate: projectedDateStr,
      recommendation,
    });
  }

  const onTrackCount = forecastItems.filter((f) => f.riskStatus === "ON_TRACK").length;
  const atRiskCount = forecastItems.filter((f) => f.riskStatus === "AT_RISK").length;
  const highRiskCount = forecastItems.filter((f) => f.riskStatus === "HIGH_RISK" || f.riskStatus === "BEHIND").length;

  return {
    averageDailyVelocityHours: overallDailyVelocity,
    totalActiveGoals: forecastItems.length,
    onTrackCount,
    atRiskCount,
    highRiskCount,
    goals: forecastItems,
  };
}

import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { callGeminiGenerate } from "@/lib/ai/gemini";
import { fromZonedTime } from "date-fns-tz";
import { VIETNAM_TIMEZONE } from "@/lib/date-utils";

export async function generateWeeklyReview(userId: string, weekStartDate: string, weekEndDate: string) {
  // Convert weekStartDate and weekEndDate to UTC dates for querying
  const startUTC = fromZonedTime(`${weekStartDate}T00:00:00`, VIETNAM_TIMEZONE);
  const endUTC = fromZonedTime(`${weekEndDate}T23:59:59.999`, VIETNAM_TIMEZONE);

  // 1. Gather all weekly data
  const [
    plannedEvents,
    completedSessions,
    completedTasksCount,
    allGoals,
    upcomingDeadlinesCount,
    userHabitLogsCount,
    subjects,
    userApiKeyRecord,
  ] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { gte: startUTC, lte: endUTC },
        type: { in: ["STUDY", "SELF_STUDY"] },
      },
      include: { subject: true },
    }),
    prisma.studySession.findMany({
      where: {
        userId,
        status: "COMPLETED",
        actualStart: { gte: startUTC, lte: endUTC },
      },
      include: { subject: true },
    }),
    prisma.task.count({
      where: {
        userId,
        status: "DONE",
        completedAt: { gte: startUTC, lte: endUTC },
      },
    }),
    prisma.goal.findMany({
      where: { userId },
      include: { milestoneRecords: true },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { not: "DONE" },
        deadline: {
          gte: endUTC,
          lte: new Date(endUTC.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.habitLog.count({
      where: {
        habit: { userId },
        createdAt: { gte: startUTC, lte: endUTC },
      },
    }),
    prisma.subject.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, code: true },
    }),
    prisma.userApiKey.findFirst({
      where: { userId, provider: "GEMINI", isActive: true },
    }),
  ]);

  // 2. Compute Planned & Actual Hours
  let plannedMinutes = 0;
  for (const ev of plannedEvents) {
    const dur = Math.max(0, (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 60));
    plannedMinutes += dur;
  }
  const plannedHours = Math.round((plannedMinutes / 60) * 10) / 10;

  let actualSeconds = 0;
  for (const s of completedSessions) {
    actualSeconds += s.actualDurationSeconds || 0;
  }
  const actualHours = Math.round((actualSeconds / 3600) * 10) / 10;
  const completionRate = plannedHours > 0
    ? Math.min(100, Math.round((actualHours / plannedHours) * 100))
    : actualHours > 0 ? 100 : 0;

  // Compute breakdown per subject
  const subjectMap: Record<string, { name: string; color: string; plannedHours: number; actualHours: number }> = {};
  for (const sub of subjects) {
    subjectMap[sub.id] = {
      name: sub.name,
      color: sub.color || "#2d6a4f",
      plannedHours: 0,
      actualHours: 0,
    };
  }

  for (const ev of plannedEvents) {
    if (ev.subjectId && subjectMap[ev.subjectId]) {
      const dur = Math.max(0, (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 3600));
      subjectMap[ev.subjectId].plannedHours = Math.round((subjectMap[ev.subjectId].plannedHours + dur) * 10) / 10;
    }
  }

  for (const s of completedSessions) {
    if (s.subjectId && subjectMap[s.subjectId]) {
      const dur = (s.actualDurationSeconds || 0) / 3600;
      subjectMap[s.subjectId].actualHours = Math.round((subjectMap[s.subjectId].actualHours + dur) * 10) / 10;
    }
  }

  const subjectStatsList = Object.values(subjectMap).filter((s) => s.plannedHours > 0 || s.actualHours > 0);
  const completedGoalsCount = allGoals.filter((g) => g.status === "COMPLETED").length;
  const totalGoalsCount = allGoals.length;

  // 3. Generate AI Insights
  let aiInsights: any = null;

  let apiKey: string | undefined = undefined;
  if (userApiKeyRecord?.encryptedKey && userApiKeyRecord?.iv && userApiKeyRecord?.authTag) {
    apiKey = decryptApiKey(userApiKeyRecord.encryptedKey, userApiKeyRecord.iv, userApiKeyRecord.authTag);
  } else if (process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (apiKey) {
    try {
      const prompt = `Bạn là ChronoMind AI Study Coach. Hãy viết báo cáo phản tỉnh và đánh giá học tập tuần (Weekly Review) cho học sinh dựa trên dữ liệu sau:
- Khoảng thời gian: ${weekStartDate} đến ${weekEndDate}
- Thời gian học lên lịch (Planned): ${plannedHours} giờ
- Thời gian học thực tế (Actual): ${actualHours} giờ
- Tỷ lệ hoàn thành: ${completionRate}%
- Số phiên học hoàn thành: ${completedSessions.length} phiên
- Nhiệm vụ (Task) đã làm xong: ${completedTasksCount}
- Thói quen (Habit) tích lũy: ${userHabitLogsCount} lượt
- Thống kê môn học: ${JSON.stringify(subjectStatsList)}
- Mục tiêu hoàn thành: ${completedGoalsCount}/${totalGoalsCount}
- Hạn chót sắp tới tuần sau: ${upcomingDeadlinesCount}

YÊU CẦU: Trả về ĐÚNG ĐỊNH DẠNG JSON (không bọc markdown, không thừa chữ):
{
  "summary": "Tóm tắt tổng quan tuần bằng tiếng Việt (2-3 câu khích lệ, phân tích tính kỷ luật và nhịp học)",
  "keyAchievements": ["Thành tựu 1", "Thành tựu 2", "Thành tựu 3"],
  "improvementAreas": ["Điểm cần tối ưu 1", "Điểm cần tối ưu 2"],
  "nextWeekAdvice": "Lời khuyên chiến lược cho tuần tới (phân bổ thời gian, môn cần ưu tiên)",
  "recommendedHoursNextWeek": ${Math.max(10, Math.round(actualHours * 1.1))}
}`;

      const res = await callGeminiGenerate({
        apiKey,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        },
      });

      const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
      aiInsights = JSON.parse(cleaned);
    } catch (err) {
      console.warn("AI generation failed, fallback to rule-based insights:", err);
    }
  }

  // Fallback rule-based insights if AI was not available
  if (!aiInsights) {
    let summaryText = "";
    if (completionRate >= 85) {
      summaryText = `Một tuần học tập xuất sắc! Bạn đã hoàn thành ${actualHours}h trên ${plannedHours}h kế hoạch (${completionRate}%), duy trì tính kỷ luật rất cao.`;
    } else if (completionRate >= 60) {
      summaryText = `Tuần học tập khá tốt với ${actualHours} giờ thực học (${completionRate}% kế hoạch). Một số phiên bị gián đoạn nhưng nhìn chung bạn vẫn giữ được đà tiến triển.`;
    } else {
      summaryText = `Tuần này bạn ghi nhận ${actualHours}h học (${completionRate}% kế hoạch). Hãy xem lại các khung giờ trống và dùng tính năng AI Rescheduler để sắp xếp lại nhịp học.`;
    }

    aiInsights = {
      summary: summaryText,
      keyAchievements: [
        `Hoàn thành ${completedSessions.length} phiên học tập trung`,
        `Giải quyết dứt điểm ${completedTasksCount} nhiệm vụ học tập`,
        `Tích lũy ${userHabitLogsCount} lượt thói quen hàng ngày`,
      ],
      improvementAreas: [
        actualHours < plannedHours
          ? `Còn thiếu ${Math.round((plannedHours - actualHours) * 10) / 10} giờ so với kế hoạch ban đầu`
          : "Tối ưu hóa các khoảng nghỉ ngắn để tránh quá tải",
        upcomingDeadlinesCount > 0
          ? `Có ${upcomingDeadlinesCount} deadline sắp đến trong 7 ngày tới cần lên lịch sớm`
          : "Tiếp tục duy trì cân bằng giữa các môn học",
      ],
      nextWeekAdvice: `Tuần tới nên đặt mục tiêu khoảng ${Math.max(8, Math.round(actualHours * 1.1))} giờ tự học và chia đều vào các khung giờ năng lượng cao.`,
      recommendedHoursNextWeek: Math.max(10, Math.round(actualHours * 1.1)),
    };
  }

  // 4. Upsert into database
  const review = await prisma.weeklyReview.upsert({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate,
      },
    },
    create: {
      userId,
      weekStartDate,
      weekEndDate,
      plannedHours,
      actualHours,
      completionRate,
      completedGoals: completedGoalsCount,
      totalGoals: totalGoalsCount,
      upcomingDeadlines: upcomingDeadlinesCount,
      subjectStatsJson: JSON.stringify(subjectStatsList),
      aiInsightsJson: JSON.stringify(aiInsights),
      nextWeekPlanJson: JSON.stringify({
        recommendedHours: aiInsights.recommendedHoursNextWeek || 15,
        targetSubjects: subjectStatsList.map((s) => ({ name: s.name, color: s.color })),
      }),
    },
    update: {
      weekEndDate,
      plannedHours,
      actualHours,
      completionRate,
      completedGoals: completedGoalsCount,
      totalGoals: totalGoalsCount,
      upcomingDeadlines: upcomingDeadlinesCount,
      subjectStatsJson: JSON.stringify(subjectStatsList),
      aiInsightsJson: JSON.stringify(aiInsights),
      nextWeekPlanJson: JSON.stringify({
        recommendedHours: aiInsights.recommendedHoursNextWeek || 15,
        targetSubjects: subjectStatsList.map((s) => ({ name: s.name, color: s.color })),
      }),
    },
  });

  return review;
}

import { prisma } from "../prisma";

export interface LearningProfileData {
  overallLevel: string;
  strengths: string[];
  weaknesses: string[];
  retentionRate: number;
  learningSpeed: number;
  preferredDurationMins: number;
  preferredTimeOfDay: string;
  frequentMistakeTypes: Array<{ type: string; count: number; label: string }>;
  subjectMastery: Record<string, { name: string; mastery: number; weakTopics: string[]; strongTopics: string[] }>;
  retentionRates: Record<string, number>;
  cognitiveSummary: string;
  lastUpdated: string;
}

export async function getUserLearningMemory(userId: string): Promise<LearningProfileData> {
  let memory = await prisma.userLearningMemory.findUnique({
    where: { userId },
  });

  if (!memory) {
    // Automatically synthesize initial memory from actual user activity
    memory = await synthesizeAndSaveLearningMemory(userId);
  }

  const strengths: string[] = safeJsonParse(memory.strengthsJson, []);
  const weaknesses: string[] = safeJsonParse(memory.weaknessesJson, []);
  const frequentMistakeTypes = safeJsonParse(memory.frequentMistakeTypesJson, []);
  const subjectMastery = safeJsonParse(memory.subjectMasteryJson, {});
  const retentionRates = safeJsonParse(memory.retentionRatesJson, {});

  return {
    overallLevel: memory.overallLevel,
    strengths,
    weaknesses,
    retentionRate: memory.retentionRate,
    learningSpeed: memory.learningSpeed,
    preferredDurationMins: memory.preferredDurationMins,
    preferredTimeOfDay: memory.preferredTimeOfDay,
    frequentMistakeTypes,
    subjectMastery,
    retentionRates,
    cognitiveSummary: memory.cognitiveSummary || "Hệ thống đang liên tục thu thập dữ liệu học tập để hoàn thiện hồ sơ nhận thức của bạn.",
    lastUpdated: memory.updatedAt.toISOString(),
  };
}

export async function synthesizeAndSaveLearningMemory(userId: string) {
  // 1. Fetch user subjects & quiz attempts
  const [subjects, quizAttempts, mistakes, flashcardReviews, vocabMasteries, studySessions] = await Promise.all([
    prisma.subject.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, code: true, priority: true, targetHours: true, completedHours: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    prisma.mistakeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.flashcardReview.findMany({
      where: { userId },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    }),
    prisma.userVocabularyMastery.findMany({
      where: { userId },
      take: 100,
    }),
    prisma.studySession.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { actualStart: "desc" },
      take: 30,
    }),
  ]);

  // Calculate retention rate from flashcard reviews (rating >= 3 is good retention)
  let retentionRate = 0.82;
  if (flashcardReviews.length > 0) {
    const rememberedCount = flashcardReviews.filter((r) => r.rating >= 3).length;
    retentionRate = Math.round((rememberedCount / flashcardReviews.length) * 100) / 100;
  }

  // Calculate frequent mistake types
  const mistakeTypeCounts: Record<string, number> = {};
  mistakes.forEach((m) => {
    mistakeTypeCounts[m.errorType] = (mistakeTypeCounts[m.errorType] || 0) + 1;
  });

  const errorLabels: Record<string, string> = {
    KNOWLEDGE_GAP: "Lỗ hổng kiến thức",
    MISUNDERSTANDING: "Hiểu sai khái niệm",
    CARELESS: "Bất cẩn / Đọc lướt",
    MEMORY_FAILURE: "Quên sau thời gian dài",
    CALCULATION: "Sai sót tính toán",
    VOCABULARY: "Nhầm lẫn từ vựng",
    CONCEPT_CONFUSION: "Nhầm lẫn định lý / quy tắc",
  };

  const frequentMistakeTypes = Object.entries(mistakeTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      label: errorLabels[type] || type,
    }));

  // Analyze preferred study time & duration from actual sessions
  let preferredDurationMins = 45;
  let preferredTimeOfDay = "EVENING";

  if (studySessions.length > 0) {
    const avgDuration = Math.round(
      studySessions.reduce((acc, s) => acc + (s.actualDurationSeconds || 0), 0) /
        studySessions.length /
        60
    );
    if (avgDuration > 10 && avgDuration < 180) preferredDurationMins = avgDuration;

    const hourBuckets = { MORNING: 0, AFTERNOON: 0, EVENING: 0, NIGHT: 0 };
    studySessions.forEach((s) => {
      const h = new Date(s.actualStart).getHours();
      if (h >= 5 && h < 12) hourBuckets.MORNING++;
      else if (h >= 12 && h < 18) hourBuckets.AFTERNOON++;
      else if (h >= 18 && h < 23) hourBuckets.EVENING++;
      else hourBuckets.NIGHT++;
    });

    const topBucket = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
    if (topBucket && topBucket[1] > 0) preferredTimeOfDay = topBucket[0];
  }

  // Calculate subject mastery
  const subjectMastery: Record<string, { name: string; mastery: number; weakTopics: string[]; strongTopics: string[] }> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  subjects.forEach((sub) => {
    const subMistakes = mistakes.filter((m) => m.subjectId === sub.id);
    const subQuizzes = quizAttempts.filter((q) => q.score !== undefined); // approx
    let mastery = 0.7; // baseline

    if (subMistakes.length > 3) mastery -= 0.2;
    if (subMistakes.length > 7) mastery -= 0.15;

    const weakTopics = Array.from(new Set(subMistakes.map((m) => m.concept || m.topic).filter(Boolean))) as string[];
    const strongTopics: string[] = [];

    if (mastery >= 0.75) {
      strengths.push(sub.name);
      strongTopics.push("Kiến thức nền tảng vững");
    } else {
      weaknesses.push(sub.name);
    }

    subjectMastery[sub.id] = {
      name: sub.name,
      mastery: Math.max(0.1, Math.min(1.0, Math.round(mastery * 100) / 100)),
      weakTopics: weakTopics.slice(0, 5),
      strongTopics,
    };
  });

  const cognitiveSummary = `Sinh viên có khả năng tập trung tốt nhất vào buổi ${
    preferredTimeOfDay === "MORNING"
      ? "sáng (5:00 - 12:00)"
      : preferredTimeOfDay === "AFTERNOON"
      ? "chiều (12:00 - 18:00)"
      : "tối (18:00 - 23:00)"
  } với thời lượng phiên tối ưu khoảng ${preferredDurationMins} phút. Tỷ lệ duy trì trí nhớ đạt ${Math.round(
    retentionRate * 100
  )}%. ${
    frequentMistakeTypes.length > 0
      ? `Lỗi sai thường gặp nhất là: ${frequentMistakeTypes[0].label}.`
      : "Chưa ghi nhận nhiều lỗi sai lặp lại."
  }`;

  return await prisma.userLearningMemory.upsert({
    where: { userId },
    create: {
      userId,
      overallLevel: retentionRate > 0.85 ? "ADVANCED" : retentionRate > 0.7 ? "INTERMEDIATE" : "BEGINNER",
      strengthsJson: JSON.stringify(strengths),
      weaknessesJson: JSON.stringify(weaknesses),
      retentionRate,
      learningSpeed: 1.0,
      preferredDurationMins,
      preferredTimeOfDay,
      frequentMistakeTypesJson: JSON.stringify(frequentMistakeTypes),
      subjectMasteryJson: JSON.stringify(subjectMastery),
      retentionRatesJson: JSON.stringify({ overall: retentionRate }),
      cognitiveSummary,
    },
    update: {
      overallLevel: retentionRate > 0.85 ? "ADVANCED" : retentionRate > 0.7 ? "INTERMEDIATE" : "BEGINNER",
      strengthsJson: JSON.stringify(strengths),
      weaknessesJson: JSON.stringify(weaknesses),
      retentionRate,
      preferredDurationMins,
      preferredTimeOfDay,
      frequentMistakeTypesJson: JSON.stringify(frequentMistakeTypes),
      subjectMasteryJson: JSON.stringify(subjectMastery),
      cognitiveSummary,
    },
  });
}

function safeJsonParse(str: string | null | undefined, fallback: any) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

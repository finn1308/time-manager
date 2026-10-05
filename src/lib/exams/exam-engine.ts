import { differenceInDays } from "date-fns";

export interface ExamStrategy {
  daysRemaining: number;
  readinessScore: number; // 0 - 100
  estimatedScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  phases: Array<{
    name: string;
    key: "FOUNDATION" | "WEAK_TOPIC_RECOVERY" | "PRACTICE" | "MOCK_EXAM" | "FINAL_REVIEW";
    description: string;
    isCurrent: boolean;
    isCompleted: boolean;
    recommendedHours: number;
  }>;
  recommendedDailyMinutes: number;
}

export function calculateExamStrategy(params: {
  examDate: Date;
  targetScore: number;
  currentScore: number;
  availableStudyHours: number;
  currentPhase: string;
  weakTopicsCount: number;
  resolvedMistakesCount: number;
  totalMistakesCount: number;
}): ExamStrategy {
  const now = new Date();
  const daysRemaining = Math.max(0, differenceInDays(params.examDate, now));

  // Compute readiness based on current phase and mistake resolution rate
  let phaseWeight = 0.2;
  if (params.currentPhase === "WEAK_TOPIC_RECOVERY") phaseWeight = 0.4;
  else if (params.currentPhase === "PRACTICE") phaseWeight = 0.65;
  else if (params.currentPhase === "MOCK_EXAM") phaseWeight = 0.85;
  else if (params.currentPhase === "FINAL_REVIEW") phaseWeight = 0.95;

  let mistakeResolutionRate = 1.0;
  if (params.totalMistakesCount > 0) {
    mistakeResolutionRate = params.resolvedMistakesCount / params.totalMistakesCount;
  }

  const rawReadiness = (phaseWeight * 0.6 + mistakeResolutionRate * 0.4) * 100;
  const readinessScore = Math.min(100, Math.max(10, Math.round(rawReadiness)));

  // Estimated score projection
  const gap = params.targetScore - params.currentScore;
  const projectedGain = gap * (readinessScore / 100);
  const estimatedScore = Math.round((params.currentScore + projectedGain) * 10) / 10;

  // Risk assessment
  let riskLevel: ExamStrategy["riskLevel"] = "LOW";
  if (daysRemaining <= 3 && readinessScore < 70) riskLevel = "CRITICAL";
  else if (daysRemaining <= 7 && readinessScore < 60) riskLevel = "HIGH";
  else if (daysRemaining <= 14 && readinessScore < 50) riskLevel = "MODERATE";

  // Daily recommended minutes
  const totalMinutesRemaining = params.availableStudyHours * 60;
  const dailyMinutes = daysRemaining > 0 ? Math.round(totalMinutesRemaining / daysRemaining) : 120;

  const phaseKeys: Array<"FOUNDATION" | "WEAK_TOPIC_RECOVERY" | "PRACTICE" | "MOCK_EXAM" | "FINAL_REVIEW"> = [
    "FOUNDATION",
    "WEAK_TOPIC_RECOVERY",
    "PRACTICE",
    "MOCK_EXAM",
    "FINAL_REVIEW",
  ];

  const phaseIndex = phaseKeys.indexOf(params.currentPhase as any);
  const currentIdx = phaseIndex >= 0 ? phaseIndex : 0;

  const phases = [
    {
      name: "Giai đoạn 1: Nền tảng cốt lõi (Foundation)",
      key: "FOUNDATION" as const,
      description: "Hệ thống hóa toàn bộ định lý, công thức và lý thuyết bài học.",
      isCurrent: currentIdx === 0,
      isCompleted: currentIdx > 0,
      recommendedHours: Math.round(params.availableStudyHours * 0.25),
    },
    {
      name: "Giai đoạn 2: Phục hồi lỗ hổng kiến thức (Weak Topic Recovery)",
      key: "WEAK_TOPIC_RECOVERY" as const,
      description: "Tập trung giải quyết các lỗi sai trong Ngân hàng lỗi sai (Mistake Bank).",
      isCurrent: currentIdx === 1,
      isCompleted: currentIdx > 1,
      recommendedHours: Math.round(params.availableStudyHours * 0.25),
    },
    {
      name: "Giai đoạn 3: Luyện tập chuyên sâu (Practice)",
      key: "PRACTICE" as const,
      description: "Làm bài tập ứng dụng, dạng bài phân loại và câu hỏi nâng cao.",
      isCurrent: currentIdx === 2,
      isCompleted: currentIdx > 2,
      recommendedHours: Math.round(params.availableStudyHours * 0.25),
    },
    {
      name: "Giai đoạn 4: Thi thử bấm giờ (Mock Exams)",
      key: "MOCK_EXAM" as const,
      description: "Luyện đề thi thử có bấm giờ như kỳ thi thật để rèn luyện tâm lý phòng thi.",
      isCurrent: currentIdx === 3,
      isCompleted: currentIdx > 3,
      recommendedHours: Math.round(params.availableStudyHours * 0.15),
    },
    {
      name: "Giai đoạn 5: Tổng duyệt & Tự tin (Final Review)",
      key: "FINAL_REVIEW" as const,
      description: "Ôn tập nhẹ nhàng các mẹo làm bài, giữ gìn sức khỏe trước ngày thi.",
      isCurrent: currentIdx === 4,
      isCompleted: currentIdx > 4,
      recommendedHours: Math.round(params.availableStudyHours * 0.1),
    },
  ];

  return {
    daysRemaining,
    readinessScore,
    estimatedScore,
    riskLevel,
    phases,
    recommendedDailyMinutes: Math.min(240, Math.max(30, dailyMinutes)),
  };
}

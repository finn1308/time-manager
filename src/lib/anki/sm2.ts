import { addDays } from "date-fns";

export type FlashcardRating = 1 | 2 | 3 | 4;
// 1 = Again (Lặp lại - quên hẳn)
// 2 = Hard (Khó - nhớ nhưng chật vật)
// 3 = Good (Tốt - nhớ đúng sau một chút suy nghĩ)
// 4 = Easy (Dễ - nhớ ngay lập tức)

export interface SM2Input {
  rating: FlashcardRating;
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
}

export interface SM2Output {
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
  nextReview: Date;
  status: "NEW" | "LEARNING" | "REVIEW" | "MASTERED";
  masteryLevel: number; // 0 to 5
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm adapted for Anki 4-button format.
 *
 * Rating mapping:
 * 1 (Again): Fail, reset repetitions, 1 day
 * 2 (Hard): Pass with difficulty, moderate interval scaling
 * 3 (Good): Standard SM-2 interval
 * 4 (Easy): Accelerated interval + ease bonus
 */
export function calculateSM2({
  rating,
  repetitionCount,
  intervalDays,
  easeFactor,
}: SM2Input): SM2Output {
  const now = new Date();

  // 1. Calculate new Ease Factor (EF)
  // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // Normalized for 1-4 scale:
  const q = rating + 1; // map 1..4 -> 2..5
  let newEase = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEase < 1.3) newEase = 1.3;
  if (newEase > 3.0) newEase = 3.0;

  let newRepetition = repetitionCount;
  let newInterval = intervalDays;
  let status: "NEW" | "LEARNING" | "REVIEW" | "MASTERED" = "REVIEW";

  if (rating === 1) {
    // AGAIN: Lapse
    newRepetition = 0;
    newInterval = 1;
    status = "LEARNING";
  } else if (rating === 2) {
    // HARD: Slower progression
    newRepetition += 1;
    if (newRepetition <= 1) {
      newInterval = 1;
    } else {
      newInterval = Math.max(2, Math.round(intervalDays * 1.2));
    }
    status = newRepetition >= 4 ? "REVIEW" : "LEARNING";
  } else if (rating === 3) {
    // GOOD: Standard SM-2 progression
    if (newRepetition === 0) {
      newInterval = 1;
    } else if (newRepetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.max(1, Math.round(intervalDays * newEase));
    }
    newRepetition += 1;
    status = newRepetition >= 5 ? "MASTERED" : "REVIEW";
  } else {
    // EASY: Accelerated progression
    if (newRepetition === 0) {
      newInterval = 4;
    } else if (newRepetition === 1) {
      newInterval = 10;
    } else {
      newInterval = Math.max(1, Math.round(intervalDays * newEase * 1.35));
    }
    newRepetition += 1;
    status = newRepetition >= 3 ? "MASTERED" : "REVIEW";
  }

  // Calculate mastery level from 0 to 5
  let masteryLevel = 0;
  if (newInterval >= 30 || newRepetition >= 6) masteryLevel = 5;
  else if (newInterval >= 14 || newRepetition >= 4) masteryLevel = 4;
  else if (newInterval >= 6 || newRepetition >= 2) masteryLevel = 3;
  else if (newInterval >= 2 || newRepetition >= 1) masteryLevel = 2;
  else masteryLevel = 1;

  const nextReview = addDays(now, newInterval);

  return {
    repetitionCount: newRepetition,
    intervalDays: newInterval,
    easeFactor: parseFloat(newEase.toFixed(2)),
    nextReview,
    status,
    masteryLevel,
  };
}

/**
 * Preview next intervals for UI buttons before user clicks
 */
export function previewNextIntervals(currentInterval: number, currentRep: number, currentEase: number) {
  const again = calculateSM2({ rating: 1, repetitionCount: currentRep, intervalDays: currentInterval, easeFactor: currentEase });
  const hard = calculateSM2({ rating: 2, repetitionCount: currentRep, intervalDays: currentInterval, easeFactor: currentEase });
  const good = calculateSM2({ rating: 3, repetitionCount: currentRep, intervalDays: currentInterval, easeFactor: currentEase });
  const easy = calculateSM2({ rating: 4, repetitionCount: currentRep, intervalDays: currentInterval, easeFactor: currentEase });

  const formatDays = (days: number) => {
    if (days <= 1) return "1 ngày";
    if (days < 30) return `${days} ngày`;
    const m = Math.round(days / 30);
    return `${m} tháng`;
  };

  return {
    again: formatDays(again.intervalDays),
    hard: formatDays(hard.intervalDays),
    good: formatDays(good.intervalDays),
    easy: formatDays(easy.intervalDays),
  };
}

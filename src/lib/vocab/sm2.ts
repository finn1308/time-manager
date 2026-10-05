/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * Standard algorithm for calculating optimal review intervals.
 */

export interface Sm2Input {
  quality: number; // 0 to 5
  repetition: number;
  intervalDays: number;
  easeFactor: number;
}

export interface Sm2Output {
  repetition: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: Date;
}

export function calculateSm2(input: Sm2Input): Sm2Output {
  const { quality, repetition, intervalDays, easeFactor } = input;

  let newRepetition: number;
  let newInterval: number;
  let newEaseFactor: number;

  if (quality >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * easeFactor);
    }
    newRepetition = repetition + 1;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  // Calculate new ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    repetition: newRepetition,
    intervalDays: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    nextReviewDate,
  };
}

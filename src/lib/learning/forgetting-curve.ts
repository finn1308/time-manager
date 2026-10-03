import { ForgettingCurveInput, ForgettingCurveResult } from "./types";

/**
 * Constant: Target retention probability at scheduled review time.
 * When retention drops to 88%, the system schedules a review session.
 */
export const TARGET_RETENTION_THRESHOLD = 0.88;

/**
 * Calculates retention rate R(t) according to the Half-life Memory Model:
 * R(t) = 2^(-t / S)
 * 
 * @param elapsedDays Number of days since last review
 * @param stabilityDays Memory half-life S in days
 * @returns Retention probability in range [0.0, 1.0]
 */
export function calculateRetentionRate(
  elapsedDays: number,
  stabilityDays: number
): number {
  if (elapsedDays <= 0) return 1.0;
  const safeStability = Math.max(0.2, stabilityDays);
  const power = -elapsedDays / safeStability;
  const retention = Math.pow(2, power);
  return Math.max(0.01, Math.min(1.0, retention));
}

/**
 * Computes updated memory stability after a recall event:
 * - If recall succeeded: S_new = S_old * (1 + factor * knowledge)
 * - If recall failed: S_new = max(0.5, S_old * 0.35)
 */
export function updateMemoryStability(
  currentStabilityDays: number,
  currentKnowledge: number,
  isCorrect: boolean
): number {
  const safeCurrent = Math.max(0.5, currentStabilityDays);

  if (isCorrect) {
    // Stability expands as knowledge increases and successful reviews happen
    // Typical expansion multiplier ranges from 1.6 to 2.8
    const expansionMultiplier = 1.4 + currentKnowledge * 1.2;
    const newStability = safeCurrent * expansionMultiplier;
    // Cap maximum stability at 365 days (1 year)
    return Math.min(365, Math.round(newStability * 100) / 100);
  } else {
    // Failed retrieval collapses memory stability back towards baseline
    const collapsed = Math.max(0.6, safeCurrent * 0.35);
    return Math.round(collapsed * 100) / 100;
  }
}

/**
 * Calculates optimal interval until next review when retention reaches target threshold:
 * R(t_target) = TARGET_RETENTION_THRESHOLD
 * 2^(-t / S) = 0.88 => -t / S = log2(0.88) => t = -S * (ln(0.88) / ln(2))
 */
export function calculateNextReviewIntervalDays(stabilityDays: number): number {
  const log2Target = Math.log(TARGET_RETENTION_THRESHOLD) / Math.LN2;
  const intervalDays = -stabilityDays * log2Target;
  // Minimum review interval is 0.25 days (6 hours)
  return Math.max(0.25, Math.round(intervalDays * 100) / 100);
}

/**
 * Ebbinghaus / Half-Life Forgetting Curve Evaluation
 */
export function evaluateForgettingCurve(
  input: ForgettingCurveInput
): ForgettingCurveResult {
  const { lastSeenAt, currentKnowledge, memoryStabilityDays, isCorrectNow } = input;

  const now = new Date();
  let elapsedDays = 0;

  if (lastSeenAt) {
    const elapsedMs = Math.max(0, now.getTime() - new Date(lastSeenAt).getTime());
    elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  }

  // 1. Current instantaneous retention probability R(t)
  const retentionRate = calculateRetentionRate(elapsedDays, memoryStabilityDays);
  const forgettingRisk = Math.round((1.0 - retentionRate) * 10000) / 10000;

  // 2. Updated stability if an active review just occurred
  let newMemoryStability = memoryStabilityDays;
  if (isCorrectNow !== undefined) {
    newMemoryStability = updateMemoryStability(
      memoryStabilityDays,
      currentKnowledge,
      isCorrectNow
    );
  }

  // 3. Compute optimal next review timestamp
  const nextIntervalDays = calculateNextReviewIntervalDays(newMemoryStability);
  const nextReviewAt = new Date(now.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);

  // An item is overdue if retention has degraded below the 88% target threshold
  const isOverdue = retentionRate < TARGET_RETENTION_THRESHOLD;

  return {
    retentionRate: Math.round(retentionRate * 10000) / 10000,
    forgettingRisk,
    newMemoryStability,
    nextReviewAt,
    isOverdue,
  };
}

/**
 * Computes instantaneous effective knowledge discounted by the forgetting curve:
 * K_effective(t) = K_base * R(t)
 */
export function calculateEffectiveKnowledge(
  baseKnowledge: number,
  lastSeenAt: Date | null,
  memoryStabilityDays: number
): number {
  if (!lastSeenAt) return baseKnowledge;
  const elapsedDays = Math.max(
    0,
    (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const retention = calculateRetentionRate(elapsedDays, memoryStabilityDays);
  return Math.round(baseKnowledge * retention * 10000) / 10000;
}

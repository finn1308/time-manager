import {
  AdaptiveQuestionType,
  CrossSkillScores,
  MasteryCalculationInput,
  MasteryCalculationResult,
  MasteryCategory,
} from "./types";

/**
 * Calculates category from continuous knowledge score (0.0 to 1.0)
 */
export function getMasteryCategory(score: number): MasteryCategory {
  if (score >= 0.85) return "MASTERED";
  if (score >= 0.65) return "STRONG";
  if (score >= 0.40) return "MEDIUM";
  return "WEAK";
}

/**
 * Computes the speed factor based on response time in seconds.
 * 
 * Cognitive window for vocabulary recall:
 * - 0.5s - 2.5s: Confident, automated retrieval (Factor: 1.0 - 1.2)
 * - 2.5s - 5.0s: Deliberate retrieval (Factor: 0.9 - 1.0)
 * - 5.0s - 9.0s: Hesitant / struggling retrieval (Factor: 0.6 - 0.85)
 * - > 9.0s: Likely guessed or looked up (Factor: 0.4 - 0.6)
 */
export function calculateSpeedFactor(responseTimeSeconds: number): number {
  if (responseTimeSeconds <= 0) return 0.8; // default
  if (responseTimeSeconds < 2.5) {
    return Math.min(1.2, 1.0 + (2.5 - responseTimeSeconds) * 0.1);
  }
  if (responseTimeSeconds <= 5.0) {
    return 1.0 - (responseTimeSeconds - 2.5) * 0.04;
  }
  if (responseTimeSeconds <= 10.0) {
    return 0.9 - (responseTimeSeconds - 5.0) * 0.06;
  }
  return 0.5; // slow or guessed
}

/**
 * Computes weight of question format in cognitive hierarchy:
 * - RECOGNITION (passive): Weight 0.8
 * - LISTENING (auditory comprehension): Weight 0.95
 * - SENTENCE_COMPLETION (contextual): Weight 1.0
 * - RECALL (active retrieval): Weight 1.15
 * - SPELLING (active production & motor encoding): Weight 1.25
 */
export function getQuestionTypeWeight(type: AdaptiveQuestionType): number {
  switch (type) {
    case "RECOGNITION":
      return 0.8;
    case "LISTENING":
      return 0.95;
    case "SENTENCE_COMPLETION":
      return 1.0;
    case "RECALL":
      return 1.15;
    case "SPELLING":
      return 1.25;
    default:
      return 1.0;
  }
}

/**
 * Deterministic Adaptive Mastery Calculation Engine
 * 
 * Combines Bayesian knowledge estimation with multi-signal behavioral metrics:
 * 1. Exponential moving average of accuracy
 * 2. Response speed / cognitive hesitation index
 * 3. Asymmetric penalty for memory retrieval failures
 * 4. Question type depth weighting
 * 5. Cross-skill breakdown updates
 */
export function calculateAdaptiveMastery(
  input: MasteryCalculationInput
): MasteryCalculationResult {
  const {
    currentKnowledge,
    currentConfidence,
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    consecutiveCorrect,
    consecutiveIncorrect,
    averageResponseTime,
    isCorrect,
    responseTimeSeconds,
    questionType,
    difficultyScore,
    crossSkills,
  } = input;

  const newTotalAttempts = totalAttempts + 1;
  const newCorrectAttempts = isCorrect ? correctAttempts + 1 : correctAttempts;
  const newIncorrectAttempts = isCorrect ? incorrectAttempts : incorrectAttempts + 1;
  const newConsecutiveCorrect = isCorrect ? consecutiveCorrect + 1 : 0;
  const newConsecutiveIncorrect = isCorrect ? 0 : consecutiveIncorrect + 1;

  // 1. Moving average of response time
  const safeResponseTime = Math.max(0.5, Math.min(60, responseTimeSeconds));
  const newAverageResponseTime =
    totalAttempts === 0
      ? safeResponseTime
      : (averageResponseTime * totalAttempts + safeResponseTime) / newTotalAttempts;

  const speedFactor = calculateSpeedFactor(safeResponseTime);
  const typeWeight = getQuestionTypeWeight(questionType);

  // 2. Update specific Cross-Skill score
  const updatedCrossSkills: CrossSkillScores = { ...crossSkills };
  const currentSkillScore = getSkillScoreForType(updatedCrossSkills, questionType);

  let updatedSkillScore = currentSkillScore;
  if (isCorrect) {
    const delta = (1.0 - currentSkillScore) * 0.35 * speedFactor * (difficultyScore * 0.5 + 0.75);
    updatedSkillScore = Math.min(1.0, currentSkillScore + delta);
  } else {
    // Asymmetric penalty: mistakes cost more than small victories
    const penalty = 0.30 + newConsecutiveIncorrect * 0.10;
    updatedSkillScore = Math.max(0.0, currentSkillScore - penalty);
  }
  setSkillScoreForType(updatedCrossSkills, questionType, updatedSkillScore);

  // 3. Composite knowledge score from cross skills + overall signal
  const crossSkillComposite =
    updatedCrossSkills.recognition * 0.25 +
    updatedCrossSkills.recall * 0.25 +
    updatedCrossSkills.spelling * 0.20 +
    updatedCrossSkills.listening * 0.15 +
    updatedCrossSkills.usage * 0.15;

  let newKnowledgeScore: number;

  if (isCorrect) {
    // Increment knowledge score smoothly
    // Learning rate diminishes as score approaches 1.0 (asymptotic learning)
    const baseIncrement = 0.22;
    const streakBonus = Math.min(0.12, newConsecutiveCorrect * 0.03);
    const difficultyMultiplier = 0.7 + difficultyScore * 0.5; // harder questions grant higher mastery

    const deltaKnowledge =
      (1.0 - currentKnowledge) *
      baseIncrement *
      speedFactor *
      typeWeight *
      difficultyMultiplier +
      streakBonus * (1.0 - currentKnowledge);

    const blended = currentKnowledge + deltaKnowledge;
    // Blend with cross-skill composite
    newKnowledgeScore = Math.min(1.0, blended * 0.65 + crossSkillComposite * 0.35);
  } else {
    // Decrement on failure: significant drop, stronger if repeated failures
    const baseDrop = 0.22;
    const streakPenalty = Math.min(0.25, newConsecutiveIncorrect * 0.08);
    const drop = baseDrop + streakPenalty;

    const blended = Math.max(0.0, currentKnowledge - drop);
    newKnowledgeScore = Math.max(0.0, blended * 0.65 + crossSkillComposite * 0.35);
  }

  // Ensure strict bounds [0.0, 1.0] and round to 4 decimals
  newKnowledgeScore = Math.round(Math.max(0.0, Math.min(1.0, newKnowledgeScore)) * 10000) / 10000;

  // 4. Update Confidence Score (based on total attempts & consistency)
  // Confidence reaches high only with sufficient attempts (> 5) and low variance
  const attemptWeight = Math.min(1.0, newTotalAttempts / 7.0);
  const consistencyWeight = Math.max(0.0, 1.0 - (newConsecutiveIncorrect * 0.3));
  const targetConfidence = newKnowledgeScore * attemptWeight * consistencyWeight;
  const newConfidenceScore =
    Math.round(Math.max(0.0, Math.min(1.0, currentConfidence * 0.6 + targetConfidence * 0.4)) * 10000) /
    10000;

  // 5. Dynamic Difficulty for this item:
  // If user consistently masters it, we adjust effective difficulty downward for them
  let updatedDifficulty = difficultyScore;
  if (isCorrect && speedFactor >= 1.0) {
    updatedDifficulty = Math.max(0.1, difficultyScore - 0.03);
  } else if (!isCorrect) {
    updatedDifficulty = Math.min(1.0, difficultyScore + 0.05);
  }
  updatedDifficulty = Math.round(updatedDifficulty * 100) / 100;

  const category = getMasteryCategory(newKnowledgeScore);

  return {
    newKnowledgeScore,
    newConfidenceScore,
    newAverageResponseTime: Math.round(newAverageResponseTime * 100) / 100,
    newConsecutiveCorrect,
    newConsecutiveIncorrect,
    newTotalAttempts,
    newCorrectAttempts,
    newIncorrectAttempts,
    updatedCrossSkills,
    updatedDifficulty,
    category,
  };
}

function getSkillScoreForType(skills: CrossSkillScores, type: AdaptiveQuestionType): number {
  switch (type) {
    case "RECOGNITION":
      return skills.recognition;
    case "RECALL":
      return skills.recall;
    case "SPELLING":
      return skills.spelling;
    case "LISTENING":
      return skills.listening;
    case "SENTENCE_COMPLETION":
      return skills.usage;
  }
}

function setSkillScoreForType(
  skills: CrossSkillScores,
  type: AdaptiveQuestionType,
  value: number
): void {
  const bounded = Math.round(Math.max(0.0, Math.min(1.0, value)) * 10000) / 10000;
  switch (type) {
    case "RECOGNITION":
      skills.recognition = bounded;
      break;
    case "RECALL":
      skills.recall = bounded;
      break;
    case "SPELLING":
      skills.spelling = bounded;
      break;
    case "LISTENING":
      skills.listening = bounded;
      break;
    case "SENTENCE_COMPLETION":
      skills.usage = bounded;
      break;
  }
}

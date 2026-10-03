import {
  AdaptiveQuestionPayload,
  AdaptiveQuestionType,
  MasteryCategory,
  PriorityScoreBreakdown,
  QuestionCandidate,
} from "./types";
import { getMasteryCategory } from "./scoring";

export interface SelectionEngineOptions {
  candidates: QuestionCandidate[];
  recentlyShownVocabularyIds?: string[];
  minimumReviewGap?: number; // e.g. 4
  preferredCategory?: MasteryCategory;
}

/**
 * Weights for the priority score computation
 */
const PRIORITY_WEIGHTS = {
  weakness: 0.35,        // (1 - knowledgeScore)
  forgetting: 0.25,      // forgettingRisk
  overdue: 0.20,         // overdue status and degree
  recentFailure: 0.15,   // consecutiveIncorrect streak
  difficulty: 0.05,      // difficultyScore
};

/**
 * Computes priority score for a single candidate vocabulary item
 */
export function calculateCandidatePriority(
  candidate: QuestionCandidate,
  recentlyShownIds: string[] = [],
  minimumReviewGap: number = 4
): PriorityScoreBreakdown {
  const category = getMasteryCategory(candidate.knowledgeScore);

  // 1. Weakness score (lower knowledge = higher priority)
  const weaknessScore = Math.max(0, 1.0 - candidate.knowledgeScore);

  // 2. Forgetting score (higher risk = higher priority)
  const forgettingScore = Math.max(0, Math.min(1.0, candidate.forgettingRisk));

  // 3. Overdue score
  let overdueScore = 0;
  if (candidate.nextReviewAt) {
    const overdueMs = Date.now() - new Date(candidate.nextReviewAt).getTime();
    if (overdueMs > 0) {
      // Overdue: escalates over 3 days to maximum 1.0
      const overdueDays = overdueMs / (1000 * 60 * 60 * 24);
      overdueScore = Math.min(1.0, overdueDays / 3.0);
    }
  } else {
    // Never scheduled or brand new -> give moderate initial review urgency
    overdueScore = 0.5;
  }

  // 4. Recent failure urgency
  const recentFailureScore = Math.min(1.0, candidate.consecutiveIncorrect * 0.35);

  // 5. Difficulty adjustment (slightly prioritize harder items to conquer them)
  const difficultyAdjustment = candidate.difficultyScore;

  // 6. Anti-repetition penalty
  let antiRepetitionPenalty = 0;
  const recentIndex = recentlyShownIds.indexOf(candidate.vocabularyId);
  if (recentIndex !== -1) {
    const distance = recentlyShownIds.length - 1 - recentIndex;
    if (distance < minimumReviewGap) {
      // Exponential penalty if shown very recently
      antiRepetitionPenalty = 1.0 - distance / minimumReviewGap;
    }
  }

  // Raw weighted sum
  const rawScore =
    PRIORITY_WEIGHTS.weakness * weaknessScore +
    PRIORITY_WEIGHTS.forgetting * forgettingScore +
    PRIORITY_WEIGHTS.overdue * overdueScore +
    PRIORITY_WEIGHTS.recentFailure * recentFailureScore +
    PRIORITY_WEIGHTS.difficulty * difficultyAdjustment;

  // Apply anti-repetition penalty
  const finalPriority = Math.max(0.01, rawScore * (1.0 - antiRepetitionPenalty * 0.95));

  return {
    vocabularyId: candidate.vocabularyId,
    priorityScore: Math.round(finalPriority * 10000) / 10000,
    weaknessScore: Math.round(weaknessScore * 1000) / 1000,
    forgettingScore: Math.round(forgettingScore * 1000) / 1000,
    overdueScore: Math.round(overdueScore * 1000) / 1000,
    difficultyAdjustment: Math.round(difficultyAdjustment * 1000) / 1000,
    recentFailureScore: Math.round(recentFailureScore * 1000) / 1000,
    antiRepetitionPenalty: Math.round(antiRepetitionPenalty * 1000) / 1000,
    category,
  };
}

/**
 * Weighted probabilistic selection (Stratified sampling & Boltzmann distribution)
 * 
 * Target empirical proportions across categories:
 * - Weak: ~50%
 * - Medium: ~30%
 * - Strong: ~15%
 * - Mastered: ~5%
 */
export function selectAdaptiveCandidate(
  candidates: QuestionCandidate[],
  recentlyShownIds: string[] = [],
  minimumReviewGap: number = 4
): { candidate: QuestionCandidate; priority: PriorityScoreBreakdown } {
  if (candidates.length === 0) {
    throw new Error("No candidate vocabulary items available for adaptive selection");
  }

  if (candidates.length === 1) {
    const priority = calculateCandidatePriority(candidates[0], recentlyShownIds, minimumReviewGap);
    return { candidate: candidates[0], priority };
  }

  // 1. Calculate priority score for every candidate
  const scored = candidates.map((candidate) => ({
    candidate,
    priority: calculateCandidatePriority(candidate, recentlyShownIds, minimumReviewGap),
  }));

  // 2. Stratify by mastery category
  const buckets: Record<MasteryCategory, typeof scored> = {
    WEAK: [],
    MEDIUM: [],
    STRONG: [],
    MASTERED: [],
  };

  for (const item of scored) {
    buckets[item.priority.category].push(item);
  }

  // 3. Roll a random category based on target distribution
  // (Weak 50%, Medium 30%, Strong 15%, Mastered 5%)
  const rand = Math.random();
  let targetCategory: MasteryCategory;

  if (rand < 0.50) {
    targetCategory = "WEAK";
  } else if (rand < 0.80) {
    targetCategory = "MEDIUM";
  } else if (rand < 0.95) {
    targetCategory = "STRONG";
  } else {
    targetCategory = "MASTERED";
  }

  // Fallback hierarchy if the chosen bucket is empty
  const fallbackOrder: MasteryCategory[] = [
    targetCategory,
    "WEAK",
    "MEDIUM",
    "STRONG",
    "MASTERED",
  ];

  let selectedBucket = scored;
  for (const cat of fallbackOrder) {
    if (buckets[cat].length > 0) {
      selectedBucket = buckets[cat];
      break;
    }
  }

  // 4. Within the selected bucket, perform weighted roulette wheel selection
  // based on priorityScore to reward higher urgency
  const totalWeight = selectedBucket.reduce(
    (sum, item) => sum + Math.max(0.001, item.priority.priorityScore),
    0
  );

  let randomPoint = Math.random() * totalWeight;
  for (const item of selectedBucket) {
    randomPoint -= Math.max(0.001, item.priority.priorityScore);
    if (randomPoint <= 0) {
      return item;
    }
  }

  return selectedBucket[0];
}

/**
 * Determines appropriate question type according to user's knowledge stage
 * - Stage 1 (Score < 0.35): RECOGNITION (EN -> VN) or LISTENING
 * - Stage 2 (Score 0.35 - 0.65): RECALL (VN -> EN) or SENTENCE_COMPLETION
 * - Stage 3 (Score >= 0.65): SPELLING or SENTENCE_COMPLETION
 */
export function determineQuestionType(
  candidate: QuestionCandidate,
  forceType?: AdaptiveQuestionType
): AdaptiveQuestionType {
  if (forceType) return forceType;

  const score = candidate.knowledgeScore;
  const skills = candidate.crossSkills;

  // Identify user's weakest skill for this word
  const skillEntries: [AdaptiveQuestionType, number][] = [
    ["RECOGNITION", skills.recognition],
    ["RECALL", skills.recall],
    ["SPELLING", skills.spelling],
    ["LISTENING", skills.listening],
    ["SENTENCE_COMPLETION", skills.usage],
  ];
  skillEntries.sort((a, b) => a[1] - b[1]);
  const weakestSkill = skillEntries[0][0];

  // If word is completely new/weak, start with recognition
  if (score < 0.30) {
    return Math.random() < 0.7 ? "RECOGNITION" : "LISTENING";
  }

  // Intermediate: recall or sentence completion
  if (score < 0.65) {
    if (candidate.exampleSentence && Math.random() < 0.45) {
      return "SENTENCE_COMPLETION";
    }
    return Math.random() < 0.65 ? "RECALL" : weakestSkill;
  }

  // Advanced / Mastered: spelling (typing) or active contextual production
  if (Math.random() < 0.50) {
    return "SPELLING";
  }
  return candidate.exampleSentence ? "SENTENCE_COMPLETION" : "RECALL";
}

/**
 * Builds an adaptive question payload with prompt, options, and distractors
 */
export function buildAdaptiveQuestionPayload(
  candidate: QuestionCandidate,
  allCandidates: QuestionCandidate[],
  type?: AdaptiveQuestionType
): AdaptiveQuestionPayload {
  const questionType = determineQuestionType(candidate, type);
  const priority = calculateCandidatePriority(candidate);

  let prompt = "";
  let correctAnswer = "";
  const distractorPool: string[] = [];

  switch (questionType) {
    case "RECOGNITION": {
      prompt = `Chọn nghĩa đúng của từ: "${candidate.term}"`;
      correctAnswer = candidate.meaning;
      for (const other of allCandidates) {
        if (other.vocabularyId !== candidate.vocabularyId && other.meaning) {
          distractorPool.push(other.meaning);
        }
      }
      break;
    }

    case "RECALL": {
      prompt = `Chọn từ tiếng Anh phù hợp với nghĩa: "${candidate.meaning}"`;
      correctAnswer = candidate.term;
      for (const other of allCandidates) {
        if (other.vocabularyId !== candidate.vocabularyId && other.term) {
          distractorPool.push(other.term);
        }
      }
      break;
    }

    case "SENTENCE_COMPLETION": {
      const sentence = candidate.exampleSentence || `I want to _______ this.`;
      // Replace target word with blank line
      const blanked = sentence.replace(new RegExp(`\\b${candidate.term}\\b`, "gi"), "_______");
      prompt = `Điền từ thích hợp vào chỗ trống:\n"${blanked}"\n(${candidate.exampleMeaning || candidate.meaning})`;
      correctAnswer = candidate.term;
      for (const other of allCandidates) {
        if (other.vocabularyId !== candidate.vocabularyId && other.term) {
          distractorPool.push(other.term);
        }
      }
      break;
    }

    case "LISTENING": {
      prompt = `Nghe phát âm và chọn từ chính xác:`;
      correctAnswer = candidate.term;
      for (const other of allCandidates) {
        if (other.vocabularyId !== candidate.vocabularyId && other.term) {
          distractorPool.push(other.term);
        }
      }
      break;
    }

    case "SPELLING": {
      prompt = `Gõ chính xác từ tiếng Anh có nghĩa là: "${candidate.meaning}"`;
      correctAnswer = candidate.term;
      // In spelling mode, options can be empty or letter anagrams
      break;
    }
  }

  // Shuffle and pick 3 unique distractors + 1 correct answer (total 4 options)
  const shuffledDistractors = distractorPool
    .filter((d, i, arr) => arr.indexOf(d) === i && d !== correctAnswer)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  const options =
    questionType === "SPELLING"
      ? []
      : [...shuffledDistractors, correctAnswer].sort(() => 0.5 - Math.random());

  return {
    vocabularyId: candidate.vocabularyId,
    term: candidate.term,
    meaning: candidate.meaning,
    phonetic: candidate.phonetic,
    partOfSpeech: candidate.partOfSpeech,
    exampleSentence: candidate.exampleSentence,
    exampleMeaning: candidate.exampleMeaning,
    audioUrl: candidate.audioUrl,
    questionType,
    prompt,
    options,
    correctAnswer,
    difficulty: candidate.difficultyScore,
    priorityScore: priority.priorityScore,
    currentKnowledgeScore: candidate.knowledgeScore,
    forgettingRisk: candidate.forgettingRisk,
    category: priority.category,
  };
}

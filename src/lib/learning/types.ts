import { z } from "zod";

// ==============================================================================
// QUESTION TYPES & LEARNING EVENT TYPES
// ==============================================================================

export type AdaptiveQuestionType =
  | "RECOGNITION"          // English term -> choose Vietnamese meaning
  | "RECALL"               // Vietnamese meaning -> choose English term
  | "SENTENCE_COMPLETION"  // Fill missing word in example sentence
  | "LISTENING"            // Audio pronunciation -> identify/type word
  | "SPELLING";            // Type word from meaning with letter hints

export type LearningEventType =
  | "VIEW"
  | "ANSWER_CORRECT"
  | "ANSWER_INCORRECT"
  | "SKIPPED"
  | "FLASHCARD_REVIEW"
  | "QUIZ_COMPLETED"
  | "MANUAL_MARK_KNOWN"
  | "MANUAL_MARK_UNKNOWN";

export type MasteryCategory = "WEAK" | "MEDIUM" | "STRONG" | "MASTERED";

// ==============================================================================
// DATA INTERFACES
// ==============================================================================

export interface CrossSkillScores {
  recognition: number; // 0.0 - 1.0 (EN -> VN)
  recall: number;      // 0.0 - 1.0 (VN -> EN)
  spelling: number;    // 0.0 - 1.0 (Typing)
  listening: number;   // 0.0 - 1.0 (Audio)
  usage: number;       // 0.0 - 1.0 (Context)
}

export interface MasteryCalculationInput {
  currentKnowledge: number;
  currentConfidence: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  averageResponseTime: number;
  isCorrect: boolean;
  responseTimeSeconds: number;
  questionType: AdaptiveQuestionType;
  difficultyScore: number;
  crossSkills: CrossSkillScores;
}

export interface MasteryCalculationResult {
  newKnowledgeScore: number;
  newConfidenceScore: number;
  newAverageResponseTime: number;
  newConsecutiveCorrect: number;
  newConsecutiveIncorrect: number;
  newTotalAttempts: number;
  newCorrectAttempts: number;
  newIncorrectAttempts: number;
  updatedCrossSkills: CrossSkillScores;
  updatedDifficulty: number;
  category: MasteryCategory;
}

export interface ForgettingCurveInput {
  lastSeenAt: Date | null;
  currentKnowledge: number;
  memoryStabilityDays: number;
  isCorrectNow?: boolean;
}

export interface ForgettingCurveResult {
  retentionRate: number;      // 0.0 - 1.0 (Current probability of recall)
  forgettingRisk: number;     // 1.0 - retentionRate
  newMemoryStability: number; // Updated half-life S in days
  nextReviewAt: Date;         // Scheduled next review
  isOverdue: boolean;
}

export interface QuestionCandidate {
  vocabularyId: string;
  term: string;
  meaning: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  exampleSentence?: string | null;
  exampleMeaning?: string | null;
  audioUrl?: string | null;
  wordSetId: string;
  knowledgeScore: number;
  confidenceScore: number;
  forgettingRisk: number;
  difficultyScore: number;
  nextReviewAt?: Date | null;
  lastSeenAt?: Date | null;
  consecutiveIncorrect: number;
  consecutiveCorrect: number;
  crossSkills: CrossSkillScores;
}

export interface PriorityScoreBreakdown {
  vocabularyId: string;
  priorityScore: number;
  weaknessScore: number;
  forgettingScore: number;
  overdueScore: number;
  difficultyAdjustment: number;
  recentFailureScore: number;
  antiRepetitionPenalty: number;
  category: MasteryCategory;
}

export interface AdaptiveQuestionPayload {
  vocabularyId: string;
  term: string;
  meaning: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  exampleSentence?: string | null;
  exampleMeaning?: string | null;
  audioUrl?: string | null;
  questionType: AdaptiveQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  priorityScore: number;
  currentKnowledgeScore: number;
  forgettingRisk: number;
  category: MasteryCategory;
}

// ==============================================================================
// AI ANALYSIS SCHEMA (ZOD)
// ==============================================================================

export const AiLearningAnalysisSchema = z.object({
  strongestArea: z.string().min(3),
  weakestArea: z.string().min(3),
  wordsNeedingAttention: z.array(
    z.object({
      term: z.string(),
      meaning: z.string(),
      reason: z.string(),
      forgettingRisk: z.number().min(0).max(1),
    })
  ).max(10),
  wordsImprovingRapidly: z.array(
    z.object({
      term: z.string(),
      masteryScore: z.number().min(0).max(1),
      notes: z.string(),
    })
  ).max(10),
  recommendedFocus: z.string().min(10),
  cognitiveInsights: z.string().min(10),
  estimatedMasteryGrade: z.enum(["A+", "A", "B", "C", "D", "F"]).optional(),
});

export type AiLearningAnalysisResponse = z.infer<typeof AiLearningAnalysisSchema>;

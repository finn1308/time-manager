export interface PracticeSubject {
  id: string;
  name: string;
  code: string | null;
  color: string;
  icon?: string | null;
  priority?: number;
}

export interface PracticeStats {
  totalItems: number;
  dueCount: number;
  resolvedCount: number;
  mistakeCount: number;
  streakDays: number;
  streakWeekDays: boolean[]; // 7 days Mon-Sun (or T2-CN)
  totalPracticeSeconds: number;
  coins: number;
  completionRate: number;
}

export interface PracticeItem {
  id: string;
  term: string;
  meaning: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  exampleSentence?: string | null;
  exampleMeaning?: string | null;
  subjectName?: string | null;
  source?: "MISTAKE" | "FLASHCARD" | "QUIZ" | "PRACTICE";
  difficulty?: number;
  hint?: string | null;
}

export interface PracticeModule {
  id: string;
  title: string;
  description: string;
  href: string;
  iconName: string;
  color: string;
  border?: string;
  badge?: string;
  badgeColor?: string;
  progressPercent?: number;
  statsText?: string;
  category: "REVIEW" | "MISTAKES" | "FLASHCARDS" | "QUIZ" | "GAMES" | "SUBJECT";
  subjectId?: string;
}

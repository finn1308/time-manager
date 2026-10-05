# DATABASE ARCHITECTURE & SCHEMA EXPANSION

## 1. Overview
The database layer uses Prisma ORM on top of PostgreSQL (Supabase pooler). All entities are strictly scoped to `userId` to enforce tenant isolation and security.

## 2. Core Models Added for 4-Year Learning OS

### `UserLearningMemory`
Stores persistent cognitive state across vocabulary, academic subjects, and exams:
- `retentionRate` (Float): Historical active recall retention rate.
- `avgSessionMinutes` (Int): Computed optimal focus session duration.
- `studyConsistency` (Float): Adherence percentage to planned sessions.
- `weakSubjects`, `strongSubjects` (String[]): Automatically computed from quizzes and mistakes.
- `frequentMistakes` (String[]): Aggregated error patterns.
- `subjectMastery` (Json): Subject-by-subject percentage mastery.
- `preferredHours` (String[]): Peak performance time windows.

### `MistakeRecord`
Universal error tracking from any quiz, flashcard, exam, or typing exercise:
- `question`, `correctAnswer`, `userAnswer` (String): Error detail.
- `subjectId`, `topic`, `concept` (String): Hierarchy mapping.
- `errorType` (Enum/String): `KNOWLEDGE_GAP`, `MISUNDERSTANDING`, `CARELESS_MISTAKE`, `MEMORY_FAILURE`, `CALCULATION_ERROR`, `VOCAB_CONFUSION`, `CONCEPT_CONFUSION`.
- `repetitionCount` (Int), `mastery` (Float): SM-2 spaced repetition state.
- `nextReviewAt` (DateTime): Scheduling for Today's Review.

### `ExamPreparation`
Dedicated 5-phase strategic exam management:
- `title`, `examDate` (DateTime), `targetScore`, `currentScore` (Float).
- `availableHours` (Int), `difficulty` (String).
- `phase` (String): `FOUNDATION`, `WEAK_TOPIC_RECOVERY`, `PRACTICE`, `MOCK_EXAMS`, `FINAL_REVIEW`.
- `readinessScore` (Float), `riskLevel` (String): Dynamically estimated probability of success.
- `weakTopics`, `materials` (String[]).

### `Assignment`
Academic assignment tracker with automated subtask breakdown:
- `title`, `course`, `deadline` (DateTime), `priority` (Int), `status` (String).
- `subtasks` (Json): Decomposed into `Research`, `Outline`, `Draft`, `Review`, `Finalize`, `Submit`.
- Connected to Subject and user calendar events.

### `KnowledgeNode` & `KnowledgePrerequisite`
Interactive knowledge graph mapping dependencies:
- `title`, `chapter`, `topic`, `mastery` (Float), `notesSummary` (String).
- Self-referencing prerequisite relations with warning thresholds (<50% mastery blocks progression).

### `SyllabusImport`
Course syllabus intake and AI extraction registry:
- `rawText`, `courseName`, `courseCode`, `credits`, `instructor`, `weeklyTopics` (Json).
- `assignmentsGen`, `examsGen` (Json): Stored state before committing to subjects, tasks, and calendar.

### `BackupRecord` & `ContentVersion`
Backup registry and version history for user notes, study plans, and decks:
- `dataSnapshot` (Json): Complete workspace state.
- `checksum`, `fileSize`: Verification integrity.

## 3. Indexes & Performance
Indexes were applied to:
- `[userId, nextReviewAt]` on `MistakeRecord` (0ms lookup for Today's Review).
- `[userId, examDate]` on `ExamPreparation`.
- `[userId, deadline]` on `Assignment`.
- `[userId, subjectId]` on `KnowledgeNode`.

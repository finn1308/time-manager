# AI SYSTEM ARCHITECTURE

## 1. Core Principles
- **No Hallucinations**: Educational materials and syllabus structures are strictly grounded in user-provided documents, notes, or uploaded files.
- **Structured Learning Intelligence**: Rather than keeping raw conversation logs, the AI extracts structured indicators (cognitive memory, error classification, weak concepts, readiness score).
- **Asynchronous Execution**: Heavy AI calls (Syllabus parsing, Flashcard generation, Task decomposition) run asynchronously and never block UI navigation or first-render times.

## 2. Integrated AI Modules

### 1. AI Cognitive Memory (`src/lib/ai/learning-memory.ts`)
- Automatically analyzes historical quiz submissions, flashcard reviews, study logs, and mistake bank records.
- Computes retention rate (%), average focused session length, consistency, and classifies weak vs strong subjects.
- Accessible for user inspection and manual overrides via `/academic/learning-profile`.

### 2. Syllabus Parser (`src/lib/ai/syllabus-parser.ts`)
- Intake: Pasted syllabus text or uploaded course outlines.
- Extracts: Course code, title, credits, instructor, weekly roadmap, required materials, assignments with deadlines, exams with weights.
- Generates staged actions for user confirmation before bulk-committing to Subject, Assignments, Exams, and Calendar.

### 3. Subject AI Tutors (`src/app/api/ai/subject-tutor/route.ts`)
- Contextual tutoring grounded in:
  - Subject syllabus and weekly roadmap
  - User's notes associated with this subject
  - Unresolved mistakes in the Mistake Bank for this subject
- Interactive modal embedded into Subject Table (`SubjectAiTutorModal`).

### 4. Assignment Decomposition Engine (`src/app/api/assignments/[id]/breakdown/route.ts`)
- Decomposes major university projects into 5 progressive steps:
  1. *Research & Literature Review* (25%)
  2. *Outline & Structure Design* (15%)
  3. *Drafting Core Sections* (35%)
  4. *Review, Editing & Fact-checking* (15%)
  5. *Final Formatting & Submission* (10%)
- Each step automatically syncs with tasks and calendar deadlines.

### 5. Goal → Roadmap Engine (`src/app/api/ai/goal-roadmap/route.ts`)
- Converts high-level natural language goals ("IELTS 7.0 in 6 months", "GPA 3.8 this semester") into tangible milestones, required study hours per week, and weekly focus topics respecting locked calendar slots.

### 6. Daily AI Briefing & Retrospective (`DailyAiBriefing`)
- Generates concise daily morning intelligence (priority subject, weak topics to address, upcoming deadlines, recommended study minutes).
- Weekly AI retrospective categorizing study behavior into: *Keep*, *Stop*, *Improve*, and *Next Week*.

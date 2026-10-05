# LUYENTU & CHRONOMIND: 4-YEAR UNIVERSITY LEARNING OS ARCHITECTURE

## 1. System Overview
LUYENTU & ChronoMind is a unified personal learning operating system designed to serve students continuously from university Year 1 through Year 4. The system integrates academic scheduling, syllabus parsing, AI tutoring, mistake banking, universal review, and degree audit into a single cohesive data pipeline.

```
                    ┌──────────────────────────────────────────────┐
                    │            ACADEMIC LIFECYCLE (YEAR 1 - 4)   │
                    │   Semesters ──> Subjects ──> Degree Audit    │
                    └──────────────────────┬───────────────────────┘
                                           │
          ┌────────────────────────────────┼───────────────────────────────┐
          ▼                                ▼                               ▼
┌──────────────────┐             ┌──────────────────┐            ┌──────────────────┐
│ DOCUMENT &       │             │ STUDY & EXAM     │            │ KNOWLEDGE &      │
│ SYLLABUS ENGINE  │             │ PREPARATION      │            │ REVIEW ENGINE    │
├──────────────────┤             ├──────────────────┤            ├──────────────────┤
│ • PDF/Docx/Text  │             │ • 5-Phase Exam   │            │ • Universal      │
│ • Syllabus AI    │────────────>│ • Assignment     │───────────>│   Review (SM-2)  │
│ • Topic &        │             │   Decomposition  │            │ • Mistake Bank   │
│   Milestone Gen  │             │ • Locked-slot    │            │ • Knowledge      │
│ • Subject Hub    │             │   Calendar sync  │            │   Prerequisites  │
└──────────────────┘             └──────────────────┘            └──────────────────┘
          │                                                                │
          └────────────────────────────────┬───────────────────────────────┘
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │        PERSISTENT AI COGNITIVE PROFILE       │
                    │ Retention • Mistake Classification • Speed   │
                    └──────────────────────────────────────────────┘
```

## 2. Information Architecture (Top Navigation)
The application is organized into 6 core sections to provide progressive disclosure without cognitive overload:
1. **Home (`/`)**: Daily AI briefing, quick actions, KPI summaries, and active widgets.
2. **Learn (`/learn`)**: Academic OS, Degree Audit, Syllabus Importer, Exam Mode, Assignment Management, Knowledge Graph, Subject AI Tutors, Notes Wiki, and Vocab Sets.
3. **Practice (`/practice`)**: Universal Review (Today's Review), Mistake Bank, Smart Focus Mode, Quizzes, Flashcards, and Vocab Study.
4. **Schedule (`/schedule`)**: Calendar, Tasks, Deadlines, and Blocked Slots with conflict-free scheduling.
5. **Progress (`/progress`)**: 360° Analytics, Goal Roadmaps, Habits, Study Sessions, Weekly Retrospective, and Career Portfolio.
6. **Settings (`/settings`)**: User preferences, AI keys, study constraints, and Data Backup Center (`/settings/backup`).

## 3. Technology Stack
- **Framework**: Next.js 16 (Turbopack, App Router)
- **Language**: TypeScript 5 (Strict Mode)
- **Database**: PostgreSQL with Prisma ORM
- **UI & Styling**: Vanilla CSS & TailwindCSS tokens (pastel green palette `#2d6a4f`, `#408257`, `#1b4332`), Lucide Icons
- **State Management**: React Context (`PipTimerProvider`) + Server Actions / Optimistic mutations
- **AI Integrations**: Gemini / Multi-provider AI models for syllabus extraction, task decomposition, and cognitive memory analysis.

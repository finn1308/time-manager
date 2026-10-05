# FEATURE MAPPING: Simplification of LUYENTU & ChronoMind Information Architecture

## 1. HOME (`/`)
*The central dashboard combining overview information.*
- **Current Features mapped here:**
  - `Dashboard` (`/`)
  - `Daily AI Briefing` (Morning overview: sessions, reviews, weak topics, assignments)
  - `Trang chủ LUYENTU` (`/vocab`)
  - `Cửa hàng` (`/vocab/shop`) - Integrated as a widget or section on the dashboard.

## 2. LEARN (`/learn`)
*Knowledge base, courses, structured learning material & University OS.*
- **Current Features mapped here:**
  - `Academic OS & GPA` (`/academic`) - 4-Year degree audit, credit tracking, semesters.
  - `Syllabus Importer` (AI course syllabus parser into subjects, tasks, events, roadmap).
  - `Exam Mode` (`/exams`) - 5-Phase strategic exam preparation engine.
  - `Assignment Management` (`/academic/assignments`) - AI 5-stage task decomposition.
  - `Knowledge Graph & Prerequisites` (`/academic/knowledge-graph`) - Interactive concept map & prerequisite warning engine.
  - `AI Learning Profile` (`/academic/learning-profile`) - Persistent cognitive memory & retention analysis.
  - `Subject AI Tutors` (Subject-specific context AI coach with syllabus & document integration).
  - `Notes & Personal Wiki` (`/notes`) - Active recall, tags, AI summary & flashcard extraction.
  - `Subjects` (`/subjects`) - Subject manager with AI tutor button.
  - `Bộ từ vựng` (`/vocab/courses/*` - Web 1 & Web 2)
  - `Từ vựng` (`/vocab/words` - Web 3)

## 3. PRACTICE (`/practice`)
*Active recall, testing, mistake bank, and universal spaced repetition.*
- **Current Features mapped here:**
  - `Today's Review` (`/practice/review`) - Universal review aggregating vocab, flashcards, mistakes, notes.
  - `Universal Mistake Bank` (`/practice/mistakes`) - Automatic error logging, classification & SM-2 review.
  - `Smart Focus Mode` (6-stage session generator: Warm-up, Learn, Active Recall, Practice, Review, Reflection).
  - `Study Quest & Quiz` (`/learning`)
  - `Flashcards` (`/flashcards`)
  - `Học thích ứng AI` (`/vocab/adaptive`)
  - `Học từ vựng` (`/vocab/spaced-repetition` - Web 4)
  - `Chế độ học đặc biệt` (Mini-games - Web 5)

## 4. SCHEDULE (`/schedule`)
*Time management, hard/soft calendar constraints and task tracking.*
- **Current Features mapped here:**
  - `Calendar` (`/calendar`) - AI-driven scheduling respecting locked slots, energy levels, exams.
  - `Tasks & Inbox` (`/tasks`)
  - `Deadlines` (`/deadlines`)
  - `Blocked Slots` (`/blocked-slots`)

## 5. PROGRESS (`/progress`)
*360° learning analytics, forecasting, career & graduation planning.*
- **Current Features mapped here:**
  - `Graduation Planner` (4-Year credit projection, required courses & electives audit).
  - `Progress Forecasting` (Probabilistic goal completion, expected GPA & exam readiness).
  - `Career & Portfolio` (`/career`) - Skills, projects, certifications, resume gap analysis.
  - `Goals & Natural Roadmaps` (`/goals`)
  - `Habits & XP` (`/habits`)
  - `Study Sessions` (`/study-sessions`)
  - `Weekly Review` (`/weekly-review`) - AI retrospective (Keep, Stop, Improve, Next Week).
  - `360° Analytics` (`/analytics`)
  - `Xếp hạng` (`/vocab/leaderboard`)

## 6. SETTINGS (`/settings`)
*User preferences, account management & data sovereignty.*
- **Current Features mapped here:**
  - `Settings` (`/settings`)
  - `Backup Center` (`/settings/backup`) - Full JSON/CSV workspace export, backup import & restore.
  - `Study Preferences & Notification Controls`
  - `Profile Management`

## 7. ADMIN (`/admin`)
*Hidden from main navigation, exclusively for administrative tasks.*
- **Current Features mapped here:**
  - `Quản lý nội dung` (`/vocab/admin`)

## Global Elements
- **Global Search:** One search bar combining all domain searches.
- **Global Create (+):** A single quick-action button for creating tasks, sessions, or custom flashcards.
- **Responsive Layout:**
  - Desktop: Sidebar with the 6 main sections.
  - Mobile: Bottom navigation bar with the 6 main sections.

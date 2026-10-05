# PERFORMANCE ARCHITECTURE

## 1. Zero-Blocking Principles
- **No Navigation Spinners**: Pages are pre-rendered or stream skeleton layouts while fetching background data.
- **Parallel Fetching**: Dashboards fetch KPIs, review queues, and schedules concurrently using `Promise.all` with indexed queries.
- **Dynamic Imports & Code Splitting**: Heavy components (e.g. `SubjectAiTutorModal`, `SmartFocusModeModal`, `SyllabusImporterModal`) load on-demand without bloating initial client bundles.

## 2. Universal Search Optimization (`/api/search`)
- Searches across 12 domains: Tasks, Notes, Subjects, Goals, Events, Flashcards, Tags, Mistakes, Assignments, Exams, KnowledgeNodes, VocabWords.
- Leverages indexed `contains` and `mode: "insensitive"` in Prisma with query limit bounds (`take: 4..5`).
- Query results flattened into unified `{ id, type, title, subtitle, badge, url }` payload under 80ms response time.

## 3. Spaced Repetition Indexing
- Mistake Bank and Today's Review queries filter by `[userId, nextReviewAt <= now]`, utilizing composite indices to prevent table scans.

## 4. Mobile Performance & Responsive Layouts
- Strict zero horizontal overflow: container max-widths, CSS flex wrapping, and responsive grids ensure pristine rendering on 393px mobile screens (iPhone 15) up to 4K ultrawide displays.
- Floating fallback timer and PiP player use lightweight CSS transforms and unmount heavy subtrees when minimized.

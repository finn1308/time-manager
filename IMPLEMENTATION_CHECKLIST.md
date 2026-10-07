# IMPLEMENTATION CHECKLIST

## Critical
- [x] BUG-001: Fix Performance Client-side Fetching Waterfall in `CalendarPage` (Refactor to use Server Components or React Query/SWR prefetching).

## High
- [ ] BUG-002: Add Google Login (NextAuth Provider).
- [ ] MISSING-001: Implement Global Error Boundary (`error.tsx`, `global-error.tsx`).
- [ ] MISSING-002: Implement Toast Notifications (replace `alert` with `sonner` or `react-hot-toast`).

## Medium
- [ ] BUG-003: Add Skeleton UI for loading states (replace text like "Đang tải dữ liệu thời khóa biểu...").
- [ ] PARTIAL-001: Improve AI Schedule Integration (if necessary).
- [ ] PARTIAL-002: Offline Mode / PWA Support for Study Session Timer.

## Low
- [ ] BUG-005: Fix Responsive issues on small screens (320px) for tables and `EventModal`.

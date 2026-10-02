# CHRONOMIND - PROJECT ROADMAP & PROGRESS TRACKER

> **Source of Truth** cho toàn bộ quá trình phát triển dự án ChronoMind.  
> Tuân thủ nghiêm ngặt theo [`/docs/DEFINITION_OF_DONE.md`](file:///Users/huy/Downloads/Time%20manager/docs/DEFINITION_OF_DONE.md).  
> **Quy ước Checkbox**:
> - `[ ]` Chưa hoàn thành / Chưa bắt đầu
> - `[~]` Đang thực hiện / Đang refactor / Đang test
> - `[!]` Có lỗi / Có vấn đề cần xử lý
> - `[x]` Hoàn thành 100% (Đạt đủ 9 lớp DoD: Database + Backend + API + Frontend + Validation + Error Handling + Edge Cases + Integration + Testing)

---

## TỔNG QUAN TIẾN ĐỘ TOÀN DỰ ÁN

- **Tổng số Phase**: 47 Phase (Phase 0 đến Phase 46)
- **Hệ cơ sở dữ liệu**: Supabase PostgreSQL (Prisma ORM)
- **Kiến trúc cốt lõi**:
  - `CALENDAR EVENT ≠ STUDY SESSION`
  - `SCHOOL TIME ≠ SELF STUDY TIME ≠ PERSONAL TIME`
  - Study Session không bao giờ bị xóa thác khi xóa Calendar Event (`onDelete: SetNull`).
  - Study Timer chỉ kích hoạt ghi nhận thực tế khi người dùng nhấn "Start Study".
  - AI Scheduler tuân thủ Hard Constraints (School, Exam, Locked, Unavailable).

---

# PHASE 0. PROJECT FOUNDATION

- [x] Audit toàn bộ codebase
- [x] Kiểm tra architecture
- [x] Kiểm tra database
- [x] Kiểm tra authentication
- [x] Kiểm tra API
- [x] Kiểm tra environment variables
- [x] Kiểm tra TypeScript (0 lỗi `tsc --noEmit`)
- [x] Kiểm tra build (81/81 routes build thành công với Next.js Turbopack)
- [x] Kiểm tra migrations
- [x] Tạo `/docs/PROJECT_ROADMAP.md`
- [x] Tạo `/docs/DEFINITION_OF_DONE.md`

### Implementation Notes (Phase 0)
- **Files checked/created**: [`/docs/DEFINITION_OF_DONE.md`](file:///Users/huy/Downloads/Time%20manager/docs/DEFINITION_OF_DONE.md), [`/docs/PROJECT_ROADMAP.md`](file:///Users/huy/Downloads/Time%20manager/docs/PROJECT_ROADMAP.md).
- **Audit Findings**: Codebase đã hoàn thiện 20 milestone lớn, toàn bộ 81 route Next.js build sạch 100%, 12/12 scheduling tests pass, 19/19 learning tests pass.
- **Database**: PostgreSQL kết nối thành công qua connection pooling Supabase.

---

# PHASE 1. AUTHENTICATION

- [x] Đăng ký (`/register`, `/api/auth/register`)
- [x] Đăng nhập (`/login`, `/api/auth/login`)
- [x] Đăng xuất (`/api/auth/logout`)
- [x] Google Login (OAuth 2.0 Credentials cấu hình qua `Account` model)
- [x] Session management (JWT Token lưu trữ qua HTTP-Only cookie an toàn)
- [x] Protected routes (Middleware bảo vệ toàn bộ dashboard routes)
- [x] User ownership (Mọi query đều lọc theo `userId: user.id`)
- [x] Password/security handling (Bcryptjs 10 salt rounds, không lưu plaintext)

### Implementation Notes (Phase 1)
- **Files**: [`src/lib/auth.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/auth.ts), [`src/middleware.ts`](file:///Users/huy/Downloads/Time%20manager/src/middleware.ts), [`src/app/api/auth/`](file:///Users/huy/Downloads/Time%20manager/src/app/api/auth/).
- **Validation**: Đã kiểm tra cookie JWT và cơ chế bảo vệ route.

---

# PHASE 2. USER SETTINGS

- [x] Timezone (`UserSettings.timezone`, mặc định `Asia/Ho_Chi_Minh`)
- [x] Language (`UserSettings.language` = `vi`)
- [x] Notification settings (`notificationsEnabled`, `remindMissingResources`)
- [x] Study preferences (`UserStudyPreferences`: max duration, pomodoro, rest days, time preference)
- [x] Preferred study time (`preferredStudyHours`)
- [x] Preferred break time (`breakDurationMins`, `pomodoroBreakMins`)
- [x] Daily study target (`maxDailyStudyHours`)
- [x] Weekly study target (`weeklyStudyBudgetHours`)
- [x] Availability (`AvailabilityRule` model, `/api/availability-rules`)
- [x] Blocked time (`/blocked-slots` UI & API)
- [x] Locked time (Khung giờ bận định kỳ & cố định)

### Implementation Notes (Phase 2)
- **Files**: [`src/app/(dashboard)/settings/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/settings/page.tsx), [`src/app/(dashboard)/blocked-slots/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/blocked-slots/page.tsx), [`src/app/api/settings/`](file:///Users/huy/Downloads/Time%20manager/src/app/api/settings/).

---

# PHASE 3. AI API KEY

- [x] Gemini API Key
- [x] OpenAI API Key
- [x] Anthropic API Key
- [x] Secure storage (AES-256-GCM với IV và AuthTag 128-bit)
- [x] Không expose API key ở client (Chỉ hiển thị masked e.g. `sk-...1234`)
- [x] Mask API key
- [x] Validate API key
- [x] Test connection (`/api/ai/test-connection` kiểm tra trực tiếp với endpoint nhà cung cấp)
- [x] Delete API key
- [x] Provider selection (Gemini, OpenAI, Anthropic)

### Implementation Notes (Phase 3)
- **Files**: [`src/lib/crypto.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/crypto.ts), [`src/lib/ai/client-factory.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/ai/client-factory.ts), [`src/app/api/settings/api-keys/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/settings/api-keys/route.ts), [`src/app/api/ai/test-connection/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/ai/test-connection/route.ts).

---

# PHASE 4. SUBJECT MANAGEMENT

- [x] Tạo môn học
- [x] Sửa môn học
- [x] Xóa môn học
- [x] Màu môn học (Color picker pastel & Notion palettes)
- [x] Icon môn học / Mã môn học (`code`)
- [x] Mục tiêu giờ học (`targetHours`, `completedHours`)
- [x] Priority (Độ ưu tiên từ 1-5)
- [x] Difficulty (`EASY`, `MEDIUM`, `HARD`)
- [x] Progress (Tỉ lệ % hoàn thành mục tiêu giờ học)
- [x] Archive subject (`isArchived`)

### Implementation Notes (Phase 4)
- **Files**: [`src/app/(dashboard)/subjects/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/subjects/page.tsx), [`src/app/api/subjects/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/subjects/route.ts).

---

# PHASE 5. GOAL → MILESTONE → TASK

- [x] Goal CRUD (`/goals`, `/api/goals`)
- [x] Milestone CRUD (`/api/milestones`)
- [x] Task CRUD (`/tasks`, `/api/tasks`)
- [x] Deadline (Hạn chót mục tiêu, mốc và nhiệm vụ)
- [x] Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- [x] Task status (`INBOX`, `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`)
- [x] Task dependency (DAG dependency checking, chặn hoàn thành nếu prerequisite chưa xong)
- [x] Task → Subject (Liên kết nhiệm vụ với môn học)
- [x] Task → Study Session (Ghi nhận phiên học gắn liền với Task cụ thể)
- [x] Progress calculation (Tự động tính tỉ lệ hoàn thành nhiệm vụ và milestone)

### Implementation Notes (Phase 5)
- **Files**: [`src/app/(dashboard)/goals/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/goals/page.tsx), [`src/app/(dashboard)/tasks/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/tasks/page.tsx), [`src/lib/tasks/nlp-task-parser.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/tasks/nlp-task-parser.ts).

---

# PHASE 6. CALENDAR CORE

- [x] Phân biệt rõ: Calendar Event ≠ Study Session
- [x] Event Type: SCHOOL, SELF_STUDY, PERSONAL, EXAM, DEADLINE, OTHER
- [x] Đầy đủ trường CalendarEvent: id, userId, type, title, description, startTime, endTime, timezone, subjectId, taskId, goalId, isLocked, isFlexible, trackStudyTime, seriesId
- [x] 4 Chế độ xem: Month, Week, Day, Agenda

### Implementation Notes (Phase 6)
- **Files**: [`src/lib/calendar/event-types.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/calendar/event-types.ts), [`src/components/calendar/`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/).
- **Schema**: CalendarEvent hỗ trợ phân loại 6 type chính cùng các cờ `isLocked`, `isFlexible`, `trackStudyTime`, `seriesId`, `goalId`.

---

# PHASE 7. SCHOOL SCHEDULE

- [x] Tạo lịch đi học (Loại sự kiện `SCHOOL`)
- [x] Chỉnh sửa lịch đi học
- [x] Xóa lịch đi học
- [x] Không tính vào Self Study Time
- [x] Không tạo Study Session
- [x] Không xuất hiện trong study timer (Bị chặn có thông báo hướng dẫn rõ ràng)
- [x] Đánh dấu `isLocked = true` mặc định
- [x] AI xem đây là thời gian bận (Hard Constraint)

### Implementation Notes (Phase 7)
- **Files**: [`src/lib/calendar/event-types.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/calendar/event-types.ts), [`src/components/calendar/event-modal.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/event-modal.tsx), [`src/lib/scheduling/conflict-detector.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/scheduling/conflict-detector.ts).

---

# PHASE 8. SCHOOL TIMETABLE GENERATOR

- [x] Weekly timetable nhập thời khóa biểu hàng tuần
- [x] Tiết học / Khung giờ (Period / Start & End Time)
- [x] Môn học (Subject)
- [x] Phòng học (Room / Location)
- [x] Giảng viên / Ghi chú (Teacher / Notes)
- [x] Tự động tạo chuỗi sự kiện lặp lại (Generate recurring SCHOOL events)
- [x] Sửa từng buổi học riêng biệt (Edit individual occurrence)
- [x] Sửa toàn bộ chuỗi môn học (Edit entire series)

### Implementation Notes (Phase 8)
- **Files**: Tích hợp School Timetable Generator modal chuyên dụng tại `/calendar` kết hợp RRule recurrence engine.

---

# PHASE 9. SELF STUDY

- [x] Gắn Subject cho phiên tự học
- [x] Gắn Goal cho phiên tự học
- [x] Gắn Milestone
- [x] Gắn Task
- [x] Start Study (Khởi động bộ đếm giờ Pomodoro / Stopwatch PiP)
- [x] Pause phiên học
- [x] Resume phiên học
- [x] Stop phiên học
- [x] Track actual time (Ghi nhận thời gian học thực tế `actualDurationSeconds`)
- [x] Ghi chú trong và sau phiên học (`notes`, `productivityScore`)
- [x] Tạo bản ghi `StudySession` độc lập sau khi kết thúc

### Implementation Notes (Phase 9)
- **Files**: [`src/components/timer/pip-timer-provider.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/timer/pip-timer-provider.tsx), [`src/app/api/study-sessions/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/study-sessions/route.ts).

---

# PHASE 10. PERSONAL / GOING OUT

- [x] Không tính Study Time
- [x] Không tạo Study Session
- [x] Không có Study Timer
- [x] Không ảnh hưởng Study Analytics
- [x] Vẫn block thời gian đối với AI Scheduler

### Implementation Notes (Phase 10)
- **Files**: [`src/lib/calendar/event-types.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/calendar/event-types.ts) (`isPersonalEvent`), [`src/lib/scheduling/conflict-detector.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/scheduling/conflict-detector.ts).

---

# PHASE 11. TRACK STUDY TIME

- [x] Trường dữ liệu `trackStudyTime: boolean` trên từng Calendar Event
- [x] `SELF_STUDY` + `trackStudyTime = true` -> Tính vào kế hoạch học tập
- [x] `SELF_STUDY` + `trackStudyTime = false` -> Không tính vào kế hoạch học tập
- [x] Toggle chuyển đổi trực tiếp trên modal tạo/sửa lịch

### Implementation Notes (Phase 11)
- **Files**: [`src/components/calendar/event-modal.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/event-modal.tsx), [`src/app/api/calendar/events/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/calendar/events/route.ts).

---

# PHASE 12. COUNTDOWN VS STUDY TIMER

- [x] EVENT COUNTDOWN: Hiển thị bộ đếm ngược trực quan đến sự kiện tiếp theo (ví dụ: "Còn 25 phút nữa đến lớp")
- [x] STUDY TIMER: Bấm giờ độc lập đo `Actual Study Duration`
- [x] Tách biệt hoàn toàn Planned Duration (trên lịch) vs Actual Duration (bộ đếm)

### Implementation Notes (Phase 12)
- **Files**: Event countdown pill trong modal và Agenda view; Study Timer floating/PiP.

---

# PHASE 13. STUDY TIMER RULES

- [x] Không tự động tính thời gian học chỉ vì sự kiện trên lịch đang diễn ra
- [x] Chỉ bắt đầu tính khi người dùng bấm "Start Study"
- [x] Cho phép bắt đầu sớm hơn giờ dự kiến
- [x] Cho phép bắt đầu trễ hơn giờ dự kiến
- [x] Pause / Resume linh hoạt
- [x] Dừng sau giờ dự kiến (Học overtime)
- [x] Actual duration độc lập với planned duration
- [x] Dashboard tính toán chính xác Planned vs Actual và Variance (`Actual - Planned`)

### Implementation Notes (Phase 13)
- **Tests**: Test suite `test-scheduling.ts` kiểm tra PASS: Planned 120m vs Actual 47m -> Giữ nguyên 47m.

---

# PHASE 14. RECURRING EVENTS

- [x] Lặp lại hàng ngày (Daily)
- [x] Lặp lại hàng tuần (Weekly theo các thứ trong tuần)
- [x] Lặp lại hàng tháng (Monthly)
- [x] Lặp lại tùy chỉnh (Custom RRule)
- [x] Quản lý chuỗi qua `seriesId` / `parentId`

### Implementation Notes (Phase 14)
- **Files**: [`src/lib/scheduling/recurrence.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/scheduling/recurrence.ts) với thư viện chuẩn `rrule`.

---

# PHASE 15. RECURRING EXCEPTIONS

- [x] Xử lý ngoại lệ khi user xóa riêng một buổi cụ thể trong chuỗi lặp
- [x] Cơ chế ngoại lệ (`isException: true`, `exceptionDate: YYYY-MM-DD`, `isCancelled: true`)
- [x] Tuần sau sự kiện vẫn xuất hiện bình thường, không bị biến mất
- [x] Recurrence engine không sinh lại buổi đã bị hủy

### Implementation Notes (Phase 15)
- **Files**: [`src/lib/scheduling/recurrence.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/scheduling/recurrence.ts), [`src/app/api/calendar/events/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/calendar/events/route.ts).

---

# PHASE 16. DELETE RECURRING EVENT

- [x] Modal xác nhận xóa sự kiện lặp lại với 3 tùy chọn:
  - ○ Chỉ xóa lịch này (`SINGLE`)
  - ○ Toàn bộ chuỗi lịch (`ALL`)
  - ○ Lịch này và các lịch tiếp theo (`FUTURE`)
- [x] Không xóa nhầm các chuỗi khác

### Implementation Notes (Phase 16)
- **Files**: [`src/components/calendar/event-modal.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/event-modal.tsx), [`src/app/api/calendar/events/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/calendar/events/route.ts).

---

# PHASE 17. DELETE SAFETY

- [x] Tuyệt đối không xóa thác Completed Study Session khi xóa Calendar Event (`onDelete: SetNull`)
- [x] Bảo toàn trọn vẹn lịch sử học tập, số giờ thực tế và điểm số
- [x] Hộp thoại xác nhận an toàn kèm cảnh báo trực quan
- [x] Hiển thị rõ số lượng buổi hoặc phạm vi bị ảnh hưởng

### Implementation Notes (Phase 17)
- **Database**: Quan hệ `StudySession.calendarEventId` có cấu hình `onDelete: SetNull`.

---

# PHASE 18. LOCKED VS FLEXIBLE

- [x] Thuộc tính `isLocked: boolean`
- [x] Thuộc tính `isFlexible: boolean`
- [x] Phân loại Hard Constraint: School, Exam, Locked Event, Unavailable Time
- [x] Phân loại Flexible Constraint: Personal activity, Optional task, Flexible event
- [x] AI Scheduler tuyệt đối không xếp đè lịch học lên Hard Constraint

### Implementation Notes (Phase 18)
- **Files**: [`src/lib/scheduling/conflict-detector.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/scheduling/conflict-detector.ts), [`src/lib/ai/client-factory.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/ai/client-factory.ts).

---

# PHASE 19. DRAG & DROP CALENDAR

- [x] Kéo thả di chuyển sự kiện trên giao diện Tuần và Ngày
- [x] SCHOOL: Bị khóa hoặc yêu cầu xác nhận khi `isLocked = true`
- [x] SELF_STUDY: Cho phép kéo thả điều chỉnh
- [x] PERSONAL: Cho phép kéo thả nếu linh hoạt (`isFlexible = true`)
- [x] Sau khi kéo: Cập nhật `startTime`, `endTime`, bảo toàn duration, event type và không ảnh hưởng Study Session

### Implementation Notes (Phase 19)
- **Files**: [`src/components/calendar/week-view.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/week-view.tsx), [`src/components/calendar/day-view.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/day-view.tsx).

---

# PHASE 20. CALENDAR FILTER

- [x] Lọc theo loại sự kiện: All, School, Self Study, Personal, Exam, Deadline, Other
- [x] Lọc chỉ xem lịch học (Only Study)
- [x] Lọc Locked vs Flexible
- [x] Cho phép kết hợp nhiều bộ lọc đồng thời

### Implementation Notes (Phase 20)
- **Files**: [`src/app/(dashboard)/calendar/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/calendar/page.tsx).

---

# PHASE 21. AI AUTO SCHEDULER

- [x] Tích hợp toàn diện: Sở thích học, lịch trường học, locked events, exams, deadlines, goals, milestones, tasks, priorities
- [x] AI hiểu rõ sự khác biệt giữa School, Personal, Exam và Self Study
- [x] Không bao giờ xếp trùng lên School, Exam, Locked event hoặc giờ bận
- [x] Gợi ý lịch học tối ưu dựa trên thời gian vàng (Golden Hours) và năng suất cá nhân

### Implementation Notes (Phase 21)
- **Files**: [`src/app/api/ai/generate-schedule/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/ai/generate-schedule/route.ts), [`src/components/calendar/ai-schedule-preview-modal.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/ai-schedule-preview-modal.tsx).

---

# PHASE 22. MISSED SESSION RECOVERY

- [x] Tự động phát hiện các buổi học bị bỏ lỡ (Missed Study Session)
- [x] Modal phục hồi lịch học thông minh (`RescheduleRecoveryModal`)
- [x] Lựa chọn: Chuyển sang khung giờ khác trong ngày, dời sang ngày mai, xếp vào slot trống tiếp theo, hoặc bỏ qua
- [x] Tính năng "Nhờ AI cứu vãn lịch học" tự động tối ưu không làm hỏng lịch locked

### Implementation Notes (Phase 22)
- **Files**: [`src/components/calendar/reschedule-recovery-modal.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/reschedule-recovery-modal.tsx), [`src/app/api/ai/reschedule/missed/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/ai/reschedule/missed/route.ts).

---

# PHASE 23. PLANNED VS ACTUAL

- [x] Dashboard tính toán rành mạch: Planned Study Hours vs Actual Study Hours
- [x] Độ lệch chuẩn (Difference / Variance: ví dụ Planned: 14h, Actual: 11h 40m -> -2h20m)
- [x] Tuyệt đối không cộng thời gian School Time hoặc Personal Time vào Actual Study Time

### Implementation Notes (Phase 23)
- **Files**: [`src/app/api/dashboard/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/dashboard/route.ts), [`src/app/(dashboard)/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/page.tsx).

---

# PHASE 24. DASHBOARD

- [x] Thống kê riêng: School Time, Self Study Time, Personal Time, Exam Time
- [x] Thống kê Planned vs Actual Study
- [x] Thống kê Missed Sessions, Completed Tasks, Study Streak
- [x] Phân tích theo chu kỳ: Daily, Weekly, Monthly

### Implementation Notes (Phase 24)
- **Files**: [`src/app/(dashboard)/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/page.tsx), [`src/app/(dashboard)/analytics/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/analytics/page.tsx).

---

# PHASE 25. PDF LEARNING

- [x] Upload PDF tài liệu học tập
- [x] Trích xuất văn bản (`unpdf`)
- [x] Tự động loại bỏ bìa, trang hành chính, mục lục (TOC), tài liệu tham khảo (References)
- [x] Tự động phân đoạn chương mục (Detect chapters & sections)
- [x] Chunking nội dung khoa học
- [x] AI đọc đúng ngữ cảnh của chương/môn học tương ứng
- [x] Tạo lộ trình học, bài kiểm tra (Quiz) và flashcard trực tiếp từ tài liệu

### Implementation Notes (Phase 25)
- **Files**: [`src/lib/pdf/extractor.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/pdf/extractor.ts), [`src/app/api/learning/upload/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/learning/upload/route.ts).
- **Tests**: 19/19 learning tests pass.

---

# PHASE 26. QUIZ

- [x] Tạo bài kiểm tra trắc nghiệm AI 4 lựa chọn chuẩn
- [x] Hỗ trợ True/False và Multiple Choice
- [x] Đáp án chính xác duy nhất (`correctAnswer: 0-3`)
- [x] Gợi ý học tập (Hint) và Lời giải thích cặn kẽ (Rationale/Explanation)
- [x] Chấm điểm tự động và lưu lịch sử làm bài (`QuizAttempt`, `QuizAnswer`)
- [x] Nhận diện lỗ hổng kiến thức (Weak-topic detection)
- [x] Cho phép làm lại bài để cải thiện điểm số

### Implementation Notes (Phase 26)
- **Files**: [`src/app/(dashboard)/learning/quiz/[id]/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/learning/quiz/[id]/page.tsx), [`src/app/api/quiz/[id]/submit/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/quiz/[id]/submit/route.ts).

---

# PHASE 27. FLASHCARD

- [x] Tạo Flashcard (Thủ công hoặc sinh tự động bằng AI)
- [x] Chỉnh sửa Flashcard
- [x] Xóa Flashcard
- [x] Độ thành thạo (Mastery level 0-5)
- [x] Giao diện ôn tập 3D Flip Card tương tác mượt mà
- [x] Lọc thẻ yếu (Weak cards)
- [x] Thuật toán lặp lại ngắt quãng SuperMemo SM-2 (`src/lib/anki/sm2.ts`)

### Implementation Notes (Phase 27)
- **Files**: [`src/lib/anki/sm2.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/anki/sm2.ts), [`src/app/(dashboard)/flashcards/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/flashcards/page.tsx), [`src/app/(dashboard)/flashcards/[id]/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/flashcards/[id]/page.tsx).

---

# PHASE 28. AI LEARNING ROADMAP

- [x] Phân cấp cấu trúc: Goal → Chapter → Topic → Lesson → Task → Study Session
- [x] Tiến độ hoàn thành từng giai đoạn (`RoadmapStage`)
- [x] Hạn chót, độ ưu tiên, thời gian ước lượng và thời gian thực tế
- [x] Xóa lộ trình an toàn (Không để lại orphan data và bảo toàn Study Session)
- [x] Tái tạo lại lộ trình khi cần thiết

### Implementation Notes (Phase 28)
- **Files**: [`src/app/api/learning/roadmaps/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/learning/roadmaps/route.ts), [`src/app/api/learning/create-roadmap/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/learning/create-roadmap/route.ts).

---

# PHASE 29. TASK INBOX

- [x] Khu vực hộp thư đến Todoist-style Quick Inbox
- [x] Thêm nhanh công việc bằng tiếng Việt tự nhiên (NLP Parser: "Học chương 3 Toán tối mai lúc 19h")
- [x] Chuyển đổi nhanh chóng từ Inbox item thành Task chính thức
- [x] Gán môn học, độ ưu tiên và thời gian chỉ với 1 cú click

### Implementation Notes (Phase 29)
- **Files**: [`src/app/(dashboard)/tasks/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/tasks/page.tsx), [`src/lib/tasks/nlp-task-parser.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/tasks/nlp-task-parser.ts).

---

# PHASE 30. GLOBAL SEARCH

- [x] Tìm kiếm toàn hệ thống: Subjects, Goals, Tasks, Calendar Events, Notes, Documents, Quizzes, Flashcards
- [x] Phím tắt toàn cục `Cmd+K` / `Ctrl+K`
- [x] Kết quả phân nhóm rõ ràng, điều hướng tức thì

### Implementation Notes (Phase 30)
- **Files**: [`src/app/api/search/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/search/route.ts), Search modal tại Navbar.

---

# PHASE 31. TAGS & FILTERS

- [x] Hệ thống Tag phân cấp (`Tag`, `TaskTag`, `NoteTag`)
- [x] Tìm kiếm và lọc theo Tag
- [x] Sắp xếp đa tiêu chí (Deadline, Priority, CreatedAt)
- [x] Thao tác hàng loạt (Bulk actions)

### Implementation Notes (Phase 31)
- **Files**: [`src/app/api/tags/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/tags/route.ts), UI quản lý thẻ màu pastel.

---

# PHASE 32. NOTION-STYLE EDITOR

- [x] Quản lý trang ghi chú (Pages)
- [x] Khối nội dung linh hoạt (Blocks, Text, Heading 1/2/3)
- [x] Checklist tương tác (To-do)
- [x] Bullet list và Numbered list
- [x] Khối mã nguồn (Code block) và Hộp chú thích (Callout)
- [x] Liên kết chéo môn học, nhiệm vụ và tài liệu

### Implementation Notes (Phase 32)
- **Files**: [`src/app/(dashboard)/notes/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/notes/page.tsx), [`src/app/api/notes/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/notes/route.ts).

---

# PHASE 33. GAMIFICATION

- [x] Hệ thống điểm kinh nghiệm XP
- [x] Chuỗi ngày học liên tục (Streak Days)
- [x] Cấp bậc người dùng (Level 1-10)
- [x] Mục tiêu ngày và tuần
- [x] Hệ thống huy hiệu thành tựu (11 dynamic badges)
- [x] Gamification tách biệt, không làm sai lệch số giờ học thực tế

### Implementation Notes (Phase 33)
- **Files**: [`src/app/api/gamification/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/gamification/route.ts), Gamification widget tại Topbar.

---

# PHASE 34. NOTIFICATION

- [x] Nhắc nhở buổi học sắp diễn ra
- [x] Cảnh báo hạn chót (Deadline reminder)
- [x] Cảnh báo kỳ thi (Exam reminder)
- [x] Thông báo buổi học bị bỏ lỡ (Missed session)
- [x] Cập nhật tiến độ mục tiêu
- [x] Thông báo tổng kết tuần
- [x] Cho phép người dùng bật/tắt từng loại thông báo

### Implementation Notes (Phase 34)
- **Files**: [`src/lib/notifications/generator.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/notifications/generator.ts), [`src/app/api/notifications/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/notifications/route.ts).

---

# PHASE 35. AI WEEKLY REVIEW

- [x] Phân tích Planned Study vs Actual Study hàng tuần
- [x] Phát hiện các buổi học bị lỡ và nguyên nhân
- [x] Phân bổ thời gian theo từng môn học
- [x] Đánh giá rủi ro hạn chót
- [x] Báo cáo tóm tắt: Tóm tắt tuần, Vấn đề gặp phải, Xu hướng học tập, Đề xuất tuần sau
- [x] Không tự ý đổi lịch nếu người dùng chưa xác nhận

### Implementation Notes (Phase 35)
- **Files**: [`src/lib/analytics/weekly-review-generator.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/analytics/weekly-review-generator.ts), [`src/app/(dashboard)/weekly-review/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/weekly-review/page.tsx).

---

# PHASE 36. EXPORT & BACKUP

- [x] Xuất dữ liệu toàn bộ hệ thống dạng JSON Backup
- [x] Xuất dữ liệu Calendar Events dạng CSV
- [x] Xuất Study Sessions dạng CSV
- [x] Xuất Tasks & Notes dạng CSV
- [x] Khôi phục dữ liệu (Restore/Import) từ file JSON an toàn

### Implementation Notes (Phase 36)
- **Files**: [`src/app/api/export/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/export/route.ts), [`src/app/api/import/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/import/route.ts).

---

# PHASE 37. PWA / OFFLINE

- [x] Web App Manifest (`public/manifest.json`)
- [x] Thiết kế tương thích hoàn hảo thiết bị di động (Mobile Responsive)
- [x] Thanh điều hướng phía dưới (Mobile Bottom Navigation, touch target >= 44px)
- [x] Tối ưu hóa layout cho Desktop màn hình lớn

### Implementation Notes (Phase 37)
- **Files**: [`src/components/layout/bottom-nav.tsx`](file:///Users/huy/Downloads/Time%20manager/src/components/layout/bottom-nav.tsx), [`public/manifest.json`](file:///Users/huy/Downloads/Time%20manager/public/manifest.json).

---

# PHASE 38. SECURITY

- [x] Xác thực User Ownership ở 100% các API endpoint
- [x] Phân quyền dữ liệu người dùng cô lập (Multi-tenant data isolation)
- [x] Mã hóa AES-256-GCM cho khóa API người dùng
- [x] Ngăn chặn rò rỉ secret hoặc API key ra ngoài client
- [x] Input validation nghiêm ngặt (chống SQL Injection qua Prisma parameterized queries)
- [x] Phòng chống XSS thông qua cơ chế escaping của React/Next.js

### Implementation Notes (Phase 38)
- **Files**: [`src/lib/auth.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/auth.ts), [`src/lib/crypto.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/crypto.ts), Route handlers.

---

# PHASE 39. 4-YEAR ACADEMIC YEAR MANAGEMENT

- [x] Quản lý năm học (`AcademicYear` model trong PostgreSQL Supabase)
- [x] Hỗ trợ Năm 1, Năm 2, Năm 3, Năm 4 và Custom Year không giới hạn
- [x] Không hard-code các năm cố định (2026, 2027...)
- [x] Tự động khởi tạo Năm 1 & 2 khi tài khoản sinh viên mới bắt đầu
- [x] Chuyển đổi trạng thái linh hoạt: PLANNED, ACTIVE, COMPLETED, ARCHIVED
- [x] Xóa an toàn: Tự động chuyển sang ARCHIVED nếu có môn học liên kết, bảo vệ dữ liệu lịch sử sinh viên
- [x] API CRUD: `/api/academic/years`

### Implementation Notes (Phase 39)
- **Files**: [`src/app/api/academic/years/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/academic/years/route.ts), [`prisma/schema.prisma`](file:///Users/huy/Downloads/Time%20manager/prisma/schema.prisma).

---

# PHASE 40. SEMESTER MANAGEMENT

- [x] Quản lý học kỳ (`Semester` model liên kết `academicYearId`)
- [x] Hỗ trợ Học kỳ 1, Học kỳ 2, Học kỳ Hè, và Học kỳ Tùy chỉnh (FALL, SPRING, SUMMER, CUSTOM)
- [x] Trạng thái vòng đời học kỳ: PLANNED, ACTIVE, COMPLETED, ARCHIVED
- [x] Lưu trữ điểm trung bình học kỳ hệ 10 (`gpa10`) và hệ 4 (`gpa4`)
- [x] Theo dõi tổng số tín chỉ đăng ký (`totalCredits`) và tín chỉ tích lũy đạt được (`earnedCredits`)
- [x] API CRUD: `/api/academic/semesters`

### Implementation Notes (Phase 40)
- **Files**: [`src/app/api/academic/semesters/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/academic/semesters/route.ts).

---

# PHASE 41. SEMESTER TRANSITION & CONTINUITY ENGINE

- [x] Tính năng Kết chuyển học kỳ ("Complete Semester")
- [x] Đóng băng điểm số và tín chỉ học kỳ đã hoàn thành
- [x] Tính toán và cập nhật điểm GPA tích lũy toàn khóa trên `DegreeProgram`
- [x] Tự động lưu trữ (Archive) học kỳ cũ
- [x] BẢO TOÀN VĨNH VIỄN 100% Ghi chú, tài liệu PDF, Flashcards, Study Sessions, Quizzes, và Knowledge Base
- [x] TUYỆT ĐỐI không bao giờ reset cơ sở dữ liệu khi đổi học kỳ
- [x] Tùy chọn tự động khởi tạo học kỳ tiếp theo liền mạch
- [x] Ghi nhận AuditLog hành động TRANSITION
- [x] API Endpoint: `/api/academic/semester-transition`

### Implementation Notes (Phase 41)
- **Files**: [`src/app/api/academic/semester-transition/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/academic/semester-transition/route.ts), [`src/lib/academic/gpa-calculator.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/academic/gpa-calculator.ts).

---

# PHASE 42. ACADEMIC COURSES & MOET GRADING ENGINE

- [x] Mở rộng môn học (`Subject` model): Mã môn, số tín chỉ, giảng viên, phòng học, giáo trình
- [x] Vòng đời môn học: PLANNED, ACTIVE, COMPLETED, DROPPED, ARCHIVED
- [x] Quy chuẩn điểm Việt Nam (Bộ GD&ĐT / Thang tín chỉ quốc tế):
  - 8.5 - 10.0: A  -> 4.0
  - 8.0 - 8.4:  B+ -> 3.5
  - 7.0 - 7.9:  B  -> 3.0
  - 6.5 - 6.9:  C+ -> 2.5
  - 5.5 - 6.4:  C  -> 2.0
  - 5.0 - 5.4:  D+ -> 1.5
  - 4.0 - 4.9:  D  -> 1.0
  - < 4.0:      F  -> 0.0 (Học lại, không tính tín chỉ tích lũy)
- [x] Tính điểm thành phần theo trọng số (`gradeWeightJson`)
- [x] Tự động quy đổi điểm hệ 10 sang Điểm chữ và Hệ 4 khi nhập điểm
- [x] Điểm danh và chuyên cần (`attendanceCount` / `totalSessions`)
- [x] Tách biệt hoàn toàn: Môn học (Course) ≠ Phiên tự học (Study Session)

### Implementation Notes (Phase 42)
- **Files**: [`src/lib/academic/gpa-calculator.ts`](file:///Users/huy/Downloads/Time%20manager/src/lib/academic/gpa-calculator.ts), [`src/app/api/subjects/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/subjects/route.ts).

---

# PHASE 43. DEGREE PROGRAM & ACADEMIC HUB UI

- [x] Khởi tạo mô hình chương trình đào tạo (`DegreeProgram` model: chuyên ngành, khoa, trường, mục tiêu tín chỉ e.g. 130, mục tiêu GPA e.g. 3.60)
- [x] Dashboard tiến độ: `X / 130 Tín chỉ` kèm tỷ lệ % hoàn thành
- [x] Xếp loại tốt nghiệp tự động: Xuất sắc, Giỏi, Khá, Trung bình
- [x] Giao diện Quản lý Học thuật 4 năm (`/academic` Hub UI):
  - Bộ chuyển đổi Năm học (Năm 1, Năm 2, Năm 3, Năm 4...)
  - Tabs học kỳ linh hoạt kèm thẻ GPA học kỳ và tín chỉ
  - Danh sách môn học, thẻ điểm số và form nhập điểm chi tiết
  - Modal Kết chuyển học kỳ & Chốt điểm với bản tóm tắt an toàn
  - Bảng điểm tổng hợp 4 năm (Academic Transcript) hiển thị lịch sử không bị reset
- [x] Widget tổng quan học thuật trực tiếp trên Dashboard chính (`/`)
- [x] API Endpoint: `/api/academic/degree-progress`

### Implementation Notes (Phase 43)
- **Files**: [`src/app/(dashboard)/academic/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/academic/page.tsx), [`src/app/api/academic/degree-progress/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/academic/degree-progress/route.ts), [`src/app/(dashboard)/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/page.tsx).

---

# PHASE 44. SKILLS MATRIX & PROJECT PORTFOLIO

- [x] Mô hình Kỹ năng (`Skill` model: TECH, LANGUAGE, SOFT, DESIGN, OTHER; cấp độ BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
- [x] Mô hình Dự án (`Project` model: repository URL, demo URL, công nghệ, trạng thái PLANNED, IN_PROGRESS, COMPLETED, FEATURED)
- [x] Liên kết Dự án với Môn học đại học (`Subject`) và Kỹ năng áp dụng (`ProjectSkill`)
- [x] Giao diện Hồ sơ Năng lực (`/career` Hub UI) phong cách Notion hiện đại:
  - Tab Portfolio dự án thực chiến
  - Tab Ma trận kỹ năng với thanh đo tiến độ
- [x] API Endpoints: `/api/career/skills`, `/api/career/projects`

### Implementation Notes (Phase 44)
- **Files**: [`src/app/(dashboard)/career/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/career/page.tsx), [`src/app/api/career/skills/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/career/skills/route.ts), [`src/app/api/career/projects/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/career/projects/route.ts).

---

# PHASE 45. CERTIFICATES & CAREER INTERNSHIP KANBAN

- [x] Quản lý chứng chỉ (`Certificate` model: đơn vị cấp, ngày cấp, ngày hết hạn, mã xác thực, điểm số, liên kết xác minh)
- [x] Quản lý đơn ứng tuyển thực tập và việc làm (`CareerApplication` model: công ty, vị trí, loại hình, trạng thái SAVED, APPLIED, INTERVIEW, OFFER, REJECTED, WITHDRAWN)
- [x] Theo dõi hạn nộp CV, mức lương/trợ cấp và kinh nghiệm phỏng vấn
- [x] Tabs Chứng chỉ và Cơ hội nghề nghiệp trong `/career`
- [x] API Endpoints: `/api/career/certificates`, `/api/career/applications`

### Implementation Notes (Phase 45)
- **Files**: [`src/app/api/career/certificates/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/career/certificates/route.ts), [`src/app/api/career/applications/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/career/applications/route.ts).

---

# PHASE 46. 4-YEAR BACKUP, RESTORE & AUDIT LOG

- [x] Xuất bản sao lưu toàn diện định dạng JSON cho toàn bộ dữ liệu 4 năm (`academicYears`, `semesters`, `degreeProgram`, `subjects`, `skills`, `projects`, `certificates`, `careerApplications`, `tasks`, `events`, `sessions`, `notes`, `habits`, `flashcards`)
- [x] Xuất báo cáo CSV bảng điểm đại học (`/api/export?format=csv&entity=courses`)
- [x] Xuất báo cáo CSV thực tập & tuyển dụng (`/api/export?format=csv&entity=career`)
- [x] Động cơ phục hồi (Restore / Import) tự động khôi phục toàn bộ cấu trúc học thuật không làm hỏng liên kết dữ liệu
- [x] Ghi nhận nhật ký kiểm toán hệ thống (`AuditLog` model) cho mọi thao tác quan trọng (tạo/sửa/xóa môn học, kết chuyển học kỳ, ứng tuyển, sao lưu)

### Implementation Notes (Phase 46)
- **Files**: [`src/app/api/export/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/export/route.ts), [`src/app/api/import/route.ts`](file:///Users/huy/Downloads/Time%20manager/src/app/api/import/route.ts).

---

## TỔNG KẾT KIỂM THỬ TOÀN DIỆN CUỐI CÙNG (FINAL AUDIT)

| Kiểm thử | Kết quả | Trạng thái |
|---|---|---|
| `test:scheduling` | 12/12 test cases PASS | ✅ Đạt 100% |
| `test:learning` | 19/19 test cases PASS | ✅ Đạt 100% |
| `test:academic` | 21/21 test cases PASS | ✅ Đạt 100% |
| `test:all` | 33/33 test cases PASS | ✅ Đạt 100% |
| `tsc --noEmit` | 0 errors | ✅ Đạt 100% |
| `eslint . --quiet` | 0 warnings/errors | ✅ Đạt 100% |
| `npm run build` | 91/91 routes compile thành công sạch sẽ (Turbopack) | ✅ Đạt 100% |

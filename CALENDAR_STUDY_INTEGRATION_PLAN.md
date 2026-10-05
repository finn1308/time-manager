# KẾ HOẠCH TÍCH HỢP LỊCH HỌC VỚI HỆ THỐNG TỰ ĐỘNG TÍNH GIỜ HỌC
*Tracking File - Cập nhật tiến độ liên tục*

---

## 📋 Danh Sách Hạng Mục & Tiến Độ

### I. Database & Data Models
- [x] **1.1. Cập nhật Prisma Schema cho `CalendarEvent`**:
  - Thêm `completed Boolean @default(false)`
  - Thêm `completedAt DateTime?`
  - Thêm `actualDurationMinutes Int?`
  - Thêm `plannedDurationMinutes Int?`
  - Thêm các index: `@@index([userId, subjectId])`, `@@index([userId, completed])`
- [x] **1.2. Tối ưu hóa Model `StudySession` (StudyRecord)**:
  - Kiểm tra các trường: `userId`, `subjectId`, `calendarEventId`, `actualDurationSeconds`, `actualStart`, `actualEnd`, `source` ("CALENDAR_CHECKBOX" | "PIP_TIMER" | "MANUAL"), `status`
  - Thêm index: `@@index([calendarEventId])`, `@@index([userId, subjectId])`
- [x] **1.3. Đồng bộ Database Migration (`npx prisma db push`) & Generate Prisma Client**

---

### II. Core Backend Logic & Transaction API
- [x] **2.1. API Complete/Uncomplete Event (`/api/calendar/events/complete`)**:
  - Hỗ trợ toggle checkbox: `☐ -> ☑` (Complete) và `☑ -> ☐` (Uncomplete).
  - Tự động tính duration theo datetime chính xác `(endTime - startTime)`, xử lý qua đêm/qua ngày.
  - Cho phép người dùng tùy chọn truyền `customActualMinutes` nếu muốn ghi nhận khác `plannedDuration`.
  - Hỗ trợ cả sự kiện đơn và sự kiện lặp (recurring event occurrence): tạo/cập nhật exception record có `completed: true`.
  - Transaction đảm bảo atomic:
    - Khi Complete: Cập nhật `CalendarEvent.completed = true`, tạo `StudySession` (`source = "CALENDAR_CHECKBOX"`, `calendarEventId = event.id`), cập nhật `Subject.completedHours`.
    - Khi Uncomplete: Cập nhật `CalendarEvent.completed = false`, xóa/hủy `StudySession` liên quan, giảm `Subject.completedHours` tương ứng.
    - Idempotent: Nếu đã completed mà gọi complete lại thì không tạo thêm session nào (chống cộng trùng tuyệt đối).
- [x] **2.2. Xử lý Delete Event với Data Consistency**:
  - Khi xóa event chưa hoàn thành: Không ảnh hưởng StudySession / actual time.
  - Khi xóa event đã hoàn thành: Xử lý an toàn các StudySession liên quan (dọn dẹp hoặc tách biệt có log truy vết, đảm bảo không bị orphan hay duplicate).
- [x] **2.3. Xử lý Edit Event với Data Separation**:
  - Tách bạch giữa `plannedDuration` và `actualDuration`.
  - Khi sửa giờ bắt đầu/kết thúc của lịch đã completed: Không âm thầm sửa actual duration trừ khi người dùng chủ động yêu cầu.
- [x] **2.4. Quy tắc phân loại loại sự kiện**:
  - Chỉ tính thời gian học cho sự kiện có `subjectId` hoặc loại học tập (`SELF_STUDY`, `STUDY`).
  - Sự kiện `PERSONAL`, `SCHOOL` cố định, `MEETING` không tính vào actual study time trừ khi người dùng gán subject cụ thể.

---

### III. Tích hợp PIP Timer & Đồng bộ Hai Chiều
- [x] **3.1. Đồng bộ khi hoàn thành học bằng PIP Timer (`/api/timer/stop` & `/api/timer/save-log`)**:
  - Khi timer kết thúc có `calendarEventId`:
    - Đánh dấu `CalendarEvent.completed = true`, `completedAt = now`, `actualDurationMinutes = round(seconds/60)`.
    - Tạo `StudySession` với `source = "PIP_TIMER"` liên kết `calendarEventId`.
- [x] **3.2. Chống Double Counting giữa Checkbox & PIP Timer**:
  - Nếu một event đã được hoàn thành bằng Timer, event hiển thị đã học trên Calendar.
  - Khi người dùng click bỏ tick hoặc tick lại, hệ thống nhận diện đúng `calendarEventId` và không nhân đôi thời gian.

---

### IV. Giao diện Calendar (Tuần, Tháng, Ngày, Agenda, Quick Action, Mobile)
- [x] **4.1. Visual Status Indicators trên Calendar**:
  - 🟢 **Completed** (Đã học): Checkbox xanh, hiển thị Actual duration (vd: `2h`).
  - 🟡 **Planned** (Dự kiến trong tương lai hoặc chưa đến giờ).
  - 🔵 **In Progress** (Đang học / Timer đang chạy).
  - 🔴 **Missed / Overdue** (Đã qua giờ nhưng chưa đánh dấu đã học).
- [x] **4.2. Thao tác 1 chạm (Quick Action)**:
  - Checkbox trực tiếp trên thẻ lịch hoặc Quick Action 1 chạm: tick là xong.
  - Click vào thẻ mở popup thông tin nhanh (`EventQuickModal`):
    - Planned duration, Actual duration.
    - Checkbox [✓ Đã học] / [☐ Chưa học].
    - Nút tùy chọn [Chỉnh thời gian thực tế].
    - Nút [▶ Bắt đầu PIP Timer].
    - Nút [✏ Chỉnh sửa sự kiện].
- [x] **4.3. Đồng bộ trên tất cả các View của Calendar**:
  - Week View (`week-view.tsx`).
  - Month View (`month-view.tsx`).
  - Day View (`day-view.tsx`).
  - Agenda View (`agenda-view.tsx`).
  - Event Modal (`event-modal.tsx`).
- [x] **4.4. Tối ưu Mobile UX**:
  - Nút bấm và Checkbox to rõ, dễ chạm ngón tay trên điện thoại (touch-manipulation, min-h 28-44px).
  - Phản hồi tức thì với Optimistic UI, không giật lag.

---

### V. Thống kê & Dashboard Tự Động Cập Nhật
- [x] **5.1. Dashboard API (`/api/dashboard`)**:
  - Tính `actualHours` từ nguồn dữ liệu duy nhất `StudySession` (bao gồm cả checkbox và timer).
  - Thống kê Planned vs Actual cho Hôm nay, Tuần này, Biểu đồ 7 ngày.
  - Subject Progress: `targetHours`, `actualHours`, `progressPercent`, `remainingHours`.
- [x] **5.2. Subjects Page & API (`/api/subjects`, `subjects/page.tsx`)**:
  - Hiển thị đầy đủ: Mục tiêu tuần/tháng (`targetHours`), Thực tế (`actualHours`), Còn thiếu (`remainingHours`), Tiến độ (`%`).
  - Đồng bộ ngay với dữ liệu `StudySession`.
- [x] **5.3. Thống kê theo nhiều mốc thời gian**:
  - Hôm nay, Hôm qua, 7 ngày qua, Tuần này, Tháng này, Năm nay, Toàn bộ thời gian (`multiPeriodStats` trong `/api/dashboard`).
- [x] **5.4. Real-time UI Update**:
  - Sau khi tick "Đã học" trên Calendar hoặc Dashboard, dispatch custom event `"chronomind-study-updated"`.
  - `DashboardRefresher`, `CalendarPage`, và `SubjectTable` tự động lắng nghe và cập nhật giao diện ngay lập tức mà không cần F5.

---

### VI. AI Scheduler Tương Thích
- [x] **6.1. AI Context & Scheduler**:
  - AI scheduler và AI coach đọc đúng `StudySession` (actual time) và `CalendarEvent` (planned time).
  - API `schedule-study` và AI Syllabus Apply tạo sự kiện mới với `completed = false`, `plannedDurationMinutes`, `type = STUDY`.

---

### VII. Kiểm Thử Toàn Diện (12 Acceptance Tests)
- [x] **Test 1**: Tạo IELTS 19:00 → 21:00. Tick completed. → IELTS +2h actual. (Passed)
- [x] **Test 2**: Tick lại lần nữa (idempotent). → Vẫn +2h, không thành 4h. (Passed)
- [x] **Test 3**: Bỏ tick. → IELTS -2h actual. (Passed)
- [x] **Test 4**: Tạo IELTS 2h và Math 1h. Tick cả hai. → IELTS +2h, Math +1h. (Passed)
- [x] **Test 5**: Tạo event Personal 2h. Tick. → Không cộng study time. (Passed)
- [x] **Test 6**: Xóa event chưa completed. → Không thay đổi actual. (Passed)
- [x] **Test 7**: Xóa event đã completed. → StudyRecord được xử lý an toàn, không orphan. (Passed)
- [x] **Test 8**: Sửa planned duration sau khi completed. → Không phá vỡ actual duration. (Passed)
- [x] **Test 9**: Dùng PIP Timer cho Calendar Event. → Không double count, calendar hiển thị completed. (Passed)
- [x] **Test 10**: Refresh trang (F5). → Dữ liệu completed và actual time vẫn chính xác. (Passed)
- [x] **Test 11**: Đăng xuất → đăng nhập lại. → Dữ liệu persistent theo từng user. (Passed)
- [x] **Test 12**: Chuyển Week → Month → Day → Week. → Dữ liệu không mất, trạng thái nhất quán. (Passed)
- [x] **TypeScript / Lint / Build Check**: Chạy `npm run build` hoàn thành với 0 lỗi (154 static/dynamic routes compiled). (Passed)

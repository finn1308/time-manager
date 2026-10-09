# 📋 TODO_FEATURE_CHECKLIST.md
## SMART DAILY TO-DO SYSTEM (MICROSOFT TO DO + PRODUCTIVITY TRACKER)
> Dự án: ChronoMind University Planner / Study Operating System
> Ngôn ngữ: Vietnamese
> Mục tiêu: Triển khai Full-Stack hệ thống To-Do List hàng ngày thông minh, Microsoft To Do UX, chốt ngày, chuyển tiếp nhiệm vụ (rollover), thống kê kỷ luật, và tích hợp sâu với Study Timer.

---

### Phase 1: Database & Backend Architecture
- [x] Cập nhật `prisma/schema.prisma` với:
  - [x] `Task` model: `scheduledDate`, `originalDate`, `isImportant`, `isRollover`, `rolloverCount`, `lastRolloverAt`, indexes `[userId, scheduledDate]`, `[userId, isImportant]`, `[userId, isCompleted]`
  - [x] `DailyTaskSummary` model: `dateKey`, `totalTasks`, `completedTasks`, `uncompletedTasks`, `completionRate`, `rolledOverTasks`, `isClosed`, `closedAt`, `snapshotData`
  - [x] `UserSettings` model: `autoDayClosureEnabled`, `autoRolloverTasksEnabled`
  - [x] `User` relation: `dailyTaskSummaries`
- [x] Push schema lên database (`prisma db push` / `prisma generate`) an toàn, không mất dữ liệu.
- [x] Seed / Migration validation: Đảm bảo dữ liệu cũ không bị ảnh hưởng, các task cũ có fallback tương thích.

### Phase 2: API Endpoints & Business Logic
- [x] Cập nhật `GET /api/tasks`: Hỗ trợ filter theo `dateKey` / `scheduledDate`, `list` (today, important, planned, pending, completed, all), `priority`, `subjectId`, `search`.
- [x] Cập nhật `POST /api/tasks`: Hỗ trợ tạo task nhanh theo ngày được chọn, `isImportant`, `scheduledDate`, liên kết `subjectId`.
- [x] Cập nhật `PATCH /api/tasks/[id]`:
  - [x] Toggle `isCompleted` tức thì kèm `completedAt` timestamp, tự động cập nhật thống kê ngày
  - [x] Toggle `isImportant` (star / unstar)
  - [x] Cập nhật `scheduledDate`, `priority`, `subjectId`, `description`
  - [x] Đảm bảo tính idempotent, không sinh log trùng khi click liên tục
- [x] Tạo API `POST /api/tasks/rollover`: Chuyển 1 hoặc nhiều nhiệm vụ chưa hoàn thành sang ngày mới, giữ nguyên lịch sử ngày cũ, tăng `rolloverCount`.
- [x] Tạo API `GET /api/tasks/day-closure` & `POST /api/tasks/day-closure`:
  - [x] Kiểm tra trạng thái chốt ngày của ngày chỉ định hoặc ngày hôm qua
  - [x] Hỗ trợ chốt ngày thủ công hoặc tự động
  - [x] Lưu snapshot đóng băng kết quả (VD: 3/5 hoàn thành = 60%)
  - [x] Hỏi / thực thi chuyển nhiệm vụ chưa hoàn thành sang ngày tiếp theo
- [x] Tạo API `GET /api/tasks/history`: Thống kê kỷ luật theo ngày, tuần, tháng, toàn bộ thời gian, danh sách chi tiết từng ngày.
- [x] Cập nhật `GET /api/settings` & `PATCH /api/settings`: Hỗ trợ cấu hình `autoDayClosureEnabled`, `autoRolloverTasksEnabled`.

### Phase 3: Microsoft To Do User Experience & UI
- [x] Thêm liên kết điều hướng "Nhiệm vụ" vào Sidebar (`src/components/notion/sidebar.tsx`) & Mobile Bottom Nav / Drawer (`src/components/layout/bottom-nav.tsx`).
- [x] Thiết kế lại màn hình To-Do (`src/app/(dashboard)/tasks/page.tsx`):
  - [x] Tích hợp 6 danh sách chuẩn Microsoft To Do:
    1. **Hôm nay (My Day)**: Nhiệm vụ của ngày đang chọn kèm ngày tháng theo múi giờ
    2. **Quan trọng (Important)**: Nhiệm vụ gắn sao / ưu tiên cao
    3. **Đã lên lịch (Planned)**: Nhiệm vụ có ngày hẹn / deadline
    4. **Chưa hoàn thành (Pending)**: Toàn bộ nhiệm vụ chưa hoàn thành
    5. **Đã hoàn thành (Completed)**: Toàn bộ nhiệm vụ đã hoàn thành
    6. **Tất cả nhiệm vụ (All Tasks)**: Toàn bộ danh sách dùng chung 1 nguồn dữ liệu
  - [x] Thiết kế Pastel Green hiện đại, bo góc mềm, tương thích dark/light mode
  - [x] Thanh Quick Add Input (gõ tiêu đề + Enter là lưu ngay vào ngày đang chọn)
  - [x] Checkbox tròn mượt mà (Optimistic UI), âm thanh/phản hồi trực quan
  - [x] Badges: Môn học (Subject), Mức độ ưu tiên (Urgent/High/Medium/Low), Rollover (Chuyển tiếp từ ngày cũ kèm số lần)
  - [x] Thanh tiến độ hoàn thành trong ngày (Progress bar + Tỷ lệ % + X/Y hoàn thành)
  - [x] Thao tác: Sửa inline / modal, xóa, gắn sao, bắt đầu timer học

### Phase 4: Quy trình Chốt Ngày (Daily Checkout & Rollover Modal)
- [x] Component `DailyClosureModal`:
  - [x] Nút "Chốt ngày" nổi bật trên giao diện Hôm nay
  - [x] Hiển thị thống kê tổng kết: Tổng số, Đã hoàn thành, Chưa hoàn thành, Tỷ lệ %
  - [x] Hộp thoại xác nhận: "Bạn đã hoàn thành X/Y nhiệm vụ hôm nay. Bạn có muốn chuyển Z nhiệm vụ chưa hoàn thành sang ngày mai không?"
  - [x] Hai nút lựa chọn rõ ràng:
    - `[ CÓ, CHUYỂN SANG NGÀY MAI ]`
    - `[ KHÔNG, GIỮ Ở NGÀY CŨ ]`
  - [x] Tự động phát hiện ngày cũ chưa chốt khi người dùng mở lại website
  - [x] Idempotent: Ngăn chặn chốt ngày trùng lặp khi bấm nhiều lần

### Phase 5: Thống kê Kỷ luật & Lịch sử Nhiệm vụ (History & Discipline)
- [x] Tab / Chế độ xem "Lịch sử nhiệm vụ" (Discipline History):
  - [x] Bộ lọc: Tuần, Tháng, Toàn bộ thời gian
  - [x] Thẻ từng ngày: Ngày, Tỷ lệ %, Hoàn thành / Tổng số, Số nhiệm vụ chuyển tiếp, Trạng thái chốt ngày
  - [x] Modal / Mở rộng xem chi tiết: Xem danh sách nhiệm vụ của ngày đã chốt (snapshot) và lịch sử chuyển ngày

### Phase 6: Tích hợp với Lịch học, Timer & Dashboard
- [x] Tích hợp môn học (`subjectId`) và sự kiện lịch (`calendarEventId`)
- [x] Nút "Bắt đầu học" (Timer Launcher) ngay trên từng thẻ Task:
  - [x] Khởi chạy `startTimer` từ `PipTimerProvider` với môn học và tên task
  - [x] Không tự tiện cộng giờ học khi chỉ tick checkbox mà không có phiên học timer thực tế
- [x] Tích hợp widget To-Do tóm tắt trên Dashboard chính (`src/app/(dashboard)/page.tsx`)

### Phase 7: Kiểm thử thực tế (10/10 Test Cases PASSED)
- [x] Test 1: Tạo 5 nhiệm vụ, hoàn thành 3, chốt ngày -> 3/5, 60%, 2 chưa làm (PASSED)
- [x] Test 2: Chọn chuyển 2 nhiệm vụ sang ngày hôm sau -> Ngày cũ 3/5, ngày mới có 2 nhiệm vụ rollover, không trùng lặp (PASSED)
- [x] Test 3: Hoàn thành 1 nhiệm vụ rollover ở ngày mới -> completedAt ngày mới, ngày cũ giữ nguyên snapshot (PASSED)
- [x] Test 4: Chọn giữ 2 nhiệm vụ ở ngày cũ -> Ngày cũ 3/5, ngày mới không xuất hiện, tìm thấy ở danh sách chưa làm (PASSED)
- [x] Test 5: Reload / Đăng nhập lại -> Dữ liệu đồng bộ chính xác (PASSED)
- [x] Test 6: Bấm chốt ngày 2 lần -> Idempotent, không sinh lỗi hoặc nhân bản (PASSED)
- [x] Test 7: Timer học 30 phút -> Đồng bộ giờ học chính xác, tick hoàn thành không cộng trùng (PASSED)
- [x] Test 8: Mở lại ngày cũ -> Xem đầy đủ snapshot và trạng thái (PASSED)
- [x] Test 9: Múi giờ -> Nhận diện ngày theo múi giờ `Asia/Ho_Chi_Minh` (PASSED)
- [x] Test 10: Phân quyền -> Tài khoản này không can thiệp nhiệm vụ tài khoản khác (PASSED)

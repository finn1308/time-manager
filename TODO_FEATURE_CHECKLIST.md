# 📋 TODO_FEATURE_CHECKLIST.md
## SMART DAILY TO-DO SYSTEM (MICROSOFT TO DO + PRODUCTIVITY TRACKER)
> Dự án: ChronoMind University Planner / Study Operating System
> Ngôn ngữ: Vietnamese
> Mục tiêu: Triển khai Full-Stack hệ thống To-Do List hàng ngày thông minh, Microsoft To Do UX, chốt ngày, chuyển tiếp nhiệm vụ (rollover), thống kê kỷ luật, và tích hợp sâu với Study Timer.

---

### Phase 1: Database & Backend Architecture
- [ ] Cập nhật `prisma/schema.prisma` với:
  - [ ] `Task` model: `scheduledDate`, `originalDate`, `isImportant`, `isRollover`, `rolloverCount`, `lastRolloverAt`, indexes `[userId, scheduledDate]`, `[userId, isImportant]`
  - [ ] `DailyTaskSummary` model: `dateKey`, `totalTasks`, `completedTasks`, `uncompletedTasks`, `completionRate`, `rolledOverTasks`, `isClosed`, `closedAt`, `snapshotData`
  - [ ] `UserSettings` model: `autoDayClosureEnabled`, `autoRolloverTasksEnabled`
  - [ ] `User` relation: `dailyTaskSummaries`
- [ ] Push schema lên database (`prisma db push` / `prisma generate`) an toàn, không mất dữ liệu.
- [ ] Seed / Migration validation: Đảm bảo dữ liệu cũ không bị ảnh hưởng, các task cũ có fallback tương thích.

### Phase 2: API Endpoints & Business Logic
- [ ] Cập nhật `GET /api/tasks`: Hỗ trợ filter theo `dateKey` / `scheduledDate`, `list` (today, important, planned, pending, completed, all), `priority`, `subjectId`, `search`.
- [ ] Cập nhật `POST /api/tasks`: Hỗ trợ tạo task nhanh theo ngày được chọn, `isImportant`, `scheduledDate`, liên kết `subjectId`.
- [ ] Cập nhật `PATCH /api/tasks/[id]`:
  - [ ] Toggle `isCompleted` tức thì kèm `completedAt` timestamp, tự động cập nhật thống kê ngày
  - [ ] Toggle `isImportant` (star / unstar)
  - [ ] Cập nhật `scheduledDate`, `priority`, `subjectId`, `description`
  - [ ] Đảm bảo tính idempotent, không sinh log trùng khi click liên tục
- [ ] Tạo API `POST /api/tasks/rollover`: Chuyển 1 hoặc nhiều nhiệm vụ chưa hoàn thành sang ngày mới, giữ nguyên lịch sử ngày cũ, tăng `rolloverCount`.
- [ ] Tạo API `GET /api/tasks/day-closure` & `POST /api/tasks/day-closure`:
  - [ ] Kiểm tra trạng thái chốt ngày của ngày chỉ định hoặc ngày hôm qua
  - [ ] Hỗ trợ chốt ngày thủ công hoặc tự động
  - [ ] Lưu snapshot đóng băng kết quả (VD: 3/5 hoàn thành = 60%)
  - [ ] Hỏi / thực thi chuyển nhiệm vụ chưa hoàn thành sang ngày tiếp theo
- [ ] Tạo API `GET /api/tasks/history`: Thống kê kỷ luật theo ngày, tuần, tháng, toàn bộ thời gian, danh sách chi tiết từng ngày.
- [ ] Cập nhật `GET /api/settings` & `PATCH /api/settings`: Hỗ trợ cấu hình `autoDayClosureEnabled`, `autoRolloverTasksEnabled`.

### Phase 3: Microsoft To Do User Experience & UI
- [ ] Thêm liên kết điều hướng "Nhiệm vụ" vào Sidebar (`src/components/notion/sidebar.tsx`) & Mobile Bottom Nav / Drawer (`src/components/layout/bottom-nav.tsx`).
- [ ] Thiết kế lại màn hình To-Do (`src/app/(dashboard)/tasks/page.tsx`):
  - [ ] Tích hợp 6 danh sách chuẩn Microsoft To Do:
    1. **Hôm nay (My Day)**: Nhiệm vụ của ngày đang chọn kèm ngày tháng theo múi giờ
    2. **Quan trọng (Important)**: Nhiệm vụ gắn sao / ưu tiên cao
    3. **Đã lên lịch (Planned)**: Nhiệm vụ có ngày hẹn / deadline
    4. **Chưa hoàn thành (Pending)**: Toàn bộ nhiệm vụ chưa hoàn thành
    5. **Đã hoàn thành (Completed)**: Toàn bộ nhiệm vụ đã hoàn thành
    6. **Tất cả nhiệm vụ (All Tasks)**: Toàn bộ danh sách dùng chung 1 nguồn dữ liệu
  - [ ] Thiết kế Pastel Green hiện đại, bo góc mềm, tương thích dark/light mode
  - [ ] Thanh Quick Add Input (gõ tiêu đề + Enter là lưu ngay vào ngày đang chọn)
  - [ ] Checkbox tròn mượt mà (Optimistic UI), âm thanh/phản hồi trực quan
  - [ ] Badges: Môn học (Subject), Mức độ ưu tiên (Urgent/High/Medium/Low), Rollover (Chuyển tiếp từ ngày cũ kèm số lần)
  - [ ] Thanh tiến độ hoàn thành trong ngày (Progress bar + Tỷ lệ % + X/Y hoàn thành)
  - [ ] Thao tác: Sửa inline / modal, xóa, gắn sao, bắt đầu timer học

### Phase 4: Quy trình Chốt Ngày (Daily Checkout & Rollover Modal)
- [ ] Component `DailyClosureModal`:
  - [ ] Nút "Chốt ngày" nổi bật trên giao diện Hôm nay
  - [ ] Hiển thị thống kê tổng kết: Tổng số, Đã hoàn thành, Chưa hoàn thành, Tỷ lệ %
  - [ ] Hộp thoại xác nhận: "Bạn đã hoàn thành X/Y nhiệm vụ hôm nay. Bạn có muốn chuyển Z nhiệm vụ chưa hoàn thành sang ngày mai không?"
  - [ ] Hai nút lựa chọn rõ ràng:
    - `[ CÓ, CHUYỂN SANG NGÀY MAI ]`
    - `[ KHÔNG, GIỮ Ở NGÀY CŨ ]`
  - [ ] Tự động phát hiện ngày cũ chưa chốt khi người dùng mở lại website
  - [ ] Idempotent: Ngăn chặn chốt ngày trùng lặp khi bấm nhiều lần

### Phase 5: Thống kê Kỷ luật & Lịch sử Nhiệm vụ (History & Discipline)
- [ ] Tab / Chế độ xem "Lịch sử nhiệm vụ" (Discipline History):
  - [ ] Bộ lọc: Tuần, Tháng, Toàn bộ thời gian
  - [ ] Thẻ từng ngày: Ngày, Tỷ lệ %, Hoàn thành / Tổng số, Số nhiệm vụ chuyển tiếp, Trạng thái chốt ngày
  - [ ] Modal / Mở rộng xem chi tiết: Xem danh sách nhiệm vụ của ngày đã chốt (snapshot) và lịch sử chuyển ngày

### Phase 6: Tích hợp với Lịch học, Timer & Dashboard
- [ ] Tích hợp môn học (`subjectId`) và sự kiện lịch (`calendarEventId`)
- [ ] Nút "Bắt đầu học" (Timer Launcher) ngay trên từng thẻ Task:
  - [ ] Khởi chạy `startTimer` từ `PipTimerProvider` với môn học và tên task
  - [ ] Không tự tiện cộng giờ học khi chỉ tick checkbox mà không có phiên học timer thực tế
- [ ] Tích hợp widget To-Do tóm tắt trên Dashboard chính (`src/app/(dashboard)/page.tsx`)

### Phase 7: Kiểm thử thực tế (10 Test Cases)
- [ ] Test 1: Tạo 5 nhiệm vụ, hoàn thành 3, chốt ngày -> 3/5, 60%, 2 chưa làm
- [ ] Test 2: Chọn chuyển 2 nhiệm vụ sang ngày hôm sau -> Ngày cũ 3/5, ngày mới có 2 nhiệm vụ rollover, không trùng lặp
- [ ] Test 3: Hoàn thành 1 nhiệm vụ rollover ở ngày mới -> completedAt ngày mới, ngày cũ giữ nguyên snapshot
- [ ] Test 4: Chọn giữ 2 nhiệm vụ ở ngày cũ -> Ngày cũ 3/5, ngày mới không xuất hiện, tìm thấy ở danh sách chưa làm
- [ ] Test 5: Reload / Đăng nhập lại -> Dữ liệu đồng bộ chính xác
- [ ] Test 6: Bấm chốt ngày 2 lần -> Idempotent, không sinh lỗi hoặc nhân bản
- [ ] Test 7: Timer học 30 phút -> Đồng bộ giờ học chính xác, tick hoàn thành không cộng trùng
- [ ] Test 8: Mở lại ngày cũ -> Xem đầy đủ snapshot và trạng thái
- [ ] Test 9: Múi giờ -> Nhận diện ngày theo múi giờ `Asia/Ho_Chi_Minh`
- [ ] Test 10: Phân quyền -> Tài khoản này không can thiệp nhiệm vụ tài khoản khác

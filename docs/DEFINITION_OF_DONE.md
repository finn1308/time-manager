# CHRONOMIND - DEFINITION OF DONE (DoD)

Tài liệu này xác định các tiêu chuẩn bắt buộc mà một tính năng (feature) hoặc pha phát triển (phase) phải đáp ứng đầy đủ trước khi được đánh dấu hoàn thành `[x]` trong [`/docs/PROJECT_ROADMAP.md`](file:///Users/huy/Downloads/Time%20manager/docs/PROJECT_ROADMAP.md).

---

## 1. TIÊU CHÍ BẮT BUỘC 9 LỚP (9-LAYER DoD)

Một mục công việc chỉ được chuyển trạng thái từ `[ ]` hoặc `[~]` sang `[x]` khi và chỉ khi **toàn bộ 9 lớp** sau đây được thỏa mãn:

| Lớp | Yêu cầu kiểm tra | Trạng thái đạt |
|---|---|---|
| **1. Database** | Schema Prisma có model/field phù hợp, migrate thành công vào PostgreSQL/Supabase, index chuẩn, relation cascading an toàn (`SetNull` bảo toàn dữ liệu lịch sử). | ✅ Passed |
| **2. Backend / Service** | Logic nghiệp vụ thuần (business logic), helper/service tách biệt rõ ràng, không hardcode, không phụ thuộc UI. | ✅ Passed |
| **3. API Endpoint** | Next.js Route Handlers (`GET`, `POST`, `PUT`, `DELETE`) xác thực JWT session, kiểm tra User Ownership (`where: { userId }`), trả HTTP status chuẩn. | ✅ Passed |
| **4. Validation** | Kiểm tra dữ liệu đầu vào (Zod hoặc guard checks), validate định dạng ngày giờ, kiểu dữ liệu, quan hệ khóa ngoại (subject, goal, task). | ✅ Passed |
| **5. Error Handling** | Khối `try/catch` chặt chẽ, thông báo lỗi tiếng Việt dễ hiểu cho người dùng, mã lỗi 400, 401, 403, 404, 500 minh bạch. | ✅ Passed |
| **6. Edge Cases** | Xử lý triệt để: chuỗi rỗng, khoảng thời gian âm (`end <= start`), trùng lịch, ngoại lệ lịch lặp (`RecurringException`), xóa một ngày trong chuỗi, lệch múi giờ UTC vs VN. | ✅ Passed |
| **7. Frontend UI/UX** | Giao diện chuẩn Notion-aesthetic (bảng màu `#2d6a4f`, `#52b788`, bo góc mềm mại, responsive mobile + desktop), có đủ State: Loading, Empty, Error, Success Toast/Feedback. | ✅ Passed |
| **8. Integration** | Tích hợp thông suốt giữa các phân hệ: Calendar ↔ Timer ↔ Study Session ↔ Task ↔ Dashboard ↔ Analytics. Không làm gián đoạn hay phá vỡ chức năng cũ. | ✅ Passed |
| **9. Testing & Build** | Chạy kiểm thử tự động (unit/integration test scripts), kiểm tra kiểu tĩnh `npx tsc --noEmit` đạt 0 lỗi, build sản phẩm `npm run build` thành công. | ✅ Passed |

---

## 2. NGUYÊN TẮC BẤT DI BẤT DỊCH (CORE INVARIANTS)

1. **`CalendarEvent ≠ StudySession`**:
   - `CalendarEvent` là lịch dự kiến biểu diễn trên thời gian biểu (Plan).
   - `StudySession` là phiên học thực tế ghi lại thời gian học thật sự, điểm hiệu suất, ghi chú, và XP tích lũy (Actual).
   - Xóa `CalendarEvent` **tuyệt đối không được xóa thác (cascade delete)** các `StudySession` đã hoàn thành (`onDelete: SetNull`).

2. **`School Time ≠ Self Study Time ≠ Personal Time`**:
   - `SCHOOL`: Lịch học trường/lớp. Mặc định `isLocked = true`, `trackStudyTime = false`, không xuất hiện trong Study Timer, AI Scheduler xem là Hard Constraint (không được đè).
   - `SELF_STUDY`: Thời gian tự học chủ động. Cho phép gắn Subject, Goal, Task, mở Study Timer, tính vào Actual Study Time khi user thực sự bấm học.
   - `PERSONAL`: Lịch cá nhân, sinh hoạt, giải trí. Mặc định không tính Study Time, không tạo Study Session, nhưng vẫn block thời gian của AI Scheduler.

3. **Study Timer Rules**:
   - Không được tự động tính thời gian học thực tế chỉ vì đến giờ trên Calendar.
   - Chỉ ghi nhận khi người dùng chủ động nhấn **"Start Study"**.
   - Hỗ trợ học sớm hơn, trễ hơn, tạm dừng (Pause), tiếp tục (Resume), học quá giờ (Overtime).
   - Dashboard ghi nhận chính xác Planned, Actual và Variance (`Actual - Planned`).

4. **Recurring Events & Exception Integrity**:
   - Mọi chuỗi lịch lặp phải quản lý nhất quán thông qua `parentId` / `seriesId` và `recurrenceRule`.
   - Khi xóa hoặc sửa một ngày cụ thể, hệ thống ghi nhận ngoại lệ (`isException: true` hoặc `isCancelled: true`) mà **không làm mất** chuỗi lịch của các tuần/ngày khác.
   - Hộp thoại xóa/sửa bắt buộc cung cấp 3 lựa chọn: "Chỉ lịch này", "Toàn bộ chuỗi", "Lịch này và các lịch tiếp theo".

5. **Tuyệt đối không dùng Mock Data trong Production Flow**:
   - Toàn bộ dữ liệu hiển thị phải truy vấn thực tế từ Supabase PostgreSQL qua Prisma ORM và Next.js API Routes.

---

## 3. QUY TRÌNH CHUYỂN TRẠNG THÁI CHECKBOX

- `[ ] Chưa làm`: Tính năng chưa bắt đầu hoặc chưa có bất kỳ phần code nào hoạt động.
- `[~] Đang thực hiện`: Tính năng đang trong quá trình lập trình, kiểm thử hoặc refactor.
- `[!] Có vấn đề`: Phát hiện lỗi logic, conflict thư viện, migration fail hoặc API lỗi cần khắc phục.
- `[x] Hoàn thành`: ĐÃ THỎA MÃN TOÀN BỘ 9 LỚP DoD TRÊN. Đã kiểm tra code thực tế, chạy test và typecheck thành công.

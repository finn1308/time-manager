# TIẾN ĐỘ NÂNG CẤP HỆ THỐNG CALENDAR / SCHEDULE

Tài liệu này theo dõi chi tiết từng hạng mục nâng cấp Calendar theo yêu cầu kỹ thuật và Definition of Done.

## DEFINITION OF DONE CHECKLIST

- [ ] Calendar phân biệt Event Type
- [ ] School Event
- [ ] Self Study Event
- [ ] Personal Event
- [ ] Exam Event
- [ ] Deadline Event
- [ ] Other Event
- [ ] Self Study có thể Start Timer
- [ ] School không Start Study Timer
- [ ] Personal không Start Study Timer
- [x] School Time không tính Self Study Hours
- [x] Personal Time không tính Study Hours
- [ ] AI Scheduler hiểu Event Type
- [ ] Recurring Event
- [ ] Delete single occurrence
- [ ] Delete entire series
- [ ] Delete confirmation
- [ ] Không xóa Study History khi xóa Calendar
- [ ] Backend validation
- [ ] Authorization
- [ ] Database migration an toàn
- [ ] Không có TypeScript error
- [ ] Không có Prisma error
- [ ] Build thành công
- [ ] Đã test các case quan trọng
- [ ] Không phá Calendar functionality hiện tại

---

## CÁC BƯỚC THỰC HIỆN CHI TIẾT

1. **Database & Types Layer**:
   - Thêm `location String?` vào CalendarEvent trong Prisma schema nếu chưa có.
   - Thêm Event Types: `SCHOOL`, `SELF_STUDY`, `PERSONAL`, `EXAM`, `DEADLINE`, `OTHER` (với alias/tương thích `STUDY` cũ).
   - Kiểm tra Prisma relations: đảm bảo `StudySession.calendarEvent` có `onDelete: SetNull`, không bao giờ cascade delete StudySession khi CalendarEvent bị xóa.
   - Chạy `npx prisma db push` hoặc `prisma generate`.

2. **Event Type Config & Helpers**:
   - Nâng cấp `src/lib/calendar/event-types.ts`:
     - 🏫 `SCHOOL`: Lịch đi học trường / lớp cố định. Location, Room. Không Timer, không Study Session, không Study Hours.
     - 🏠 `SELF_STUDY`: Học tại nhà. Link Subject, Task, Goal. Có nút Start Timer, ghi nhận actual duration vào Study Hours.
     - 🎮 `PERSONAL`: Hoạt động cá nhân / đi chơi. Không Timer, không Study Hours. AI coi là BUSY.
     - 📝 `EXAM`: Lịch thi cử. Constraint quan trọng cho AI.
     - ⏰ `DEADLINE`: Hạn chót bài tập / đồ án. Constraint cho AI.
     - 📌 `OTHER`: Lịch khác.

3. **Event Modal & Form Contextual Rendering**:
   - `src/components/calendar/event-modal.tsx`:
     - Event Type selector với 6 loại (School, Self Study, Personal, Exam, Deadline, Other).
     - Form động thay đổi theo Type:
       - SCHOOL: Tên môn, Địa điểm (Location / Phòng học), Ngày, Giờ bắt đầu, Giờ kết thúc, Lặp lại (Weekly: chọn nhiều ngày Mon-Sun), Ghi chú.
       - SELF_STUDY: Tên, Môn học, Topic, Ngày, Giờ, Task liên kết, Goal, nút Start Study Timer.
       - PERSONAL: Tên, Ngày, Giờ, Địa điểm, Ghi chú (KHÔNG có nút Start Study Timer, KHÔNG tạo Study Session).
       - EXAM: Tên kỳ thi, Môn, Ngày, Giờ, Địa điểm/Phòng thi, Ghi chú.
       - DEADLINE: Tên deadline, Môn, Task, Hạn chót, Ghi chú.
       - OTHER: Tên, Ngày, Giờ, Địa điểm, Ghi chú.

4. **Event Detail & Calendar Views**:
   - Hiển thị Event Countdown (ví dụ: "Đi học Toán sau 02:35:20", "IELTS bắt đầu sau 00:25:10").
   - Nút `Start Study Timer`: CHỈ hiển thị cho `SELF_STUDY` (và legacy `STUDY`). Tuyệt đối KHÔNG hiển thị cho `SCHOOL`, `PERSONAL`, `OTHER`.
   - Cập nhật Day View, Week View, Month View, Agenda View.

5. **Delete Confirmation & Recurring Deletion Safety**:
   - Modal xác nhận xóa sự kiện (Đặc biệt cho Recurring series):
     - Hiển thị rõ: Tên sự kiện, Thời gian đang chọn, Tên chuỗi lặp.
     - 2 lựa chọn bắt buộc:
       1. "Chỉ xóa lịch này" (`deleteMode=SINGLE`)
       2. "Xóa tất cả lịch trong chuỗi" (`deleteMode=ALL`)
       3. Tùy chọn nâng cao: "Xóa từ lịch này trở đi" (`deleteMode=FUTURE`)
     - Bảo vệ Month View, Week View, Day View, Agenda View không xóa nhầm toàn bộ series khi xóa 1 occurrence.
     - Đảm bảo xóa CalendarEvent KHÔNG BAO GIỜ xóa StudySession đã hoàn thành.

6. **Dashboard & Analytics Metrics Separation**:
   - Phân biệt các loại thời gian:
     - School Time: Giờ đi học (SCHOOL)
     - Self Study Time: Giờ tự học thực tế từ Timer / StudySession
     - Personal Time: Giờ cá nhân (PERSONAL)
     - Scheduled Time: Tổng thời gian có event trong Calendar
   - School Time KHÔNG được tính vào Self Study Hours.
   - Personal Time KHÔNG được tính vào Study Hours.
   - Cập nhật `/api/dashboard/route.ts`, `src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/analytics/page.tsx`, `day-view.tsx`.

7. **AI Scheduler & Rescheduler Engine Awareness**:
   - AI Scheduler đọc Event Type:
     - `SCHOOL` -> BẬN (Busy), tuyệt đối không xếp self-study đè lên.
     - `PERSONAL` -> BẬN (Busy), tuyệt đối không xếp self-study đè lên.
     - `EXAM` -> Constraint quan trọng, xếp lịch ôn tập trước kỳ thi.
     - `DEADLINE` -> Constraint deadline, xếp lịch học trước deadline.
     - `SELF_STUDY` -> Existing study plan.
     - `OTHER` -> Busy nếu có lịch.
   - Cập nhật context builder, prompts, local heuristic scheduler, conflict detector.

8. **Backend API Validation & Authorization**:
   - `POST`, `PUT`, `DELETE` tại `/api/calendar/events/route.ts`:
     - Validate start < end, valid ISO dates, event type, recurrence.
     - Kiểm tra user ownership trên Subject, Task, Event.
     - Xử lý composite ID `cuid_YYYY-MM-DD` an toàn.
     - Delete mode: `SINGLE` vs `ALL` vs `FUTURE`.

9. **Testing & Verification**:
   - Viết test suite toàn diện kiểm tra 10 test case bắt buộc.
   - Chạy `tsc --noEmit` & `npm run build`.
   - Tự động tick đủ tất cả mục trong checklist.

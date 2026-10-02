# CHRONOMIND - CALENDAR & TIME ARCHITECTURE
## 4-YEAR CALENDAR ENGINE, RECURRENCE & STUDY TIMER (`/docs/CALENDAR_ARCHITECTURE.md`)

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE INVARIANTS)

```text
CALENDAR EVENT  ≠  STUDY SESSION
     (Kế hoạch)          (Thực tế)

SCHOOL TIME  ≠  SELF STUDY TIME  ≠  PERSONAL TIME
  (Lên lớp)        (Tự học)           (Cá nhân)
```

1. **`CalendarEvent` là kế hoạch (Plan)**:
   - Đại diện cho các mốc thời gian trên thời khóa biểu.
   - Có thể được tạo thủ công, sinh hàng loạt từ thời khóa biểu trường, hoặc do AI đề xuất.

2. **`StudySession` là thực tế (Actual)**:
   - Ghi nhận thời gian học thực, số phút tập trung, đánh giá năng suất, ghi chú và XP.
   - Chỉ được tạo ra khi người dùng chủ động nhấn **"Start Study"** trên bộ đếm giờ (Study Timer).
   - Xóa `CalendarEvent` **không bao giờ** làm mất các `StudySession` đã hoàn thành (`onDelete: SetNull`).

---

## 2. PHÂN LOẠI VÀ QUY TẮC NGHIỆP VỤ 6 LOẠI SỰ KIỆN

| Loại sự kiện (`type`) | Mục đích | `isLocked` mặc định | `isFlexible` mặc định | `trackStudyTime` mặc định | Có mở Study Timer? | Ràng buộc đối với AI |
|---|---|---|---|---|---|---|
| **`SCHOOL`** | Giờ học chính quy, thực hành, thí nghiệm, seminar | `true` | `false` | `false` | ❌ Không | **HARD CONSTRAINT** (Tuyệt đối không xếp đè) |
| **`SELF_STUDY`** | Giờ tự học, làm bài tập, ôn thi, nghiên cứu | `false` | `false` | `true` | ✅ Có (Khuyên dùng) | Có thể dịch chuyển nếu cần |
| **`PERSONAL`** | Đi chơi, gặp bạn bè, thể thao, việc gia đình | `false` | `true` | `false` | ❌ Không | **FLEXIBLE** (AI có thể đề xuất dời khi khẩn) |
| **`EXAM`** | Thi giữa kỳ, thi cuối kỳ, bảo vệ đồ án | `true` | `false` | `false` | ❌ Không | **HARD CONSTRAINT** (Mốc học thuật tối cao) |
| **`DEADLINE`** | Hạn chót nộp bài tập, nộp đồ án | `true` | `false` | `false` | ❌ Không | Cột mốc thời gian không chiếm duration |
| **`OTHER`** | Các lịch hẹn và sự kiện thông thường khác | `false` | `true` | `false` | ❌ Không | Khung giờ bận thông thường |

---

## 3. CƠ CHẾ SỰ KIỆN LẶP (RRULE ENGINE) & XỬ LÝ NGOẠI LỆ (EXCEPTIONS)

### A. Chuỗi sự kiện lặp (`Recurrence`)
- Sử dụng chuẩn quốc tế **iCalendar RFC 5545 (RRule)**.
- Chuỗi lặp được quản lý qua `parentId` / `seriesId` và chuỗi quy tắc `recurrenceRule` (e.g. `FREQ=WEEKLY;BYDAY=MO,WE,FR`).
- Hàm `expandRecurringEvents` tính toán các buổi diễn ra trong cửa sổ thời gian cần hiển thị mà không làm phình to dung lượng database.

### B. Cơ chế ngoại lệ (`RecurringEventException`)
Khi sinh viên nghỉ học một buổi (ví dụ: Thứ Hai tuần này nghỉ lễ):
1. Hệ thống tạo hoặc cập nhật bản ghi ngoại lệ với `parentId = masterEvent.id`, `exceptionDate = "YYYY-MM-DD"`, `isException = true`, `isCancelled = true`.
2. Thứ Hai của tuần kế tiếp **vẫn hiển thị bình thường 100%**, không bị biến mất.

### C. Hộp thoại xóa sự kiện lặp (Delete Confirmation Dialog)
Khi xóa một sự kiện thuộc chuỗi lặp, hệ thống bắt buộc cung cấp 3 lựa chọn độc lập:
- **Chỉ lịch này (`SINGLE`)**: Hủy buổi hiện tại thông qua ghi nhận ngoại lệ.
- **Toàn bộ chuỗi (`ALL`)**: Xóa sự kiện gốc master và toàn bộ chuỗi lặp (các `StudySession` đã học trong quá khứ vẫn được bảo toàn dữ liệu).
- **Lịch này và các lịch tiếp theo (`FUTURE`)**: Cắt ngắn `recurrenceEnd` về ngày hiện tại, giữ nguyên toàn bộ lịch sử các buổi học trước đó.

---

## 4. STUDY TIMER & TÍNH TOÁN ĐỘ LỆCH (PLANNED VS ACTUAL VARIANCE)

- **Độc lập về thời gian**:
  - Sinh viên có thể bắt đầu học sớm hơn, trễ hơn, tạm dừng (Pause), tiếp tục (Resume) và học quá giờ (Overtime).
- **Đo lường độ lệch (Variance)**:
  $$\text{Độ lệch (Variance)} = \text{Actual Duration} - \text{Planned Duration}$$
  - Ví dụ: Lịch dự kiến 60 phút, thực tế học 82 phút $\rightarrow$ Ghi nhận Variance: $+22$ phút.
- **W3C Document Picture-in-Picture (PiP)**:
  - Cho phép cửa sổ bấm giờ nổi trên màn hình ngay cả khi sinh viên chuyển sang đọc tài liệu PDF, làm bài tập hoặc duyệt web.

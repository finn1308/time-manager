# CHRONOMIND - 4-YEAR PERSONAL ACADEMIC OPERATING SYSTEM
## SYSTEM ARCHITECTURE DOCUMENTATION (`/docs/ARCHITECTURE.md`)

---

## 1. TỔNG QUAN KIẾN TRÚC TOÀN DIỆN (SYSTEM OVERVIEW)

ChronoMind được thiết kế không phải là một ứng dụng quản lý to-do hay lịch trình ngắn hạn theo từng tuần, mà là một **Personal Academic Operating System (PAOS)** đồng hành xuyên suốt 4 năm đại học của sinh viên:

```text
                     🎓 CHRONOMIND ACADEMIC OS
                                │
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
   ACADEMIC ENGINE       CALENDAR ENGINE        KNOWLEDGE BASE
  - Academic Years      - SCHOOL (Locked)      - Course Notes
  - Semesters           - SELF_STUDY (Tracked) - Extracted PDFs
  - Courses & Credits   - PERSONAL (Flexible)  - SM-2 Flashcards
  - GPA (10 & 4 scale)  - EXAM / DEADLINE      - Adaptive Quizzes
  - Degree Progress     - RRule Recurrence     - Roadmaps
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ↓
                     AI ORCHESTRATION ENGINE
                  - Multi-Provider BYOK (Gemini, OpenAI, Claude)
                  - Context Builder (Token & Scope-aware)
                  - Conflict Detector & Smart Rescheduler
                  - Weekly Academic Advisor
                                │
                                ↓
                     CAREER & PORTFOLIO HUB
                  - Skills Matrix (Tech, Language, Soft)
                  - Project Portfolio (Course-linked)
                  - Certificates & Credentials
                  - Internship & Job Applications
                                │
                                ↓
                     SECURITY & STORAGE CORE
                  - Supabase PostgreSQL with Connection Pooling
                  - AES-256-GCM Personal Key Encryption
                  - JWT HTTP-Only Cookie Session
                  - Full Audit Logging & Portability (JSON/CSV)
```

---

## 2. NGUYÊN TẮC THIẾT KẾ BẤT BIẾN (CORE ARCHITECTURAL INVARIANTS)

1. **Tính liên tục 4 năm (4-Year Continuity)**:
   - Khi hoàn thành hoặc chuyển tiếp học kỳ (`Semester Transition: Năm 1 → Năm 2 → Năm 3 → Năm 4`), hệ thống **tuyệt đối không bao giờ reset database**.
   - Dữ liệu lịch sử (Study Sessions, bài thi, GPA, ghi chú, flashcards, PDF, projects) được đóng băng và lưu trữ lâu dài dưới trạng thái `COMPLETED` hoặc `ARCHIVED`.

2. **Phân tách rạch ròi ba miền thời gian**:
   - `SCHOOL`: Lịch học trường, thí nghiệm, seminar. Mặc định `isLocked = true`, `trackStudyTime = false`, không xuất hiện trong Study Timer. Đây là **Hard Constraint** bất khả xâm phạm của AI.
   - `SELF_STUDY`: Thời gian tự học chủ động. Gắn môn học, nhiệm vụ, mục tiêu, kích hoạt Study Timer PiP và tính vào Actual Study Time khi người dùng bấm học.
   - `PERSONAL`: Sinh hoạt cá nhân, giải trí. Mặc định `isFlexible = true`, không tính giờ học, nhưng được AI bảo vệ tránh xếp đè.

3. **`CalendarEvent ≠ StudySession`**:
   - `CalendarEvent` là kế hoạch dự kiến (Plan).
   - `StudySession` là phiên học thực tế (Actual) ghi lại thời gian học thực, độ tập trung, ghi chú và XP.
   - Xóa `CalendarEvent` không bao giờ cascade delete `StudySession` (`onDelete: SetNull`).

4. **Trừu tượng hóa nhà cung cấp AI (Provider-Agnostic AI Layer)**:
   - Không gắn chặt mã nguồn vào một nhà cung cấp đơn lẻ. Hỗ trợ Bring-Your-Own-Key (BYOK) mã hóa AES-256-GCM cho **Google Gemini, OpenAI GPT, và Anthropic Claude**.
   - Tất cả tương tác AI đều sử dụng **Context Builder** để chỉ truyền tải dữ liệu liên quan, tiết kiệm token và bảo mật quyền riêng tư.

---

## 3. CÁC PHÂN HỆ CHÍNH (SYSTEM MODULES)

### A. Academic Lifecycle Management
- **`DegreeProgram`**: Theo dõi tiến độ tích lũy tín chỉ tốt nghiệp (ví dụ: `72 / 130 tín chỉ`), mục tiêu GPA toàn khóa và ngành đào tạo.
- **`AcademicYear`**: Quản lý từng năm học (Năm 1 đến Năm 4+), ngày bắt đầu/kết thúc, trạng thái kích hoạt.
- **`Semester`**: Phân chia Học kỳ 1, Học kỳ 2, Học kỳ Hè. Tự động tính toán và lưu vết GPA học kỳ và GPA tích lũy.
- **`Subject (Course)`**: Môn học chuyên sâu bao gồm số tín chỉ, giảng viên, phòng học, giáo trình, điểm thành phần (chuyên cần, giữa kỳ, đồ án, cuối kỳ), điểm hệ 10 và hệ 4.

### B. Time & Scheduling Engine
- **Full Calendar Core**: Chế độ Ngày, Tuần, Tháng, Danh sách (Agenda) trên múi giờ chuẩn `Asia/Ho_Chi_Minh`.
- **RRule Engine**: Xử lý lịch lặp vô hạn (Hàng tuần, Hàng ngày, Tùy chỉnh) kèm cơ chế ngoại lệ (`RecurringEventException`) khi xóa hoặc sửa từng ngày đơn lẻ mà không làm hỏng chuỗi.
- **W3C Document PiP Timer**: Bộ bấm giờ nổi độc lập, duy trì trạng thái khi chuyển trang, đo lường chính xác `Planned vs Actual` và độ lệch `Variance`.

### C. Knowledge & Learning Hub
- **PDF Engine**: Trích xuất văn bản khoa học, tự động lọc bỏ trang bìa hành chính, mục lục và tài liệu tham khảo.
- **AI Roadmaps & Adaptive Quiz**: Sinh lộ trình học phân đoạn theo chương, tạo câu hỏi trắc nghiệm 4 đáp án có lời giải chi tiết và gợi ý.
- **Spaced Repetition Flashcards**: Triển khai thuật toán SuperMemo SM-2 cho việc ghi nhớ dài hạn kiến thức chuyên ngành.
- **Notion-Style Knowledge Base**: Soạn thảo khối linh hoạt, gắn thẻ `#Tag`, liên kết môn học, mục tiêu và tài liệu.

### D. Career & Portfolio Tracker
- **Skills Matrix**: Quản trị kỹ năng theo phân loại (Tech, Ngôn ngữ, Kỹ năng mềm, Thiết kế) và cấp độ (Beginner -> Expert).
- **Project Portfolio**: Lưu trữ đề tài, bài tập lớn, đồ án tốt nghiệp liên kết trực tiếp với Môn học và Kỹ năng, có đường dẫn Github và Demo trực tiếp.
- **Certificates & Internships**: Hồ sơ chứng chỉ quốc tế và bảng Kanban theo dõi tiến độ ứng tuyển thực tập/việc làm.

---

## 4. CHIẾN LƯỢC HIỆU NĂNG CHO DỮ LIỆU 4 NĂM (SCALABILITY STRATEGY)

- **Database Indexing**: Đánh chỉ mục kép `[userId, status]`, `[userId, startTime, endTime]`, `[semesterId]`, `[academicYearId]` để đảm bảo truy vấn hàng nghìn sự kiện và bài học trong 4 năm vẫn phản hồi dưới 50ms.
- **Server-Side Pagination & Range Queries**: Không bao giờ nạp toàn bộ 4 năm dữ liệu lên trình duyệt; calendar và analytics luôn truy vấn theo cửa sổ thời gian (windowing).
- **Audit Logging**: Bản ghi `AuditLog` lưu lại toàn bộ các thao tác trọng yếu (tạo, cập nhật, xóa, chuyển đổi học kỳ, khôi phục) để đảm bảo toàn vẹn dữ liệu.

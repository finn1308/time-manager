# CHRONOMIND - DATABASE ARCHITECTURE
## 4-YEAR ACADEMIC SCHEMA & ENTITY RELATIONSHIPS (`/docs/DATABASE_ARCHITECTURE.md`)

---

## 1. SƠ ĐỒ THỰC THỂ QUAN HỆ CỐT LÕI (CORE E-R MODEL)

```text
User (Sinh viên)
 │
 ├── DegreeProgram (Chương trình đào tạo: 130 tín chỉ, Ngành, Khoa)
 │
 ├── AcademicYears (Năm 1, Năm 2, Năm 3, Năm 4...)
 │    └── Semesters (Học kỳ 1, Học kỳ 2, Hè...)
 │         └── Subjects / Courses (Môn học: Tín chỉ, Điểm, Giảng viên, Đồ án)
 │              ├── CalendarEvents (SCHOOL / SELF_STUDY / EXAM)
 │              ├── StudySessions (Phiên học thực tế)
 │              ├── Documents / PDFs (Giáo trình trích xuất)
 │              ├── Notes (Ghi chú Notion-style)
 │              ├── FlashcardDecks (Bộ thẻ SM-2)
 │              ├── Quizzes (Trắc nghiệm AI)
 │              └── Projects (Đồ án / Bài tập lớn)
 │
 ├── Goals ── Milestones ── Tasks ── StudySessions
 │
 ├── Skills ── ProjectSkills ── Projects
 ├── Certificates (Chứng chỉ quốc tế)
 ├── CareerApplications (Ứng tuyển thực tập / Việc làm)
 └── AuditLogs (Nhật ký kiểm toán toàn vẹn dữ liệu)
```

---

## 2. BẢNG MÔ HÌNH VÀ CÁC TRƯỜNG DỮ LIỆU CHÍNH

### A. Academic Lifecycle Models

#### `DegreeProgram`
- `id` (PK, cuid)
- `userId` (FK -> User.id, Cascade)
- `major`: Tên ngành học (e.g. "Khoa học Máy tính")
- `faculty`: Khoa trực thuộc
- `university`: Tên trường đại học
- `totalCreditsRequired`: Tổng số tín chỉ yêu cầu tốt nghiệp (mặc định 130)
- `targetGpa`: Mục tiêu GPA toàn khóa (ví dụ: 3.6 / 4.0)
- `currentGpa`: GPA tích lũy hiện tại
- `currentCredits`: Số tín chỉ đã hoàn thành
- `status`: `ACTIVE`, `GRADUATED`, `ON_HOLD`

#### `AcademicYear`
- `id` (PK, cuid)
- `userId` (FK -> User.id, Cascade)
- `yearNumber`: Thứ tự năm học (1, 2, 3, 4, 5...)
- `name`: Tên hiển thị (e.g. "Năm 1 (2024 - 2025)")
- `startDate`: Ngày bắt đầu năm học
- `endDate`: Ngày kết thúc năm học
- `status`: `PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`
- `@@unique([userId, yearNumber])`

#### `Semester`
- `id` (PK, cuid)
- `userId` (FK -> User.id, Cascade)
- `academicYearId` (FK -> AcademicYear.id, Cascade)
- `name`: Tên học kỳ (e.g. "Học kỳ 1", "Học kỳ 2", "Học kỳ Hè")
- `type`: `FALL`, `SPRING`, `SUMMER`, `CUSTOM`
- `startDate`: Ngày bắt đầu học kỳ
- `endDate`: Ngày kết thúc học kỳ
- `status`: `PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`
- `gpa10`: Điểm trung bình học kỳ theo thang điểm 10
- `gpa4`: Điểm trung bình học kỳ theo thang điểm 4
- `totalCredits`: Tổng số tín chỉ đăng ký trong học kỳ
- `earnedCredits`: Số tín chỉ đạt được

#### `Subject` (Môn học / Khóa học)
- Mở rộng các trường học thuật:
  - `semesterId`: (FK -> Semester.id, SetNull)
  - `credits`: Số tín chỉ (mặc định 3)
  - `lecturer`: Tên giảng viên phụ trách
  - `classroom`: Phòng học chính quy
  - `syllabus`: Đề cương chi tiết môn học
  - `status`: `PLANNED`, `ACTIVE`, `COMPLETED`, `DROPPED`, `ARCHIVED`
  - `midtermScore`: Điểm giữa kỳ (0 - 10)
  - `finalScore`: Điểm cuối kỳ (0 - 10)
  - `courseGrade`: Điểm tổng kết hệ 10
  - `letterGrade`: Điểm chữ (A, B+, B, C+, C, D+, D, F)
  - `gradePoints`: Điểm hệ 4 (4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.0)
  - `gradeWeightJson`: Cấu trúc trọng số thành phần JSON
  - `attendanceCount`: Số buổi đã tham dự
  - `totalSessions`: Tổng số buổi học kỳ

---

### B. Time & Tracking Models

#### `CalendarEvent`
- `id` (PK, cuid)
- `userId` (FK -> User.id, Cascade)
- `subjectId` (FK -> Subject.id, SetNull)
- `taskId` (FK -> Task.id, SetNull)
- `goalId` (FK -> Goal.id, SetNull)
- `type`: `SCHOOL`, `SELF_STUDY`, `PERSONAL`, `EXAM`, `DEADLINE`, `OTHER`
- `startTime`, `endTime`, `timezone`
- `isLocked`: Khóa cứng (Hard constraint cho AI Scheduler)
- `isFlexible`: Cho phép AI dịch chuyển linh hoạt
- `trackStudyTime`: Cờ xác định có tính vào kế hoạch giờ học không
- `seriesId`: Định danh chuỗi lặp
- `recurrence`: `NONE`, `DAILY`, `WEEKLY`, `MONTHLY`
- `recurrenceRule`, `recurrenceEnd`
- `parentId`, `exceptionDate`, `isException`, `isCancelled`

#### `StudySession` (Phiên học thực tế)
- `calendarEventId` (FK -> CalendarEvent.id, **`onDelete: SetNull`**)
  - *Quy tắc sống còn*: Khi xóa lịch biểu, lịch sử học tập thực tế không bao giờ bị xóa.
- `actualStart`, `actualEnd`, `actualDurationSeconds`
- `productivityScore`: Đánh giá chất lượng phiên học (1 - 5 sao)
- `notes`: Ghi chú sau buổi học
- `source`: `PIP_TIMER`, `MANUAL`

---

### C. Career & Portfolio Models

#### `Skill`
- `id` (PK, cuid), `userId` (FK -> User.id, Cascade)
- `name`: Tên kỹ năng (e.g. "React", "TypeScript", "IELTS 7.5", "SQL")
- `category`: `TECH`, `LANGUAGE`, `SOFT`, `DESIGN`, `OTHER`
- `level`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`

#### `Project`
- `id` (PK, cuid), `userId` (FK -> User.id, Cascade)
- `subjectId` (FK -> Subject.id, SetNull)
- `title`, `description`, `repositoryUrl`, `demoUrl`, `technologies`
- `status`: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `FEATURED`

#### `Certificate`
- `id`, `userId`, `name`, `issuer`, `issueDate`, `expiryDate`, `credentialId`, `score`

#### `CareerApplication`
- `id`, `userId`, `company`, `role`, `type` (`INTERNSHIP`, `FULL_TIME`), `status` (`SAVED`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`)

#### `AuditLog`
- `id`, `userId`, `entityType`, `entityId`, `action` (`CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `TRANSITION`), `detailsJson`, `createdAt`

---

## 3. CÔNG THỨC QUY ĐỔI ĐIỂM (GPA MAPPING RULES)

Hệ thống hỗ trợ quy đổi chuẩn theo Bộ Giáo dục và Đào tạo:

| Điểm hệ 10 | Điểm chữ | Điểm hệ 4 | Xếp loại |
|---|---|---|---|
| **8.5 - 10.0** | A | 4.0 | Xuất sắc / Giỏi |
| **8.0 - 8.4** | B+ | 3.5 | Khá giỏi |
| **7.0 - 7.9** | B | 3.0 | Khá |
| **6.5 - 6.9** | C+ | 2.5 | Trung bình khá |
| **5.5 - 6.4** | C | 2.0 | Trung bình |
| **5.0 - 5.4** | D+ | 1.5 | Trung bình yếu |
| **4.0 - 4.9** | D | 1.0 | Đạt |
| **< 4.0** | F | 0.0 | Không đạt (Học lại) |

- **GPA Học kỳ**:
  $$\text{GPA} = \frac{\sum (\text{Điểm hệ 4}_i \times \text{Số tín chỉ}_i)}{\sum \text{Số tín chỉ}_i}$$
- **GPA Tích lũy (Cumulative GPA)**:
  Tính trên toàn bộ các môn đã tích lũy điểm tính đến thời điểm hiện tại của các học kỳ đã hoàn thành.

---

## 4. QUY TẮC BẢO TOÀN DỮ LIỆU KHI CHUYỂN HỌC KỲ (SEMESTER TRANSITION)

Khi người dùng thực hiện chuyển giao học kỳ:
1. Trạng thái học kỳ cũ chuyển thành `COMPLETED` hoặc `ARCHIVED`.
2. Điểm học kỳ và GPA tích lũy được tính toán và lưu vào bản ghi học kỳ.
3. Các môn học chuyển trạng thái tương ứng (`COMPLETED`).
4. Toàn bộ tài liệu PDF, bộ thẻ Flashcards, bài trắc nghiệm Quiz, ghi chú Notes, và phiên học Study Sessions **được giữ nguyên vẹn 100%**, có thể truy cập lại bất cứ lúc nào qua chế độ lọc Năm học / Học kỳ.

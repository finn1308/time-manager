# CHRONOMIND - BACKUP, DATA PORTABILITY & RECOVERY
## 4-YEAR DATA SAFETY, EXPORT/IMPORT & DISASTER RECOVERY (`/docs/BACKUP_AND_RECOVERY.md`)

---

## 1. NGUYÊN TẮC QUYỀN SỞ HỮU DỮ LIỆU (DATA OWNERSHIP & PORTABILITY)

Dữ liệu học tập suốt 4 năm đại học là tài sản vô giá của sinh viên. ChronoMind cam kết:
1. **Không khóa dữ liệu (No Vendor Lock-in)**: Toàn bộ dữ liệu của người dùng có thể được xuất ra dưới định dạng mở tiêu chuẩn (`JSON`, `CSV`).
2. **Quyền mang theo dữ liệu (Data Portability)**: Người dùng có thể tải về bản sao lưu toàn diện bất kỳ lúc nào để chuyển giao sang hệ thống khác hoặc lưu trữ offline.
3. **Phân quyền và cô lập tuyệt đối (Tenant Isolation)**: Mọi thao tác xuất/nhập dữ liệu đều được xác thực danh tính người dùng (`where: { userId: user.id }`), ngăn chặn rò rỉ dữ liệu chéo.

---

## 2. KIẾN TRÚC SAO LƯU (BACKUP ARCHITECTURE)

### A. Full System JSON Backup (`/api/export?format=json`)
Xuất toàn bộ hệ sinh thái học thuật 4 năm vào một file JSON duy nhất:
```json
{
  "version": "1.0.0",
  "exportedAt": "2026-10-03T00:00:00.000Z",
  "degreeProgram": { ... },
  "academicYears": [ ... ],
  "semesters": [ ... ],
  "subjects": [ ... ],
  "goals": [ ... ],
  "tasks": [ ... ],
  "calendarEvents": [ ... ],
  "studySessions": [ ... ],
  "notes": [ ... ],
  "flashcardDecks": [ ... ],
  "skills": [ ... ],
  "projects": [ ... ],
  "certificates": [ ... ],
  "careerApplications": [ ... ]
}
```

### B. Modular CSV Export (`/api/export?format=csv&module=...`)
Hỗ trợ xuất từng phân hệ riêng biệt để mở bằng Microsoft Excel hoặc Google Sheets:
- `module=events`: Toàn bộ sự kiện lịch biểu
- `module=sessions`: Toàn bộ lịch sử các phiên học thực tế
- `module=tasks`: Toàn bộ danh sách nhiệm vụ và trạng thái
- `module=notes`: Toàn bộ ghi chú học tập
- `module=grades`: Bảng điểm chi tiết theo học kỳ

---

## 3. KIẾN TRÚC PHỤC HỒI DỮ LIỆU (RESTORE ENGINE - `/api/import`)

1. **Kiểm tra tính toàn vẹn (Payload Validation)**:
   - Sử dụng bộ parser kiểm tra cấu trúc schema JSON trước khi ghi vào Database.
2. **Giao dịch an toàn (Database Transaction)**:
   - Áp dụng `prisma.$transaction` để bảo đảm nếu có lỗi phát sinh giữa chừng, hệ thống tự động rollback mà không làm sai lệch cơ sở dữ liệu hiện có.
3. **Ánh xạ khóa ngoại tự động (Foreign Key Remapping)**:
   - Khi nhập lại dữ liệu, hệ thống tự động tái lập các liên kết:
     `AcademicYear` $\rightarrow$ `Semester` $\rightarrow$ `Subject` $\rightarrow$ `Tasks / StudySessions / Notes / Projects`.

---

## 4. CHIẾN LƯỢC PHÒNG CHỐNG THẢM HỌA (DISASTER RECOVERY)

1. **Bảo toàn cascade (`onDelete: SetNull`)**:
   - Khóa ngoại `StudySession.calendarEventId` có cấu hình `onDelete: SetNull`. Nếu người dùng xóa sự kiện lịch biểu, số giờ học thực tế và lịch sử phiên học không bao giờ bị xóa thác.
2. **Nhật ký kiểm toán (`AuditLog`)**:
   - Ghi lại vết mọi thao tác xóa, cập nhật lớn, và chuyển đổi học kỳ (`SEMESTER_TRANSITION`) kèm dữ liệu chi tiết dạng JSON để hỗ trợ tra cứu và khôi phục khi cần thiết.

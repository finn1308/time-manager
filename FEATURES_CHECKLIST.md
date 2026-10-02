# FEATURES CHECKLIST - NỀN TẢNG LUYENTU & CHRONOMIND OS

Bảng kiểm kê tính năng đầy đủ theo yêu cầu hệ thống học tập full-stack thực tế, persistent và production-ready.

---

## 🎯 Danh Sách Tính Năng Cốt Lõi

- [x] **Authentication**: Đăng ký, đăng nhập bảo mật với bcrypt, JWT HTTP-only cookies, session management, user data isolation triệt để.
- [x] **User Profile**: Quản lý thông tin cá nhân, avatar, cấu hình múi giờ, số xu (coins), trạng thái PRO.
- [x] **Subject (Môn học)**: CRUD môn học, gán mã môn, mã màu pastel/emerald, icon, ưu tiên hiển thị, mục tiêu học tập.
- [x] **Course (Khóa học Vocab & Học phần)**: Khóa từ vựng A1 (0-3.0) và các cấp độ khác, danh sách bộ từ, ghim khóa học, mở khóa PRO.
- [x] **Lesson / Word Sets (Bộ từ vựng)**:
  - Khớp 100% Screenshot 1 & 2: 31 bộ từ vựng, 371 từ, thanh tiến độ xanh lá.
  - Bộ 1 "Lời chào hỏi" (9 từ, 100% hoàn thành).
  - Các bộ 2-6 ("Số đếm", "Màu sắc", "Ngày trong tuần", "Tháng trong năm", "Thời tiết") với huy hiệu PRO lock.
  - Bộ lọc: Trạng thái (Chưa thuộc, Đang học, Đã thuộc, Yêu thích), Số lượng (5, 10, 15, 20, Tất cả), Thứ tự (Ngẫu nhiên, Mặc định, A-Z).
- [x] **Quiz (Trắc nghiệm 4 đáp án)**: Chế độ Quiz với câu hỏi ngẫu nhiên từ nghĩa/từ tiếng Anh, chấm điểm thời gian thực, giải thích chi tiết, thưởng +10 xu.
- [x] **Flashcard (Lật thẻ 3D)**: Thẻ học từ vựng 3D flip card, phát âm Web Speech API, đánh dấu thuộc / chưa thuộc, thưởng +5 xu.
- [x] **Listening (Luyện nghe & gõ lại)**: Đếm ngược 30 giây, phát âm bản xứ, kiểm tra chính tả, thưởng +15 xu.
- [x] **Typing (Xem nghĩa gõ từ)**: Hiển thị gợi ý nghĩa tiếng Việt và từ loại, gõ từ tiếng Anh, thưởng +10 xu.
- [x] **Ghép cặp (Matching Pairs)**: Trò chơi nối từ tiếng Anh với nghĩa tiếng Việt, phản hồi trực quan, thưởng +10 xu.
- [x] **Đặc biệt (HOT Challenge)**: Chế độ tổng hợp câu hỏi hỗn hợp, thưởng cao nhất +20 xu.
- [x] **Spaced Repetition (Học ngắt quãng SuperMemo SM-2)**: Thuật toán SuperMemo SM-2 chuẩn quốc tế, tự động tính repetition, interval, ease factor và ngày ôn tập tiếp theo.
- [x] **Shop (Cửa hàng phần thưởng)**: Đổi xu thưởng tích lũy lấy gói PRO Pass, Streak Freeze bảo vệ chuỗi học, huy hiệu độc quyền, giao diện VIP.
- [x] **Leaderboard (Bảng xếp hạng)**: BXH học viên theo số phiên học, số từ đã thuộc và số xu tích lũy.
- [x] **Notes & Wiki**: Ghi chú cá nhân hóa theo từng môn học, hỗ trợ tìm kiếm, ghim, tag.
- [x] **Schedule & Calendar**: Lịch học thông minh, hỗ trợ xung đột thời gian, lặp lại định kỳ, đồng bộ Google Calendar.
- [x] **Timer (Study Timer / Pomodoro)**: PIP Floating timer chạy ngầm, lưu phiên học thực tế vào database, tích lũy XP và xu.
- [x] **Progress & KPI**: Dashboard thống kê thời gian học thật, chuỗi ngày streak, biểu đồ heatmap hoạt động, tiến độ từng bộ từ và môn học.
- [x] **AI Layer**: Gemini / AI Coach phân tích tài liệu PDF, tạo roadmap học tập tự động, tư vấn phân bổ thời gian.
- [x] **Admin**: Trang `/vocab/admin` quản lý thống kê hệ thống, tạo bộ từ mới, thêm từ vựng với phiên âm IPA & câu ví dụ, đổi trạng thái PRO.
- [x] **Search**: Tìm kiếm toàn diện khóa học, bộ từ, từ vựng theo từ tiếng Anh hoặc nghĩa tiếng Việt, phân trang.
- [x] **File / PDF**: Trích xuất giáo trình PDF, phân loại trang bìa/mục lục, bóc tách cấu trúc học phần.
- [x] **Notification**: Hệ thống thông báo nhắc nhở deadline và học tập.
- [x] **Security**: Phân quyền server-side, bảo vệ CSRF, mã hóa mật khẩu bcrypt, kiểm tra userId ở mọi query database.
- [x] **Responsive**: Tối ưu 100% trên Desktop, Laptop, Tablet, iPhone và Android (Drawer menu & Bottom navigation linh hoạt).
- [x] **Deployment**: Sẵn sàng deploy production với Next.js Turbopack và PostgreSQL Prisma, kiểm thử 42/42 tests pass 100%.

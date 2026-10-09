# KIỂM KÊ GIAO DIỆN CHI TIẾT — NHÓM 4: FLASHCARDS, PHÂN TÍCH, NGHỀ NGHIỆP & HỆ THỐNG

---

## 33. Trang Quản Lý Bộ Thẻ Ghi Nhớ (Flashcards Index)
- **URL/Route**: `/flashcards`
- **Tập tin source**: [src/app/(dashboard)/flashcards/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/flashcards/page.tsx)
- **Mục đích**: Quản lý các bộ thẻ ghi nhớ (Flashcard Decks), tạo bộ thẻ thủ công hoặc tạo tự động bằng AI từ tài liệu học tập.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, quản lý qua `/api/flashcards/decks`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề trang, 2 nút hành động: `Tạo bộ thẻ bằng AI` (`Sparkles`) và `+ Tạo bộ thẻ mới`.
- **Thanh thống kê nhanh**: Tổng số bộ thẻ, tổng số thẻ ghi nhớ, số thẻ cần ôn tập hôm nay.
- **Lưới các Bộ Thẻ (Decks Grid)**: Mỗi thẻ đại diện cho một bộ flashcard:
  - Tên bộ thẻ, môn học liên kết (badge màu sắc).
  - Mô tả bộ thẻ.
  - Số lượng thẻ bên trong (vd: `10 thẻ`).
  - Số thẻ đã thuộc (Mastered) vs Số thẻ đang học (Learning) vs Thẻ mới (New).
  - Nút `Học ngay` (dẫn vào `/flashcards/[id]`).
  - Nút Xóa bộ thẻ.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Bộ thẻ Ghi nhớ (Flashcards & Spaced Repetition)`.
2. **Các thẻ thống kê**: 3 thẻ chỉ số (Tổng bộ thẻ, Tổng thẻ, Thẻ đến hạn).
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các bộ thẻ ghi nhớ.
5. **Các biểu đồ**: Thanh tiến độ thông thạo từng bộ thẻ (`%`).
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu** (trong modal):
   - Tạo thủ công: Tiêu đề bộ thẻ, Mô tả, Môn học liên kết.
   - Tạo bằng AI: Chọn nguồn (Tài liệu có sẵn / Dán văn bản tự do), Chọn Môn học, Nhập prompt/nội dung, Số lượng thẻ muốn tạo (mặc định 10).
8. **Các nút bấm**:
   - Nút `+ Tạo bộ thẻ mới`.
   - Nút `Tạo bộ thẻ bằng AI`.
   - Nút `Học ngay →` trên từng bộ thẻ.
   - Nút `Xóa bộ thẻ` (icon Trash).
9. **Các menu tùy chọn**: Dropdown chọn môn học liên kết.
10. **Các cửa sổ popup và modal**:
    - Modal Tạo bộ thẻ thủ công.
    - Modal Trình tạo Flashcard bằng AI (`AiGenModal`).
11. **Các bộ lọc và chức năng tìm kiếm**: Không có thanh tìm kiếm riêng.
12. **Trạng thái loading, empty và error**:
    - Khi chưa có bộ thẻ: Khung thông báo kèm nút "Tạo bộ thẻ đầu tiên".
13. **Chức năng ẩn**: Không có.
14. **Desktop vs Mobile**: Lưới 3 cột trên desktop, 1 cột trên mobile.

---

## 34. Trang Chi Tiết Bộ Thẻ & Chế Độ Học (Flashcard Deck Detail & Study Modes)
- **URL/Route**: `/flashcards/[id]`
- **Tập tin source**: [src/app/(dashboard)/flashcards/[id]/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/flashcards/%5Bid%5D/page.tsx)
- **Mục đích**: Xem danh sách các thẻ trong bộ, thêm thẻ từ vựng mới, và chọn 5 chế độ học tập chuyên sâu (Lật thẻ Flashcard, Trắc nghiệm Quiz, Nghe âm thanh Listening, Gõ chính tả Typing, Trò chơi Ghép từ Matching).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200 với deck ID thật `cmuvclpj00001itrya210hhbb`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/flashcards`, tiêu đề bộ thẻ, môn học, nút `+ Thêm thẻ mới`.
- **Thanh Tùy biến Chế độ học (Study Customization Bar)**:
  - Bộ lọc trạng thái học: `Tất cả (All)`, `Thẻ mới (New)`, `Chưa thuộc (Learning)`, `Đã thuộc (Mastered)`.
  - Giới hạn số lượng thẻ: `Tất cả`, `5 thẻ`, `10 thẻ`, `20 thẻ`.
  - Thứ tự học: `Mặc định` vs `Trộn ngẫu nhiên (Shuffle)`.
- **Lưới 5 Nút Khởi động Chế độ Học (Study Modes)**:
  1. `Lật thẻ (Flashcard)`: Xem mặt trước/sau, SuperMemo rating.
  2. `Trắc nghiệm (Quiz)`: Chọn 1 trong 4 đáp án đúng.
  3. `Luyện nghe (Listening)`: Nghe phát âm AI và chọn từ vựng.
  4. `Gõ từ (Typing)`: Nhìn nghĩa và gõ chính xác chính tả từ tiếng Anh.
  5. `Ghép từ (Matching)`: Trò chơi nối cặp Từ và Nghĩa.
- **Bảng Danh sách Thẻ trong Bộ (Cards Table)**:
  - Thuật ngữ (kèm nút Loa phát âm), Phiên âm IPA, Từ loại (noun, verb...).
  - Nghĩa tiếng Việt, Câu ví dụ tiếng Anh và bản dịch.
  - Trạng thái thuộc (NEW, LEARNING, MASTERED).
  - Nút Xóa thẻ.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: Tên bộ thẻ (vd: `10 Từ Vựng Học Thuật Cốt Lõi`).
2. **Các thẻ thống kê**: Số thẻ đã thuộc, số thẻ đang học, số thẻ mới.
3. **Các bảng dữ liệu**: Bảng danh sách thẻ với 5 cột thông tin.
4. **Các danh sách**: Danh sách các thẻ từ vựng.
5. **Các biểu đồ**: Thanh tỷ lệ thuộc từ (`%`).
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu** (trong modal thêm thẻ):
   - Thuật ngữ / Từ vựng (Term).
   - Phiên âm IPA.
   - Từ loại (noun, verb, adjective, phrase...).
   - Nghĩa tiếng Việt.
   - Câu ví dụ tiếng Anh & Dịch nghĩa.
   - Gợi ý ghi nhớ (Hint).
8. **Các nút bấm**:
   - 5 nút chọn chế độ học (`Flashcard`, `Quiz`, `Nghe`, `Gõ từ`, `Ghép từ`).
   - Nút `Loa phát âm` trên từng thẻ (gọi TTS).
   - Nút `+ Thêm thẻ mới`.
   - Nút Xóa thẻ.
   - Nút `Trộn ngẫu nhiên`.
9. **Các menu tùy chọn**: Chọn số lượng thẻ giới hạn, chọn trạng thái thẻ.
10. **Các cửa sổ popup và modal**:
    - `AddCardModal`: Thêm từ vựng mới vào deck.
    - `StudyModeSession`: Modal/Màn hình chạy phiên học tương tác.
11. **Các bộ lọc và chức năng tìm kiếm**:
    - Tìm kiếm từ khóa trong bảng thẻ.
    - Lọc theo trạng thái NEW / LEARNING / MASTERED.
12. **Trạng thái loading, empty và error**:
    - Khi bộ thẻ rỗng: Thông báo "Chưa có thẻ nào trong bộ" kèm nút thêm thẻ.
13. **Chức năng ẩn**:
    - Phiên học tương tác che toàn bộ màn hình khi người dùng bấm vào 1 trong 5 chế độ học.
14. **Desktop vs Mobile**: Bảng thẻ có scroll ngang, 5 nút chế độ học xếp thành lưới 2 cột trên điện thoại.

---

## 35. Trang Cổng Tiến Độ (Progress Hub)
- **URL/Route**: `/progress`
- **Tập tin source**: [src/app/(dashboard)/progress/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/progress/page.tsx)
- **Mục đích**: Cổng điều phối số liệu tiến độ (Progress Hub) liên kết tới 7 phân hệ đo lường: Thống kê (Analytics), Nhật ký phiên học, Đánh giá tuần, Mục tiêu & OKRs, Thói quen & XP, Hồ sơ nghề nghiệp và Practice Hub.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, 7 module liên kết chuẩn).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Icon Tăng trưởng xanh mạ (`TrendingUp`), tiêu đề "Tiến độ (Progress)", mô tả.
- **Lưới 7 Thẻ Module tiến độ**:
  1. `Thống kê (Analytics)`: Dẫn tới `/analytics`.
  2. `Nhật ký phiên học`: Dẫn tới `/study-sessions`.
  3. `Đánh giá tuần (Weekly Review)`: Dẫn tới `/weekly-review`.
  4. `Mục tiêu & OKRs`: Dẫn tới `/goals`.
  5. `Thói quen (Habits & XP)`: Dẫn tới `/habits`.
  6. `Hồ sơ & Nghề nghiệp`: Dẫn tới `/career`.
  7. `Trung tâm Luyện tập (Practice Hub)`: Dẫn tới `/practice`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Tiến độ (Progress)`.
2. **Các thẻ thống kê**: Không có thẻ số liệu trực tiếp trên trang hub.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách 7 module.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**: 7 thẻ card clickable link.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Không có.
13. **Chức năng ẩn**: Hiệu ứng hover viền sáng và bóng mờ.
14. **Desktop vs Mobile**: Lưới 3 cột trên desktop, 1 cột trên mobile.

---

## 36. Trang Thống Kê Chuyên Sâu (Analytics)
- **URL/Route**: `/analytics`
- **Tập tin source**: [src/app/(dashboard)/analytics/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/analytics/page.tsx)
- **Mục đích**: Báo cáo phân tích dữ liệu học tập đa chiều: lọc theo khoảng thời gian (7 ngày, 30 ngày, 90 ngày, toàn bộ thời gian), đối chiếu Planned vs Actual, Bản đồ nhiệt 365 ngày (Heatmap), phân tích thời gian theo môn học và nhịp sinh học tập trung.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, trả về 192KB HTML dữ liệu SSR).

### A. Khu vực giao diện & Thành phần hiển thị
- **Thanh lọc khoảng thời gian (Range Selector)**: 4 nút: `7 ngày qua`, `30 ngày qua`, `90 ngày qua`, `Toàn bộ thời gian`.
- **Bộ 6 Thẻ KPI cốt lõi (KpiCards)**:
  - Giờ thực tế đã học (tổng hợp timer).
  - Giờ đã lên lịch (tổng hợp calendar).
  - Tỷ lệ bám sát kế hoạch (%).
  - Chuỗi ngày học liên tục (Streak).
  - Giờ học trường vs Giờ cá nhân.
- **Biểu đồ Cột Planned vs Actual (PlannedVsActualChart)**: So sánh trực quan kế hoạch vs thực tế theo từng ngày trong khoảng thời gian đã chọn.
- **Bản đồ nhiệt học tập 365 ngày (StudyHeatmap)**: Thể hiện mật độ học tập từng ngày trong năm qua mức độ đậm nhạt của màu xanh.
- **Phân tích Cơ cấu Môn học (Subject Distribution)**: Biểu đồ thanh tỷ trọng thời gian dành cho từng môn.
- **Đồng hồ Sinh học & Độ tập trung (Focus Distribution)**: Tỷ lệ phân bổ học Buổi sáng (05h-12h), Buổi chiều (12h-18h), Buổi tối (18h-24h) và điểm đánh giá sao trung bình.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Thống kê & Phân tích Hiệu suất Học tập (Deep Analytics)`.
2. **Các thẻ thống kê**: 6 thẻ KPI lớn, các thẻ tóm tắt giờ học từng môn.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các môn học kèm số giờ chi tiết.
5. **Các biểu đồ**:
   - Biểu đồ cột đôi Recharts (Kế hoạch vs Thực tế).
   - SVG GitHub-style Heatmap 52 tuần.
   - Thanh phân bổ phần trăm môn học.
6. **Các lịch và bộ chọn ngày**: Nút chọn khoảng thời gian 7/30/90/all.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**:
   - 4 nút lọc thời gian (`7 ngày`, `30 ngày`, `90 ngày`, `Tất cả`).
   - Nút chuyển tới `/calendar` hoặc `/study-sessions`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Lọc dữ liệu theo tham số URL `?range=30`.
12. **Trạng thái loading, empty và error**: Tự động hiển thị 0h nếu không có dữ liệu trong khoảng thời gian chọn.
13. **Chức năng ẩn**: Tooltip khi rê chuột vào từng ô trên bản đồ nhiệt hiển thị ngày và số phút học chính xác.
14. **Desktop vs Mobile**: Bản đồ nhiệt có thanh cuộn ngang khi xem trên điện thoại.

---

## 37. Trang Hồ Sơ & Nghề Nghiệp (Career Hub)
- **URL/Route**: `/career`
- **Tập tin source**: [src/app/(dashboard)/career/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/career/page.tsx)
- **Mục đích**: Xây dựng hồ sơ năng lực 4 năm đại học: quản lý Portfolio dự án (GitHub/Demo), Danh mục kỹ năng chuyên môn, Chứng chỉ quốc tế và Theo dõi hồ sơ ứng tuyển thực tập/việc làm (Internship Applications Tracker).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, quản lý 4 model Prisma liên quan).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề "Hồ sơ Năng lực & Nghề nghiệp (Career & Portfolio OS)".
- **Bộ 4 Tab chức năng**:
  1. `Dự án Portfolio (Projects)`: Danh sách dự án đã làm, link GitHub, link Live Demo, tech stack, liên kết môn học và kỹ năng.
  2. `Kỹ năng chuyên môn (Skills)`: Kỹ năng kỹ thuật, ngoại ngữ, mức độ thành thạo và các dự án minh chứng.
  3. `Chứng chỉ & Bằng cấp (Certificates)`: Chứng chỉ ngoại ngữ (IELTS, TOEIC), chứng chỉ công nghệ (AWS, GCP), ngày cấp, điểm số, link xác thực bằng cấp.
  4. `Ứng tuyển Thực tập (Internships)`: Bảng theo dõi nộp đơn việc làm (Công ty, Vị trí, Mức lương, Hạn nộp, Trạng thái: Đã lưu, Đã nộp, Phỏng vấn, Nhận Offer, Từ chối).
- **Nút Thêm mới**: Nút `+ Thêm dự án / kỹ năng / chứng chỉ / đơn ứng tuyển` thay đổi tương ứng theo tab đang chọn.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Hồ sơ Năng lực & Nghề nghiệp (Career & Portfolio OS)`.
2. **Các thẻ thống kê**: Số lượng dự án, số kỹ năng, số chứng chỉ, số đơn ứng tuyển đang chờ phỏng vấn.
3. **Các bảng dữ liệu**: Bảng theo dõi ứng tuyển việc làm dạng bảng/danh sách có badge trạng thái.
4. **Các danh sách**: Danh sách dự án, danh sách kỹ năng, danh sách chứng chỉ.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Chọn ngày nộp hồ sơ, hạn nộp, ngày cấp chứng chỉ.
7. **Các ô nhập liệu** (trong các modal thêm tương ứng):
   - Dự án: Tên dự án, Mô tả, Link GitHub Repo, Link Demo, Công nghệ sử dụng, Môn học liên kết.
   - Chứng chỉ: Tên chứng chỉ, Đơn vị cấp, Ngày cấp, Mã chứng chỉ, Điểm số, Link xác thực.
   - Đơn ứng tuyển: Tên công ty, Vị trí, Địa điểm, Loại hình (Thực tập/Bán thời gian/Toàn thời gian), Mức lương, Link bài đăng tuyển, Link CV đã nộp.
8. **Các nút bấm**:
   - 4 nút chuyển Tab (`DỰ ÁN`, `KỸ NĂNG`, `CHỨNG CHỈ`, `ỨNG TUYỂN`).
   - Nút `+ Thêm mới`.
   - Nút mở link ngoài (`ExternalLink`) sang GitHub/Demo/Job Post.
   - Nút Sửa, Nút Xóa.
9. **Các menu tùy chọn**: Chọn trạng thái ứng tuyển (APPLIED, INTERVIEW, OFFER, REJECTED...).
10. **Các cửa sổ popup và modal**: 4 modal riêng biệt cho từng loại dữ liệu.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có thanh tìm kiếm riêng; lọc theo 4 tab.
12. **Trạng thái loading, empty và error**: Card thông báo khi tab chưa có dữ liệu.
13. **Chức năng ẩn**: Không có.
14. **Desktop vs Mobile**: Lưới card responsive 2 cột trên desktop, 1 cột trên mobile.

---

## 38. Trang Bảng Điều Khiển Quản Trị (Admin Console)
- **URL/Route**: `/admin`
- **Tập tin source**: [src/app/(dashboard)/admin/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/admin/page.tsx)
- **Mục đích**: Bảng điều khiển quản trị nội dung dành cho Developer / Admin.
- **Trạng thái hoạt động**: **C. HOẠT ĐỘNG MỘT PHẦN** (Route trả về HTTP 200; tuy nhiên tính năng Quản trị người dùng chỉ là card giao diện demo với link `#`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Icon Khiên bảo mật (`ShieldCheck`), tiêu đề "Admin Console", mô tả hệ thống quản trị.
- **Lưới 2 Card Quản trị**:
  1. `Quản lý môn học & Luyện tập`: Liên kết thực tế dẫn sang `/subjects` (**Hoạt động**).
  2. `Quản trị người dùng`: Mô tả "Xem danh sách và phân quyền tài khoản (Demo)", liên kết tới `href="#"` (**Chỉ có giao diện**).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Admin Console`.
2. **Các thẻ thống kê**: Không có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách 2 card module.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**: 2 card bấm được (1 link thật, 1 link `#`).
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Không có.
13. **Chức năng ẩn**: Không có.
14. **Desktop vs Mobile**: Lưới 2 cột trên desktop, 1 cột trên mobile.

---

## 39. Trang Cài Đặt Hệ Thống & API Keys (Settings)
- **URL/Route**: `/settings`
- **Tập tin source**: [src/app/(dashboard)/settings/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/settings/page.tsx)
- **Mục đích**: Cấu hình toàn diện hệ thống: quản lý API Keys cho AI (Gemini, OpenAI, Anthropic), tùy biến thông số thuật toán lập lịch học (Study Preferences), cài đặt hệ thống và sao lưu dữ liệu.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `/api/ai/test-connection`, `/api/user-settings`, `/api/backup/*`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề trang, mô tả cấu hình.
- **Bộ 4 Tab cài đặt chính**:
  1. `AI & API Keys (AI_KEYS)`:
     - Chọn nhà cung cấp: Google Gemini, OpenAI, Anthropic Claude.
     - Ô nhập API Key (che ký tự mật).
     - Nút `Lưu & Kích hoạt Key`.
     - Nút `Kiểm tra kết nối (Test Connection)`: Gọi `/api/ai/test-connection` để xác thực key thật.
     - Danh sách các Key đang lưu kèm trạng thái: ĐÃ KẾT NỐI (Xanh lá), KHÔNG HỢP LỆ (Đỏ), CHƯA CẤU HÌNH (Xám).
     - Nút Xóa key.
  2. `Thông số Học tập (STUDY_PREFS)`:
     - Ngân sách học tập tuần (Weekly Study Budget, vd: 20 giờ).
     - Thời lượng tối đa 1 phiên học (vd: 90 phút).
     - Thời gian nghỉ giải lao giữa các phiên (vd: 15 phút).
     - Thời lượng Pomodoro Work (25p) & Break (5p).
     - Khung giờ học ưa thích & Khung giờ không muốn học.
     - Giới hạn số giờ học tối đa mỗi ngày & Số buổi học tối đa.
     - Ngày nghỉ trong tuần (Checkbox chọn từ T2 đến CN).
     - Xu hướng thời gian (Sáng, Chiều, Tối, Cân bằng).
     - Mức độ linh hoạt của lịch (Nghiêm ngặt, Vừa phải, Linh hoạt).
     - Nút `Lưu thông số học tập`.
  3. `Cài đặt Hệ thống (SYSTEM)`:
     - Chế độ thi cử (Exam Mode switch toggle).
     - Nhận thông báo nhắc nhở học (Notifications toggle).
     - Tự động đóng ngày học (Auto Day Closure toggle).
     - Giao diện Sáng / Tối (Light / Dark mode).
  4. `Sao lưu & Dữ liệu (BACKUP)`:
     - Thẻ xuất dữ liệu JSON / CSV.
     - Nút dẫn sang Trung tâm sao lưu chuyên sâu `/settings/backup`.
     - Khu vực Nguy hiểm (Danger Zone): Nút Xóa toàn bộ dữ liệu tài khoản (có hộp xác nhận gõ chữ).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Cài đặt Hệ thống & Tùy biến (Settings)`.
2. **Các thẻ thống kê**: Không có thẻ số liệu trực tiếp.
3. **Các bảng dữ liệu**: Danh sách API Keys với cột Nhà cung cấp, Trạng thái, Ngày cập nhật, Thao tác.
4. **Các danh sách**: Danh sách phím API, danh sách ngày nghỉ trong tuần.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**:
   - Ô nhập API Key (`<Input type="password">`).
   - Ô nhập Ngân sách tuần (`<Input type="number">`).
   - Các ô nhập số phút Pomodoro, Break, Session Max.
   - Các ô chuỗi giờ học ưa thích (vd: `08:00-11:30`).
   - Ô nhập xác nhận xóa tài khoản (`gõ "DELETE"`).
8. **Các nút bấm**:
   - 4 nút chuyển Tab cài đặt.
   - Nút `Lưu & Kích hoạt API Key`.
   - Nút `Kiểm tra kết nối` (Test Connection).
   - Nút `Xóa Key`.
   - Nút `Lưu thông số học tập`.
   - Nút `Khôi phục mặc định`.
   - Nút `Xuất toàn bộ dữ liệu JSON`.
   - Nút `Mở Backup Center →`.
   - Nút `Xóa toàn bộ dữ liệu tài khoản` (Màu đỏ nguy hiểm).
9. **Các menu tùy chọn**: Dropdown chọn AI Provider, Dropdown chọn Time Preference, Schedule Flexibility.
10. **Các cửa sổ popup và modal**: Hộp thoại xác nhận hành động nguy hiểm (Xóa tài khoản / Đặt lại hệ thống).
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**:
    - Khi kiểm tra kết nối API: Spinner quay và thông báo toast thành công/thất bại.
13. **Chức năng ẩn**: Nút hiện/ẩn API Key bằng icon con mắt.
14. **Desktop vs Mobile**: Form 2 cột trên desktop, 1 cột trên mobile.

---

## 40. Trang Trung Tâm Sao Lưu & Phục Hồi Dữ Liệu (Backup Center)
- **URL/Route**: `/settings/backup`
- **Tập tin source**: [src/app/(dashboard)/settings/backup/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/settings/backup/page.tsx)
- **Mục đích**: Trung tâm sao lưu ngoại tuyến và sở hữu dữ liệu 4 năm: tải về toàn bộ cơ sở dữ liệu học tập dưới dạng tệp JSON, tải danh sách nhiệm vụ dưới dạng CSV, và khôi phục toàn bộ hệ thống bằng cách tải tệp JSON lên.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `/api/backup/export` và `/api/backup/import`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/settings`, icon Cơ sở dữ liệu (`Database`), tiêu đề và tuyên ngôn quyền sở hữu dữ liệu của sinh viên.
- **Phân hệ Xuất Dữ Liệu (Data Export Section)**:
  - Nút `Tải về Bản sao lưu Toàn diện (Full Backup JSON)`: Gọi `/api/backup/export?format=json`, tải về toàn bộ môn học, ghi chú, flashcards, lịch học, lỗi sai, đề cương.
  - Nút `Xuất Danh sách Nhiệm vụ (Tasks CSV)`: Gọi `/api/backup/export?format=csv&module=TASKS`, tải file Excel/CSV.
- **Phân hệ Phục Hồi Dữ Liệu (Data Restore Section)**:
  - Khung tải tệp lên dạng kéo thả hoặc bấm nút chọn file `.json`.
  - Hộp thông báo kết quả phục hồi (`restoreResult`): Hiển thị chi tiết số lượng môn học, sự kiện lịch, thẻ ghi nhớ đã được khôi phục thành công vào database.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Trung tâm Sao lưu & Quyền sở hữu Dữ liệu (Backup Center)`.
2. **Các thẻ thống kê**: Thẻ tóm tắt kết quả phục hồi dữ liệu (số lượng bản ghi).
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các module được bao gồm trong gói sao lưu.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Ô chọn tệp tin `<input type="file" accept=".json">`.
8. **Các nút bấm**:
   - Nút `Tải về Bản sao lưu Toàn diện (JSON)`.
   - Nút `Xuất Nhiệm vụ (CSV)`.
   - Nút `Chọn tệp khôi phục` (Upload).
   - Nút quay lại `/settings`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**:
    - Khi đang khôi phục: Spinner và thông báo "Đang xử lý khôi phục cơ sở dữ liệu...".
    - Khi tệp không hợp lệ: Toast thông báo lỗi "Tệp sao lưu không hợp lệ".
13. **Chức năng ẩn**: Bảng tóm tắt kết quả phục hồi chỉ xuất hiện sau khi import thành công.
14. **Desktop vs Mobile**: Tương thích tốt trên mobile.

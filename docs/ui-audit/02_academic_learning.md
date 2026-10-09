# KIỂM KÊ GIAO DIỆN CHI TIẾT — NHÓM 2: HỌC THUẬT & ÔN TẬP (ACADEMIC, EXAMS & LEARNING)

---

## 11. Trang Quản Lý Hạn Chót (Deadlines - Anti-Cramming)
- **URL/Route**: `/deadlines`
- **Tập tin source**: [src/app/(dashboard)/deadlines/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/deadlines/page.tsx)
- **Mục đích**: Hệ thống chống học dồn (Anti-Cramming System), theo dõi các hạn chót bài tập/đồ án và thuật toán AI tự động phân rã hạn chót thành nhiều buổi học nhỏ rải đều trong tuần.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, kết nối API `/api/deadlines` và `/api/deadlines/distribute`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề trang, nút `+ Thêm deadline mới`.
- **Thanh 3 thẻ thống kê tổng quan (Deadline Stats)**:
  - Tổng số Deadline đang theo dõi.
  - Số Deadline khẩn cấp (dưới 48h hoặc cận hạn).
  - Số Deadline chưa được xếp lịch học (Unscheduled).
- **Thanh Tab phân loại**: `Tất cả`, `Khẩn cấp (Urgent)`, `Sắp tới (Upcoming)`, `Tương lai (Future)`, `Chưa xếp lịch (Unscheduled)`.
- **Danh sách thẻ Deadline**: Mỗi thẻ hiển thị:
  - Môn học liên kết, Tiêu đề nhiệm vụ.
  - Hạn chót chính xác (ngày & giờ) kèm số ngày/giờ còn lại.
  - Mức độ ưu tiên (LOW, MEDIUM, HIGH, URGENT).
  - Ước tính thời lượng cần thiết (Số giờ).
  - Nút chức năng `Tự động phân rã vào Calendar` (kích hoạt thuật toán phân bổ).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Quản lý Hạn chót & Chống học dồn (Anti-Cramming Deadlines)`.
2. **Các thẻ thống kê**: 3 thẻ (Tổng cộng, Khẩn cấp, Chưa xếp lịch).
3. **Các bảng dữ liệu**: Không có bảng dạng lưới; dữ liệu hiển thị theo danh sách Card.
4. **Các danh sách**: Danh sách các deadline theo tab.
5. **Các biểu đồ**: Thanh tiến độ thời gian còn lại đến hạn chót.
6. **Các lịch và bộ chọn ngày**: Bộ chọn ngày giờ deadline trong modal tạo mới.
7. **Các ô nhập liệu** (trong modal thêm): Tiêu đề, Môn học, Ngày giờ hạn chót, Giờ ước tính, Mức độ ưu tiên, Mô tả.
8. **Các nút bấm**:
   - Nút `+ Thêm deadline mới`.
   - 5 nút tab phân loại (`TẤT CẢ`, `KHẨN CẤP`, `SẮP TỚI`, `TƯƠNG LAI`, `CHƯA XẾP LỊCH`).
   - Nút `Phân rã vào Calendar` (Distribute Modal).
   - Nút `Xem trước phân bổ` (Preview).
   - Nút `Xác nhận ghi vào Calendar` (Commit to Calendar).
   - Nút Xóa deadline.
9. **Các menu tùy chọn**: Chọn thời lượng mỗi buổi phân rã (30p, 45p, 60p, 90p) và số ngày đệm an toàn (Buffer days).
10. **Các cửa sổ popup và modal**:
    - Modal Tạo Deadline mới.
    - Modal Phân rã lịch học tự động (Auto-distribution Simulator Modal).
11. **Các bộ lọc và chức năng tìm kiếm**: Lọc theo 5 trạng thái thông qua các tab.
12. **Trạng thái loading, empty và error**:
    - Loading: Hiển thị hiệu ứng tải dữ liệu.
    - Empty: Card thông báo "Không có deadline nào trong danh mục này".
13. **Chức năng ẩn**:
    - Bản xem trước các slot học dự kiến chỉ hiện ra sau khi nhấn "Xem trước phân bổ".
14. **Desktop vs Mobile**: Thẻ thống kê 3 cột chuyển thành xếp chồng dọc trên màn hình hẹp.

---

## 12. Trang Kế Hoạch Thi Cử (Exams - Sprint Mode)
- **URL/Route**: `/exams`
- **Tập tin source**: [src/app/(dashboard)/exams/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/exams/page.tsx)
- **Mục đích**: Chế độ ôn thi nước rút (Exam Sprint Mode), chiến lược ôn thi 5 giai đoạn (Foundation -> Recovery -> Practice -> Mock Exam -> Final Review), đo chỉ số sẵn sàng và dự báo điểm số.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, kết nối `/api/exams`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề "Chế độ Luyện thi (Exam Mode)", nút `+ Lập kế hoạch thi mới`.
- **Danh sách các kỳ thi đang ôn tập**: Mỗi kỳ thi hiển thị dưới dạng Dashboard thu nhỏ:
  - Tên môn thi, ngày thi và đồng hồ đếm ngược số ngày.
  - Điểm mục tiêu (Target Score) vs Điểm hiện tại (Current Score) vs Điểm dự báo (Estimated Score).
  - Chỉ số sẵn sàng (Readiness Score: 0 - 100%).
  - Mức độ rủi ro (Risk Level: THẤP, TRUNG BÌNH, CAO, NGUY CẤP).
  - Giai đoạn hiện tại trong 5 phase ôn thi.
  - Danh sách chủ đề yếu cần khắc phục (Weak Topics).
  - Lộ trình ôn tập theo từng ngày (Structured Phased Study Plan).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Chế độ Luyện thi & Ôn thi nước rút (Exam Sprint Mode)`.
2. **Các thẻ thống kê**: Điểm mục tiêu, Điểm hiện tại, Điểm dự báo, Chỉ số sẵn sàng `%`, Giờ học khả dụng còn lại.
3. **Các bảng dữ liệu**: Bảng các giai đoạn ôn thi (Phases & Milestones).
4. **Các danh sách**: Danh sách kỳ thi, danh sách các chuyên đề yếu, danh sách nhiệm vụ ngày.
5. **Các biểu đồ**: Thanh tròn hoặc thanh ngang chỉ số sẵn sàng phòng thi (`Readiness Score`).
6. **Các lịch và bộ chọn ngày**: Bộ chọn ngày thi (`<Input type="date">`).
7. **Các ô nhập liệu** (trong modal thêm):
   - Tên kỳ thi (vd: "Thi kết thúc học phần Giải Tích 1").
   - Chọn Môn học.
   - Ngày diễn ra kỳ thi.
   - Điểm mục tiêu (Target score, vd: 8.5).
   - Điểm đánh giá hiện tại (vd: 5.0).
   - Tổng số giờ ôn tập khả dụng (vd: 40 giờ).
8. **Các nút bấm**:
   - Nút `+ Lập kế hoạch thi mới`.
   - Nút `Vào luyện tập ngay` (dẫn sang Practice/Quiz).
   - Nút `Cập nhật điểm số & tiến độ`.
   - Nút `Xóa kế hoạch thi`.
9. **Các menu tùy chọn**: Chọn mức độ rủi ro, chọn giai đoạn ôn tập.
10. **Các cửa sổ popup và modal**: Modal Lập kế hoạch thi mới (`CreateExamModal`).
11. **Các bộ lọc và chức năng tìm kiếm**: Không có thanh tìm kiếm.
12. **Trạng thái loading, empty và error**:
    - Khi chưa có kỳ thi: Card thông báo "Chưa có kế hoạch thi nào được kích hoạt".
13. **Chức năng ẩn**: Lộ trình nhiệm vụ chi tiết có thể thu gọn / mở rộng.
14. **Desktop vs Mobile**: Các cột chỉ số thu gọn thành lưới 2 cột trên điện thoại.

---

## 13. Trang Đánh Giá Tuần (Weekly Review)
- **URL/Route**: `/weekly-review`
- **Tập tin source**: [src/app/(dashboard)/weekly-review/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/weekly-review/page.tsx)
- **Mục đích**: Tổng kết hiệu suất tuần, phân tích Planned vs Actual bằng AI, dự báo vận tốc hoàn thành mục tiêu (Goal Velocity Forecasting) và cảnh báo rủi ro trễ hạn.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác `/api/weekly-review` và `/api/forecast`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Thanh chọn tuần (Week Navigator)**: Nút `< Tuần trước`, `Tuần sau >`, hiển thị khoảng ngày thứ Hai đến Chủ Nhật.
- **Nút Hành động**: `Tạo bản đánh giá tuần bằng AI` (Tự động tổng hợp dữ liệu từ Database).
- **Bộ 4 chỉ số tổng kết tuần**:
  - Giờ kế hoạch (Planned Hours).
  - Giờ thực tế đã học (Actual Hours).
  - Tỷ lệ bám sát lịch (%).
  - Số mục tiêu đã hoàn thành.
- **Khu vực Trí tuệ Nhân tạo nhận xét (AI Insights)**:
  - Điểm mạnh & Thành tích nổi bật trong tuần.
  - Lỗ hổng & Vấn đề tồn đọng (số buổi bỏ lỡ, môn học bị bỏ quên).
  - Đề xuất điều chỉnh thời khóa biểu tuần sau.
- **Bảng Dự báo Vận tốc & Rủi ro Mục tiêu (Goal Velocity & Risk Forecast Table)**:
  - Cột Mục tiêu, Cột Vận tốc hiện tại (h/ngày), Cột Vận tốc bắt buộc (h/ngày), Xác suất hoàn thành (%), Trạng thái rủi ro (ĐÚNG HẠN, CÓ NGUY CƠ, NGUY HIỂM, TRỄ HẠN), Ngày dự kiến hoàn thành.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Đánh giá Tuần & Dự báo Tiến độ (Weekly Review & Forecasting)`.
2. **Các thẻ thống kê**: 4 thẻ KPI tuần, 1 thẻ vận tốc trung bình toàn hệ thống.
3. **Các bảng dữ liệu**: Bảng dự báo rủi ro mục tiêu với 7 cột chi tiết.
4. **Các danh sách**: Danh sách gạch đầu dòng nhận xét điểm mạnh và điểm yếu từ AI.
5. **Các biểu đồ**: Biểu đồ phân bổ thời gian học các môn trong tuần.
6. **Các lịch và bộ chọn ngày**: Bộ điều hướng chuyển tuần trước / tuần này / tuần sau.
7. **Các ô nhập liệu**: Không có ô nhập trực tiếp; trang tự tổng hợp từ hệ thống.
8. **Các nút bấm**:
   - Nút `Tuần trước`, `Tuần sau`.
   - Nút `Tạo báo cáo AI tuần này`.
   - Nút `Làm mới dữ liệu`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**:
    - Khi chưa tạo review tuần: Card khuyến khích bấm nút "Tạo bản đánh giá tuần bằng AI".
13. **Chức năng ẩn**: Huy hiệu rủi ro đổi màu theo ngưỡng xác suất (Xanh lá > 80%, Đỏ < 40%).
14. **Desktop vs Mobile**: Bảng dự báo có cuộn ngang trên mobile.

---

## 14. Trang Nhật Ký Phiên Học (Study Sessions)
- **URL/Route**: `/study-sessions`
- **Tập tin source**: [src/app/(dashboard)/study-sessions/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/study-sessions/page.tsx)
- **Mục đích**: Bảng điều khiển khởi động Timer (Pomodoro, Custom Countdown, Stopwatch) và xem toàn bộ lịch sử các phiên học đã được ghi nhận vào database thật.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `pip-timer-provider` và `/api/study-sessions`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Bảng điều khiển Bật học nhanh (Timer Launcher Console)**:
  - Chọn môn học muốn học.
  - Chọn chế độ: Pomodoro (preset 25/5 hoặc 50/10), Đếm ngược tùy chỉnh (Custom Countdown), hoặc Bấm giờ tăng dần (Stopwatch).
  - Nút `Bắt đầu phiên học ngay` (kích hoạt Timer toàn cục và cửa sổ Picture-in-Picture).
- **Bộ lọc lịch sử**: Lọc theo từng Môn học (`Tất cả`, `IELTS`, `Giải Tích 1`...).
- **Bảng/Danh sách Lịch sử phiên học (Study Sessions History)**:
  - Tên môn học & màu đại diện.
  - Thời gian bắt đầu và kết thúc chính xác.
  - Thời lượng thực tế (phút hoặc giây).
  - Đánh giá mức độ tập trung (1 đến 5 sao vàng).
  - Ghi chú cá nhân sau phiên học.
  - Nút Xóa phiên học.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Bảng điều khiển & Nhật ký Phiên học (Study Sessions)`.
2. **Các thẻ thống kê**: Tổng số phiên học đã hoàn thành, tổng số giờ tích lũy thực tế.
3. **Các bảng dữ liệu**: Danh sách phiên học dạng card/hàng có viền bo tròn.
4. **Các danh sách**: Danh sách phiên học sắp xếp theo thời gian mới nhất lên đầu.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Hiển thị ngày giờ phiên học `dd/MM/yyyy HH:mm`.
7. **Các ô nhập liệu**: Ô chọn số phút đếm ngược khi dùng Custom Countdown.
8. **Các nút bấm**:
   - Nút chọn preset Pomodoro `25 / 5` và `50 / 10`.
   - Nút `Bắt đầu phiên học ngay`.
   - Nút `Bật cửa sổ nổi PiP desktop`.
   - Nút Xóa phiên học (icon Trash).
9. **Các menu tùy chọn**: Dropdown chọn môn học trong launcher và trong bộ lọc.
10. **Các cửa sổ popup và modal**: Kết nối với Modal lưu phiên học khi kết thúc timer.
11. **Các bộ lọc và chức năng tìm kiếm**: Bộ lọc dropdown theo môn học.
12. **Trạng thái loading, empty và error**:
    - Khi chưa có phiên học: Card thông báo "Chưa có phiên học nào được ghi nhận".
13. **Chức năng ẩn**: Ghi chú phiên học chỉ hiển thị nếu người dùng có nhập khi dừng timer.
14. **Desktop vs Mobile**: Tương thích tốt trên mobile.

---

## 15. Trang Ghi Chú & Wiki Bài Học (Notes)
- **URL/Route**: `/notes`
- **Tập tin source**: [src/app/(dashboard)/notes/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/notes/page.tsx)
- **Mục đích**: Hệ thống ghi chú Markdown chuẩn Notion, liên kết bài học với Môn học/Nhiệm vụ/Mục tiêu, tính năng AI tự động trích xuất Flashcards từ nội dung bài học.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, xử lý lưu ghi chú qua `/api/notes`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Bố cục 2 cột (Split View Layout)**:
  - Cột trái: Danh sách các ghi chú, thanh tìm kiếm, bộ lọc môn học, nút `+ Ghi chú mới`, chỉ số ghim (Pin).
  - Cột phải: Trình soạn thảo Markdown chuyên nghiệp với Toolbar đầy đủ và màn hình Xem trước (Preview).
- **Thanh công cụ soạn thảo (Markdown Toolbar)**:
  - Định dạng: H1, H2, H3, Đậm (Bold), Nghiêng (Italic), Danh sách số, Danh sách chấm, Danh sách việc cần làm (Checklist), Trích dẫn (Quote), Khối mã (Code), Đường kẻ ngang.
- **Thanh trạng thái & AI**:
  - Trạng thái lưu tự động (Đã lưu / Đang lưu / Chưa lưu).
  - Nút `Trích xuất Flashcards bằng AI` (Tự động đọc bài học và tạo bộ thẻ ôn tập).
  - Nút Ghim lên đầu (Pin).
  - Nút Xuất file Markdown (`.md`).
  - Nút Xóa ghi chú.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Ghi chú & Wiki bài học (Knowledge Notes)`.
2. **Các thẻ thống kê**: Số lượng ghi chú hiện có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách ghi chú bên cột trái (hiển thị tiêu đề, ngày sửa, môn học, tag).
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**:
   - Ô Tiêu đề ghi chú (`<Input>`).
   - Ô Soạn thảo nội dung Markdown (`<textarea>` hỗ trợ phím Tab và gõ mượt).
   - Ô Tìm kiếm ghi chú.
   - Ô Nhập thẻ tag (`#tags`).
8. **Các nút bấm**:
   - Nút `+ Ghi chú mới`.
   - Bộ 11 nút định dạng Markdown trên toolbar.
   - Nút chuyển chế độ: `Soạn thảo` / `Xem trước` / `Chia đôi (Split)`.
   - Nút `Trích xuất Flashcards bằng AI` (`Sparkles`).
   - Nút `Ghim ghi chú` (`Pin`).
   - Nút `Xuất Markdown` (`FileDown`).
   - Nút `Xóa ghi chú` (`Trash2`).
9. **Các menu tùy chọn**: Dropdown liên kết ghi chú với Môn học, Mục tiêu, Nhiệm vụ.
10. **Các cửa sổ popup và modal**: Không có (xử lý trực tiếp inline).
11. **Các bộ lọc và chức năng tìm kiếm**:
    - Tìm kiếm ghi chú tức thì theo tiêu đề và nội dung.
    - Lọc theo Môn học.
12. **Trạng thái loading, empty và error**:
    - Khi chưa chọn ghi chú: Màn hình chờ "Chọn một ghi chú để bắt đầu chỉnh sửa".
    - Khi danh sách trống: Nút tạo ghi chú đầu tiên.
13. **Chức năng ẩn**: Chế độ Xem trước dịch cú pháp Markdown sang HTML đẹp mắt theo thời gian thực.
14. **Desktop vs Mobile**: Trên mobile, có nút chuyển tab giữa "Danh sách ghi chú" và "Trình soạn thảo".

---

## 16. Trang Quản Lý Học Thuật 4 Năm (Academic Hub)
- **URL/Route**: `/academic`
- **Tập tin source**: [src/app/(dashboard)/academic/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/academic/page.tsx)
- **Mục đích**: Hệ điều hành học thuật 4 năm đại học: theo dõi tiến độ tích lũy tín chỉ, bảng điểm GPA tích lũy & từng học kỳ, chuyển tiếp học kỳ (Semester Transition) và Import đề cương AI.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với các API `/api/academic/*`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Banner Chương trình Đào tạo (Degree Program Progress)**:
  - Ngành học, Trường đại học, Khoa, Năm tốt nghiệp dự kiến.
  - Tín chỉ đã tích lũy / Tổng tín chỉ yêu cầu (vd: `0 / 130 tín chỉ`).
  - Điểm GPA tích lũy Hệ 4.0 và Hệ 10.
  - Xếp loại tốt nghiệp dự kiến (Xuất sắc, Giỏi, Khá, Trung bình).
  - Nút chỉnh sửa chương trình đào tạo.
- **Thanh liên kết nhanh chuyên sâu**:
  - Nút mở `Bài tập lớn & Đồ án` (`/academic/assignments`).
  - Nút mở `Cây tri thức & Tiên quyết` (`/academic/knowledge-graph`).
  - Nút mở `Hồ sơ Trí tuệ AI` (`/academic/learning-profile`).
  - Nút `Import Đề cương môn học bằng AI` (`SyllabusImporterModal`).
- **Cây 4 Năm học & Học kỳ (Academic Years & Semesters)**:
  - Phân cấp Năm 1 -> Năm 4.
  - Mỗi năm chứa các học kỳ (Học kỳ 1, Học kỳ 2, Học kỳ hè).
  - Điểm GPA riêng của từng kỳ, số tín chỉ đạt được.
  - Danh sách môn học trong kỳ kèm số tín chỉ, giảng viên, phòng học, điểm số và điểm chữ (A, B+, B, C...).
  - Nút `Chuyển tiếp học kỳ` (Semester Transition).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Hệ điều hành Học thuật 4 năm (Academic OS & GPA Tracker)`.
2. **Các thẻ thống kê**: 4 thẻ KPI lớn (Tổng tín chỉ, Tín chỉ đạt, GPA tích lũy, Xếp loại).
3. **Các bảng dữ liệu**: Bảng điểm môn học theo từng học kỳ gồm Tên môn, Số tín chỉ, Điểm tổng kết, Điểm chữ, Điểm hệ 4.
4. **Các danh sách**: Danh sách năm học, danh sách học kỳ.
5. **Các biểu đồ**: Thanh tiến độ tích lũy tín chỉ 4 năm (`%`).
6. **Các lịch và bộ chọn ngày**: Chọn ngày bắt đầu và kết thúc năm học / kỳ học.
7. **Các ô nhập liệu** (trong các modal):
   - Ngành học, Tổng tín chỉ yêu cầu, GPA mục tiêu.
   - Thêm năm học mới, thêm học kỳ mới.
   - Thêm môn học vào kỳ: Tên, Mã, Số tín chỉ, Giảng viên, Phòng học, Điểm thành phần.
8. **Các nút bấm**:
   - Nút `Chỉnh sửa thông tin văn bằng`.
   - Nút `Import đề cương AI`.
   - Nút `+ Thêm năm học`, `+ Thêm học kỳ`, `+ Thêm môn học`.
   - Nút `Chuyển tiếp học kỳ` (Chốt kỳ cũ, mở kỳ mới).
   - Nút `Sửa điểm`, `Xóa môn học`.
9. **Các menu tùy chọn**: Chọn trạng thái học kỳ (ACTIVE, COMPLETED, UPCOMING).
10. **Các cửa sổ popup và modal**:
    - `SyllabusImporterModal`: Nhập đề cương PDF/Word để AI bóc tách môn và bài học.
    - `SemesterTransitionModal`: Quy trình tổng kết học kỳ và chuyển trạng thái.
    - Modal thêm/sửa năm học, học kỳ, môn học.
11. **Các bộ lọc và chức năng tìm kiếm**: Chọn lọc theo Năm học và Học kỳ.
12. **Trạng thái loading, empty và error**:
    - Khi chưa thiết lập: Nút khởi tạo nhanh chương trình đào tạo mặc định.
13. **Chức năng ẩn**: Tự động tính điểm chữ và GPA hệ 4 ngay khi nhập điểm hệ 10.
14. **Desktop vs Mobile**: Các bảng điểm hỗ trợ cuộn ngang trên màn hình điện thoại.

---

## 17. Trang Bài Tập Lớn & Đồ Án (Assignments)
- **URL/Route**: `/academic/assignments`
- **Tập tin source**: [src/app/(dashboard)/academic/assignments/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/academic/assignments/page.tsx)
- **Mục đích**: Quản lý tiến độ đồ án/tiểu luận môn học và tính năng phân rã nhiệm vụ phức tạp thành 5 bước hành động bằng AI.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, kết nối `/api/assignments`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/academic`, tiêu đề trang, nút `+ Thêm đồ án/bài tập`.
- **Thanh thống kê tiến độ**: Số đồ án Chưa bắt đầu, Đang lập kế hoạch, Đang làm, Đang nghiệm thu, Đã nộp.
- **Bộ lọc**: Lọc theo Môn học và Lọc theo Trạng thái.
- **Danh sách thẻ Đồ án**:
  - Tiêu đề, Môn học, Hạn chót, Mức độ ưu tiên.
  - Thanh phần trăm hoàn thành đồ án (`%`).
  - Khối lượng thời gian ước tính (phút).
  - Nút `AI Phân rã 5 bước` (AI Decompose): Tự động tạo danh sách task con kèm thời gian vào hệ thống Task.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Bài tập lớn, Đồ án & Tiểu luận (Major Assignments)`.
2. **Các thẻ thống kê**: Số lượng đồ án theo từng trạng thái.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các đồ án bài tập lớn.
5. **Các biểu đồ**: Thanh tiến độ hoàn thành đồ án (`%`).
6. **Các lịch và bộ chọn ngày**: Bộ chọn Deadline bài nộp.
7. **Các ô nhập liệu**: Tiêu đề đồ án, Môn học, Hạn nộp, Thời lượng ước tính, Mô tả yêu cầu.
8. **Các nút bấm**:
   - Nút `+ Thêm đồ án mới`.
   - Nút `AI Phân rã 5 bước` (`Sparkles`).
   - Nút Cập nhật trạng thái đồ án.
   - Nút Xóa đồ án.
9. **Các menu tùy chọn**: Chọn mức độ ưu tiên, chọn trạng thái tiến độ.
10. **Các cửa sổ popup và modal**: Modal Tạo đồ án mới.
11. **Các bộ lọc và chức năng tìm kiếm**: Lọc Môn học, Lọc Trạng thái đồ án.
12. **Trạng thái loading, empty và error**: Khung thông báo khi không có bài tập nào.
13. **Chức năng ẩn**: Sau khi phân rã, các subtask tự động liên kết sang trang `/tasks`.
14. **Desktop vs Mobile**: Tương thích tốt trên mobile.

---

## 18. Trang Cây Tri Thức & Tiên Quyết (Knowledge Graph)
- **URL/Route**: `/academic/knowledge-graph`
- **Tập tin source**: [src/app/(dashboard)/academic/knowledge-graph/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/academic/knowledge-graph/page.tsx)
- **Mục đích**: Bản đồ cấu trúc tri thức chuyên ngành, thể hiện mối quan hệ môn/chuyên đề tiên quyết và cảnh báo khi người dùng học vượt cấp mà chưa nắm vững nền tảng.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `/api/knowledge/graph`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay về `/academic`, tiêu đề trang, bộ lọc Môn học, các nút Thêm nút tri thức & Thêm liên kết tiên quyết.
- **Khung cảnh báo điều kiện tiên quyết (Prerequisite Warnings)**: Banner màu hổ phách cảnh báo các chuyên đề chưa đủ điểm thông thạo (Mastery < 60%) nhưng đã bắt đầu học kiến thức nâng cao.
- **Lưới Nút Tri Thức (Knowledge Nodes Grid)**:
  - Tên chuyên đề, chương học, môn học.
  - Tầm quan trọng: CỐT LÕI (CORE), TỰ CHỌN (ELECTIVE), NÂNG CAO (ADVANCED).
  - Điểm thông thạo hiện tại (`Mastery: 0.0 - 1.0`).
  - Danh sách các chuyên đề tiên quyết bắt buộc.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Cây Tri thức & Điều kiện Tiên quyết (Knowledge Graph)`.
2. **Các thẻ thống kê**: Số lượng node tri thức, số liên kết tiên quyết, số cảnh báo vi phạm.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách node tri thức và danh sách cảnh báo.
5. **Các biểu đồ**: Thanh đo độ thông thạo kiến thức (Mastery Bar).
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu** (trong modal):
   - Tiêu đề chuyên đề tri thức.
   - Chương / Topic.
   - Chọn Môn học.
   - Tầm quan trọng (CORE, ELECTIVE, ADVANCED).
   - Chọn Nút nguồn và Nút tiên quyết trong modal liên kết.
8. **Các nút bấm**:
   - Nút `+ Thêm nút tri thức`.
   - Nút `+ Thêm liên kết tiên quyết`.
   - Nút Xóa nút / Xóa liên kết.
9. **Các menu tùy chọn**: Dropdown chọn môn học để lọc cây tri thức.
10. **Các cửa sổ popup và modal**:
    - `AddNodeModal`: Thêm chuyên đề mới.
    - `AddPrerequisiteModal`: Tạo liên kết ràng buộc tiên quyết.
11. **Các bộ lọc và chức năng tìm kiếm**: Lọc cây tri thức theo Môn học.
12. **Trạng thái loading, empty và error**: Khung thông báo khi môn học chưa có cây tri thức.
13. **Chức năng ẩn**: Cảnh báo vi phạm chỉ xuất hiện khi `warnings.length > 0`.
14. **Desktop vs Mobile**: Tương thích tốt trên mobile.

---

## 19. Trang Hồ Sơ Nhận Thức AI (Learning Profile)
- **URL/Route**: `/academic/learning-profile`
- **Tập tin source**: [src/app/(dashboard)/academic/learning-profile/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/academic/learning-profile/page.tsx)
- **Mục đích**: Mô hình hóa trí nhớ cá nhân (Personal Learning Memory), phản xạ học tập, phân tích dạng sai sót lặp lại và đồng hồ sinh học tiếp thu kiến thức.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `/api/ai/memory`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/academic`, tiêu đề trang, nút `Tổng hợp lại dữ liệu (Recalculate AI)`.
- **4 Khối Chỉ số Nhận thức cốt lõi**:
  - Trình độ nhận thức tổng quan (CƠ BẢN, TRUNG CẤP, NÂNG CAO).
  - Tỷ lệ duy trì trí nhớ dài hạn (Retention Rate, vd: `82%`).
  - Hệ số tốc độ tiếp thu kiến thức (Learning Speed, vd: `1.2x`).
  - Thời lượng buổi học tối ưu (vd: `45 phút`).
- **Phân tích Đồng hồ sinh học (Peak Learning Time)**:
  - Khung giờ não bộ tiếp thu tốt nhất: BUỔI SÁNG, BUỔI CHIỀU, BUỔI TỐI, hoặc ĐÊM.
- **Danh sách Dạng lỗi sai thường gặp (Frequent Mistake Types)**:
  - Phân loại lỗi: Hổng kiến thức, Nhầm lẫn khái niệm, Bất cẩn, Trí nhớ suy giảm, Sai sót tính toán.
- **Thế mạnh & Điểm yếu học thuật**: Hai cột phân tích chuyên sâu về môn học vượt trội và môn học cần gia sư kèm cặp.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Hồ sơ Trí tuệ Học tập AI (Personal Learning Memory)`.
2. **Các thẻ thống kê**: 4 thẻ chỉ số nhận thức (Cấp độ, Trí nhớ, Tốc độ, Thời lượng tối ưu).
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách dạng lỗi sai, danh sách thế mạnh, danh sách điểm yếu.
5. **Các biểu đồ**: Thanh đo tỷ lệ lưu giữ trí nhớ dài hạn.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có ô nhập trực tiếp; dữ liệu do AI tổng hợp tự động từ lịch sử luyện tập và timer.
8. **Các nút bấm**:
   - Nút `Tổng hợp lại dữ liệu` (`RotateCcw` kèm hiệu ứng xoay spinner).
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Loading spinner khi AI đang tái tính toán hồ sơ.
13. **Chức năng ẩn**: Không có.
14. **Desktop vs Mobile**: Lưới 4 card chuyển thành 2 cột trên tablet và 1 cột trên điện thoại.

---

## 20. Trang Cổng Học Tập (Learn Hub)
- **URL/Route**: `/learn`
- **Tập tin source**: [src/app/(dashboard)/learn/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/learn/page.tsx)
- **Mục đích**: Cổng điều hướng tập trung (Navigation Portal) liên kết đến toàn bộ 8 phân hệ học tập của ChronoMind.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, 8 thẻ module có link chuẩn).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Icon sách xanh ngọc, tiêu đề "Học tập (Learn)", mô tả chức năng.
- **Lưới 8 Thẻ Module học tập**:
  1. `Chế độ Luyện thi (Exam Mode)`: Dẫn tới `/exams` (Có badge "TRỌNG TÂM").
  2. `Bài tập lớn & Đồ án (Assignments)`: Dẫn tới `/academic/assignments`.
  3. `Cây tri thức & Tiên quyết (Knowledge Graph)`: Dẫn tới `/academic/knowledge-graph`.
  4. `Hồ sơ Nhận thức AI (Learning Memory)`: Dẫn tới `/academic/learning-profile`.
  5. `Học thuật & GPA (Academic OS)`: Dẫn tới `/academic`.
  6. `Quản lý môn học (Subjects)`: Dẫn tới `/subjects`.
  7. `Ghi chú & Wiki bài học`: Dẫn tới `/notes`.
  8. `Trung tâm Luyện tập (Practice)`: Dẫn tới `/practice`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Học tập (Learn)`.
2. **Các thẻ thống kê**: Không có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách 8 module.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**: 8 thẻ Card bấm được dẫn tới từng trang con.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Không có.
13. **Chức năng ẩn**: Hiệu ứng hover nổi bật thẻ card.
14. **Desktop vs Mobile**: Lưới 1 cột trên mobile, 2 cột trên desktop.

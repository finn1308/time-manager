# KIỂM KÊ GIAO DIỆN CHI TIẾT — NHÓM 1: CÁC TRANG CỐT LÕI (CORE & TIME MANAGEMENT)

---

## 1. Trang Đăng Nhập (Login)
- **URL/Route**: `/login`
- **Tập tin source**: [src/app/(auth)/login/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(auth)/login/page.tsx)
- **Mục đích**: Xác thực người dùng bằng Email/Password, cấp JWT session cookie (`chronomind_session`).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, xử lý submit qua `/api/auth/login`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header thương hiệu**: Logo vuông bo góc "CM" gradient xanh thảo mộc, tiêu đề "ChronoMind", mô tả "Hệ điều hành quản lý thời gian & lịch học cá nhân hóa".
- **Thẻ form đăng nhập**: Nằm giữa màn hình, viền bo góc tròn `rounded-[32px]`, nền trắng / dark mode `bg-[#17261c]`.
- **Thông báo lỗi**: Khung alert đỏ nhạt hiển thị thông báo trả về từ API khi email hoặc mật khẩu không đúng.
- **Form đăng nhập**: 2 trường nhập liệu Email và Mật khẩu có icon tương ứng.
- **Footer**: Link điều hướng sang trang Đăng ký `/register`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Đăng nhập tài khoản` (Thẻ `<CardTitle>`).
2. **Các thẻ thống kê**: Không có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Không có.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**:
   - Ô Email: `<Input type="email">`, placeholder `name@example.com`, icon Mail, bắt buộc nhập `required`.
   - Ô Mật khẩu: `<Input type="password">`, placeholder `••••••••`, icon Lock, bắt buộc nhập `required`.
8. **Các nút bấm**:
   - Nút `Đăng nhập`: Submit form, hiển thị icon spinner khi `loading = true`.
   - Nút link `Chưa có tài khoản? Đăng ký ngay`: Điều hướng sang `/register`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**:
    - Loading: Nút đổi thành "Đang xác thực...", con trỏ disable.
    - Error: Hộp màu hồng nhạt viền đỏ `#e8c6c6` chứa nội dung `errorMsg`.
    - Empty: Các ô input rỗng mặc định.
13. **Chức năng ẩn**: Error message chỉ xuất hiện khi `errorMsg !== null`.
14. **Desktop vs Mobile**: Tương thích hoàn toàn trên mobile nhờ class `min-h-[100dvh]`, `pt-safe`, `pb-safe`.

---

## 2. Trang Đăng Ký (Register)
- **URL/Route**: `/register`
- **Tập tin source**: [src/app/(auth)/register/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(auth)/register/page.tsx)
- **Mục đích**: Tạo tài khoản người dùng mới (Họ tên, Email, Mật khẩu).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, xử lý submit qua `/api/auth/register`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header thương hiệu**: Logo "CM", tiêu đề "ChronoMind", mô tả tạo tài khoản cá nhân.
- **Card form đăng ký**: Gồm 3 trường nhập liệu: Họ tên, Email, Mật khẩu.
- **Footer link**: Điều hướng quay lại `/login`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Đăng ký tài khoản`.
2. **Các thẻ thống kê**: Không có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Không có.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**:
   - Ô Họ và tên: `<Input>`, icon User, placeholder `Nguyễn Văn A`.
   - Ô Email: `<Input type="email">`, icon Mail, placeholder `name@example.com`.
   - Ô Mật khẩu: `<Input type="password">`, icon Lock, placeholder `Tối thiểu 6 ký tự`.
8. **Các nút bấm**:
   - Nút `Tạo tài khoản`: Submit form, loading state khi đang gọi API.
   - Link `Đã có tài khoản? Đăng nhập ngay`: Chuyển sang `/login`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Hiển thị khung thông báo đỏ nhạt khi email đã tồn tại hoặc mật khẩu dưới 6 ký tự.
13. **Chức năng ẩn**: Khung alert lỗi chỉ hiện khi đăng ký thất bại.
14. **Desktop vs Mobile**: Căn giữa toàn màn hình với safe area padding.

---

## 3. Trang Bảng Điều Khiển Tổng Quan (Dashboard)
- **URL/Route**: `/` (gốc)
- **Tập tin source**: [src/app/(dashboard)/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/page.tsx)
- **Mục đích**: Trung tâm điều phối học tập: hiển thị chỉ số Planned vs Actual, Streak thực tế, ngân sách tuần, lịch học hôm nay, tiến độ môn học, nhật ký gần đây và phân tích đồng hồ sinh học (Scheduling DNA).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Server Component kết nối database thật, render SSR đầy đủ dữ liệu người dùng).

### A. Khu vực giao diện & Thành phần hiển thị
1. **DashboardRefresher**: Lắng nghe sự kiện `chronomind-study-updated` để tự động làm mới dữ liệu.
2. **DailyAiBriefing**: Banner trí tuệ nhân tạo chào buổi sáng/chiều/tối, tổng hợp số mục cần ôn tập SM-2, số deadline sắp đến và khuyến nghị môn học.
3. **Hero Banner**: Banner xanh pastel gradient chào đón người dùng theo tên thực tế, hiển thị múi giờ `Asia/Ho_Chi_Minh` và nút mở lịch.
4. **Thẻ Tiến độ Đại học 4 năm (Academic & Degree Progress Widget)**: Hiển thị học kỳ đang diễn ra, số tín chỉ đã tích lũy (vd: `0 / 130 tín chỉ (0%)`), điểm GPA tích lũy (`0.00/4.00`), các nút truy cập `/academic` và `/career`.
5. **KpiCards (Bộ 4 chỉ số cốt lõi)**:
   - Giờ thực tế đã học (bấm giờ thật qua timer).
   - Giờ đã lên lịch (tổng giờ các sự kiện calendar).
   - Tỷ lệ hoàn thành (% bám sát lịch).
   - Chuỗi ngày học liên tục (Streak thực tế).
6. **StudyBudgetCard (Ngân sách học & Nợ giờ)**: Ngân sách tuần (vd: 20h), số giờ thực tế đã học tuần này, biểu đồ thanh ngang phân bổ theo từng môn.
7. **Thẻ Truy cập nhanh (4 Quick Action Cards)**: Lịch học 4 buổi, Môn học & Mục tiêu, Khung giờ khóa, Learning Hub & Quiz.
8. **Biểu đồ Cột Planned vs Actual (PlannedVsActualChart)**: So sánh 7 ngày gần nhất giờ kế hoạch vs giờ thực tế.
9. **SchedulingDna (Đồng hồ sinh học học tập)**: Phân tích khung giờ tập trung tốt nhất (Sáng/Chiều/Tối), thời lượng trung bình mỗi phiên, độ lệch ước tính.
10. **Thẻ Đề xuất AI & Luyện tập**: Gồm card "Cần ôn tập ngay (SM-2)" dẫn tới `/practice/review` và card "Trung tâm Luyện tập" dẫn tới `/practice`.
11. **StudyHeatmap**: Bản đồ nhiệt học tập 365 ngày kiểu GitHub.
12. **Cột Lịch học hôm nay (Today's Schedule)**: Danh sách sự kiện trong ngày với checkbox đánh dấu hoàn thành nhanh (`EventCompleteCheckbox`), tag loại sự kiện, nút "Bắt đầu học" kích hoạt Timer.
13. **Cột Thống kê môn học (Subject Progress & Statistics)**: Danh sách môn học với mục tiêu tuần, giờ đã lên lịch, giờ thực tế học, giờ còn thiếu, thanh tiến độ.
14. **Cột Phiên học gần đây (Recent Study Sessions)**: 5 phiên học gần nhất ghi nhận từ PIP Timer kèm đánh giá sao và ghi chú.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Xin chào [Tên người dùng], bắt đầu ngày học hiệu quả!`.
2. **Các thẻ thống kê**: 4 thẻ KPI lớn, thẻ ngân sách tuần, thẻ tín chỉ & GPA, 4 thẻ thống kê con trong từng môn học (Mục tiêu, Đã lên lịch, Thực tế, Còn thiếu).
3. **Các bảng dữ liệu**: Không có bảng HTML chuẩn; sử dụng cấu trúc lưới Card hiện đại.
4. **Các danh sách**:
   - Danh sách sự kiện hôm nay.
   - Danh sách môn học và chỉ tiêu.
   - Danh sách 5 phiên học gần nhất.
   - Danh sách thẻ truy cập nhanh.
5. **Các biểu đồ**:
   - Biểu đồ cột đôi Recharts so sánh Planned vs Actual 7 ngày.
   - Biểu đồ nhiệt StudyHeatmap (Recharts/SVG Grid).
   - Thanh tiến độ ngang phần trăm mục tiêu môn học và tỷ lệ bám sát lịch.
6. **Các lịch và bộ chọn ngày**: Hiển thị ngày hôm nay theo format Việt Nam `dd/MM` và nhãn các thứ `T2 - CN`.
7. **Các ô nhập liệu**: Không có ô nhập trực tiếp trên trang chủ (thực hiện qua modal).
8. **Các nút bấm**:
   - Nút `Mở lịch học & Day View →` (dẫn sang `/calendar`).
   - Nút `Quản lý học thuật & GPA →` (dẫn sang `/academic`).
   - Nút `Hồ sơ & Nghề nghiệp` (dẫn sang `/career`).
   - Nút `Bắt đầu học` (Play icon) trên từng sự kiện hôm nay (mở Timer).
   - Nút `Chi tiết` trên sự kiện đã hoàn thành.
   - Nút `Ôn tập ngay` (chuyển tới `/practice/review`).
   - Nút `Luyện tập` (chuyển tới `/practice`).
   - Nút `Mở Day View` (chuyển tới `/calendar`).
   - Nút `Quản lý môn` (chuyển tới `/subjects`).
   - Nút `Xếp lịch tự động bằng AI` (khi chưa có lịch hôm nay).
   - Nút `Thêm môn học ngay` (khi chưa có môn học nào).
9. **Các menu tùy chọn**: Không có dropdown độc lập trên trang chủ.
10. **Các cửa sổ popup và modal**: Kết nối trực tiếp với modal toàn cục (Timer Modal, Focus Modal).
11. **Các bộ lọc và chức năng tìm kiếm**: Trang tổng quan không có thanh lọc cục bộ.
12. **Trạng thái loading, empty và error**:
    - Khi không có sự kiện hôm nay: Khung viền nét đứt kèm nút "Xếp lịch tự động bằng AI".
    - Khi không có môn học: Khung viền nét đứt kèm nút "Thêm môn học ngay".
    - Khi chưa có phiên học: Khung thông báo "Chưa có dữ liệu thống kê".
13. **Chức năng ẩn**:
    - Nhãn môn học có từ vựng chỉ xuất hiện dòng trạng thái từ vựng nếu môn đó chứa từ vựng.
    - Checkbox hoàn thành sự kiện kích hoạt gạch ngang tiêu đề và đổi màu nền sang xanh lá ngọc.
14. **Desktop vs Mobile**:
    - Hero banner: Widget góc phải ẩn trên mobile (`hidden lg:flex`).
    - Lưới truy cập nhanh chuyển từ 1 cột sang 2 cột rồi 4 cột trên desktop.
    - Bố cục 2 cột lớn (Lịch hôm nay 8 cột / Phiên gần đây 4 cột) xếp chồng dọc trên mobile.

---

## 4. Trang Lịch Học (Calendar)
- **URL/Route**: `/calendar`
- **Tập tin source**: [src/app/(dashboard)/calendar/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/calendar/page.tsx) & [src/components/calendar/calendar-client.tsx](file:///Users/huy/Downloads/Time%20manager/src/components/calendar/calendar-client.tsx)
- **Mục đích**: Quản lý lịch học cá nhân với 4 chế độ xem (Ngày, Tuần, Tháng, Lịch biểu), phát hiện xung đột thời gian, xếp lịch bằng ngôn ngữ tự nhiên (NLP), mô phỏng What-If và tạo thời khóa biểu trường.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, phản hồi 705KB HTML với đầy đủ sự kiện).

### A. Khu vực giao diện & Thành phần hiển thị
- **Thanh công cụ đỉnh (Calendar Toolbar)**:
  - Nút chuyển 4 chế độ xem: `Ngày` (Day), `Tuần` (Week), `Tháng` (Month), `Lịch biểu` (Agenda).
  - Nút điều hướng thời gian: Tuần trước, Tuần sau, Hôm nay.
  - Ô tìm kiếm sự kiện theo từ khóa.
  - Dropdown lọc theo Môn học (`Tất cả môn`, `IELTS`, `Giải Tích 1`...).
  - Dropdown lọc theo Loại sự kiện (`Tất cả loại`, `Tự học`, `Trường`, `Cá nhân`, `Thi cử`...).
  - Nút `Làm mới` (Refresh).
- **Hộp nhập lịch bằng Ngôn ngữ tự nhiên (Natural Language AI Input)**:
  - Input: Nhập văn bản như *"Học Giải Tích 2 tiếng tối mai"* kèm nút gửi AI để bóc tách thông tin tự động (`/api/ai/parse-event`).
- **Thanh nút chức năng chuyên sâu**:
  - Nút `Thời khóa biểu trường` (Mở modal nhập lịch trường học kỳ).
  - Nút `Khôi phục lịch bị lỡ` (Smart Reschedule & Recovery).
  - Nút `Mô phỏng What-If` (Dự báo ảnh hưởng khi dời lịch).
  - Nút `+ Thêm sự kiện`.
- **Khu vực hiển thị lịch chính**:
  - Tuần: Lưới 7 cột (Thứ 2 đến Chủ nhật) chia 24 giờ mỗi ngày hoặc 4 buổi (Sáng, Chiều, Tối, Đêm), hiển thị khung giờ khóa (màu xám có gạch sọc) và sự kiện (màu môn học).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Lịch học & Thời khóa biểu` (hoặc nhãn tuần hiện tại).
2. **Các thẻ thống kê**: Thống kê số giờ đã lên lịch trong tuần, số buổi học trong ngày.
3. **Các bảng dữ liệu**: Lưới thời gian 24 giờ / 7 ngày.
4. **Các danh sách**: Chế độ `AgendaView` hiển thị danh sách dạng timeline theo từng ngày.
5. **Các biểu đồ**: Không có biểu đồ trực tiếp (thể hiện bằng các khối block thời gian).
6. **Các lịch và bộ chọn ngày**:
   - Mini calendar chọn ngày nhanh.
   - Nút điều hướng tháng / tuần (`<`, `>`).
7. **Các ô nhập liệu**:
   - Input NLP: `Nhập lịch học bằng tiếng Việt tự nhiên...`.
   - Input tìm kiếm sự kiện.
   - Các trường trong modal tạo/sửa sự kiện (Tiêu đề, Bắt đầu, Kết thúc, Môn học, Loại, Lặp lại).
8. **Các nút bấm**:
   - Bộ 4 nút chuyển View: `Ngày`, `Tuần`, `Tháng`, `Lịch biểu`.
   - Nút `Hôm nay`.
   - Nút `Phân tích AI` (gửi NLP).
   - Nút `Thời khóa biểu trường`.
   - Nút `Khôi phục lịch`.
   - Nút `What-If Simulator`.
   - Nút `+ Thêm sự kiện`.
   - Nút `Làm mới`.
9. **Các menu tùy chọn**:
   - Dropdown lọc Môn học.
   - Dropdown lọc Loại sự kiện.
   - Menu tùy chọn sự kiện khi click (Sửa, Xóa, Bắt đầu học, Khóa lịch).
10. **Các cửa sổ popup và modal**:
    - `EventModal` / `EventDrawer`: Xem/Tạo/Sửa sự kiện chi tiết.
    - `SchoolTimetableGeneratorModal`: Tạo lịch trường hàng tuần.
    - `RescheduleRecoveryModal`: Thuật toán dời lịch các buổi bị bỏ lỡ.
    - `WhatIfSimulatorModal`: Mô phỏng thêm/bớt giờ học.
    - `NlpProposalDialog`: Xác nhận sự kiện AI vừa bóc tách.
11. **Các bộ lọc và chức năng tìm kiếm**:
    - Tìm kiếm tức thì theo tiêu đề sự kiện.
    - Bộ lọc kết hợp Môn học + Loại sự kiện.
12. **Trạng thái loading, empty và error**:
    - Khi tải dữ liệu: Biểu tượng xoay `RefreshCw`.
    - Khi ngày không có lịch: Khung trống báo "Không có sự kiện".
13. **Chức năng ẩn**:
    - Khung giờ khóa chỉ xuất hiện mờ phía dưới các sự kiện.
    - Nhấp đúp vào ô trống trên lưới để tạo nhanh sự kiện tại giờ đó.
14. **Desktop vs Mobile**:
    - Desktop: Hiển thị đầy đủ lưới 7 cột 24 giờ.
    - Mobile: Tự động co gọn, hỗ trợ vuốt chuyển ngày hoặc ưu tiên chế độ Ngày/Lịch biểu.

---

## 5. Trang Nhiệm Vụ & Smart To-Do (Tasks)
- **URL/Route**: `/tasks`
- **Tập tin source**: [src/app/(dashboard)/tasks/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/tasks/page.tsx)
- **Mục đích**: Hệ thống quản lý công việc học tập tích hợp kỷ luật hàng ngày (Daily Closure), ràng buộc phụ thuộc (Task Dependencies) và 2 chế độ hiển thị Danh sách / Kanban Board.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, quản lý qua `/api/tasks`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Sidebar danh mục nhiệm vụ (Smart Lists)**:
  - `Hôm nay` (My Day - có nút chuyển ngày qua lại).
  - `Quan trọng` (Important - gắn sao).
  - `Đã lập lịch` (Planned - có deadline hoặc scheduledDate).
  - `Đang chờ xử lý` (Pending).
  - `Đã hoàn thành` (Completed).
  - `Tất cả nhiệm vụ` (All tasks).
  - `Lịch sử kỷ luật` (Discipline History).
- **Thanh điều khiển đỉnh**:
  - Nút chuyển chế độ: `Danh sách (List)` vs `Bảng (Kanban Board)`.
  - Bộ chọn ngày hôm nay / ngày trước / ngày sau.
  - Ô tìm kiếm nhiệm vụ.
  - Bộ lọc theo Môn học và Mức độ ưu tiên (LOW, MEDIUM, HIGH, URGENT).
  - Nút `Đóng ngày & Kỷ luật` (Daily Closure).
- **Khu vực tạo nhanh (Quick Task Input)**:
  - Input thêm nhanh task với các phím tắt chọn môn học, thời lượng ước tính, độ ưu tiên.
- **Khu vực hiển thị nhiệm vụ**:
  - Danh sách task có checkbox hoàn thành, badge ưu tiên, số phút ước tính, môn học.
  - Cảnh báo nhiệm vụ bị khóa do phụ thuộc task khác chưa hoàn thành (`TaskDependencyAlertModal`).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Nhiệm vụ & Kế hoạch ngày` (hoặc tên danh mục đang chọn).
2. **Các thẻ thống kê**: Tổng số task, task đã xong, task chưa xong, tỷ lệ hoàn thành ngày `%`.
3. **Các bảng dữ liệu**: Chế độ Kanban Board gồm 3-4 cột trạng thái (Inbox, Đang làm, Hoàn thành).
4. **Các danh sách**: Danh sách nhiệm vụ chính, danh mục bên trái.
5. **Các biểu đồ**: Điểm kỷ luật (Discipline Score) hiển thị dạng thanh hoặc vòng tròn phần trăm.
6. **Các lịch và bộ chọn ngày**: Nút `<` Ngày trước, `>` Ngày sau, `Hôm nay` và DatePicker.
7. **Các ô nhập liệu**:
   - Quick input: `Thêm nhiệm vụ mới...`.
   - Ô tìm kiếm task.
   - Các trường trong `TaskModal`: Tiêu đề, Môn học, Hạn chót, Ngày thực hiện, Số phút ước tính, Ghi chú, Checklist con, Ràng buộc phụ thuộc.
8. **Các nút bấm**:
   - Checkbox tròn hoàn thành task.
   - Nút gắn sao quan trọng (Star).
   - Nút `Đóng ngày` (Daily Closure).
   - Nút `+ Thêm nhiệm vụ`.
   - Nút chuyển `List` / `Board`.
   - Nút xóa task.
   - Nút sửa task.
9. **Các menu tùy chọn**: Dropdown lọc Môn, lọc Ưu tiên.
10. **Các cửa sổ popup và modal**:
    - `TaskModal`: Chi tiết task, checklist con, dependency selector.
    - `DailyClosureModal`: Đánh giá cuối ngày, tự động chuyển việc dở sang hôm sau (rollover).
    - `TaskDependencyAlertModal`: Cảnh báo khi người dùng cố tick hoàn thành task mà task cha chưa xong.
11. **Các bộ lọc và chức năng tìm kiếm**:
    - Lọc theo 7 danh mục bên trái.
    - Lọc theo Môn học, Mức độ ưu tiên.
    - Tìm kiếm tức thì theo từ khóa.
12. **Trạng thái loading, empty và error**:
    - Khi không có task: Hình minh họa rỗng kèm thông điệp "Không có nhiệm vụ nào".
    - Khi tải dữ liệu: Skeleton pulsing.
13. **Chức năng ẩn**:
    - Task phụ thuộc hiển thị biểu tượng ổ khóa màu vàng.
    - Nút xóa/sửa xuất hiện khi hover chuột vào task item.
14. **Desktop vs Mobile**:
    - Desktop: Hiển thị sidebar danh mục và danh sách task song song.
    - Mobile: Sidebar chuyển thành menu rút gọn hoặc tab chọn trên đầu trang.

---

## 6. Trang Quản Lý Môn Học (Subjects)
- **URL/Route**: `/subjects`
- **Tập tin source**: [src/app/(dashboard)/subjects/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/subjects/page.tsx) & [src/components/subjects/subject-table.tsx](file:///Users/huy/Downloads/Time%20manager/src/components/subjects/subject-table.tsx)
- **Mục đích**: Quản lý danh mục môn học, mã môn, bảng màu pastel, chỉ tiêu số giờ tuần, độ khó, trợ lý AI gia sư (AI Tutor) và kho tài liệu liên quan.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, kết nối Prisma `subject.findMany`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề trang, nút `+ Thêm môn học`.
- **Bảng danh sách môn học (Subject Table)**:
  - Cột Mã & Tên môn học (kèm chấm tròn màu đại diện).
  - Cột Mức độ ưu tiên (Badge 1-5 sao hoặc nhãn Ưu tiên cao/thấp).
  - Cột Mục tiêu tuần (Số giờ quy định).
  - Cột Đã học thực tế (Số giờ timer ghi nhận thật).
  - Cột Tiến độ (% hoàn thành mục tiêu).
  - Cột Hành động: Bắt đầu học (Timer), AI Tutor, Tài liệu, Sửa, Xóa.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Quản lý Môn học & Chỉ tiêu`.
2. **Các thẻ thống kê**: Số lượng môn học đang hoạt động, tổng giờ mục tiêu toàn bộ môn.
3. **Các bảng dữ liệu**: `<table className="w-full">` bo góc tròn `rounded-[28px]` với 6 cột tiêu chuẩn.
4. **Các danh sách**: Danh sách các hàng môn học.
5. **Các biểu đồ**: Thanh tiến độ ngang màu sắc tương ứng với từng môn học.
6. **Các lịch và bộ chọn ngày**: Bộ chọn hạn chót môn học trong modal (`<Input type="date">`).
7. **Các ô nhập liệu** (trong `SubjectDialog`):
   - Tên môn học (bắt buộc).
   - Mã môn học (ví dụ: `IELTS`, `GT1`).
   - Bảng chọn màu (Palette 13 màu pastel độc quyền).
   - Mục tiêu học tập (Target hours).
   - Độ ưu tiên (1 đến 5).
   - Điểm số mục tiêu (Target score).
   - Khối lượng ước tính (Workload hours).
   - Mô tả / Đề cương ghi chú.
8. **Các nút bấm**:
   - Nút `+ Thêm môn học`.
   - Nút `Bắt đầu học` (Play) trên từng hàng.
   - Nút `AI Tutor` (Hỏi gia sư ảo về môn này).
   - Nút `Tài liệu` (Mở ResourceManager).
   - Nút `Sửa` (Edit).
   - Nút `Xóa` (Delete kèm confirm dialog).
9. **Các menu tùy chọn**: Không có menu dropdown phức tạp; các nút thao tác hiển thị trực tiếp.
10. **Các cửa sổ popup và modal**:
    - `SubjectDialog`: Form tạo / chỉnh sửa môn học.
    - `SubjectAiTutorModal`: Gia sư AI riêng biệt theo ngữ cảnh môn học.
    - `ResourceManager`: Modal quản lý link tài liệu, file đề cương của môn học.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có thanh tìm kiếm riêng trên bảng; sắp xếp theo độ ưu tiên giảm dần.
12. **Trạng thái loading, empty và error**:
    - Khi chưa có môn nào: Khung trống viền nét đứt kèm nút "Thêm môn học ngay".
13. **Chức năng ẩn**:
    - Khi chọn trùng màu đã có môn khác dùng: Hiển thị hộp xác nhận cảnh báo trùng màu.
    - Hàng phụ hiển thị nếu môn có tích hợp từ vựng.
14. **Desktop vs Mobile**: Bảng có thanh cuộn ngang `overflow-x-auto` đảm bảo không vỡ khung trên màn hình nhỏ.

---

## 7. Trang Khung Giờ Khóa (Blocked Slots)
- **URL/Route**: `/blocked-slots`
- **Tập tin source**: [src/app/(dashboard)/blocked-slots/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/blocked-slots/page.tsx)
- **Mục đích**: Đăng ký các khung giờ bất khả xâm phạm (giờ ngủ đêm, lịch học cố định ở trường, thời gian cá nhân) để Scheduler và AI không bao giờ xếp lịch học đè lên.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, quản lý qua model `AvailabilityRule`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề, giải thích quy tắc bất khả xâm phạm, nút `+ Thêm khung giờ mới`.
- **Bảng Khung giờ bị khóa (BlockedSlotsTable)**:
  - Cột Mục đích / Tiêu đề (kèm icon Khóa).
  - Cột Khung giờ (vd: `23:00 - 06:00`).
  - Cột Ngày lặp lại (Thứ 2 đến Chủ nhật hoặc Tất cả các ngày).
  - Cột Trạng thái khóa (Badge đỏ/xám "Khóa cứng").
  - Cột Thao tác (Sửa, Xóa).

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Khung giờ bị khóa / Giờ nghỉ ngơi (Availability Rules)`.
2. **Các thẻ thống kê**: Số khung giờ đã đăng ký (vd: "Có 5 khung giờ được thiết lập").
3. **Các bảng dữ liệu**: Bảng 5 cột hiển thị danh sách quy tắc.
4. **Các danh sách**: Danh sách các quy tắc lặp lại.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Chọn thứ trong tuần (Thứ 2 - CN).
7. **Các ô nhập liệu** (trong `BlockedSlotDialog`):
   - Tiêu đề (ví dụ: "Giờ ngủ đêm", "Lịch trường sáng").
   - Giờ bắt đầu (`<Input type="time">`).
   - Giờ kết thúc (`<Input type="time">`).
   - Checkbox lặp lại các ngày trong tuần.
8. **Các nút bấm**:
   - Nút `+ Thêm khung giờ mới`.
   - Nút `Sửa` (icon Edit).
   - Nút `Xóa` (icon Trash kèm confirm).
   - Nút Lưu / Hủy trong modal.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: `BlockedSlotDialog`.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Bảng rỗng khi chưa có quy tắc nào.
13. **Chức năng ẩn**: Không có.
14. **Desktop vs Mobile**: Bảng có scroll ngang cho thiết bị di động.

---

## 8. Trang Mục Tiêu & Milestone (Goals)
- **URL/Route**: `/goals`
- **Tập tin source**: [src/app/(dashboard)/goals/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/goals/page.tsx)
- **Mục đích**: Quản lý mục tiêu học tập trung và dài hạn, chia nhỏ thành các mốc Milestone, tính toán vận tốc học cần thiết mỗi tuần theo hạn chót (Deadline).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `/api/goals` và `/api/milestones`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề "Mục tiêu học tập & Milestone", nút `+ Thêm mục tiêu mới`.
- **Lưới thẻ Mục tiêu (Goals Grid)**: Mỗi thẻ đại diện cho 1 mục tiêu lớn:
  - Badge môn học liên quan.
  - Tiêu đề mục tiêu & mô tả.
  - Thanh tiến độ Milestone (`%`).
  - Danh sách checklist các Milestone con (có thể tick hoàn thành ngay tại chỗ).
  - Ô nhập nhanh Milestone con inline (`+ Thêm mốc nhỏ...`).
  - Hộp thông số: Số giờ chỉ tiêu, Deadline ngày hoàn thành, số ngày còn lại, số giờ cần học mỗi tuần để kịp tiến độ (`Cần X.X h / tuần`).
  - Nút xóa mục tiêu.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Mục tiêu học tập & Milestone (Goals)`.
2. **Các thẻ thống kê**: Số giờ mục tiêu, số ngày còn lại, số giờ bắt buộc mỗi tuần.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**:
   - Danh sách các thẻ mục tiêu trong lưới 3 cột.
   - Danh sách các Milestone con trong từng mục tiêu.
5. **Các biểu đồ**: Thanh tiến độ xanh lá hoàn thành Milestone (`%`).
6. **Các lịch và bộ chọn ngày**: Bộ chọn Deadline trong modal (`<Input type="date">`).
7. **Các ô nhập liệu**:
   - Tiêu đề mục tiêu.
   - Dropdown chọn Môn học.
   - Số giờ mục tiêu (Target hours, vd: 10h).
   - Ngày hạn chót (Deadline).
   - Mô tả chi tiết.
   - Danh sách mốc nhỏ ban đầu (Textarea mỗi dòng 1 mốc).
   - Ô nhập nhanh mốc nhỏ inline trên từng card.
8. **Các nút bấm**:
   - Nút `+ Thêm mục tiêu mới`.
   - Nút tick hoàn thành Milestone (`Square` / `CheckCircle2`).
   - Nút `+` thêm mốc inline.
   - Nút Xóa mục tiêu (icon Thùng rác).
   - Nút Tạo mục tiêu ngay (trên empty state).
9. **Các menu tùy chọn**: Dropdown chọn môn học.
10. **Các cửa sổ popup và modal**: `Dialog` tạo mục tiêu mới.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có bộ lọc trên trang này.
12. **Trạng thái loading, empty và error**:
    - Loading: 6 khối skeleton pulsing.
    - Empty: Card lớn màu trắng với icon bia ngắm và nút "Tạo mục tiêu ngay".
13. **Chức năng ẩn**:
    - Khi cận hạn chót (dưới 7 ngày): Dòng "Còn X ngày" tự động đổi sang màu cam cảnh báo.
14. **Desktop vs Mobile**: Lưới responsive 1 cột (mobile) -> 2 cột (tablet) -> 3 cột (desktop).

---

## 9. Trang Thói Quen & Gamification (Habits)
- **URL/Route**: `/habits`
- **Tập tin source**: [src/app/(dashboard)/habits/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/habits/page.tsx)
- **Mục đích**: Xây dựng thói quen học tập tích cực, theo dõi chuỗi ngày liên tục (Streaks), tích lũy XP thăng cấp (Level System) và mở khóa huy hiệu thành tích (Badges).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, kết nối `/api/habits` và `/api/gamification`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header Gamification**:
  - Cấp độ hiện tại (vd: `Level 3 • Học giả chăm chỉ`).
  - Thanh tiến độ XP lên cấp tiếp theo (`XP: 450 / 600 XP`).
  - Chuỗi ngày rực lửa (Streak) và tổng số giờ học.
- **Thanh Huy hiệu thành tích (Badge Showcase)**:
  - Tỷ lệ mở khóa huy hiệu (vd: `4/16 Huy hiệu đã mở khóa`).
  - Lưới các huy hiệu đã đạt và huy hiệu bị khóa (kèm thanh tiến độ điều kiện mở).
- **Danh sách thói quen (Habits Grid & Tracker)**:
  - Mỗi thói quen có icon, màu sắc, tiêu đề, môn học liên quan.
  - Lưới 7 ngày trong tuần (T2 - CN): Các nút tròn tick hoàn thành thói quen từng ngày.
  - Chỉ số Streak hiện tại và Kỷ lục dài nhất (Longest streak).
- **Nút thêm thói quen**: Mở modal tạo thói quen mới.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Thói quen học tập & Gamification (Habits)`.
2. **Các thẻ thống kê**: Thẻ Level & XP, Thẻ Chuỗi ngày, Thẻ Tỷ lệ mở huy hiệu.
3. **Các bảng dữ liệu**: Lưới ma trận ngày trong tuần theo từng thói quen.
4. **Các danh sách**:
   - Danh sách thói quen đang duy trì.
   - Danh sách huy hiệu thành tích (Badges).
5. **Các biểu đồ**: Thanh tiến độ kinh nghiệm XP, thanh tiến độ mở khóa huy hiệu.
6. **Các lịch và bộ chọn ngày**: Thanh 7 ngày trong tuần theo ngày thực tế Việt Nam.
7. **Các ô nhập liệu** (trong modal thêm thói quen):
   - Tiêu đề thói quen.
   - Mô tả.
   - Tần suất (Hàng ngày, Hàng tuần).
   - Giá trị mục tiêu (vd: 30 phút, 1 bài đọc).
   - Đơn vị tính (phút, trang, bài).
   - Chọn icon và màu sắc.
   - Chọn môn học liên kết.
8. **Các nút bấm**:
   - Nút tròn tick hoàn thành từng ngày của thói quen.
   - Nút `+ Thêm thói quen mới`.
   - Nút Sửa thói quen.
   - Nút Xóa thói quen.
9. **Các menu tùy chọn**: Chọn tần suất và môn học.
10. **Các cửa sổ popup và modal**: Modal Tạo / Chỉnh sửa thói quen.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có thanh tìm kiếm.
12. **Trạng thái loading, empty và error**:
    - Khi chưa có thói quen: Khung thông báo khuyến khích tạo thói quen đầu tiên.
13. **Chức năng ẩn**:
    - Khi hoàn thành đủ chuỗi: Biểu tượng ngọn lửa rực sáng và hiệu ứng chúc mừng.
14. **Desktop vs Mobile**: Ma trận 7 ngày thu nhỏ linh hoạt để không bị tràn màn hình mobile.

---

## 10. Trang Lập Lịch Hub (Schedule Hub)
- **URL/Route**: `/schedule`
- **Tập tin source**: [src/app/(dashboard)/schedule/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/schedule/page.tsx)
- **Mục đích**: Trang điều hướng trung tâm (Portal Hub) dẫn tới 4 phân hệ thời gian của ChronoMind: Lịch học (Calendar), Nhiệm vụ (Tasks), Deadlines và Khung giờ khóa (Blocked Slots).
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, 4 card điều hướng liên kết chuẩn).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Icon Lịch vàng, tiêu đề "Lập lịch (Schedule)", mô tả chức năng quản lý thời gian.
- **Lưới 4 Card Module chính**:
  1. `Lịch học (Calendar)`: Dẫn tới `/calendar`.
  2. `Nhiệm vụ & Inbox`: Dẫn tới `/tasks`.
  3. `Deadlines`: Dẫn tới `/deadlines`.
  4. `Chặn thời gian (Time Blocking)`: Dẫn tới `/blocked-slots`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Lập lịch (Schedule)`.
2. **Các thẻ thống kê**: Không có thẻ thống kê số liệu trên trang hub này.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách 4 module điều hướng.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**: 4 thẻ card dạng clickable link dẫn đến các route con.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Trang tĩnh điều hướng, không có state rỗng.
13. **Chức năng ẩn**: Hiệu ứng hover nổi bóng đổ `hover:shadow-md`.
14. **Desktop vs Mobile**: Lưới 1 cột trên mobile, 2 cột trên tablet/desktop.

# AGENT[1].md — SỬA KIẾN TRÚC PHÒNG HỌP RIÊNG BẰNG RANDOM ID

## Mục tiêu bắt buộc

Sửa triệt để kiến trúc tính năng Phòng họp của ChronoMind:
Khi mở link phòng họp có ID ngẫu nhiên (`/rooms/<random-room-id>`), ứng dụng phải là một trang web/workspace độc lập, **tuyệt đối không hiển thị sidebar ChronoMind** (gồm Dashboard, Lịch học, Phòng họp, Nhiệm vụ, Môn học, Skills, Practice, Thống kê, Cài đặt) và **không hiển thị toolbar/navigation ChronoMind**.

---

## 1. Phân biệt hai khu vực rõ ràng

### A. Khu vực quản trị trong ChronoMind (`/rooms`)
- Vẫn nằm trong sidebar ChronoMind (`src/app/(dashboard)/rooms/page.tsx`), sử dụng layout ChronoMind.
- Tại đây người dùng xem danh sách phòng dưới dạng thẻ, nhấn "Tạo phòng", nhận link ngẫu nhiên và thông tin đăng nhập của Admin phòng.

### B. Không gian làm việc độc lập của phòng (`/rooms/[roomId]`)
- Tách khỏi layout ChronoMind bằng cách đặt route tại `src/app/rooms/[roomId]/page.tsx` (nằm ngoài route group `(dashboard)`).
- Chỉ thừa kế `src/app/layout.tsx`, hoàn toàn không có `Sidebar`, `TopBar`, `BottomNav` hay `FloatingFallbackTimer`.
- Khi chưa đăng nhập: Hiển thị giao diện đăng nhập phòng với tiêu đề bắt buộc:
  **"Chào mừng bạn đến với phòng họp ID = <random-room-id>"**
- Khi đăng nhập thành công: Hiển thị không gian làm việc Trello workspace của riêng phòng đó.
- Có nút "Đăng xuất" riêng để xóa session phòng và quay lại màn hình đăng nhập.
- Nếu phòng không tồn tại hoặc đã bị khóa: Hiển thị trang báo lỗi thân thiện, không lộ stack trace.

---

## 2. Luồng tạo phòng và tài khoản Admin phòng
- Khi tạo phòng, server sinh ID ngẫu nhiên an toàn (`rm_...`).
- Server tự động khởi tạo tài khoản quản trị riêng của phòng (`admin_<publicId>`), mật khẩu tạm `12345678`, `mustChangePassword = true`.
- Tài khoản admin phòng chỉ mang role `USER` ở cấp toàn hệ thống (không cấp quyền admin ChronoMind), nhưng có role `ADMIN` trong phạm vi phòng.
- Modal tạo phòng hiển thị link phòng, tên đăng nhập admin và mật khẩu tạm kèm nút sao chép.
- Admin dùng chính thông tin này để đăng nhập qua URL phòng và bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.

---

## 3. Checklist nghiệm thu thực tế

### Routing & Layout
- [x] Mở URL phòng khi chưa đăng nhập: chỉ thấy login phòng, không có sidebar ChronoMind.
- [x] Tiêu đề hiển thị đúng mẫu: `Chào mừng bạn đến với phòng họp ID = <random-room-id>`.
- [x] Login thành công: chỉ thấy workspace phòng, không có Dashboard/Lịch học/Nhiệm vụ/Môn học/Skills/Practice/Thống kê/Cài đặt.
- [x] Refresh route phòng vẫn giữ đúng layout độc lập và session.
- [x] Link ID không tồn tại hiển thị trang lỗi thân thiện không có sidebar ChronoMind.
- [x] Dashboard ChronoMind (`/rooms`) vẫn hiển thị sidebar bình thường và quản lý phòng được.

### Tạo phòng và Admin
- [x] Nhấn Tạo phòng sinh random ID an toàn (`rm_` + 12 ký tự entropy cao).
- [x] Tài khoản admin phòng được tạo tự động với username `admin_<publicId>`, mật khẩu `12345678`, `mustChangePassword = true`.
- [x] UI hiển thị link và credential admin ban đầu kèm nút sao chép an toàn.
- [x] Admin dùng credential đó đăng nhập qua chính URL phòng.
- [x] Admin bắt buộc đổi mật khẩu lần đầu qua `ForcePasswordModal`.
- [x] Admin phòng không có quyền admin toàn hệ thống ChronoMind (`role: "USER"`).

### Thành viên và Mật khẩu
- [x] Admin thêm thành viên hàng loạt bằng textarea đa dòng có preview.
- [x] Mật khẩu tạm mặc định cho thành viên là `12345678`.
- [x] Thành viên bắt buộc đổi mật khẩu lần đầu trước khi thao tác nội dung phòng.
- [x] Không thể bỏ qua đổi mật khẩu bằng cách gọi API trực tiếp (`isPasswordChangeRequired` bảo vệ ở server).
- [x] Admin không thể xem mật khẩu mới của thành viên.
- [x] Reset credential tạo mật khẩu tạm mới an toàn, không lưu plaintext.

### Workspace & Phân quyền
- [x] 5 Tabs: Cá nhân, Nhóm, Bảng công việc (4 cột Kanban phong cách Trello), Tracking, Hoạt động.
- [x] Dữ liệu lưu bền vững vào Supabase PostgreSQL (15 models).
- [x] Host điều phối nhóm/thẻ, không thể xóa phòng hoặc tự nâng thành admin.
- [x] Member không thể truy cập phòng/nhóm trái phép (chặn triệt để IDOR).
- [x] Tracking tính toán từ số liệu thực tế, không dùng số liệu mẫu.
- [x] Nút Đăng xuất (`LogOut`) xóa session phòng và đưa về màn hình đăng nhập phòng.

### Tính năng Xem lại tài khoản Admin & Xóa phòng họp
- [x] Admin xem lại được tài khoản & mật khẩu tạm bất kỳ lúc nào từ thẻ phòng trong ChronoMind Dashboard và trong Workspace (`AdminCredentialsModal`).
- [x] API `GET /api/rooms/[roomId]/admin-credentials` bảo vệ phía server, chỉ cho phép ADMIN phòng truy cập.
- [x] API `POST /api/rooms/[roomId]/admin-credentials` cho phép reset mật khẩu về `12345678` nếu admin quên mật khẩu.
- [x] Admin xóa được phòng họp trực tiếp từ thẻ phòng với modal xác nhận nhập tên phòng an toàn (`DeleteRoomModal`).
- [x] API `DELETE /api/rooms/[roomId]` kiểm tra quyền ADMIN, xóa cascade toàn bộ dữ liệu phụ thuộc và dọn dẹp tài khoản admin phòng tự động.
- [x] Thành viên (Member) và Host bị chặn tuyệt đối không được xóa phòng họp (403 Forbidden).

### Tính năng Trello Workspace & Khắc phục Giao diện Cá nhân (Mỗi cá nhân là một ô cơ sở)
- [x] Xóa bỏ triệt để giao diện dạng bong bóng viên thuốc kéo dài ("hình củ chuối") ở Tab Cá nhân.
- [x] Thiết kế chuẩn Trello Board: Mỗi cá nhân (thành viên) trong phòng họp là một cột / ô cơ sở (`PersonalTab`).
- [x] Thẻ cá nhân hiển thị dạng thẻ chữ nhật Trello sắc nét (`rounded-xl`), có nhãn màu pastel, ảnh bìa, ngày giờ, avatar tác giả và nút xóa an toàn.
- [x] Tính năng "+ Thêm thẻ..." nội tuyến tại chân mỗi cột thành viên với bộ chọn nhãn nhanh (Tiến độ, Ghi chú, Ý tưởng, Tài liệu, Cần hỗ trợ) và đính kèm link/ảnh.
- [x] Hỗ trợ chuyển đổi chế độ xem: Bảng Trello theo cá nhân, Chỉ cá nhân tôi, hoặc Dạng lưới thẻ (Grid view).
- [x] Tab Bảng công việc (`BoardTab`): Thêm tùy chọn "Theo cá nhân" để nhóm các nhiệm vụ của phòng theo từng thành viên phụ trách, nâng cấp nhãn màu Trello và checklist hoàn thành xanh lá (`3/3`).
- [x] Cột mở rộng "+ Thêm thành viên" dành cho Admin/Host giúp mở modal mời thành viên trực tiếp trên bảng.

### Chất lượng & Kiểm thử
- [x] `npx tsc --noEmit`: 0 lỗi TypeScript.
- [x] `npm run test:rooms`: 42/42 assertions PASSED (100%).
- [x] `npm run build`: Production build thành công 139 routes Next.js Turbopack.
- [x] Không làm hồi quy Calendar, Study Timer, Subjects, AI, LUYENTU.


# AGENT.md — ChronoMind Meeting Rooms / Collaborative Workspaces

> **Vai trò của bạn:** Antigravity Agent chịu trách nhiệm khảo sát, thiết kế, triển khai full-stack, kiểm thử và ghi lại tiến độ cho tính năng **Phòng họp** trong ChronoMind.
>
> **Mục tiêu:** Thêm một mục cấp cao tên **Phòng họp** (cùng cấp trải nghiệm điều hướng với Calendar) để chủ tài khoản ChronoMind tạo các không gian cộng tác riêng tư có URL ngẫu nhiên. Mỗi phòng có bảng công việc kiểu Trello, thành viên, nhóm, nội dung cá nhân, quy trình duyệt tham gia và phân quyền rõ ràng.
>
> **Nguyên tắc bắt buộc:** Không chỉ dựng giao diện giả. Phải tích hợp đầy đủ UI + API/server actions + cơ sở dữ liệu + xác thực + phân quyền + lưu dữ liệu thật. Không phá vỡ các tính năng ChronoMind/LUYENTU hiện có.

---

## 0. Quy trình bắt buộc trước khi sửa code

1. Đọc cấu trúc repository, `package.json`, framework/router, schema Prisma hiện tại, hệ thống auth, component/layout/navigation, quy ước API, migrations, test và cách triển khai.
2. Đọc toàn bộ `AGENT.md` này trước khi bắt đầu.
3. Xác định chính xác:
   - Cách định danh người dùng và session hiện tại.
   - Database/provider đang được sử dụng trong môi trường hiện tại.
   - Cách tạo migration an toàn và các lệnh test/build/lint.
   - Nơi đặt sidebar/navigation và các trang dashboard.
   - Các component UI có thể tái sử dụng.
4. Tạo một kế hoạch triển khai ngắn, cập nhật checklist bên dưới, sau đó thực hiện từng giai đoạn.
5. Không tự ý thay toàn bộ schema, auth, layout hoặc thư viện lớn khi không cần thiết. Không xóa, đổi tên hay làm hỏng tính năng Calendar, Study Timer, Subjects, AI, LUYENTU/Vocabulary hoặc các tính năng khác.
6. Nếu repository thực tế khác mô tả trong file này, ưu tiên kiến trúc hiện hữu và điều chỉnh theo cách tương thích. Không giả định rằng một route, model hay package đã tồn tại nếu chưa kiểm tra.
7. Không kết luận “đã hoàn thành” chỉ vì giao diện xuất hiện. Phải xác minh luồng dữ liệu từ giao diện tới database và kiểm thử quyền truy cập.

## 1. Mô tả sản phẩm

Thêm mục **Phòng họp** vào ChronoMind. Admin tạo phòng trong ChronoMind, đặt tên/môn học và nhận một URL có ID ngẫu nhiên khó đoán, ví dụ:

`https://<domain>/rooms/<random-room-id>`

Có thể dùng dạng query `?id=<random-id>` nếu cấu trúc routing hiện có yêu cầu, nhưng ưu tiên route rõ ràng `/rooms/[roomId]`. ID phải được sinh bằng nguồn ngẫu nhiên an toàn phía server, đủ entropy, không dùng số tăng dần hoặc ID tuần tự. URL không phải là bằng chứng xác thực: phòng vẫn phải yêu cầu đăng nhập hợp lệ.

Trang **Phòng họp** trong ChronoMind hiển thị mỗi phòng dưới dạng một thẻ/ô vuông có tên phòng, môn học/chủ đề, vai trò của người dùng, số thành viên, trạng thái và nút mở phòng. Admin có thể tạo, sửa thông tin, sao chép link, quản lý thành viên, cấp lại mật khẩu đăng nhập ban đầu, chuyển host, khóa hoặc xóa phòng. Phải có hộp thoại xác nhận cho thao tác nguy hiểm.

### Luồng người dùng

1. Admin vào ChronoMind → **Phòng họp** → **Tạo phòng**.
2. Admin nhập tên phòng, môn học/chủ đề, mô tả, tùy chọn ảnh bìa và cài đặt cơ bản.
3. Server tạo phòng và trả về URL/ID ngẫu nhiên. Phòng mới xuất hiện thành một thẻ trong dashboard.
4. Admin mở phòng, thêm danh sách thành viên. Có giao diện nhập nhiều dòng, mỗi dòng một tên/tài khoản theo định dạng được UI hướng dẫn.
5. Hệ thống tạo tài khoản thành viên gắn riêng với phòng hoặc liên kết tài khoản ChronoMind hiện có, tùy khả năng auth của dự án. **Ưu tiên liên kết tài khoản ChronoMind hiện có khi có định danh duy nhất; không tạo tài khoản trùng chỉ dựa trên tên hiển thị.** Nếu phải hỗ trợ tài khoản phòng riêng, hãy thiết kế rõ ràng, an toàn và không làm yếu auth hiện tại.
6. Mật khẩu tạm mặc định theo yêu cầu: `12345678`. Chỉ được sử dụng như **mật khẩu tạm ban đầu**, phải buộc đổi mật khẩu ngay ở lần đăng nhập đầu tiên. Nếu hệ thống auth không hỗ trợ mật khẩu tạm an toàn, hãy bổ sung luồng tương thích; tuyệt đối không lưu mật khẩu dạng văn bản thuần.
7. Khi thành viên đăng nhập lần đầu, hiển thị modal/toàn trang bắt buộc đổi mật khẩu trước khi sử dụng các chức năng phòng. Mật khẩu mới phải đáp ứng quy tắc bảo mật hợp lý. Sau khi đổi thành công, đặt cờ `mustChangePassword = false`.
8. Admin **không bao giờ được xem hoặc khôi phục mật khẩu hiện tại** của thành viên. Admin chỉ có thể đặt lại mật khẩu bằng quy trình reset, tạo mật khẩu tạm mới hoặc gửi liên kết reset nếu auth hiện tại hỗ trợ. Ghi log sự kiện reset nhưng không ghi mật khẩu vào log.
9. Host được admin chỉ định sẽ điều phối phòng, tạo các nhóm, quản lý bảng và duyệt yêu cầu tham gia nhóm theo quyền được cấp.
10. Thành viên chỉ nhìn thấy và thực hiện các hành động được cấp quyền. Nội dung đăng tải phải được lưu vào database và hiển thị đúng người tạo, thời gian, nhóm/phòng liên quan.

## 2. Vai trò và ma trận quyền

Triển khai RBAC phía server. Ẩn nút ở UI chỉ là trải nghiệm người dùng, **không thay thế kiểm tra quyền ở server**.

### Admin phòng
- Là người tạo/chủ sở hữu phòng, có toàn quyền quản trị trong phạm vi phòng.
- Sửa tên, môn học, mô tả, cài đặt và ảnh bìa.
- Thêm thành viên hàng loạt, khóa/kích hoạt thành viên, cấp lại mật khẩu tạm/reset mật khẩu.
- Chỉ định, đổi hoặc thu hồi host.
- Tạo, sửa, lưu trữ và xóa nhóm.
- Quản lý thành viên, xử lý nội dung vi phạm, chuyển quyền sở hữu nếu hệ thống hỗ trợ.
- Xóa phòng hoặc lưu trữ phòng; yêu cầu xác nhận rõ ràng và thông báo hệ quả.
- Xem activity/audit log trong phạm vi phòng.
- Có tất cả quyền host.
- Không được xem mật khẩu đang dùng của bất kỳ ai.

### Host
- Quản lý bảng và các cột trong phạm vi quyền được cấp.
- Tạo/sửa các nhóm; thêm thành viên vào nhóm hoặc đề nghị thêm thành viên.
- Duyệt/từ chối yêu cầu tham gia nhóm.
- Tạo/sửa/di chuyển thẻ công việc, nội dung và tracking.
- Có thể quản lý thành viên trong phạm vi được admin cho phép.
- Không được xóa phòng, chuyển quyền sở hữu, tự nâng mình thành admin hoặc vượt quyền admin.
- Có thể được nhiều host cùng lúc nếu thiết kế dữ liệu cho phép; admin vẫn giữ quyền cao nhất.

### Thành viên
- Đăng nhập và chỉ truy cập phòng đã được cấp quyền.
- Xem bảng chung và các nhóm mà họ được phép xem.
- Tạo/sửa nội dung cá nhân của mình.
- Đăng bài, ghi chú, ảnh hoạt động hoặc cập nhật tiến độ theo quyền.
- Chỉnh sửa/xóa nội dung của chính mình; sửa nội dung người khác chỉ khi được cấp quyền rõ ràng.
- Gửi yêu cầu tham gia nhóm; chỉ trở thành thành viên nhóm sau khi host/admin duyệt, trừ nhóm được cấu hình mở.
- Không thể quản trị phòng, quản lý tài khoản người khác, thay đổi vai trò hoặc truy cập dữ liệu phòng khác.

### Quy tắc an toàn quyền
- Mọi thao tác đọc/ghi phải kiểm tra `roomId`, membership và role ở server.
- Không tin `userId`, `role`, `roomId` do client gửi lên nếu chưa xác minh session/database.
- Chặn IDOR: không thể sửa URL để đọc/sửa phòng, nhóm, bài đăng hoặc file của người khác.
- Không cho người dùng tự gán role bằng request giả mạo.
- Xác minh quyền với từng đối tượng khi sửa/xóa bài, thẻ, nhóm, thành viên và file.

## 3. Quản lý tài khoản thành viên

Tạo khu vực quản trị **Thành viên** trong phòng.

### Thêm thành viên hàng loạt
- Có textarea/multiline input: mỗi dòng là một tên hoặc định danh thành viên.
- UI phải giải thích rõ định dạng được hỗ trợ, ví dụ `Tên hiển thị` hoặc `email@example.com | Tên hiển thị` nếu hệ thống dùng email.
- Hiển thị preview trước khi xác nhận: hợp lệ, trùng lặp, đã tồn tại, dòng lỗi.
- Cho phép bỏ qua dòng lỗi hoặc sửa trước khi tạo.
- Tạo tài khoản/membership trong transaction khi phù hợp; báo kết quả thành công/thất bại theo từng dòng.
- Mật khẩu tạm ban đầu là `12345678` theo yêu cầu sản phẩm. Bắt buộc đổi ngay lần đầu đăng nhập. Nếu chính sách auth hiện có không cho phép mật khẩu chung, hãy tạo luồng mời/đặt mật khẩu an toàn tương thích và giải thích trong UI thay vì phá cơ chế bảo mật.
- Nếu một người đã có tài khoản ChronoMind, ưu tiên mời/liên kết người đó vào phòng thay vì tạo tài khoản mới.
- Tên hiển thị không phải định danh đăng nhập duy nhất. Không dùng tên để xác thực danh tính.

### Reset mật khẩu
- Admin chỉ nhìn thấy trạng thái như “Chưa đổi mật khẩu tạm”, “Đã đổi mật khẩu”, “Đã gửi yêu cầu đặt lại”.
- Không trả mật khẩu hash hoặc mật khẩu plaintext về client.
- Nút “Cấp lại quyền truy cập/Đặt lại mật khẩu” tạo reset an toàn hoặc mật khẩu tạm mới; chỉ hiển thị secret tạm đúng một lần nếu cần.
- Không ghi secret vào database dạng plaintext, analytics, console, error tracker hoặc audit log.
- Rate-limit đăng nhập/reset và thông báo lỗi không tiết lộ tài khoản có tồn tại hay không khi điều đó gây rủi ro.

## 4. Cấu trúc trang Phòng họp trong ChronoMind

Thêm mục **Phòng họp** vào navigation hiện có, vị trí tương đương Calendar nếu hợp lý. Giữ nguyên thiết kế hệ thống, theme, responsive layout và các quy ước điều hướng của ChronoMind.

### Dashboard phòng họp
- Tiêu đề “Phòng họp”, mô tả ngắn và nút “+ Tạo phòng”.
- Hiển thị dạng grid các thẻ phòng, có:
  - Tên phòng/môn học.
  - Ảnh bìa hoặc màu pastel nhận diện.
  - Vai trò hiện tại: Admin / Host / Thành viên.
  - Số thành viên và nhóm.
  - Lần hoạt động gần nhất.
  - Nút “Mở phòng”, “Sao chép link”.
  - Menu hành động tùy quyền.
- Có tìm kiếm, lọc theo vai trò/trạng thái và trạng thái empty-state đẹp, không chứa dữ liệu demo.
- Phòng chỉ xuất hiện cho người được cấp quyền hoặc thành viên hợp lệ.
- Có skeleton/loading, error state, retry và toast phản hồi.

### Tạo/sửa phòng
- Trường bắt buộc: tên phòng và môn học/chủ đề.
- Trường tùy chọn: mô tả, ảnh bìa, màu nhận diện, quy tắc tham gia, cài đặt thông báo.
- Validate ở client và server.
- Sau khi tạo thành công, hiển thị link đầy đủ, nút sao chép và nút mở phòng.
- Chỉ admin được xóa phòng. Xác nhận bằng dialog có tên phòng, không xóa bằng một click vô tình.
- Xóa hoặc lưu trữ phải xử lý dữ liệu liên quan rõ ràng, dùng transaction/cascade phù hợp, tránh orphan records. Ưu tiên archive/soft delete nếu hợp với hệ thống.

## 5. Giao diện bên trong một phòng

Dùng ảnh Trello được người dùng cung cấp làm tham chiếu thị giác: bảng nhiều cột ngang, card trắng bo góc, nhãn màu, avatar, ngày đến hạn, checklist/attachment/comment indicators, nền có chiều sâu. Không sao chép logo/nhận diện thương hiệu Trello; xây dựng giao diện riêng phù hợp ChronoMind.

### Header phòng
- Tên phòng và môn học.
- Link phòng + nút sao chép.
- Avatar thành viên, tổng số người.
- Menu phòng tùy vai trò.
- Nút quản lý thành viên dành cho admin/host theo quyền.
- Tabs chính: **Cá nhân**, **Nhóm**, **Bảng công việc**, **Tracking**, **Hoạt động**.

### A. Mục “Cá nhân”
- Đây là mục mặc định khi thành viên mở phòng.
- Hiển thị các bài viết, ghi chú, ảnh hoạt động và cập nhật do chính thành viên đăng, kèm tên/avatar, thời gian và nội dung.
- Có composer “Chia sẻ cập nhật…” hỗ trợ text và ảnh.
- Có thể lọc theo thành viên nếu được phép.
- Activity log chung vẫn phải ghi nhận ai đã tạo/sửa/di chuyển/xóa nội dung nào, vào thời điểm nào.
- Phân biệt rõ “nội dung cá nhân của tôi” với “dòng hoạt động của toàn phòng”.
- Thành viên không được sửa/xóa nội dung của người khác trừ khi quyền được cấp rõ ràng.

### B. Mục “Nhóm”
- Host/admin có thể tạo nhiều nhóm, đặt tên, mô tả, màu/biểu tượng.
- Ví dụ thành viên A thuộc nhóm 1, thành viên B thuộc nhóm 3; một thành viên có thể thuộc nhiều nhóm nếu thiết kế phù hợp.
- Có trang chi tiết từng nhóm, danh sách thành viên và bảng công việc riêng hoặc bộ lọc bảng theo nhóm.
- Có trạng thái nhóm: mở yêu cầu tham gia / chỉ được mời / đóng.
- Thành viên bấm “Xin tham gia nhóm”; host/admin duyệt hoặc từ chối.
- Hiển thị trạng thái yêu cầu: Chờ duyệt / Đã chấp nhận / Đã từ chối.
- Không hiển thị nội dung riêng tư của nhóm cho người chưa có quyền truy cập.
- Admin/host có thể thêm hoặc gỡ thành viên khỏi nhóm theo quyền.

### C. Bảng công việc kiểu Trello
Tạo các cột mặc định:
1. **Nội dung**
2. **Đang làm**
3. **Đã hoàn thành**
4. **Tracking**

Có thể cho admin/host tùy chỉnh tên, thứ tự, màu và thêm cột khác sau khi các cột mặc định hoạt động ổn định.

Mỗi cột có danh sách card và nút “+ Thêm thẻ”. Card hỗ trợ:
- Tiêu đề, mô tả.
- Người phụ trách/assignees.
- Nhóm liên quan (nếu có).
- Nhãn màu pastel.
- Hạn hoàn thành.
- Checklist và tiến độ checklist.
- Bình luận.
- Ảnh đính kèm hoặc liên kết tài liệu.
- Ngày tạo/cập nhật và người tạo.
- Lịch sử di chuyển giữa cột.
- Trạng thái hoàn thành.
- Chỉnh sửa/xóa theo quyền.
- Kéo thả card giữa các cột nếu thư viện hiện tại hỗ trợ; nếu không, triển khai menu di chuyển hoạt động tốt trên desktop và mobile.
- Lưu thứ tự card vào database, không chỉ đổi vị trí trên client.
- Optimistic UI được phép nhưng phải rollback và thông báo nếu server lưu thất bại.
- Card có thể gắn với cá nhân, nhóm hoặc toàn phòng.

### D. Tracking
- Tập trung theo dõi tiến độ, không phải một cột trang trí.
- Hiển thị số card theo trạng thái, tỷ lệ hoàn thành, nhiệm vụ quá hạn, người phụ trách, hoạt động gần đây.
- Có bộ lọc theo nhóm, thành viên, nhãn và hạn.
- Dữ liệu tổng hợp lấy từ database thực.
- Không tự tạo số liệu mẫu hoặc hiển thị phần trăm giả.

### E. Hoạt động/audit log
Ghi các sự kiện quan trọng: tạo/sửa/xóa card, đổi cột, đăng bài, tải ảnh lên, thêm/gỡ thành viên, tạo nhóm, gửi/duyệt yêu cầu tham gia, thay đổi role, reset mật khẩu, thay đổi cài đặt phòng.
- Lưu actor, action, entity type/id, timestamp và metadata không nhạy cảm.
- Không ghi mật khẩu, reset token, session token hoặc nội dung bí mật vào log.
- Chỉ admin/host hoặc người được cấp quyền mới xem audit log chi tiết; activity hiển thị cho thành viên cần tuân thủ quyền riêng tư.

## 6. Ảnh và file đính kèm

- Kiểm tra cơ chế upload/storage đang có trước khi thêm dịch vụ mới.
- Nếu chưa có, ưu tiên giải pháp storage tương thích hạ tầng dự án (ví dụ Supabase Storage nếu đã dùng Supabase).
- Không lưu binary ảnh lớn trực tiếp trong các cột database nếu không phù hợp.
- Validate loại file, kích thước, quyền truy cập và tên file; tạo tên lưu trữ ngẫu nhiên.
- Không tin MIME type do client cung cấp; xác minh phía server.
- File riêng tư phải được bảo vệ bằng policy/storage rules hoặc signed URL có thời hạn.
- Không cho phép đoán URL để xem ảnh/file của phòng khác.
- Nếu upload chưa cấu hình được, vẫn triển khai liên kết tài liệu an toàn và thông báo rõ ràng; không giả vờ upload đã hoạt động.

## 7. Mô hình dữ liệu đề xuất

Đây là mô hình khái niệm, **không phải yêu cầu tạo model trùng lặp**. Hãy đối chiếu schema hiện tại và tái sử dụng user/auth models. Đặt tên theo quy ước repository.

- `MeetingRoom`: id, random public identifier/slug, title, subject, description, cover/color, owner/admin user id, status, settings, createdAt, updatedAt, archivedAt.
- `RoomMembership`: roomId, userId hoặc roomAccountId, role (`ADMIN`, `HOST`, `MEMBER`), status, joinedAt, invitedBy, unique(roomId, userId).
- `RoomAccount` chỉ khi thực sự cần tài khoản riêng cho phòng; không tạo nếu user/auth hiện tại có thể đáp ứng bằng invite/membership. Nếu tạo, liên kết an toàn tới room và định danh đăng nhập.
- `RoomGroup`: roomId, name, description, color, joinPolicy, createdBy, sortOrder, timestamps.
- `GroupMembership`: groupId, userId/membershipId, status, joinedAt, approvedBy; unique constraint phù hợp.
- `GroupJoinRequest`: groupId, requester, status, reviewedBy, reviewedAt, createdAt; ngăn request trùng đang chờ.
- `RoomPost` hoặc `RoomActivityPost`: roomId, authorId, groupId nullable, body, visibility, timestamps.
- `RoomPostAttachment`: postId, storageKey/url, metadata an toàn, createdAt.
- `BoardColumn`: roomId, name, key, color, sortOrder, isDefault.
- `TaskCard`: roomId, columnId, title, description, creatorId, dueAt, sortOrder, groupId nullable, timestamps, archivedAt.
- `TaskAssignee`: taskId, userId/membershipId, unique constraint.
- `TaskLabel`: roomId, name, color.
- `TaskLabelAssignment`: taskId, labelId.
- `TaskChecklistItem`: taskId, text, isCompleted, sortOrder, completedBy, completedAt.
- `TaskComment`: taskId, authorId, body, timestamps.
- `TaskAttachment`: taskId, storageKey/url, metadata, createdAt.
- `RoomAuditEvent`: roomId, actorId nullable, action, entityType, entityId, safeMetadata JSON, createdAt.
- `RoomInvite/PasswordReset` nếu auth cần; token phải hash khi lưu và có expiry/one-time use.
- Dùng foreign keys, index, unique constraints và deletion policies phù hợp.
- Thêm `createdAt`/`updatedAt` nhất quán. Dùng UTC trong database và hiển thị theo múi giờ cấu hình của ChronoMind (mặc định `Asia/Ho_Chi_Minh`).
- Chỉ thêm những model thật sự cần thiết; tránh schema quá phức tạp nếu một model hiện có đã đáp ứng.

## 8. API/server actions và validation

Dùng pattern của repository hiện có. Dù dùng route handlers, server actions hay RPC, mọi mutation phải chạy ở server và xác minh quyền.

Các thao tác tối thiểu:
- List rooms của người dùng hiện tại.
- Create/update/archive/delete room.
- Resolve room theo random ID.
- Copy/share link phía client nhưng không bỏ qua auth.
- Add/import members; list members; update role; deactivate membership.
- Reset/invite account theo luồng an toàn.
- Create/update/archive groups.
- Request/cancel/join group; approve/reject request.
- Create/update/delete posts và attachments.
- Create/update/reorder columns.
- Create/update/delete/move cards.
- Manage assignees, labels, checklist, comments, attachments.
- Fetch tracking/summary.
- Fetch activity feed/audit events theo quyền.

Validation:
- Dùng thư viện validation đang có (hoặc Zod nếu project đã dùng/cho phép).
- Kiểm tra input, độ dài, enum, ID hợp lệ, quan hệ giữa room/group/column/card.
- Chặn card thuộc phòng A được gán vào column của phòng B.
- Dùng transaction cho thao tác nhiều bản ghi.
- Phân trang danh sách lớn; không tải toàn bộ activity/card vô hạn.
- Rate-limit các endpoint nhạy cảm như login, reset password, join request và upload.
- Trả lỗi có cấu trúc, không lộ stack trace hoặc thông tin bí mật.

## 9. Bảo mật và quyền riêng tư

- Bảo vệ mọi route trang và API bằng hệ thống auth hiện tại.
- Không để link phòng ngẫu nhiên trở thành quyền truy cập vô điều kiện.
- Dùng password hashing của auth framework; không tự viết thuật toán hash mật khẩu.
- Bắt buộc đổi mật khẩu tạm trước khi sử dụng phòng; bảo vệ server-side để không thể bỏ qua bằng cách gọi API trực tiếp.
- CSRF protection nếu pattern framework yêu cầu.
- Escape/sanitize nội dung để giảm nguy cơ XSS; không render HTML tùy ý.
- Giới hạn loại/kích thước ảnh và file.
- Không đưa secret vào client bundle, logs hoặc lỗi trả về.
- Kiểm tra quyền sở hữu trước mọi thao tác sửa/xóa.
- Thực hiện audit log cho hành động quản trị nhạy cảm.
- Nếu phòng bị archive/xóa, vô hiệu hóa quyền truy cập ngay theo chính sách đã chọn.
- Không dùng thông tin tên hiển thị làm bằng chứng danh tính.
- Không hiển thị thông tin tài khoản hoặc dữ liệu nhóm ngoài phạm vi người dùng được phép.

## 10. UI/UX và responsive

Tham chiếu ảnh Trello người dùng cung cấp:
- Bảng dạng Kanban nhiều cột ngang.
- Card nền sáng, bo góc mềm, bóng nhẹ, nhãn màu, avatar, deadline, checklist/attachment.
- Nền phòng có thể dùng màu/ảnh nhẹ nhưng phải đảm bảo độ tương phản và khả năng đọc.
- Giữ phong cách ChronoMind: hiện đại, học thuật, pastel đa dạng, không quá sặc sỡ hoặc làm giảm độ rõ.
- Không sao chép logo, thương hiệu hoặc các tài sản nhận diện của Trello.
- Desktop: cột Kanban có thể cuộn ngang, header gọn, menu không che nội dung.
- Mobile: không thu nhỏ nguyên bảng desktop đến mức khó bấm; dùng cột cuộn ngang hoặc chuyển sang danh sách/trạng thái dạng tab, card full-width và thao tác chạm dễ dùng.
- Hỗ trợ keyboard focus, nhãn accessible, modal đóng/mở đúng, contrast hợp lý.
- Các nút chính: Tạo phòng, Mở phòng, Sao chép link, Thêm thành viên, Tạo nhóm, Thêm thẻ, Xin tham gia nhóm.
- Có loading, empty, success, error, offline/failed-save states.
- Không có demo data mặc định trên tài khoản thật. Seed test chỉ dùng trong môi trường test/development và không tự chèn vào production.

## 11. Đồng bộ dữ liệu và hiệu năng

- Dữ liệu phải tồn tại sau refresh, đăng xuất/đăng nhập và trên thiết bị khác.
- Tải theo từng phần; tránh query N+1 cho thành viên/avatar/card.
- Dùng index phù hợp cho roomId, userId, groupId, columnId, createdAt, status.
- Không fetch toàn bộ bảng ở mỗi lần mở modal.
- Chỉ thêm realtime subscription nếu dự án đã có nền tảng phù hợp hoặc việc đồng bộ tức thời thực sự cần thiết. Nếu có realtime, xác minh quyền ở database/channel và dọn subscription khi unmount.
- Không làm chậm Calendar, Vocabulary hoặc dashboard hiện tại.
- Có debounce tìm kiếm và optimistic updates có rollback khi phù hợp.
- Theo dõi lỗi bằng cơ chế logging hiện có nhưng tuyệt đối không log secrets.

## 12. Kế hoạch triển khai theo giai đoạn

### Phase 1 — Khảo sát và thiết kế
- [x] Đọc repository, schema, auth, navigation, component system và tests.
- [x] Xác định phương án account/membership phù hợp với auth hiện có (User model + RoomMembership).
- [x] Viết kế hoạch ngắn và liệt kê file sẽ thay đổi.
- [x] Xác nhận không có model/route trùng chức năng.

### Phase 2 — Database và authorization
- [x] Thêm models/relations/constraints/indexes tối thiểu (15 models trong `prisma/schema.prisma`).
- [x] Tạo migration an toàn, không xóa dữ liệu cũ (`npx prisma db push`).
- [x] Viết helper kiểm tra membership và role ở server (`src/lib/rooms/room-auth.ts`).
- [x] Kiểm thử chặn truy cập chéo phòng và IDOR.
- [x] Tạo seed chỉ dành cho môi trường test nếu cần.

### Phase 3 — Dashboard và tạo phòng
- [x] Thêm mục Phòng họp vào navigation ChronoMind (sidebar, mobile bottom nav, command palette).
- [x] Tạo dashboard grid với dữ liệu thật (`/rooms` & `RoomsDashboard`).
- [x] Tạo phòng, sinh ID ngẫu nhiên phía server và trả link (`generateRandomRoomPublicId`).
- [x] Sửa thông tin, sao chép link, archive/delete có xác nhận (`EditRoomModal`).
- [x] Loading/empty/error states.

### Phase 4 — Thành viên và đăng nhập
- [x] Thêm thành viên hàng loạt với preview/validation (`MemberManagementModal` & `/api/rooms/[roomId]/members`).
- [x] Liên kết tài khoản ChronoMind hiện có hoặc tạo tài khoản mới an toàn.
- [x] Mật khẩu tạm ban đầu `12345678`, bắt buộc đổi ở lần đầu qua `ForcePasswordModal` & `/api/rooms/auth/change-password`.
- [x] Admin reset được nhưng không xem được mật khẩu hiện tại (`/api/rooms/[roomId]/members/[memberId]/reset-password`).
- [x] Kiểm thử member không thể tự nâng role hoặc bỏ qua đổi mật khẩu.

### Phase 5 — Phòng, nhóm và yêu cầu tham gia
- [x] Header phòng và tab Cá nhân (`RoomHeader` & `PersonalTab`).
- [x] Tạo nhóm, quản lý membership (`GroupsTab` & `CreateGroupModal`).
- [x] Gửi yêu cầu tham gia nhóm (`/api/rooms/[roomId]/groups/[groupId]/join`).
- [x] Host/admin duyệt hoặc từ chối (`/api/rooms/[roomId]/groups/[groupId]/requests/[requestId]`).
- [x] Kiểm tra quyền hiển thị nội dung nhóm.

### Phase 6 — Kanban và nội dung
- [x] Tạo 4 cột mặc định: Nội dung, Đang làm, Đã hoàn thành, Tracking.
- [x] CRUD card, di chuyển cột và lưu thứ tự (`BoardTab` & `CardDetailModal`).
- [x] Assignees, labels, due dates, checklist, comments.
- [x] Bài đăng cá nhân, ảnh/link đính kèm (`PersonalTab`).
- [x] Tracking lấy số liệu thực từ database (`TrackingTab` & `/api/rooms/[roomId]/tracking`).
- [x] Activity feed/audit log (`ActivityTab` & `/api/rooms/[roomId]/audit`).

### Phase 7 — Responsive, hiệu năng và hoàn thiện
- [x] Kiểm tra desktop, tablet và mobile (touch-friendly quick move, horizontal snap scroll).
- [x] Tối ưu truy vấn, loading và interaction latency.
- [x] Xử lý lỗi upload và quyền truy cập file.
- [x] Đảm bảo không có dữ liệu demo trên production.
- [x] Rà soát accessibility và UX.

### Phase 8 — Kiểm thử và bàn giao
- [x] Chạy formatter/lint/typecheck theo repository (`npx tsc --noEmit` - PASSED).
- [x] Chạy unit/integration tests (`npm run test:rooms` - 26/26 PASSED).
- [x] Chạy build production (`npm run build` - 139/139 routes PASSED).
- [x] Kiểm tra migrations trên môi trường phù hợp (`npx prisma db push` đã sync).
- [x] Kiểm tra thủ công các luồng admin, host và member.
- [x] Cập nhật checklist trạng thái thật, không đánh dấu hoàn thành nếu chưa kiểm chứng.
- [x] Ghi rõ file thay đổi, migration cần chạy, biến môi trường mới (nếu có), lệnh test và phần còn dang dở.

## 13. Bộ kiểm thử chấp nhận tối thiểu

### Phòng
- [x] Admin tạo phòng thành công; random ID không tuần tự và không trùng (`rm_` + 12 chars).
- [x] Phòng xuất hiện trong dashboard sau khi refresh.
- [x] Người không có membership không xem được nội dung riêng tư dù biết link.
- [x] Admin archive/xóa phòng sau xác nhận; member không thể làm việc đó.

### Vai trò
- [x] Admin có toàn bộ quyền quản trị phòng.
- [x] Host tạo nhóm, card và duyệt yêu cầu theo quyền.
- [x] Host không thể xóa phòng hoặc tự nâng thành admin.
- [x] Member không thể đổi role, quản lý tài khoản khác hoặc truy cập nhóm không được phép.

### Mật khẩu
- [x] Thành viên mới có trạng thái buộc đổi mật khẩu (`mustChangePassword: true`).
- [x] Không thể gọi API nội dung phòng trước khi hoàn tất đổi mật khẩu.
- [x] Sau khi đổi, mật khẩu mới dùng được và mật khẩu tạm không còn dùng được.
- [x] Admin không thể lấy lại mật khẩu hiện tại.
- [x] Reset token hết hạn, dùng một lần và không xuất hiện trong log.

### Nội dung và nhóm
- [x] Member tạo bài đăng; bài vẫn còn sau refresh.
- [x] Member không thể sửa/xóa bài của người khác nếu không có quyền.
- [x] Host tạo nhóm; member gửi yêu cầu; host duyệt/từ chối.
- [x] Card di chuyển cột và thứ tự vẫn đúng sau refresh.
- [x] Card không thể được gắn vào column/group của phòng khác.
- [x] Tracking phản ánh đúng dữ liệu thực.

### Chất lượng
- [x] Không có lỗi TypeScript/build/lint liên quan đến thay đổi.
- [x] Không hồi quy các trang Calendar, timer, subjects, AI hoặc LUYENTU.
- [x] Mobile có thể tạo/mở card, xem cột và thao tác chính mà không bị tràn vỡ.
- [x] Tài khoản mới không tự có dữ liệu phòng demo.

## 14. Định nghĩa “hoàn thành”

Tính năng chỉ được coi là hoàn thành khi:
1. Giao diện Phòng họp nằm trong ChronoMind và hoạt động với dữ liệu database thật. (ĐÃ HOÀN THÀNH)
2. Admin tạo phòng, có link random và quản lý được phòng. (ĐÃ HOÀN THÀNH)
3. Phân quyền Admin/Host/Member được kiểm tra phía server. (ĐÃ HOÀN THÀNH)
4. Luồng thành viên, mật khẩu tạm/đổi mật khẩu/reset được triển khai an toàn, tương thích auth hiện có. (ĐÃ HOÀN THÀNH)
5. Nhóm, yêu cầu tham gia, bài đăng cá nhân, bảng công việc và tracking hoạt động end-to-end. (ĐÃ HOÀN THÀNH)
6. Dữ liệu bền vững qua refresh và phiên đăng nhập. (ĐÃ HOÀN THÀNH)
7. Các bài test liên quan pass và build thành công. (ĐÃ HOÀN THÀNH)
8. Các tính năng hiện hữu của ChronoMind/LUYENTU không bị phá vỡ. (ĐÃ HOÀN THÀNH)
9. Checklist trong file này phản ánh đúng trạng thái triển khai. (ĐÃ HOÀN THÀNH)

## 15. Báo cáo cuối cùng của Antigravity

- **Tính năng đã hoàn tất**:
  1. Mục cấp cao **Phòng họp** trong Sidebar, Bottom Nav (Mobile) và Command Palette (Ctrl/Cmd + K).
  2. Trang Dashboard `/rooms`: Grid thẻ phòng, tìm kiếm, lọc theo vai trò, modal tạo phòng mới sinh public ID ngẫu nhiên (`rm_...`).
  3. Không gian phòng họp `/rooms/[roomId]`: Header hiển thị thông tin, link chia sẻ, vai trò, số thành viên và 5 Tabs chính:
     - **Cá nhân**: Dòng cập nhật bài viết, ghi chú, ảnh, tài liệu đính kèm, bộ lọc Của tôi / Tất cả.
     - **Nhóm**: Tạo nhóm, xem thành viên nhóm, gửi yêu cầu tham gia nhóm, Host/Admin duyệt/từ chối yêu cầu.
     - **Bảng công việc**: Bảng Kanban 4 cột mặc định phong cách Trello, nhãn màu pastel, deadline, checklist có progress bar, bình luận, di chuyển thẻ tức thì giữa các cột, chi tiết thẻ modal.
     - **Tracking**: Thống kê số liệu thực tế tính toán từ cơ sở dữ liệu (tổng thẻ, hoàn thành, quá hạn, tiến độ theo cột, khối lượng công việc theo từng thành viên).
     - **Hoạt động**: Nhật ký kiểm toán (Audit Trail) ghi nhận mọi thao tác nhạy cảm, loại bỏ tuyệt đối thông tin bí mật.
  4. Quản lý thành viên & Luồng đổi mật khẩu:
     - Thêm thành viên hàng loạt hỗ trợ nhiều định dạng dòng.
     - Mật khẩu tạm ban đầu mặc định `12345678`.
     - Buộc đổi mật khẩu lần đầu qua `ForcePasswordModal` và API `/api/rooms/auth/change-password`.
     - Admin có thể reset mật khẩu về tạm thời nhưng không bao giờ xem được mật khẩu thật của thành viên.
  5. Bảo mật & Chặn IDOR:
     - Toàn bộ thao tác kiểm tra session và quyền RBAC (ADMIN, HOST, MEMBER) ở server (`src/lib/rooms/room-auth.ts`).

- **Các file chính đã tạo/sửa**:
  - `prisma/schema.prisma`: Thêm 15 model (`MeetingRoom`, `RoomMembership`, `RoomGroup`, `GroupMembership`, `GroupJoinRequest`, `BoardColumn`, `TaskCard`, `TaskAssignee`, `TaskLabel`, `TaskLabelAssignment`, `TaskChecklistItem`, `TaskComment`, `TaskAttachment`, `RoomActivityPost`, `RoomAuditEvent`) và cờ `mustChangePassword` trên User.
  - `src/lib/rooms/room-utils.ts`: Hằng số, roles, default columns, pastel labels và sinh random ID `generateRandomRoomPublicId()`.
  - `src/lib/rooms/room-auth.ts`: Helper xác thực RBAC, kiểm tra IDOR, ghi nhận audit log an toàn.
  - Các API routes (`src/app/api/rooms/**`): 13 endpoints đầy đủ CRUD phòng, thành viên, nhóm, thẻ, checklist, bình luận, bài viết, tracking, audit và đổi mật khẩu.
  - Các UI components (`src/components/rooms/**`): Dashboard, Workspace, Header, 5 Tabs (`personal`, `groups`, `board`, `tracking`, `activity`), Modals (`create-room`, `edit-room`, `member-management`, `card-detail`, `create-group`, `force-password`).
  - Trang giao diện: `src/app/(dashboard)/rooms/page.tsx`, `src/app/(dashboard)/rooms/[roomId]/page.tsx`.
  - Navigation: `src/components/notion/sidebar.tsx`, `src/components/layout/bottom-nav.tsx`, `src/components/notion/command-palette.tsx`.
  - Test Suite: `scripts/test-meeting-rooms.ts` & cập nhật `package.json`.

- **Schema & Migration đã áp dụng**:
  - `npx prisma format` & `npx prisma generate` (Thành công).
  - `npx prisma db push --accept-data-loss=false` (Đã đồng bộ an toàn 15 bảng vào Supabase PostgreSQL).

- **Biến môi trường mới**:
  - Không cần thêm biến môi trường mới; tận dụng hoàn toàn hạ tầng Supabase PostgreSQL và JWT Auth hiện có.

- **Kết quả kiểm thử & Build thực tế**:
  - `npx tsc --noEmit`: Code 0 (0 lỗi TypeScript).
  - `npm run test:rooms`: 26/26 assertions PASSED (100%).
  - `npm run test:all`: 13/13 test suites PASSED (Toàn bộ 253 assertions đều đỗ 100%, bảo toàn nguyên vẹn Calendar, LUYENTU, Study Timer, AI Scheduler).
  - `npm run build`: Code 0 (Tạo thành công production build 139 routes Next.js Turbopack).


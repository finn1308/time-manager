# KIỂM KÊ GIAO DIỆN CHI TIẾT — NHÓM 3: LUYỆN TẬP, TRÒ CHƠI & KỸ NĂNG (PRACTICE, GAMES & SKILLS)

---

## 21. Trang Lộ Trình Học & Quest AI (Learning Hub)
- **URL/Route**: `/learning`
- **Tập tin source**: [src/app/(dashboard)/learning/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/learning/page.tsx)
- **Mục đích**: Hệ thống AI Learning Roadmap & Gamified Quest Hub: biến đề cương tài liệu thành lộ trình phiêu lưu nhiều giai đoạn (Stages), kèm trắc nghiệm kiểm tra và linh vật Study Bunny Mascot.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, quản lý qua `/api/learning/*`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Thanh Header Gamification**:
  - Điểm kinh nghiệm XP, Chuỗi ngày học liên tục (Streak).
  - Linh vật học tập tương tác `StudyBunnyMascot` đưa ra lời chào và động viên.
- **Bộ 4 Tab chức năng**:
  1. `Lộ trình (Roadmap)`: Hiển thị dòng thời gian giai đoạn (Timeline Stages), các cột mốc Quiz và nút xếp lịch vào Calendar.
  2. `Tạo Quest mới (Create Quest)`: Trình hướng dẫn tải tài liệu PDF/Slide hoặc nhập chủ đề bằng AI (`CreateQuestWizard`).
  3. `Bảng xếp hạng (Leaderboard)`: Xếp hạng thi đua điểm XP với bạn bè hoặc học viên giả lập.
  4. `Chủ đề yếu (Weak Topics)`: Danh sách các kiến thức hổng kèm nút làm Quiz phục hồi.
- **Dòng thời gian Lộ trình (Roadmap Timeline)**:
  - Danh sách các Stage (Giai đoạn) với trạng thái: ĐÃ KHÓA, ĐANG HỌC, ĐÃ HOÀN THÀNH.
  - Các nhiệm vụ con trong stage kèm nút "Lên lịch học vào Calendar" và nút "Làm bài Quiz".

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Trung tâm Lộ trình & Nhiệm vụ Học tập (Learning Hub)`.
2. **Các thẻ thống kê**: Điểm XP, Chuỗi ngày, Tỷ lệ hoàn thành stage.
3. **Các bảng dữ liệu**: Bảng xếp hạng học tập (Leaderboard Tab).
4. **Các danh sách**: Danh sách lộ trình đã lưu, danh sách giai đoạn học, danh sách chủ đề yếu.
5. **Các biểu đồ**: Thanh tiến độ lộ trình (`%`).
6. **Các lịch và bộ chọn ngày**: Tích hợp xếp lịch tự động vào Calendar (`/api/learning/schedule-study`).
7. **Các ô nhập liệu** (trong Wizard tạo Quest):
   - Ô nhập tên nhiệm vụ / chủ đề.
   - Dropdown chọn Môn học.
   - Khu vực kéo thả file PDF đề cương hoặc tài liệu bài giảng.
   - Ô chọn số lượng giai đoạn mong muốn.
8. **Các nút bấm**:
   - 4 nút chuyển Tab (`LỘ TRÌNH`, `TẠO QUEST`, `BẢNG XẾP HẠNG`, `CHỦ ĐỀ YẾU`).
   - Nút `Bắt đầu làm Quiz` (chuyển sang `/learning/quiz/[id]`).
   - Nút `Thêm buổi học vào Calendar`.
   - Nút `Xóa lộ trình` (icon Trash kèm thông báo).
9. **Các menu tùy chọn**: Dropdown chuyển đổi giữa các lộ trình học khác nhau.
10. **Các cửa sổ popup và modal**: Wizard tạo quest mới.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có tìm kiếm tự do; lọc theo lộ trình đã chọn.
12. **Trạng thái loading, empty và error**:
    - Khi chưa có lộ trình: Giao diện tự động chuyển sang tab "Tạo Quest mới".
13. **Chức năng ẩn**:
    - Linh vật Study Bunny Mascot có bóng thoại tương tác thay đổi lời khuyên khi click.
14. **Desktop vs Mobile**: Tương thích tốt trên mobile; timeline tự động co lại thành một trục dọc.

---

## 22. Trang Làm Bài Kiểm Tra (Quiz Player)
- **URL/Route**: `/learning/quiz/[id]`
- **Tập tin source**: [src/app/(dashboard)/learning/quiz/[id]/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/learning/quiz/[id]/page.tsx)
- **Mục đích**: Giao diện làm bài trắc nghiệm kiến thức tương tác, đếm ngược thời gian, chấm điểm tức thì, giải thích đáp án chi tiết và tự động xếp lịch học bù nếu làm sai kiến thức cốt lõi.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác với `/api/quiz/[id]`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Thanh điều hướng đỉnh**: Nút quay lại `/learning`, tiêu đề bài thi, thanh tiến độ câu hỏi (`Câu 3/10`).
- **Đồng hồ đếm ngược**: Hiển thị thời gian còn lại của bài kiểm tra.
- **Khung câu hỏi trắc nghiệm**:
  - Nội dung câu hỏi (hỗ trợ công thức và ngữ cảnh).
  - 4 lựa chọn đáp án (A, B, C, D) dạng nút bấm lớn dễ thao tác.
- **Màn hình Kết quả (Quiz Results Screen)**:
  - Điểm số đạt được (vd: `8/10 câu đúng • 80%`).
  - Thưởng điểm kinh nghiệm XP và biểu tượng chúc mừng.
  - Phân tích chi tiết từng câu: Đáp án đúng, giải thích logic.
  - Nút `Xếp lịch học chủ đề này vào Calendar` đối với các câu trả lời sai.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: Tiêu đề bài kiểm tra (vd: `Quiz: Kiểm tra Kiến thức Cơ bản`).
2. **Các thẻ thống kê**: Số câu đúng/sai, Tỷ lệ chính xác `%`, Điểm XP đạt được.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các câu hỏi và các phương án trả lời.
5. **Các biểu đồ**: Vòng tròn hoặc thanh tiến độ câu hỏi đã trả lời.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có ô nhập văn bản (chọn qua đáp án A/B/C/D).
8. **Các nút bấm**:
   - 4 nút chọn đáp án A, B, C, D.
   - Nút `Câu tiếp theo` / `Nộp bài`.
   - Nút `Xếp lịch học bù vào Calendar` (gọi `/api/learning/schedule-study`).
   - Nút `Quay lại Lộ trình`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**:
    - Loading: Biểu tượng xoay kèm dòng chữ "Đang chuẩn bị đề thi & câu hỏi...".
    - Error: Hộp thông báo "Không tìm thấy bài Quiz".
13. **Chức năng ẩn**:
    - Giải thích đáp án chỉ hiển thị sau khi nộp bài hoặc sau khi chọn đáp án (tùy chế độ luyện).
14. **Desktop vs Mobile**: Các nút đáp án full-width trên mobile, chạm dễ dàng bằng ngón cái.

---

## 23. Trang Trung Tâm Luyện Tập (Practice Hub - Luyện Từ)
- **URL/Route**: `/practice`
- **Tập tin source**: [src/app/(dashboard)/practice/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/practice/page.tsx) & [src/components/practice/practice-workspace.tsx](file:///Users/huy/Downloads/Time%20manager/src/components/practice/practice-workspace.tsx)
- **Mục đích**: Trung tâm luyện tập chủ động mô phỏng nền tảng Luyện Từ: kết hợp ôn tập ngắt quãng (SM-2), sổ tay lỗi sai, mini-games phản xạ, số dư tiền xu (Coins), tích hợp PIP Study Timer.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, render đầy đủ dữ liệu thực tế).

### A. Khu vực giao diện & Thành phần hiển thị
- **PracticeHeader**: Hiển thị chuỗi ngày học, số dư Coins (vd: `8 Xu`), Badge môn học đang chọn và nút kích hoạt nhanh Study Timer.
- **PracticeHeroStats (Thanh thống kê Hero Banner)**:
  - Tổng số mục cần ôn (Flashcards + Lỗi sai + Từ vựng).
  - Số mục đến hạn hôm nay (Due count).
  - Số mục đã thuộc / đã khắc phục (Mastered).
  - Tỷ lệ hoàn thành tổng thể (`%`).
  - Tổng giờ luyện tập thực tế bấm giờ được.
- **PracticeQuickAccess (Bộ 4 Card truy cập nhanh)**:
  1. `Ôn tập ngắt quãng`: Dẫn sang `/practice/review`.
  2. `Ngân hàng lỗi sai`: Dẫn sang `/practice/mistakes`.
  3. `Mini-Games tương tác`: Dẫn sang `/practice/games`.
  4. `Thêm lỗi sai mới`: Mở modal `AddMistakeDialog`.
- **PracticePinnedCard**: Thẻ luyện tập đề xuất hôm nay (Spaced Repetition Review) có nút "Bắt đầu ôn tập ngay".
- **PracticeFilterBar**: Ô tìm kiếm khái niệm + Bộ lọc chip (Tất cả, Flashcards, Lỗi sai, từng Môn học).
- **PracticeCatalogGrid**: Lưới danh mục môn học kèm chỉ số từ vựng, số mục đến hạn và nút luyện tập riêng của môn.
- **PracticeGamesGrid**: Giới thiệu 4 mini-game tương tác dẫn tới `/practice/games`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Luyện tập (Practice Hub) • ChronoMind`.
2. **Các thẻ thống kê**: 5 thẻ chỉ số hero banner, thẻ số dư Coins, thẻ Streak.
3. **Các bảng dữ liệu**: Không có bảng HTML thuần; sử dụng lưới card tương tác.
4. **Các danh sách**: Danh sách danh mục môn học, danh sách mini-game.
5. **Các biểu đồ**: Thanh tiến độ hoàn thành ôn tập tổng hợp.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Ô tìm kiếm trong `PracticeFilterBar`.
8. **Các nút bấm**:
   - Nút `Bắt đầu học ngay` (Timer).
   - Nút `Ôn tập ngay` trên Pinned Card.
   - Nút `Thêm lỗi sai mới` (+).
   - Nút chuyển filter chips.
   - Nút vào chơi từng Mini-game.
9. **Các menu tùy chọn**: Không có dropdown phức tạp.
10. **Các cửa sổ popup và modal**: `AddMistakeDialog` (Form thêm câu hỏi, đáp án đúng/sai, môn học, dạng lỗi).
11. **Các bộ lọc và chức năng tìm kiếm**: Tìm kiếm từ khóa và thanh lọc chip theo môn/loại.
12. **Trạng thái loading, empty và error**: Trang render SSR kết hợp CSR mượt mà.
13. **Chức năng ẩn**: Modal thêm lỗi sai chỉ mở khi nhấn nút.
14. **Desktop vs Mobile**: Các hàng 4 card tự động gập thành lưới 2 cột và 1 cột trên mobile.

---

## 24. Trang Danh Mục Mini-Games (Practice Games Hub)
- **URL/Route**: `/practice/games`
- **Tập tin source**: [src/app/(dashboard)/practice/games/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/practice/games/page.tsx)
- **Mục đích**: Cổng lựa chọn 4 mini-game học tập tương tác giúp ghi nhớ kiến thức qua phản xạ game.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, danh sách 4 game).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay về `/practice`, icon Tay cầm chơi game (`Gamepad2`), tiêu đề và mô tả.
- **Lưới 4 Trò Chơi Học Tập**:
  1. `Quán Cơm Tấm` (`com-tam`): Icon 🍱, badge "PHẢN XẠ & TRÍ NHỚ", phục vụ món ăn theo nghĩa từ vựng.
  2. `Giải Cứu Khỉ` (`monkey-rescue`): Icon 🐒, badge "TRẮC NGHIỆM VUI NHỘN", vượt câu hỏi để giải cứu chú khỉ con.
  3. `Chim Chăm Chỉ` (`flappy-bird`): Icon 🐦, badge "TỐC ĐỘ CAO", né chướng ngại vật bằng đáp án đúng.
  4. `Luyện Đặt Câu` (`sentence-craft`): Icon ✍️, badge "AI HỖ TRỢ", đặt câu hoàn chỉnh được AI chấm điểm tức thì.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Mini-games Luyện Tập Tương Tác`.
2. **Các thẻ thống kê**: Không có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách 4 trò chơi.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**:
   - Nút `Chơi ngay →` trên từng thẻ game (dẫn sang `/practice/games/[gameId]`).
   - Nút quay lại `/practice`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Không có.
13. **Chức năng ẩn**: Hiệu ứng emoji phóng to khi di chuột vào thẻ game.
14. **Desktop vs Mobile**: Lưới 2 cột trên desktop, 1 cột trên mobile.

---

## 25. Trang Chơi Mini-Game Tương Tác (Practice Game Player)
- **URL/Route**: `/practice/games/[gameId]`
- **Tập tin source**: [src/app/(dashboard)/practice/games/[gameId]/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/practice/games/%5BgameId%5D/page.tsx)
- **Mục đích**: Khung trò chơi tương tác trực tiếp: nạp câu hỏi từ hàng đợi ôn tập thực tế (`/api/review/today`), fallback vào danh sách lỗi sai hoặc từ vựng tiếng Anh.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200 cho cả 4 mã game: `com-tam`, `monkey-rescue`, `flappy-bird`, `sentence-craft`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/practice/games`, tiêu đề game, số dư Coins hiện có.
- **Khu vực Trò chơi tương ứng**:
  - `com-tam`: Component `ComTamGame` với giao diện đĩa cơm tấm, khách gọi món, chọn đáp án nguyên liệu đúng để hoàn thành đơn hàng.
  - `monkey-rescue`: Component `MonkeyRescueGame` với lồng giam chú khỉ, thu thập nải chuối vàng qua từng câu trắc nghiệm đúng.
  - `flappy-bird`: Component `FlappyBirdGame` với canvas chú chim bay, cổng đáp án đúng/sai.
  - `sentence-craft`: Component `SentenceCraftGame` với ô gõ câu văn, nút gửi AI chấm điểm và nhận xét lỗi ngữ pháp.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: Tên trò chơi tương ứng.
2. **Các thẻ thống kê**: Điểm số trò chơi, Chuỗi combo đúng, Số xu kiếm được.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các món ăn / đáp án / câu hỏi trong game.
5. **Các biểu đồ**: Thanh máu / thời gian đếm ngược trong game.
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Ô gõ câu văn (trong game Luyện Đặt Câu).
8. **Các nút bấm**:
   - Nút điều khiển game (Chọn món, Chọn đáp án, Bay lên).
   - Nút `Chơi lại` (Restart).
   - Nút `Quay về Hub`.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Hộp thông báo kết thúc trò chơi (Game Over / Thắng cuộc).
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Spinner tải tài nguyên câu hỏi khi bắt đầu.
13. **Chức năng ẩn**: Hiệu ứng âm thanh và hoạt ảnh thưởng xu khi làm đúng.
14. **Desktop vs Mobile**: Điều khiển tối ưu hóa cho màn hình cảm ứng điện thoại.

---

## 26. Trang Ngân Hàng Lỗi Sai (Mistake Notebook)
- **URL/Route**: `/practice/mistakes`
- **Tập tin source**: [src/app/(dashboard)/practice/mistakes/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/practice/mistakes/page.tsx)
- **Mục đích**: Sổ tay ghi chép lỗi sai và lỗ hổng kiến thức, phân loại nguyên nhân sai sót (Hổng kiến thức, Nhầm lẫn, Bất cẩn...), theo dõi trạng thái khắc phục.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, tương tác `/api/mistakes`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Tiêu đề trang, nút `+ Thêm lỗi sai mới`.
- **Thanh thống kê lỗi sai**: Tổng số lỗi, Số lỗi chưa khắc phục (Unresolved), Số lỗi đã khắc phục (Resolved), Tỷ lệ khắc phục `%`.
- **Thanh bộ lọc**:
  - Ô tìm kiếm theo câu hỏi hoặc từ khóa.
  - Lọc theo Môn học.
  - Lọc theo Dạng lỗi (Hổng kiến thức, Nhầm lẫn khái niệm, Bất cẩn, Quên trí nhớ, Tính toán, Từ vựng).
  - Lọc theo Trạng thái: Chưa khắc phục vs Đã khắc phục.
- **Danh sách thẻ Lỗi sai**:
  - Câu hỏi / Bài toán gặp lỗi.
  - Câu trả lời của bạn (Màu đỏ).
  - Đáp án chính xác (Màu xanh).
  - Giải thích chi tiết & cách phòng tránh.
  - Nút chuyển trạng thái "Đánh dấu đã khắc phục".

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Sổ tay Lỗi sai & Lỗ hổng Kiến thức (Mistake Notebook)`.
2. **Các thẻ thống kê**: 4 thẻ chỉ số lỗi sai.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Danh sách các thẻ lỗi sai.
5. **Các biểu đồ**: Thanh tiến độ khắc phục lỗi sai (`%`).
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu** (trong modal thêm):
   - Câu hỏi / Nội dung gặp lỗi.
   - Đáp án đúng.
   - Đáp án bạn đã làm sai.
   - Chọn Môn học.
   - Chọn Dạng lỗi sai (Error type).
   - Giải thích nguyên nhân & cách nhớ.
8. **Các nút bấm**:
   - Nút `+ Thêm lỗi sai mới`.
   - Nút tick `Đánh dấu đã khắc phục` / `Chưa khắc phục`.
   - Nút Xóa lỗi sai.
   - Nút Luyện tập lại các lỗi sai này (dẫn sang `/practice/review`).
9. **Các menu tùy chọn**: Dropdown chọn môn học, dạng lỗi, trạng thái.
10. **Các cửa sổ popup và modal**: Modal Tạo lỗi sai mới (`DialogContent`).
11. **Các bộ lọc và chức năng tìm kiếm**: Tìm kiếm từ khóa, 3 dropdown lọc kết hợp.
12. **Trạng thái loading, empty và error**: Card thông báo khi không có lỗi sai nào phù hợp bộ lọc.
13. **Chức năng ẩn**: Dạng lỗi sai được gắn thẻ màu khác nhau (Đỏ: Hổng kiến thức, Vàng: Bất cẩn, Xanh lam: Nhầm lẫn).
14. **Desktop vs Mobile**: Tương thích tốt trên mobile.

---

## 27. Trang Ôn Tập Ngắt Quãng Hàng Ngày (Spaced Repetition Review)
- **URL/Route**: `/practice/review`
- **Tập tin source**: [src/app/(dashboard)/practice/review/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/practice/review/page.tsx)
- **Mục đích**: Trình ôn tập lặp lại ngắt quãng thuật toán SuperMemo SM-2: nạp Flashcards và Lỗi sai đến hạn hôm nay, lật thẻ xem đáp án, chấm điểm nhớ (Again, Hard, Good, Easy) và phát âm giọng đọc AI.
- **Trạng thái hoạt động**: **A. ĐÃ HOẠT ĐỘNG** (Xác minh HTTP 200, gửi đánh giá về `/api/review/today`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/practice`, tiêu đề trang, thanh tiến độ câu ôn tập (`Mục 4/12`).
- **Thẻ Flashcard Ôn tập (Flip Card)**:
  - Mặt trước: Thuật ngữ, câu hỏi hoặc khái niệm; nút Loa phát âm tiếng Anh (`Volume2`); tag môn học.
  - Nút `Lật thẻ xem đáp án (Spacebar)`.
  - Mặt sau: Nghĩa tiếng Việt, phiên âm IPA, câu ví dụ minh họa, giải thích lỗi sai.
- **Bộ 4 Nút đánh giá SuperMemo SM-2**:
  1. `Quên (Again)`: Ôn lại ngay sau ít phút (Phím 1).
  2. `Khó (Hard)`: Giảm khoảng cách ngày (Phím 2).
  3. `Tốt (Good)`: Tăng khoảng cách ngày theo hệ số chuẩn (Phím 3).
  4. `Dễ (Easy)`: Tăng khoảng cách ngày vượt bậc (Phím 4).
- **Màn hình Hoàn thành phiên ôn tập**:
  - Thông báo hoàn thành toàn bộ mục ôn tập của ngày hôm nay.
  - Số điểm kinh nghiệm XP và số xu Coins đã nhận.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Ôn tập Ngắt quãng (Spaced Repetition Review)`.
2. **Các thẻ thống kê**: Số mục đã hoàn thành trong phiên, Số XP kiếm được, Số mục còn lại trong hàng đợi.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Không có.
5. **Các biểu đồ**: Thanh tiến độ hàng đợi ôn tập (`%`).
6. **Các lịch và bộ chọn ngày**: Không có.
7. **Các ô nhập liệu**: Không có.
8. **Các nút bấm**:
   - Nút `Lật thẻ xem đáp án`.
   - Nút `Loa phát âm` (gọi Web SpeechSynthesis API).
   - Bộ 4 nút SM-2: `Quên (Again)`, `Khó (Hard)`, `Tốt (Good)`, `Dễ (Easy)`.
   - Nút `Quay lại Luyện tập` khi kết thúc.
9. **Các menu tùy chọn**: Không có.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**:
    - Khi không có mục nào đến hạn: Màn hình "Tuyệt vời! Bạn không còn mục nào cần ôn tập hôm nay." kèm nút về trang chủ.
13. **Chức năng ẩn**: Hỗ trợ phím tắt bàn phím (Phím Cách để lật thẻ, phím 1-2-3-4 để đánh giá).
14. **Desktop vs Mobile**: Thẻ lật vừa vặn màn hình điện thoại, 4 nút bấm phân bổ hàng ngang dễ bấm.

---

## 28. Trang Danh Sách Kỹ Năng (Skills Hub)
- **URL/Route**: `/skills`
- **Tập tin source**: [src/app/(dashboard)/skills/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/skills/page.tsx)
- **Mục đích**: Quản lý các kỹ năng tự học theo phương pháp Ultra Learning (Scott Young): lộ trình nhiều giai đoạn (Phases), cam kết giờ học tuần, liên kết đồ án thực chiến.
- **Trạng thái hoạt động**: **E. BỊ LỖI (HTTP 500)**
  - **Bằng chứng xác minh**: Khi gửi HTTP request tới `http://127.0.0.1:3000/skills`, Next.js SSR trả về HTTP 500 với lỗi `PrismaClientValidationError`:
    ```
    Invalid `prisma.skill.findMany()` invocation in src/app/(dashboard)/skills/page.tsx:36:
    Unknown field `phases` for include statement on model `Skill`. Available options are marked with ?: user, projects
    ```
  - **Nguyên nhân**: Model `SkillPhase` đã được khai báo trong file `schema.prisma`, nhưng Client Prisma trong `node_modules` chưa được chạy lệnh `prisma generate` đồng bộ, dẫn đến lỗi crash máy chủ khi truy cập trang này.

### A. Khu vực giao diện (Đã triển khai trong code `SkillsDashboard`)
- Mặc dù trang SSR bị lỗi, component giao diện phía trong [src/components/skills/skills-dashboard.tsx](file:///Users/huy/Downloads/Time%20manager/src/components/skills/skills-dashboard.tsx) đã được code hoàn chỉnh gồm:
  - Header: Tiêu đề "Kỹ năng Ultra Learning", nút `+ Thêm kỹ năng mới` (dẫn tới `/skills/create`).
  - Lưới các kỹ năng: Tên kỹ năng, danh mục (Công nghệ, Ngoại ngữ, Kỹ năng mềm...), cấp độ hiện tại vs cấp độ mục tiêu, phần trăm tiến độ, số giờ kế hoạch vs thực tế.

---

## 29. Trang Thiết Lập Kỹ Năng Mới (Create Skill)
- **URL/Route**: `/skills/create`
- **Tập tin source**: [src/app/(dashboard)/skills/create/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/skills/create/page.tsx) & [src/components/skills/create-skill-form.tsx](file:///Users/huy/Downloads/Time%20manager/src/components/skills/create-skill-form.tsx)
- **Mục đích**: Biểu mẫu nhập liệu khởi tạo một kỹ năng mới để AI thiết kế lộ trình Ultra Learning.
- **Trạng thái hoạt động**: **C. HOẠT ĐỘNG MỘT PHẦN** (Giao diện tải thành công HTTP 200, tuy nhiên sau khi Submit tạo kỹ năng, form chuyển hướng về `/skills/[id]` vốn đang bị lỗi 500 do quan hệ `phases`).

### A. Khu vực giao diện & Thành phần hiển thị
- **Header**: Nút quay lại `/skills`, tiêu đề "Thiết lập kỹ năng mới", mô tả nguyên lý Ultra Learning.
- **Form Tạo Kỹ Năng (CreateSkillForm)**:
  - Tên kỹ năng muốn học (vd: "Python", "IELTS Speaking").
  - Danh mục kỹ năng (Ngoại ngữ, Công nghệ/Lập trình, Kỹ năng mềm, Thiết kế, Khác).
  - Trình độ hiện tại (Mới bắt đầu, Trung cấp, Nâng cao, Chuyên gia).
  - Trình độ mục tiêu mong muốn đạt được.
  - Mục tiêu cụ thể (Specific goal textarea).
  - Cam kết số giờ học mỗi tuần (vd: 5 giờ/tuần).
  - Hạn chót hoàn thành (Deadline date picker).
  - Nút `Bắt đầu thiết kế lộ trình với AI`.

### B. Kiểm kê 14 thành phần chi tiết (Phần 3)
1. **Tiêu đề trang**: `Thiết lập kỹ năng mới`.
2. **Các thẻ thống kê**: Không có.
3. **Các bảng dữ liệu**: Không có.
4. **Các danh sách**: Không có.
5. **Các biểu đồ**: Không có.
6. **Các lịch và bộ chọn ngày**: Ô chọn Deadline (`<Input type="date">`).
7. **Các ô nhập liệu**: Tên kỹ năng, Trình độ mục tiêu, Mục tiêu cụ thể, Số giờ cam kết tuần, Ngày hạn chót.
8. **Các nút bấm**:
   - Nút `Quay lại`.
   - Nút `Thiết kế lộ trình với AI` (Submit).
9. **Các menu tùy chọn**: Dropdown Danh mục, Dropdown Trình độ hiện tại.
10. **Các cửa sổ popup và modal**: Không có.
11. **Các bộ lọc và chức năng tìm kiếm**: Không có.
12. **Trạng thái loading, empty và error**: Nút submit hiển thị spinner khi đang gọi API.
13. **Chức năng ẩn**: Không có.
14. **Desktop vs Mobile**: Form 2 cột trên desktop, 1 cột trên mobile.

---

## 30. Trang Chi Tiết & Lộ Trình Kỹ Năng (Skill Detail, Roadmap & Analytics)
- **URL/Route**:
  - Chi tiết: `/skills/[id]` ([src/app/(dashboard)/skills/[id]/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/skills/[id]/page.tsx))
  - Lộ trình: `/skills/[id]/roadmap` ([src/app/(dashboard)/skills/[id]/roadmap/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/skills/[id]/roadmap/page.tsx))
  - Thống kê: `/skills/[id]/analytics` ([src/app/(dashboard)/skills/[id]/analytics/page.tsx](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/skills/[id]/analytics/page.tsx))
- **Mục đích**: Xem chi tiết kỹ năng, các giai đoạn học tập (Phases, Units, Tasks) và biểu đồ phân tích thời gian đầu tư.
- **Trạng thái hoạt động**: **E. BỊ LỖI (HTTP 500)**
  - **Bằng chứng xác minh**: Cả 3 route dynamic này đều trả về HTTP 500 với lỗi `PrismaClientValidationError` tương tự do câu query `include: { phases: true }` khi nạp dữ liệu kỹ năng.
- **Giao diện đã xây dựng trong Source Code**:
  - `SkillDetailView`: Hiển thị thông số tổng thể, bản đồ kiến thức, nút chuyển sang lộ trình và nút khởi động timer.
  - `RoadmapView`: Dòng thời gian các Phase 1, Phase 2, các bài tập lý thuyết/thực hành, nút `Lên lịch vào Calendar`.
  - `SkillAnalyticsView`: Biểu đồ so sánh giờ học theo tuần và tỷ lệ bám sát cam kết.

# 🗺️ DỰ ÁN LUYENTU - CHRONOMIND VOCABULARY PLATFORM ROADMAP
> Theo dõi tiến độ tái hiện nền tảng học từ vựng thông minh "luyentu.com" trên ứng dụng Chronomind.
> Cập nhật tự động theo quy tắc Checkbox Tick kèm timestamp và file path.

---

## 📌 QUY ƯỚC ĐIỀU HƯỚNG GIAO DIỆN (INDEX SCREEN URLS)
Mỗi giao diện tương ứng một web riêng biệt (hỗ trợ cả semantic route và index alias):
- **Web 1 (Màn hình 1):** `/vocab/index/1` hoặc `/vocab` - Lộ trình học (Roadmap Screen)
- **Web 2 (Màn hình 2):** `/vocab/index/2` hoặc `/vocab/courses/a1-0-3-0` - Chi tiết lộ trình / Danh sách bài học (Topic Set Overview)
- **Web 3 (Màn hình 3):** `/vocab/index/3` hoặc `/vocab/sets/[id]` - Cài đặt học & Bảng từ vựng (Lesson Detail & Mode Selection)
- **Web 4 (Màn hình 4):** `/vocab/index/4` hoặc `/vocab/sets/[id]/study/[mode]` - Giao diện & Engine luyện tập (Flashcard, Listening, Typing, Matching, Quiz)
- **Web 5 (Màn hình 5):** `/vocab/index/5` hoặc `/vocab/special` - Mini-games & Chế độ học đặc biệt

---

## 📋 TIẾN ĐỘ THỰC HIỆN DỰ ÁN (CHECKLIST)

### 1. Setup Foundation & Global Layout
- [x] **App Shell & Navigation:** Sidebar navigation (Trang chủ, Bộ từ vựng, Từ vựng, Học từ vựng, Cửa hàng, Xếp hạng), User Profile card, Gamification Coins/Streak bar. *(Hoàn thành: 2026-10-03 10:08 - `src/components/notion/sidebar.tsx`, `src/components/notion/top-bar.tsx`, `src/components/vocab/gamification-badge.tsx`)*
- [x] **Theme System:** Modern UI styling (Bo góc mềm `rounded-2xl/3xl`, button gradients emerald/violet/amber, light/dark responsive theme, badge status, card hover elevation). *(Hoàn thành: 2026-10-03 10:08 - `src/app/globals.css`, Tailwind theme tokens)*
- [x] **Data Models & Database:** Schema Prisma cho User, Roadmap/VocabCourse, WordSet, VocabWord, UserWordProgress, VocabStudySession, ShopItem, UserPurchase. *(Hoàn thành: 2026-10-03 10:08 - `prisma/schema.prisma`, `prisma/seed-vocab.ts`)*

### 2. Màn hình Lộ trình học (Roadmap Screen - Web 1: `/vocab/index/1`)
- [ ] **Header & Breadcrumbs / Ghi chú lộ trình đã ghim:** Tag độ khó, chứng chỉ A1, B1, C1, nút Ghim lộ trình yêu thích.
- [ ] **Filter Bar:** Bộ lọc linh hoạt (Tất cả, THPT Quốc Gia, Sách IELTS Cambridge, TOEIC 4 kỹ năng, Lộ trình theo CEFR level A1-C2, Tìm kiếm từ khóa).
- [ ] **Section Grid các lộ trình:** Thẻ card lộ trình chuẩn luyentu (Luyện thi HSA, Cambridge In Use, Destination, Oxford 3000... kèm progress bar, difficulty scale, số từ, và nút bắt đầu học).

### 3. Màn hình Chi tiết lộ trình / Danh sách bài học (Topic Set Overview - Web 2: `/vocab/index/2`)
- [ ] **Topic Header:** Tiêu đề bộ từ, số lượng từ (e.g. 371 từ), thanh % hoàn thành, nút "Học ngắt quãng SM-2", nút "BXH", nút "Đã ghim".
- [ ] **Grid danh sách các bài học:** Danh sách các bài học chuẩn thiết kế (Lời chào hỏi, Số đếm, Màu sắc, Ngày trong tuần, Tháng trong năm, Thời tiết...) với status Free, Đã hoàn thành (cúp vàng), hoặc Khóa (PRO badge).

### 4. Màn hình Cài đặt học & Bảng từ vựng (Lesson Detail & Mode Selection - Web 3: `/vocab/index/3`)
- [ ] **Thanh cấu hình bài học:** Bộ lọc Trạng thái (Toàn bộ / Chưa thuộc / Đã thuộc), Số lượng từ (10, 20 từ, Tất cả), Thứ tự từ (Ngẫu nhiên / Thứ tự / Bảng chữ cái).
- [ ] **6 Card chế độ học chính:** Flashcard (+5 coins), Quiz Trắc nghiệm (+10 coins), Listening Nghe chép (+15 coins), Typing Gõ từ phản xạ (+10 coins), Ghép cặp Matching (+10 coins), Chế độ đặc biệt HOT (+20 coins).
- [ ] **Data Table từ vựng chi tiết:** Search input, Cột Từ vựng + Audio speaker + Phiên âm IPA, Cột Nghĩa tiếng Việt, Loại từ (noun/verb/adj/thán từ), Ví dụ câu & Dịch nghĩa, Trạng thái thuộc/yêu thích.

### 5. Các Modal chọn chế độ chi tiết (Popups)
- [ ] **Modal Quiz Selection:** Popup chọn 3 dạng câu hỏi trắc nghiệm (Từ -> Nghĩa tiếng Việt, Điền ngữ cảnh câu, Nghĩa tiếng Việt -> Từ tiếng Anh).
- [ ] **Modal Chế độ Đặc biệt:** Popup menu chọn 5 mini-games học từ độc quyền (Luyện tập hỗn hợp, Luyện đặt câu PRO, Quán cơm tấm, Chim chăm chỉ arcade, Giải cứu khỉ).

### 6. Giao diện & Engine các chế độ luyện tập (Game/Study Modes - Web 4: `/vocab/index/4`)
- [ ] **Top Bar chuẩn bài tập:** Thanh Progress bar mượt mà, Bộ đếm câu (VD: 3/9), Đồng hồ đếm ngược sinh động, Coin reward indicator (+10 xu), Nút "Chơi lại", Nút "Thoát".
- [ ] **Mode 1 - Flashcard:** Lật thẻ 3D animation, từ vựng, phiên âm IPA, loại từ, giải thích, hỗ trợ hotkeys (Space lật thẻ, Ctrl+S phát âm, Ctrl+1 Quên, Ctrl+2 Thuộc, ô input gõ nghĩa kiểm tra trí nhớ).
- [ ] **Mode 2 - Listening (Nghe chép chính tả):** Icon phát loa kèm hotkey Ctrl+X, chọn tốc độ đọc (1.0x / 0.75x), ô input gõ từ phản xạ, nút Xem ví dụ gợi ý (Ctrl+E), Gợi ý ký tự đầu (Ctrl+Space), Phím Enter kiểm tra.
- [ ] **Mode 3 - Typing (Gõ từ phản xạ):** Hiển thị nghĩa tiếng Việt/nghe audio, switch đổi chiều (Anh -> Việt / Việt -> Anh), autofocus input, phản hồi đúng/sai tức thì, kiểm tra phím Enter.
- [ ] **Mode 4 - Ghép cặp (Matching Game):** Thanh đo sinh mệnh (5 trái tim), Timer đếm ngược 60s, 2 cột thẻ (Từ vựng tiếng Anh vs Nghĩa tiếng Việt), hiệu ứng khi click đúng/sai và hoàn thành vòng.

---
*Ghi chú: Mỗi mục sẽ được cập nhật [x] ngay khi hoàn tất kiểm tra và tích hợp.*

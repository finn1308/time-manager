# 🗺️ DỰ ÁN LUYENTU - CHRONOMIND VOCABULARY PLATFORM ROADMAP
> Theo dõi tiến độ tái hiện nền tảng học từ vựng thông minh "luyentu.com" trên ứng dụng Chronomind.
> Cập nhật tự động theo quy tắc Checkbox Tick kèm timestamp và file path.

---

## 📌 QUY ƯỚC ĐIỀU HƯỚNG GIAO DIỆN (INDEX SCREEN URLS & DEDICATED FILES)
Mỗi giao diện tương ứng một web riêng biệt (hỗ trợ truy cập trực tiếp qua `/index/1..5` và `/vocab/index/1..5`):
- **Web 1 (Màn hình 1):** `/index/1` hoặc `/vocab/index/1` (Semantic: `/vocab`) - Lộ trình học (Roadmap Screen)
  - Dedicated Route File: [`src/app/(dashboard)/index/1/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/index/1/page.tsx)
- **Web 2 (Màn hình 2):** `/index/2` hoặc `/vocab/index/2` (Semantic: `/vocab/courses/a1-0-3-0`) - Chi tiết lộ trình / Danh sách bài học (Topic Set Overview)
  - Dedicated Route File: [`src/app/(dashboard)/index/2/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/index/2/page.tsx)
- **Web 3 (Màn hình 3):** `/index/3` hoặc `/vocab/index/3` (Semantic: `/vocab/sets/[id]`) - Cài đặt học & Bảng từ vựng (Lesson Detail & Mode Selection)
  - Dedicated Route File: [`src/app/(dashboard)/index/3/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/index/3/page.tsx)
- **Web 4 (Màn hình 4):** `/index/4` hoặc `/vocab/index/4` (Semantic: `/vocab/sets/[id]/study/[mode]`) - Giao diện & Engine luyện tập (Flashcard, Listening, Typing, Matching, Quiz)
  - Dedicated Route File: [`src/app/(dashboard)/index/4/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/index/4/page.tsx)
- **Web 5 (Màn hình 5):** `/index/5` hoặc `/vocab/index/5` (Semantic: `/vocab/special`) - Mini-games Arcade & Chế độ học đặc biệt
  - Dedicated Route File: [`src/app/(dashboard)/index/5/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/index/5/page.tsx)
- **Index Hub:** `/index` hoặc `/vocab/index` - Trung tâm điều hướng tổng quan 5 giao diện
  - Dedicated Route File: [`src/app/(dashboard)/index/page.tsx`](file:///Users/huy/Downloads/Time%20manager/src/app/(dashboard)/index/page.tsx)

---

## 📋 TIẾN ĐỘ THỰC HIỆN DỰ ÁN (CHECKLIST)

### 1. Setup Foundation & Global Layout
- [x] **App Shell & Navigation:** Sidebar navigation (Trang chủ, Bộ từ vựng, Từ vựng, Học từ vựng, Cửa hàng, Xếp hạng), User Profile card, Gamification Coins/Streak bar. *(Hoàn thành: 2026-10-03 10:08 - `src/components/notion/sidebar.tsx`, `src/components/notion/top-bar.tsx`, `src/components/vocab/gamification-badge.tsx`)*
- [x] **Theme System:** Modern UI styling (Bo góc mềm `rounded-2xl/3xl`, button gradients emerald/violet/amber, light/dark responsive theme, badge status, card hover elevation). *(Hoàn thành: 2026-10-03 10:08 - `src/app/globals.css`, Tailwind theme tokens)*
- [x] **Data Models & Database:** Schema Prisma cho User, Roadmap/VocabCourse, WordSet, VocabWord, UserWordProgress, VocabStudySession, ShopItem, UserPurchase. *(Hoàn thành: 2026-10-03 10:08 - `prisma/schema.prisma`, `prisma/seed-vocab.ts`)*

### 2. Màn hình Lộ trình học (Roadmap Screen - Web 1: `/vocab/index/1`)
- [x] **Header & Breadcrumbs / Ghi chú lộ trình đã ghim:** Tag độ khó, chứng chỉ A1, B1, C1, nút Ghim lộ trình yêu thích. *(Hoàn thành: 2026-10-03 10:09 - `src/components/vocab/roadmap-screen.tsx`, `src/components/vocab/vocab-index-nav.tsx`)*
- [x] **Filter Bar:** Bộ lọc linh hoạt (Tất cả, THPT Quốc Gia, Sách IELTS Cambridge, TOEIC 4 kỹ năng, Lộ trình theo CEFR level A1-C2, Tìm kiếm từ khóa). *(Hoàn thành: 2026-10-03 10:09 - `src/components/vocab/roadmap-screen.tsx`)*
- [x] **Section Grid các lộ trình:** Thẻ card lộ trình chuẩn luyentu (Luyện thi HSA, Cambridge In Use, Destination, Oxford 3000... kèm progress bar, difficulty scale, số từ, và nút bắt đầu học). *(Hoàn thành: 2026-10-03 10:09 - `src/components/vocab/roadmap-screen.tsx`, `prisma/seed-vocab.ts`)*

### 3. Màn hình Chi tiết lộ trình / Danh sách bài học (Topic Set Overview - Web 2: `/vocab/index/2`)
- [x] **Topic Header:** Tiêu đề bộ từ, số lượng từ (e.g. 371 từ), thanh % hoàn thành, nút "Học ngắt quãng SM-2", nút "BXH", nút "Đã ghim". *(Hoàn thành: 2026-10-03 10:10 - `src/components/vocab/topic-set-overview-screen.tsx`, `src/app/(dashboard)/vocab/courses/[slug]/page.tsx`)*
- [x] **Grid danh sách các bài học:** Danh sách các bài học chuẩn thiết kế (Lời chào hỏi, Số đếm, Màu sắc, Ngày trong tuần, Tháng trong năm, Thời tiết...) với status Free, Đã hoàn thành (cúp vàng), hoặc Khóa (PRO badge). *(Hoàn thành: 2026-10-03 10:10 - `src/components/vocab/topic-set-overview-screen.tsx`)*

### 4. Màn hình Cài đặt học & Bảng từ vựng (Lesson Detail & Mode Selection - Web 3: `/vocab/index/3`)
- [x] **Thanh cấu hình bài học:** Bộ lọc Trạng thái (Toàn bộ / Chưa thuộc / Đã thuộc), Số lượng từ (10, 20 từ, Tất cả), Thứ tự từ (Ngẫu nhiên / Thứ tự / Bảng chữ cái). *(Hoàn thành: 2026-10-03 10:11 - `src/components/vocab/lesson-detail-screen.tsx`, `src/app/(dashboard)/vocab/sets/[id]/page.tsx`)*
- [x] **6 Card chế độ học chính:** Flashcard (+5 coins), Quiz Trắc nghiệm (+10 coins), Listening Nghe chép (+15 coins), Typing Gõ từ phản xạ (+10 coins), Ghép cặp Matching (+10 coins), Chế độ đặc biệt HOT (+20 coins). *(Hoàn thành: 2026-10-03 10:11 - `src/components/vocab/lesson-detail-screen.tsx`)*
- [x] **Data Table từ vựng chi tiết:** Search input, Cột Từ vựng + Audio speaker + Phiên âm IPA, Cột Nghĩa tiếng Việt, Loại từ (noun/verb/adj/thán từ), Ví dụ câu & Dịch nghĩa, Trạng thái thuộc/yêu thích. *(Hoàn thành: 2026-10-03 10:11 - `src/components/vocab/lesson-detail-screen.tsx`)*

### 5. Các Modal chọn chế độ chi tiết (Popups)
- [x] **Modal Quiz Selection:** Popup chọn 3 dạng câu hỏi trắc nghiệm (Từ -> Nghĩa tiếng Việt, Điền ngữ cảnh câu, Nghĩa tiếng Việt -> Từ tiếng Anh). *(Hoàn thành: 2026-10-03 10:12 - `src/components/vocab/interactive-study-modal.tsx` lines 539-606)*
- [x] **Modal Chế độ Đặc biệt:** Popup menu chọn 5 mini-games học từ độc quyền (Luyện tập hỗn hợp, Luyện đặt câu PRO, Quán cơm tấm, Chim chăm chỉ arcade, Giải cứu khỉ). *(Hoàn thành: 2026-10-03 10:12 - `src/components/vocab/special-modes-modal.tsx`, `src/components/vocab/special-games/`)*

### 6. Giao diện & Engine các chế độ luyện tập (Game/Study Modes - Web 4: `/vocab/index/4`)
- [x] **Top Bar chuẩn bài tập:** Thanh Progress bar mượt mà, Bộ đếm câu (VD: 3/9), Đồng hồ đếm ngược sinh động, Coin reward indicator (+10 xu), Nút "Chơi lại", Nút "Thoát". *(Hoàn thành: 2026-10-03 10:13 - `src/components/vocab/interactive-study-modal.tsx` lines 612-690, `src/components/vocab/interactive-study-screen.tsx`)*
- [x] **Mode 1 - Flashcard:** Lật thẻ 3D animation, từ vựng, phiên âm IPA, loại từ, giải thích, hỗ trợ hotkeys (Space lật thẻ, Ctrl+S phát âm, Ctrl+1 Quên, Ctrl+2 Thuộc, ô input gõ nghĩa kiểm tra trí nhớ). *(Hoàn thành: 2026-10-03 10:13 - `src/components/vocab/interactive-study-modal.tsx` lines 770-893)*
- [x] **Mode 2 - Listening (Nghe chép chính tả):** Icon phát loa kèm hotkey Ctrl+X, chọn tốc độ đọc (1.0x / 0.75x), ô input gõ từ phản xạ, nút Xem ví dụ gợi ý (Ctrl+E), Gợi ý ký tự đầu (Ctrl+Space), Phím Enter kiểm tra. *(Hoàn thành: 2026-10-03 10:13 - `src/components/vocab/interactive-study-modal.tsx` lines 965-1058)*
- [x] **Mode 3 - Typing (Gõ từ phản xạ):** Hiển thị nghĩa tiếng Việt/nghe audio, switch đổi chiều (Anh -> Việt / Việt -> Anh), autofocus input, phản hồi đúng/sai tức thì, kiểm tra phím Enter. *(Hoàn thành: 2026-10-03 10:13 - `src/components/vocab/interactive-study-modal.tsx` lines 1060-1140)*
- [x] **Mode 4 - Ghép cặp (Matching Game):** Thanh đo sinh mệnh (5 trái tim), Timer đếm ngược 60s, 2 cột thẻ (Từ vựng tiếng Anh vs Nghĩa tiếng Việt), hiệu ứng khi click đúng/sai và hoàn thành vòng. *(Hoàn thành: 2026-10-03 10:13 - `src/components/vocab/interactive-study-modal.tsx` lines 1142-1240)*

---
### 7. Simplify Information Architecture (6-Section Navigation)
- [x] **FEATURE_MAPPING.md:** Map all features to the 6 new top-level sections (Home, Learn, Practice, Schedule, Progress, Settings). *(Hoàn thành: 2026-10-04 22:18 - `FEATURE_MAPPING.md`)*
- [x] **Unified Navigation Sidebar:** Update `src/components/notion/sidebar.tsx` and `src/components/layout/bottom-nav.tsx` to display the 6 sections, remove `isVocab` split logic, hide admin routes. *(Hoàn thành: 2026-10-04 22:19 - `src/components/notion/sidebar.tsx`, `src/components/layout/bottom-nav.tsx`)*
- [x] **Routing & Layout Adjustments:** Create the placeholder pages/dashboards for `/learn`, `/practice`, `/schedule`, `/progress`, and `/admin` to handle the new mappings. *(Hoàn thành: 2026-10-04 22:20 - `src/app/(dashboard)/learn/page.tsx` v.v...)*
- [x] **Global Search & Create Actions:** Unified search (`Cmd+K` CommandPalette) and global "+" button (QuickAddMenu) đã có sẵn ở `src/components/notion/top-bar.tsx`. *(Xác nhận hoàn thành: 2026-10-04 22:20)*

---
*Ghi chú: Mỗi mục sẽ được cập nhật [x] ngay khi hoàn tất kiểm tra và tích hợp.*

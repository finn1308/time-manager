# LUYENTU - TÀI LIỆU KIẾN TRÚC & TÍNH NĂNG CHI TIẾT

## 1. Giới thiệu tổng quan
**LUYENTU** là hệ thống học từ vựng tiếng Anh thông minh được tích hợp trực tiếp trong nền tảng học tập cá nhân. Hệ thống được thiết kế dựa trên 2 màn hình tham chiếu chuẩn:
1. **Màn hình Khóa học & Danh mục bộ từ (Screenshot 1)**: `/vocab/courses/[slug]`
   - Tiêu đề khóa học: `📚 A1 (0-3.0)` dành cho người mới bắt đầu học tiếng Anh.
   - Thống kê: `31 bộ từ`, `371 từ vựng`, `2% hoàn thành`.
   - Các nút tác vụ nhanh: `📌 Đã ghim` (amber-600), `🏆 BXH`, `⏱️ Học ngắt quãng` (emerald green).
   - Thanh tiến độ: `Tiến độ: 9/371 từ` (xanh lá).
   - Danh sách các bộ từ:
     - Bộ 1: `🏆 #1. Lời chào hỏi` (đã hoàn thành 100%, 9/9 từ, nút học nhanh).
     - Bộ 2 - 6: `🔒 2. Số đếm`, `🔒 3. Màu sắc`, `🔒 4. Ngày trong tuần`, `🔒 5. Tháng trong năm`, `🔒 6. Thời tiết` (khóa PRO, yêu cầu xu hoặc mở khóa).
     - Nút `🔓 Mở khóa` bằng xu hoặc gói PRO trọn đời.

2. **Màn hình Chi tiết Bộ từ & 6 Chế độ học (Screenshot 2)**: `/vocab/sets/[id]`
   - Tiêu đề bộ từ: `1. Lời chào hỏi`, `9 từ vựng`, `9/9 đã học (100%)`.
   - Thanh tiến độ đầy 100% màu xanh lá.
   - Thanh tùy chỉnh học tập:
     - `TRẠNG THÁI`: Chưa thuộc, Đang học, Đã thuộc, Yêu thích.
     - `SỐ LƯỢNG`: 5 từ, 10 từ, 15 từ, 20 từ, Tất cả.
     - `THỨ TỰ`: Ngẫu nhiên, Mặc định, A-Z.
     - Badge số lượng: `0/9 từ` cập nhật theo bộ lọc.
   - **Chọn chế độ học (6 Cards gradient đặc trưng)**:
     1. **Flashcard**: Gradient tím (`from-[#a78bfa] to-[#7c3aed]`), mô tả "Lật thẻ để học từ vựng", thưởng `+5 🟡`.
     2. **Quiz**: Gradient cam (`from-[#fdba74] to-[#f97316]`), mô tả "Trắc nghiệm chọn đáp...", thưởng `+10 🟡`.
     3. **Listening**: Gradient xanh dương lam (`from-[#67e8f9] to-[#0284c7]`), mô tả "Nghe từ và gõ lại (30s)", thưởng `+15 🟡`.
     4. **Typing**: Gradient xanh lá (`from-[#86efac] to-[#16a34a]`), mô tả "Xem nghĩa, gõ từ tiếng..", thưởng `+10 🟡`.
     5. **Ghép cặp**: Gradient xanh biển (`from-[#93c5fd] to-[#2563eb]`), mô tả "Nối từ với nghĩa", thưởng `+10 🟡`.
     6. **Đặc biệt**: Gradient hồng đỏ (`from-[#f472b6] to-[#db2777]`), huy hiệu `HOT 🔥`, mô tả "Hỗn hợp, đặt câu, Quá...", thưởng `+20 🟡`.

---

## 2. Kiến trúc Kỹ thuật (Technical Architecture)

### 2.1. Frontend
- **Framework**: Next.js 16.3.8 (Turbopack) & React 19.
- **Styling**: Tailwind CSS với bảng màu HSL emerald/sky/amber/rose hiện đại, hỗ trợ Dark Mode & Light Mode 100%.
- **Audio Synthesis**: Tích hợp Web Speech API (`window.speechSynthesis`) với giọng bản xứ tiếng Anh (en-US, en-GB) tự nhiên, không phụ thuộc vào file MP3 bên ngoài.
- **Interactive Study Engine**: Modal học tập toàn màn hình tương tác cao (`interactive-study-modal.tsx`), hỗ trợ phím tắt bàn phím và hiệu ứng chúc mừng hoàn thành.

### 2.2. Backend & REST API
- `/api/vocab/courses`: Lấy danh sách khóa học và tạo khóa mới.
- `/api/vocab/courses/[slug]`: Lấy dữ liệu chi tiết khóa học, danh sách bộ từ kèm tiến độ thực của user.
- `/api/vocab/courses/[slug]/pin`: Ghim / bỏ ghim khóa học lên đầu trang chủ.
- `/api/vocab/courses/[slug]/unlock`: Mở khóa toàn bộ bộ từ PRO bằng xu tích lũy.
- `/api/vocab/sets/[id]`: Lấy dữ liệu bộ từ, hỗ trợ lọc theo trạng thái, số lượng và thứ tự.
- `/api/vocab/words/[id]/progress`: Cập nhật tiến độ từ vựng theo thuật toán SuperMemo SM-2.
- `/api/vocab/sessions`: Ghi nhận phiên học thực tế, cập nhật số từ đã học, thưởng xu và XP vào tài khoản user.
- `/api/vocab/spaced-repetition`: Hàng đợi các từ đến hạn ôn tập ngắt quãng hôm nay.
- `/api/vocab/shop`: Danh mục phần thưởng và API mua sắm (PRO pass, streak freeze, huy hiệu).
- `/api/vocab/leaderboard`: Xếp hạng học viên theo phiên học và xu.
- `/api/vocab/admin/*`: Quản trị hệ thống, thêm từ, tạo bộ từ, đổi trạng thái PRO.

### 2.3. Cơ sở dữ liệu (PostgreSQL via Prisma ORM)
- `VocabCourse`: Lưu thông tin khóa học (slug, title, subtitle, level, isPublished).
- `WordSet`: Lưu thông tin bộ từ vựng (courseId, orderNumber, title, description, isPro).
- `VocabWord`: Lưu từng từ vựng (term, phonetic, partOfSpeech, meaning, exampleSentence, exampleMeaning, explanation).
- `UserCourseEnrollment`: Lưu trạng thái người dùng với khóa học (isPinned, isUnlocked).
- `UserWordSetProgress`: Lưu tiến độ học theo từng bộ từ (completedWords, totalWords, isMastered).
- `UserWordProgress`: Lưu trạng thái và dữ liệu SM-2 cho từng từ của người dùng (status, repetition, intervalDays, easeFactor, nextReviewDate, isFavorite).
- `VocabStudySession`: Lưu lịch sử mỗi lần học (mode, totalItems, correctItems, accuracy, durationSeconds, coinsEarned).
- `ShopItem` & `UserPurchase`: Hệ thống cửa hàng và lịch sử giao dịch xu.

### 2.4. Thuật toán SuperMemo SM-2
```typescript
if (quality >= 3) {
  if (repetition === 0) newInterval = 1;
  else if (repetition === 1) newInterval = 6;
  else newInterval = Math.round(intervalDays * easeFactor);
  newRepetition = repetition + 1;
} else {
  newRepetition = 0;
  newInterval = 1;
}
newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
```

---

## 3. Quy trình Kiểm thử & Xác thực
- **Unit & Integration Test Suite**: `npm run test:vocab` (42/42 tests pass 100%).
- **Project Full Test Suite**: `npm run test:all` (73/73 tests pass 100%).
- **Type Checking**: `npx tsc --noEmit` (0 errors).
- **Production Build**: `npm run build` (Tất cả 106 routes compile sạch sẽ, 0 warnings/errors).

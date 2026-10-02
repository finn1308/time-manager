# ChronoMind & LUYENTU — Nền tảng Học tập & Quản lý Thời gian Full-Stack

ChronoMind là hệ điều hành học thuật cá nhân full-stack, tích hợp hoàn chỉnh hệ thống học từ vựng thông minh **LUYENTU** chuẩn quốc tế theo giao diện tham chiếu 100% (Visual & Functionality Parity).

---

## 🌟 Điểm Nổi Bật Của Hệ Thống LUYENTU & ChronoMind

1. **Nền tảng Học Từ Vựng LUYENTU (100% Reference Parity)**:
   - **Màn hình Khóa học & Bộ từ** (`/vocab/courses/a1-0-3-0`): Khóa A1 (0-3.0), 31 bộ từ vựng, 371 từ, thanh tiến độ xanh lá, các nút `📌 Đã ghim`, `🏆 BXH`, `⏱️ Học ngắt quãng`.
   - **Bộ từ #1 "Lời chào hỏi"**: 9 từ vựng hoàn chỉnh, thanh tiến độ 100%, huy hiệu thành tích và nút vào học nhanh.
   - **Các bộ từ 2-6** ("Số đếm", "Màu sắc", "Ngày trong tuần", "Tháng trong năm", "Thời tiết"): Khóa PRO với cơ chế mở khóa bằng xu tích lũy hoặc gói VIP.
   - **Bộ lọc tùy chỉnh thông minh**: Lọc theo TRẠNG THÁI (Chưa thuộc, Đang học, Đã thuộc, Yêu thích), SỐ LƯỢNG (5, 10, 15, 20, Tất cả), THỨ TỰ (Ngẫu nhiên, Mặc định, A-Z).
   - **6 Chế độ học tập Gradient sống động**:
     - 🗂️ **Flashcard**: Lật thẻ 3D, âm thanh bản xứ Web Speech, thưởng `+5 🟡`.
     - 📝 **Quiz**: Trắc nghiệm 4 lựa chọn, giải thích chi tiết, thưởng `+10 🟡`.
     - 🎧 **Listening**: Luyện nghe & gõ lại với đồng hồ đếm ngược 30s, thưởng `+15 🟡`.
     - ⌨️ **Typing**: Xem nghĩa tiếng Việt gõ từ tiếng Anh, thưởng `+10 🟡`.
     - 🧩 **Ghép cặp**: Trò chơi nối từ - nghĩa tương tác cao, thưởng `+10 🟡`.
     - 🔥 **Đặc biệt (HOT)**: Thử thách tổng hợp câu hỏi hỗn hợp, thưởng `+20 🟡`.
   - **Thuật toán Lặp lại Ngắt quãng SuperMemo SM-2**: Tự động tính toán chu kỳ lặp tối ưu (`repetition`, `intervalDays`, `easeFactor`, `nextReviewDate`).
   - **Hệ thống Gamification & Shop**: Tích lũy xu sau mỗi bài học, mua gói PRO trọn đời, Streak Freeze, huy hiệu danh dự và bảng xếp hạng thời gian thực.
   - **Bảng điều khiển Quản trị (`/vocab/admin`)**: Quản lý bộ từ, tạo từ vựng mới kèm phiên âm IPA, câu ví dụ, đổi trạng thái PRO.

2. **Dữ liệu thật & Persistent Storage**:
   - Tách biệt hoàn toàn theo `userId`, bảo mật dữ liệu tuyệt đối giữa các người dùng.
   - Lưu trữ Database thực tế (PostgreSQL / Supabase cho Production).
   - Hỗ trợ lưu trữ dữ liệu ổn định nhiều năm, không bị mất khi đóng trình duyệt hoặc refresh trang.

3. **Thuật toán Chống Xung đột Lịch Học (Deterministic Conflict Detection)**:
   - Server-side validation layer kiểm tra từng giây phút được AI đề xuất.
   - Ngăn chặn tuyệt đối việc trùng lặp với: Calendar Event, Khung giờ cố định bị khóa (Locked Event), Thời gian ngủ/nghỉ hoặc ngoài khung thời gian khả dụng.

4. **Picture-in-Picture & Floating Study Timer**:
   - Tích hợp chuẩn **W3C Document Picture-in-Picture API** (`window.documentPictureInPicture.requestWindow`).
   - Tự động fallback về Floating Mini-Player di chuyển được khi trình duyệt chưa hỗ trợ API PiP.
   - Ghi nhận chính xác `actual_duration_seconds` vào Database (`StudySession`).

5. **Bảo mật API Key AI Cá nhân (Zero Client Exposure)**:
   - Hỗ trợ Google Gemini, OpenAI và Anthropic Claude.
   - Mã hóa đối xứng **AES-256-GCM** (kèm IV và Auth Tag 128-bit) trước khi lưu vào Database.
   - API Key không bao giờ bị trả về trình duyệt (chỉ hiển thị `••••••••`). Mọi tác vụ AI đều được thực thi bảo mật tại Next.js Route Handlers.

---

## 📋 Hướng dẫn Cài đặt & Triển khai (10 Bước)

### 1. Clone Project
```bash
git clone <repository_url>
cd "Time manager"
```

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Tạo Supabase Project
- Đăng nhập vào [Supabase Console](https://supabase.com).
- Nhấp **New project**, chọn Tổ chức (Organization) và đặt tên dự án (VD: `chronomind-prod`).
- Chọn khu vực (Region) gần Việt Nam nhất (VD: `Singapore - ap-southeast-1`) và đặt mật khẩu cơ sở dữ liệu mạnh.

### 4. Tạo Database & Lấy Connection String
- Trong Supabase Dashboard, điều hướng đến **Project Settings** → **Database**.
- Lấy thông tin kết nối Connection Pooling (Session mode port `5432` hoặc Transaction mode port `6543` với PgBouncer).
- Copy chuỗi kết nối URI có dạng:
  `postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

### 5. Cấu hình File `.env`
Sao chép mẫu cấu hình và điền các biến môi trường cần thiết:
```bash
cp .env.example .env
```
Thiết lập các biến bắt buộc:
```env
# Kết nối PostgreSQL Supabase (Hoặc "file:./dev.db" nếu chạy SQLite cục bộ)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Khóa phiên JWT (Ít nhất 32 ký tự ngẫu nhiên)
AUTH_SECRET="your-super-secret-random-jwt-key-32-chars-long"

# Khóa mã hóa AES-256-GCM (64 ký tự hex ngẫu nhiên)
# Tạo bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_SECRET_KEY="c8b2f90145a329de7e9b04f14a82194c79435b80145c2692e104fba28d09321c"

# Múi giờ ứng dụng
NEXT_PUBLIC_APP_TIMEZONE="Asia/Ho_Chi_Minh"
```

### 6. Chạy Migration Database
Nếu triển khai lên Supabase PostgreSQL:
- Đảm bảo trong `prisma/schema.prisma` mục `datasource db` có `provider = "postgresql"` (hoặc sao chép từ `prisma/schema.postgresql.prisma`).
- Chạy lệnh đẩy schema và tạo toàn bộ bảng:
```bash
npx prisma db push
```

### 7. Chạy Development Server
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000). Đăng ký tài khoản người dùng mới để bắt đầu sử dụng với trạng thái sạch 100%.

### 8. Cấu hình Google OAuth (Tùy chọn)
- Truy cập [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**.
- Tạo **OAuth 2.0 Client ID** (Web application).
- Thêm Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (hoặc domain production của bạn).
- Thêm `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET` vào file `.env`.

### 9. Cấu hình AI Provider Cá nhân
- Đăng nhập vào ChronoMind, truy cập trang **Cài đặt** (Settings).
- Chọn nhà cung cấp: **Google Gemini**, **OpenAI** hoặc **Anthropic Claude**.
- Dán API Key cá nhân của bạn, bấm **Kiểm tra kết nối** để kiểm tra API Key thực tế và bấm **Lưu khóa**. Khóa sẽ được mã hóa AES-256 trước khi lưu vào DB.

### 10. Triển khai Production (Vercel)
- Đẩy mã nguồn lên kho chứa GitHub cá nhân.
- Đăng nhập [Vercel](https://vercel.com) và nhập dự án từ GitHub.
- Cấu hình toàn bộ biến môi trường đã chuẩn bị ở Bước 5 vào tab **Environment Variables** trên Vercel.
- Nhấp **Deploy**. Vercel sẽ tự động build và cung cấp domain HTTPS hoàn chỉnh cho bạn.

---

## 🧪 Kiểm Thử Hệ Thống (100% Automated Tests Pass)

Dự án tích hợp đầy đủ 4 bộ kiểm thử tự động, xác thực toàn bộ logic thuật toán, cơ sở dữ liệu và bảo mật:

```bash
# Chạy toàn bộ 73 bài kiểm thử (100% Pass)
npm run test:all

# Kiểm thử riêng hệ thống học từ vựng LUYENTU (42/42 Pass)
npm run test:vocab

# Kiểm thử chống xung đột lịch học & Picture-in-Picture
npm run test:scheduling

# Kiểm thử bóc tách giáo trình PDF & sinh trắc nghiệm AI
npm run test:learning

# Kiểm thử tính toán tín chỉ & GPA học thuật 4 năm
npm run test:academic
```

---

## 💡 Dữ liệu Kiểm thử & Khởi tạo (Vocab Seed)

Hệ thống cung cấp lệnh seed để khởi tạo khóa học chuẩn `A1 (0-3.0)`, các bộ từ vựng và vật phẩm trong cửa hàng:
```bash
npm run seed:vocab
```

*Lưu ý:* Khi người dùng mới đăng ký tài khoản, dữ liệu học tập cá nhân (tiến độ từ vựng, lịch sử làm bài, điểm thưởng, ghi chú) luôn bắt đầu sạch (Clean State) và gắn liền độc quyền với `userId` đó.

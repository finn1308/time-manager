# ChronoMind — Hệ điều hành Quản lý Thời gian & Lịch học Cá nhân

ChronoMind là ứng dụng web full-stack quản lý thời gian, lịch học và mục tiêu cá nhân với giao diện **100% Pastel Green** (xanh lá pastel/mint/sage) tối giản, hiện đại, tích hợp bộ lập lịch AI và bảo vệ khung giờ bận bằng thuật toán kiểm tra xung đột thời gian thực.

---

## 🌿 Điểm nổi bật về Thiết kế & Tính năng

1. **Giao diện 100% Pastel Green**:
   - Hệ thống CSS variables chuẩn xác (`--background`, `--surface`, `--primary`, `--primary-light`, `--accent`, `--border`, `--text-primary`, `--text-secondary`).
   - Bo góc lớn mềm mại đồng nhất (`rounded-[24px]`, `rounded-[28px]`, `rounded-full`), bóng đổ nhẹ nhàng, không gây chói mắt.
   - Trạng thái trống (Empty State) tự nhiên, KHÔNG hiển thị dữ liệu giả/demo để mị mắt người dùng.

2. **Dữ liệu thật & Persistent Storage**:
   - Tách biệt hoàn toàn theo `userId`, bảo mật dữ liệu tuyệt đối giữa các người dùng.
   - Lưu trữ Database thực tế (PostgreSQL / Supabase cho Production, SQLite cho phát triển cục bộ).
   - Hỗ trợ lưu trữ dữ liệu ổn định nhiều năm, không bị mất khi đóng trình duyệt hoặc deploy lại website.

3. **Thuật toán Chống Xung đột Lịch Học (Deterministic Conflict Detection)**:
   - Server-side validation layer kiểm tra từng giây phút được AI đề xuất.
   - Ngăn chặn tuyệt đối việc trùng lặp với: Calendar Event, Khung giờ cố định bị khóa (Locked Event), Thời gian ngủ/nghỉ hoặc ngoài khung thời gian khả dụng.
   - Đã được kiểm thử tự động với bộ test suite `npm run test:scheduling`.

4. **Picture-in-Picture & Floating Study Timer**:
   - Tích hợp chuẩn **W3C Document Picture-in-Picture API** (`window.documentPictureInPicture.requestWindow`).
   - Tự động fallback về Floating Mini-Player di chuyển được khi trình duyệt chưa hỗ trợ API PiP.
   - Ghi nhận chính xác `actual_duration_seconds` vào Database (`StudySession`) khi dừng phiên, không đánh đồng thời gian dự kiến (planned) thành thời gian thực tế.

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

## 🧪 Kiểm thử Lập lịch & Chống Xung Đột

Dự án tích hợp sẵn bộ kiểm thử độc lập cho logic phát hiện xung đột thời gian (Conflict Detection):
```bash
npm run test:scheduling
```
Bộ test kiểm tra nghiêm ngặt kịch bản:
- Sự kiện cố định: `19:00 - 20:00`
- Đề xuất học tập của AI: `19:30 - 20:30`
- **Kết quả trả về**: `CONFLICT` (Từ chối lưu vào Database).

---

## 💡 Dữ liệu Kiểm thử (Seed Data)

*Lưu ý quan trọng:* Toàn bộ dữ liệu demo/mẫu đã được gỡ bỏ khỏi luồng mặc định của ứng dụng để bảo đảm tính trung thực của Empty State người dùng mới. Nếu nhà phát triển muốn nạp dữ liệu mẫu cho mục đích kiểm thử cục bộ:
```bash
npm run seed
```
*Lệnh này tách biệt và KHÔNG BAO GIỜ tự động thực thi trong môi trường Production.*

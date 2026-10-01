# ChronoMind (Time Manager) — Notion-Inspired Time & Study Operating System

ChronoMind là hệ điều hành quản lý thời gian và lịch học thông minh toàn diện (Full-Stack Production Web App) được thiết kế lấy cảm hứng từ Notion.

---

## 🌟 Tính năng nổi bật (Core Features)

1. **Giao diện tối giản phong cách Notion (Notion Aesthetics)**:
   - Bảng màu xám ấm tinh tế, font chữ tối ưu hiển thị, viền mảnh thanh lịch, pastel tags và collapsible sidebar.
   - Hỗ trợ chế độ Sáng/Tối (Light/Dark mode) mượt mà.
2. **Xác thực & Quản lý phiên an toàn**:
   - Tích hợp 1-Click Demo Login (`demo@chronomind.app`) để trải nghiệm ngay lập tức.
   - Hỗ trợ đăng nhập Email & Password (băm mật khẩu với `bcryptjs`, quản lý phiên JWT an toàn với `jose` qua HTTP-only cookies).
   - Hỗ trợ Google OAuth 2.0.
3. **Múi giờ Việt Nam (UTC+7 / `Asia/Ho_Chi_Minh`)**:
   - Mọi lịch học, khung giờ bận và báo cáo thống kê đều được neo chuẩn xác theo giờ Việt Nam qua thư viện `date-fns-tz`.
4. **Lịch tuần & tháng tương tác (Week / Month Calendar)**:
   - Chế độ Tuần hiển thị lưới thời gian từ 06:00 đến 23:00.
   - Khung giờ bị khóa / lịch bận cố định hiển thị họa tiết gạch sọc chéo kèm biểu tượng ổ khóa 🔒.
   - Các buổi học được phân màu theo môn học, có đánh dấu hoàn thành và nút bấm bắt đầu học ngay.
5. **Picture-in-Picture & Floating Study Timer**:
   - Sử dụng **W3C Document Picture-in-Picture API** (`window.documentPictureInPicture.requestWindow`) cho phép đưa cửa sổ React Mini-Player ra ngoài desktop của hệ điều hành để theo dõi thời gian khi mở ứng dụng khác.
   - Tự động kích hoạt Floating In-App Draggable Widget nếu trình duyệt chưa hỗ trợ Document PiP.
   - Đồng hồ bấm giờ chuẩn xác cao (dùng độ lệch timestamp `Date.now() - startedAt`), lưu trạng thái tạm vào `localStorage`.
   - Nút Dừng & Lưu mở Modal ghi nhận số phút thực tế, đánh giá năng suất (1-5 sao) và ghi chú buổi học, đồng bộ thẳng vào Database `StudyLog`.
6. **AI Study Scheduler & Thuật toán chống xung đột (Conflict-Free Scheduling)**:
   - Đọc danh sách môn học, chỉ tiêu số giờ cần học và số giờ còn thiếu.
   - Đọc toàn bộ danh sách `BlockedSlot` (giờ ngủ đêm, lịch học trường) và các sự kiện đã có.
   - Đưa ra lịch học tối ưu: mỗi buổi 45 - 120 phút, có khoảng nghỉ đệm 10 - 15 phút, ưu tiên môn có Priority cao.
   - Hỗ trợ gọi AI đa nền tảng (**Google Gemini 1.5 Flash**, **OpenAI GPT-4o-mini**, **Anthropic Claude 3.5 Haiku**) với API Key cá nhân của người dùng.
   - Tích hợp sẵn **Local Constraint Satisfaction Heuristic Engine** chạy offline ngay cả khi chưa thêm API Key!
   - Giao diện Modal xem trước lịch với tính năng chọn lọc và chấp nhận hàng loạt (Batch Commit).
7. **Bảo mật API Key cá nhân (Zero-Client-Exposure)**:
   - API Key được mã hóa đối xứng **AES-256-GCM** trước khi lưu vào Database (`encryptedKey`, `iv`, `authTag`).
   - Server chỉ giải mã tạm trong RAM khi gọi AI, tuyệt đối không bao giờ trả API key về client.
8. **Dashboard Phân tích Planned vs Actual**:
   - KPI Cards: Số giờ thực tế, Số giờ kế hoạch, Tỷ lệ hoàn thành (%), Chuỗi học liên tục (Streak).
   - Biểu đồ cột kép Recharts so sánh Planned vs Actual theo từng ngày.
   - Biểu đồ nhiệt năng suất (Productivity Heatmap) 28 ngày phong cách GitHub.
   - Phân bổ tỷ lệ thời gian giữa các môn học.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, Turbopack, React 19)
- **Database**: PostgreSQL (Supabase / Neon) & SQLite cho phát triển cục bộ
- **ORM**: Prisma ORM v6.19.3
- **Security**: Node.js `crypto` (AES-256-GCM), `jose` (JWT), `bcryptjs`
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Data & Charts**: `recharts`, `date-fns`, `date-fns-tz`, `zod`

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Cài đặt dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Khởi tạo Database & Seed dữ liệu mẫu
```bash
# Đồng bộ Prisma Schema với SQLite local
npx prisma db push

# Nạp dữ liệu mẫu (Tài khoản demo, 4 môn học, giờ bận, lịch tuần, nhật ký học)
npm run seed
```

### 3. Chạy môi trường phát triển (Development Server)
```bash
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

**Tài khoản đăng nhập có sẵn:**
- **1-Click**: Bấm nút *"Vào ngay tài khoản Demo"* tại trang login.
- Hoặc đăng nhập thủ công:
  - **Email**: `demo@chronomind.app`
  - **Mật khẩu**: `ChronoMind123!`

---

## 🔐 Cấu hình Biến môi trường (.env)

Xem file [.env.example](file:///Users/huy/Downloads/Time%20manager/.env.example):
```env
# Database cục bộ
DATABASE_URL="file:./dev.db"

# Session JWT Secret
AUTH_SECRET="chronomind_jwt_secret_key_production_grade_32_bytes_long_random"

# Khóa bí mật 32-byte mã hóa API Key AES-256-GCM
ENCRYPTION_SECRET_KEY="c8b2f90145a329de7e9b04f14a82194c79435b80145c2692e104fba28d09321c"

# Múi giờ mặc định
NEXT_PUBLIC_APP_TIMEZONE="Asia/Ho_Chi_Minh"
```

---

## 🚢 Triển khai lên Production (Vercel + Supabase)

1. Tạo cơ sở dữ liệu PostgreSQL trên [Supabase](https://supabase.com) hoặc [Neon](https://neon.tech).
2. Trong `prisma/schema.prisma`, đổi `provider = "sqlite"` thành `provider = "postgresql"` (hoặc sao chép từ file `prisma/schema.postgresql.prisma`).
3. Cập nhật `DATABASE_URL` trong biến môi trường của Vercel trỏ tới connection string Supabase.
4. Chạy `npx prisma db push` trên database production.
5. Deploy project lên Vercel.

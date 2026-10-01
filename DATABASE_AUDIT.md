# BÁO CÁO KIỂM TRA DATABASE & KHẢ NĂNG LƯU TRỮ LÂU DÀI (DATABASE AUDIT)

Tài liệu này đánh giá tính toàn vẹn, khả năng bền vững (persistence) và kiến trúc lưu trữ dữ liệu của dự án **ChronoMind**.

---

## 1. Trả Lời 10 Câu Hỏi Trọng Yếu Về Lưu Trữ Dữ Liệu

### 1. Database đang sử dụng là gì?
- **Môi trường phát triển cục bộ (Local Dev):** Sử dụng **SQLite** (`file:./prisma/dev.db`) qua **Prisma ORM (v6.19.3)**.
- **Môi trường Production:** Đã được thiết kế sẵn sàng cho **PostgreSQL** (chạy trên **Supabase**, AWS RDS, Neon, hoặc Railway) thông qua schema production chuẩn hóa `prisma/schema.postgresql.prisma`.

### 2. Dữ liệu đang được lưu ở đâu?
- **Ở local:** Lưu trữ trực tiếp trên file nhị phân `prisma/dev.db` nằm trong ổ cứng máy chủ của lập trình viên.
- **Ở production:** Lưu trữ trên cụm cơ sở dữ liệu quan hệ PostgreSQL đám mây (Cloud Managed PostgreSQL cluster), nằm độc lập hoàn toàn với runtime của ứng dụng Next.js.
- **Tuyệt đối KHÔNG lưu trữ nghiệp vụ trong `localStorage`:** `localStorage` chỉ được sử dụng cho các trạng thái giao diện tạm thời (chẳng hạn như vị trí cửa sổ timer nổi khi người dùng kéo rê chuột). Mọi thực thể: Người dùng, Môn học, Mục tiêu, Sự kiện lịch, Phiên học thực tế và API Key đều nằm 100% trong Database.

### 3. Khi tôi đóng trình duyệt rồi mở lại, dữ liệu có còn không?
- **CÒN NGUYÊN VẸN 100%.**
- Cơ chế: Trình duyệt chỉ gửi yêu cầu HTTP. Toàn bộ thông tin học tập, lịch trình đã được ghi nhận trực tiếp vào Database thông qua Server Actions / API Routes. Khi mở lại trình duyệt và đăng nhập, dữ liệu được truy vấn từ Database và hiển thị đầy đủ.

### 4. Khi deploy website lên production, dữ liệu có còn không?
- **Nếu dùng PostgreSQL / Supabase:** **CÒN NGUYÊN VẸN 100%**. Database nằm độc lập tại Supabase/AWS.
- **Cảnh báo trung thực với SQLite:** Nếu bạn deploy file SQLite (`dev.db`) lên các nền tảng Serverless không có đĩa cứng lưu trữ liên tục (ephemeral filesystem) như Vercel hoặc Netlify, mỗi lần Vercel tạo container mới thì file SQLite sẽ bị reset về ban đầu.
- **Giải pháp chính thức:** Khi deploy production, chỉ cần đổi chuỗi kết nối `DATABASE_URL` sang Supabase PostgreSQL và dùng file cấu hình `prisma/schema.postgresql.prisma`. Khi đó, dữ liệu tồn tại vĩnh viễn trên Cloud.

### 5. Database có persistent storage hay chỉ lưu memory/localStorage?
- Database có **Persistent Storage** thực sự (ghi xuống đĩa cứng với SQLite ở local, và ghi xuống đĩa NVMe SSD có WAL replication với PostgreSQL ở production). Hoàn toàn không phải bộ nhớ RAM tạm thời (in-memory) và không phải `localStorage`.

### 6. Nếu server restart thì dữ liệu có mất không?
- **KHÔNG MẤT.**
- Cả SQLite (ghi xuống đĩa file `dev.db`) và PostgreSQL đều tuân thủ chuẩn **ACID** (Atomicity, Consistency, Isolation, Durability). Quá trình server ứng dụng khởi động lại không ảnh hưởng đến dữ liệu đã commit.

### 7. Nếu deploy lại project thì dữ liệu có mất không?
- Với kiến trúc Production nối sang **Supabase / Cloud PostgreSQL**: **KHÔNG MẤT**. Dữ liệu nằm ở một server database chuyên biệt, ứng dụng web chỉ là stateless consumer. Khi bạn deploy bản cập nhật code mới, kết nối database vẫn giữ nguyên toàn bộ dữ liệu lịch sử.

### 8. Có backup database không?
- **Ở local SQLite:** Lập trình viên có thể copy file `dev.db` bất cứ lúc nào.
- **Ở production (Supabase / Managed PostgreSQL):** Tự động bật tính năng **Point-in-Time Recovery (PITR)** và Daily Backups tự động, đảm bảo khôi phục dữ liệu ở bất kỳ giây nào khi xảy ra sự cố.

### 9. Có migration system không?
- **CÓ.**
- Dự án sử dụng **Prisma Migrate**:
  - Lệnh tạo và áp dụng migration: `npx prisma migrate dev`
  - Lệnh kiểm tra trạng thái: `npx prisma migrate status`
  - Lệnh đồng bộ schema cho production: `npx prisma migrate deploy` hoặc `npx prisma db push`.
- Mọi thay đổi bảng, cột, khóa ngoại đều được version hóa theo thời gian trong thư mục `prisma/migrations/`.

### 10. Có thể lưu dữ liệu trong nhiều năm không?
- **HOÀN TOÀN CÓ THỂ LƯU TRỮ HÀNG CHỤC NĂM.**
- Với mô hình quan hệ PostgreSQL đã index tối ưu (`userId`, `startTime`, `endTime`, `actualStart`), cơ sở dữ liệu có khả năng lưu trữ hàng triệu phiên học của người dùng qua nhiều năm học tập mà không suy giảm hiệu năng.

---

## 2. Hướng Dẫn Chuyển Sang PostgreSQL / Supabase Khi Deploy Production

1. Đăng ký tài khoản miễn phí tại [Supabase.com](https://supabase.com).
2. Tạo New Project (chọn Region Singapore hoặc Tokyo để có độ trễ thấp nhất đến Việt Nam).
3. Lấy chuỗi kết nối **Transaction Pooler** (cổng 6543) hoặc **Session Direct Connection** (cổng 5432) trong phần *Project Settings -> Database*.
4. Cấu hình file `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```
5. Đổi `provider = "sqlite"` thành `provider = "postgresql"` trong `prisma/schema.prisma` (hoặc sao chép nội dung từ `prisma/schema.postgresql.prisma`).
6. Chạy lệnh:
   ```bash
   npx prisma db push
   ```
Toàn bộ hệ thống bảng quan hệ, khóa ngoại, chỉ mục (indexes) và ràng buộc toàn vẹn sẽ được khởi tạo hoàn chỉnh ngay lập tức.

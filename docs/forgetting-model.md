# ⏳ LUYENTU - Mô Hình Đường Cong Quên Lãng (Forgetting Model)

Tài liệu này trình bày nguyên lý khoa học và công thức toán học của mô hình bán rã trí nhớ (Half-Life Memory Retention Model) áp dụng trong hệ thống Học Thích Ứng LUYENTU.

---

## 1. NGUYÊN LÝ ĐƯỜNG CONG QUÊN LÃNG EBBINGHAUS

Một từ vựng được học hôm nay **không đồng nghĩa với việc sẽ được ghi nhớ mãi mãi**. Trí nhớ con người suy giảm theo hàm mũ theo thời gian nếu không có sự gợi nhắc ngắt quãng.

Thay vì đưa điểm về 0 khi lâu ngày không ôn, LUYENTU tính toán **Xác suất lưu giữ tức thời $R(t)$** và **Nguy cơ quên lãng (Forgetting Risk)** liên tục theo thời gian trôi qua.

---

## 2. CÔNG THỨC TOÁN HỌC (HALF-LIFE RETENTION MODEL)

Xác suất truy xuất thành công $R(t)$ sau $t$ ngày kể từ lần ôn tập cuối cùng được mô tả bởi phương trình:
$$R(t) = 2^{-\frac{t}{S}}$$
Trong đó:
- $t$: Khoảng thời gian trôi qua kể từ lần ôn tập gần nhất (tính bằng ngày).
- $S$: **Độ bền trí nhớ (Memory Stability / Half-life)**: Số ngày cần thiết để xác suất ghi nhớ giảm xuống còn $50\%$.

### Nguy cơ quên lãng tức thời (Forgetting Risk)
$$\text{ForgettingRisk}(t) = 1.0 - R(t)$$
- Khi $t = 0$ (vừa học xong): $R(0) = 1.0 \implies \text{ForgettingRisk} = 0.0$.
- Khi $t = S$ (chạm chu kỳ bán rã): $R(S) = 0.5 \implies \text{ForgettingRisk} = 0.5$.
- Khi $t \gg S$: $R(t) \to 0 \implies \text{ForgettingRisk} \to 1.0$ (nguy cơ quên hoàn toàn).

---

## 3. CƠ CHẾ CẬP NHẬT ĐỘ BỀN TRÍ NHỚ (MEMORY STABILITY UPDATE)

Mỗi lần ôn tập thành công, mạng lưới neuron được củng cố và độ bền trí nhớ $S$ tăng lên theo cấp số nhân (Spaced Repetition Compounding):

### A. Khi ôn tập thành công ($isCorrect = \text{true}$)
$$S_{new} = S_{old} \times (1.4 + 1.2 \times K)$$
- Từ có điểm thành thạo $K$ càng cao, độ bền $S$ mở rộng càng nhanh.
- Giới hạn tối đa (Cap): $S \le 365\text{ ngày}$.

### B. Khi ôn tập thất bại ($isCorrect = \text{false}$)
Trí nhớ bị đứt đoạn, độ bền sụp đổ về mức cơ sở:
$$S_{new} = \max(0.6, S_{old} \times 0.35)$$

---

## 4. TỰ ĐỘNG LÊN LỊCH THỜI ĐIỂM ÔN TẬP TỐI ƯU (`nextReviewAt`)

Hệ thống đặt ngưỡng duy trì mục tiêu là **$88\%$** ($\theta = 0.88$). Một buổi ôn tập sẽ được lên lịch chính xác tại thời điểm $R(t)$ vừa chạm ngưỡng $88\%$:
$$R(t_{\text{target}}) = \theta \iff 2^{-\frac{t_{\text{target}}}{S}} = 0.88$$
Lấy logarit cơ số 2 hai vế:
$$-\frac{t_{\text{target}}}{S} = \log_2(0.88) \iff t_{\text{target}} = -S \times \frac{\ln(0.88)}{\ln(2)} \approx S \times 0.1844\text{ (ngày)}$$

Do đó:
$$\text{nextReviewAt} = \text{CurrentTimestamp} + t_{\text{target}} \times 24 \times 3600 \times 1000\text{ (ms)}$$

---

## 5. ĐIỂM TRI THỨC HIỆU DỤNG THỜI GIAN THỰC (EFFECTIVE KNOWLEDGE)

Khi người dùng mở ứng dụng, hệ thống tính toán điểm tri thức hiệu dụng đã được chiết khấu theo thời gian quên lãng:
$$K_{\text{effective}}(t) = K_{\text{base}} \times R(t)$$
Nhờ công thức này, những từ học viên đã từng thành thạo ($0.95$) nhưng bỏ quên 6 tháng sẽ tự động bị hạ điểm hiệu dụng và được thuật toán ưu tiên đẩy lên kiểm tra lại.

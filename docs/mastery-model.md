# 📐 LUYENTU - Mô Hình Đo Lường Độ Thành Thạo (Mastery Model)

Tài liệu này trình bày chi tiết công thức toán học và cơ chế đo lường điểm tri thức liên tục trong hệ thống Học Thích Ứng của LUYENTU.

---

## 1. MỤC TIÊU CÔNG THỨC

Điểm thành thạo $K$ phải phản ánh chân thực năng lực ghi nhớ và phản xạ của học viên trên khoảng chuẩn hóa:
$$K \in [0.0, 1.0]$$
- $0.0 \le K < 0.40$: **WEAK** (Chưa thuộc / Cần củng cố).
- $0.40 \le K < 0.65$: **MEDIUM** (Đang trong quá trình ghi nhớ).
- $0.65 \le K < 0.85$: **STRONG** (Vững vàng, truy xuất nhanh).
- $0.85 \le K \le 1.0$: **MASTERED** (Đã thành thạo, chuyển vào trí nhớ dài hạn).

---

## 2. CÁC TÍN HIỆU ĐẦU VÀO (MULTI-SIGNAL INPUTS)

Mô hình không chỉ dựa vào việc đúng/sai mà kết hợp 5 nhóm tín hiệu:
1. **Kết quả truy xuất ($isCorrect \in \{0, 1\}$)**.
2. **Thời gian phản xạ ($T$ tính bằng giây)**: Đo lường mức độ tự tin nhận thức.
3. **Chuỗi thành công / thất bại liên tiếp ($C_{correct}, C_{incorrect}$)**.
4. **Độ sâu nhận thức của dạng câu hỏi ($W_{type}$)**.
5. **Độ khó của câu hỏi ($D \in [0.1, 1.0]$)**.

---

## 3. CÔNG THỨC CHI TIẾT

### A. Hệ số thời gian phản hồi (Speed Factor $\sigma(T)$)
Thời gian phản xạ của người học phản ánh trạng thái nhận thức:
- Nếu $T < 2.5\text{s}$: Truy xuất tự động, tự tin $\to \sigma(T) = \min(1.2, 1.0 + (2.5 - T) \times 0.1)$.
- Nếu $2.5\text{s} \le T \le 5.0\text{s}$: Suy nghĩ bình thường $\to \sigma(T) = 1.0 - (T - 2.5) \times 0.04$.
- Nếu $5.0\text{s} < T \le 10.0\text{s}$: Chần chừ, gặp khó khăn $\to \sigma(T) = 0.9 - (T - 5.0) \times 0.06$.
- Nếu $T > 10.0\text{s}$: Đoán mò hoặc tra cứu ngoài $\to \sigma(T) = 0.5$.

### B. Trọng số dạng câu hỏi ($W_{type}$)
- **Recognition** (Nhìn từ tiếng Anh $\to$ chọn nghĩa tiếng Việt): $W = 0.80$ (Nhận thức thụ động).
- **Listening** (Nghe phát âm $\to$ chọn từ): $W = 0.95$.
- **Sentence Completion** (Điền từ vào ngữ cảnh câu): $W = 1.00$.
- **Active Recall** (Nhìn nghĩa tiếng Việt $\to$ chọn từ tiếng Anh): $W = 1.15$ (Truy xuất chủ động).
- **Spelling / Typing** (Gõ chính xác từng ký tự): $W = 1.25$ (Kích hoạt vận động & mã hóa sâu).

### C. Tính điểm cập nhật khi Trả lời Đúng
Học tập có tính chất tiệm cận (diminishing returns): Khi điểm đã cao, mỗi lần đúng sẽ tăng ít hơn để chống lạm phát điểm:
$$\Delta K = (1.0 - K_{old}) \times \beta \times \sigma(T) \times W_{type} \times (0.7 + 0.5 \times D) + \text{StreakBonus}$$
Trong đó:
- $\beta = 0.22$ (tốc độ học cơ sở).
- $\text{StreakBonus} = \min(0.12, C_{correct} \times 0.03) \times (1.0 - K_{old})$.

### D. Tính điểm cập nhật khi Trả lời Sai (Asymmetric Penalty)
Theo tâm lý học nhận thức, một lần quên làm tổn hại đáng kể đến mạng liên kết trí nhớ, do đó hình phạt giảm điểm có tính bất đối xứng:
$$\text{Drop} = 0.22 + \min(0.25, C_{incorrect} \times 0.08)$$
$$K_{new} = \max(0.0, K_{old} - \text{Drop})$$

---

## 4. PHÂN RÃ KỸ NĂNG CHÉO (CROSS-SKILL BREAKDOWN)

Mỗi từ vựng lưu trữ riêng 5 chiều năng lực độc lập:
1. $S_{\text{recognition}}$: Khả năng nhận diện mặt chữ.
2. $S_{\text{recall}}$: Khả năng nhớ từ từ nghĩa.
3. $S_{\text{spelling}}$: Khả năng viết/gõ chính tả đúng.
4. $S_{\text{listening}}$: Khả năng phân biệt âm thanh khi nghe.
5. $S_{\text{usage}}$: Khả năng hiểu và áp dụng từ vào câu.

Điểm tri thức tổng hợp cuối cùng được hòa trộn với điểm kỹ năng chéo:
$$K_{\text{final}} = 0.65 \times K_{\text{direct}} + 0.35 \times \left(0.25 S_{\text{recog}} + 0.25 S_{\text{recall}} + 0.20 S_{\text{spell}} + 0.15 S_{\text{listen}} + 0.15 S_{\text{usage}}\right)$$
Giúp hệ thống phát hiện chính xác: *"Người dùng nhận diện từ rất tốt ($0.95$) nhưng chưa thể gõ đúng chính tả ($0.30$)"*, từ đó định hướng dạng bài tập phù hợp.

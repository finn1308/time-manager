# 🧠 LUYENTU - Kiến trúc Hệ thống Học Thích Ứng (Adaptive Learning Engine)

Tài liệu này mô tả toàn diện kiến trúc, nguyên lý vận hành và luồng dữ liệu của hệ thống **Học thích ứng thông minh (AI-powered Adaptive Learning Engine)** trên nền tảng LUYENTU.

---

## 1. NGUYÊN LÝ CỐT LÕI (CORE LEARNING PRINCIPLE)

Hệ thống hoạt động theo tôn chỉ khoa học nhận thức:
- **Từ người dùng đã nắm vững $\to$ giảm tần suất xuất hiện.**
- **Từ người dùng đang gặp khó khăn $\to$ tăng tần suất xuất hiện và hạ độ khó tạm thời.**
- **Không bao giờ dùng logic nhị phân đơn giản (`known = 1`, `unknown = 0`).** Mọi từ vựng đều sở hữu một **Điểm thành thạo liên tục (Continuous Knowledge Score)** từ `0.0` đến `1.0`.

Ví dụ thực tế:
```text
Word: "abandon"    -> Knowledge Score: 0.92 -> Tần suất thấp (ôn củng cố)
Word: "acquire"    -> Knowledge Score: 0.63 -> Tần suất trung bình
Word: "substantial"-> Knowledge Score: 0.21 -> Tần suất cao (ưu tiên hàng đầu)
```

---

## 2. KIẾN TRÚC HYBRID: THUẬT TOÁN ĐO LƯỜNG TỨC THỜI + PHÂN TÍCH NHẬN THỨC AI

Để đảm bảo hệ thống đạt độ trễ cực thấp (< 50ms khi trả lời câu hỏi), không bị ảnh hưởng bởi rate-limit hay chi phí API, LUYENTU triển khai kiến trúc **Lai (Hybrid AI + Deterministic Algorithm)**:

```text
[ Người dùng trả lời câu hỏi ]
              │
              ▼
   [ Ghi nhận sự kiện học tập (LearningEvent) ]
              │
              ▼
   [ Thuật toán tính điểm thành thạo tức thời (Scoring Engine) ]
              │
              ▼
   [ Đánh giá mô hình suy giảm trí nhớ (Ebbinghaus Forgetting Curve) ]
              │
              ▼
   [ Cập nhật UserVocabularyMastery trong PostgreSQL ]
              │
              ├──────────────────────────────┐
              ▼                              ▼
[ Sinh câu hỏi thích ứng tiếp theo ]     [ Định kỳ phân tích AI (Batch/Periodic) ]
(Lấy mẫu có trọng số + Anti-Repetition)  (Gemini / OpenAI / Claude / Local Fallback)
                                             │
                                             ▼
                                 [ Báo cáo nhận thức & Khuyến nghị ]
```

---

## 3. CÁC THÀNH PHẦN CHÍNH (SYSTEM COMPONENTS)

1. **`UserVocabularyMastery` (Database Model)**:
   Lưu trữ trạng thái thành thạo riêng biệt của từng người dùng cho từng từ vựng, bao gồm:
   - Điểm tri thức (`knowledgeScore`: 0.0 - 1.0) & độ tin cậy (`confidenceScore`: 0.0 - 1.0).
   - Tín hiệu hành vi: Số lần thử đúng/sai, chuỗi đúng/sai liên tiếp, thời gian phản hồi trung bình.
   - Tín hiệu thời gian & quên lãng: `lastSeenAt`, `forgettingRisk`, `memoryStability`, `nextReviewAt`.
   - Phân rã kỹ năng chéo (Cross-skill): `recognitionScore`, `recallScore`, `spellingScore`, `listeningScore`, `usageScore`.

2. **`AdaptiveLearningService` (`src/lib/learning/adaptive-service.ts`)**:
   Dịch vụ trung tâm điều phối việc ghi nhận sự kiện, tính toán cập nhật điểm, và lấy câu hỏi tiếp theo.

3. **`QuestionSelectionEngine` (`src/lib/learning/question-selection.ts`)**:
   Lựa chọn từ vựng tiếp theo dựa trên hàm tính điểm ưu tiên động $\text{PriorityScore}$ kết hợp kỹ thuật lấy mẫu có trọng số theo phân tầng (Stratified Weighted Sampling) và cơ chế chống lặp từ liên tiếp (`minimumReviewGap`, `recentlyShownPenalty`).

4. **`LearningAnalysisService` (`src/lib/learning/ai/analysis-service.ts`)**:
   Sử dụng AI để nhận diện các mẫu lỗi lặp lại (nhầm lẫn phiên âm, rào cản chính tả, quên sau thời gian dài) và xuất báo cáo nhận thức có cấu trúc được xác thực bởi Zod Schema.

---

## 4. BẢO MẬT & CÔ LẬP DỮ LIỆU (PRIVACY & ISOLATION)

- Mọi truy vấn và cập nhật đều được bảo vệ bởi khóa ngoại `userId` và ràng buộc `@@unique([userId, vocabularyId])`.
- Người dùng tuyệt đối không thể đọc hoặc can thiệp vào tiến trình học tập của người dùng khác.
- Dữ liệu gửi đến AI Provider được ẩn danh hóa (chỉ gửi thống kê học tập, không gửi thông tin định danh cá nhân).

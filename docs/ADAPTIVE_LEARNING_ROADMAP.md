# 🧠 LUYENTU - AI-POWERED ADAPTIVE LEARNING ENGINE ROADMAP

Tài liệu này theo dõi và cập nhật tiến độ triển khai hệ thống **Học thích ứng thông minh (Adaptive Learning Engine)** sử dụng AI & thuật toán Deep Knowledge Tracing cho nền tảng học từ vựng LUYENTU.

---

## 📋 DANH SÁCH TÍNH NĂNG VÀ TIẾN ĐỘ THỰC HIỆN

### I. CƠ SỞ DỮ LIỆU & SCHEMA (DATABASE ARCHITECTURE)
- [x] **1. Model `UserVocabularyMastery`**: Quản lý điểm thành thạo liên tục (0.0 - 1.0), độ tin cậy, số lần thử đúng/sai, chuỗi liên tiếp, thời gian phản hồi trung bình, nguy cơ quên lãng (forgettingRisk), độ khó thích ứng, và điểm phân rã kỹ năng chéo (Recognition, Recall, Spelling, Listening, Usage).
- [x] **2. Model `LearningEvent`**: Lưu vết chi tiết từng sự kiện học tập (view, answer_correct, answer_incorrect, responseTime, questionType, previousMastery, newMastery...).
- [x] **3. Model `UserAiLearningReport`**: Lưu trữ và cache báo cáo phân tích nhận thức học tập định kỳ từ AI (thế mạnh, điểm yếu, từ vựng cần lưu ý, từ tiến bộ nhanh, khuyến nghị trọng tâm).
- [x] **4. Ràng buộc Unique & Chỉ mục hiệu năng cao**: Unique `(userId, vocabularyId)` và các composite indexes (`userId + knowledgeScore`, `userId + forgettingRisk`, `userId + nextReviewAt`) phục vụ truy vấn tối ưu khi có hàng chục ngàn từ.

---

### II. MÔ HÌNH TOÁN HỌC & THUẬT TOÁN ĐO LƯỜNG (MATHEMATICAL ENGINE)
- [ ] **5. Dynamic Knowledge Scoring Model (`scoring.ts`)**:
  - Tính điểm thành thạo liên tục $K \in [0.0, 1.0]$ dựa trên đa tín hiệu: Tỷ lệ chính xác quá khứ + Exponential Moving Average của các lần thử gần nhất.
  - Phạt khi phản hồi quá chậm (> 8s) hoặc đoán mò; thưởng điểm phản hồi tự tin (1.2s - 4.0s).
  - Bất đối xứng trong ghi nhớ: Chuỗi sai liên tiếp làm giảm điểm mạnh hơn chuỗi đúng (asymmetric penalty).
  - Phân rã theo 5 kỹ năng chéo (Cross-skill breakdown): Nhận diện (Recognition), Truy xuất chủ động (Recall), Chính tả (Spelling), Luyện nghe (Listening), Đặt câu/Ngữ cảnh (Usage).
- [ ] **6. Ebbinghaus Forgetting Curve & Memory Stability (`forgetting-curve.ts`)**:
  - Mô hình bán rã trí nhớ (Half-life memory retention model): $R(t) = 2^{-t / S}$.
  - Tính toán độ bền trí nhớ $S$ (Memory Stability) tăng theo cấp số nhân khi ôn tập thành công và giảm khi quên.
  - Xác định tỷ lệ rủi ro quên lãng tức thời: $\text{forgettingRisk} = 1.0 - R(t)$.
  - Tự động lên lịch thời điểm ôn tập tối ưu tiếp theo (`nextReviewAt`) khi xác suất ghi nhớ chạm ngưỡng mục tiêu (90%).
- [ ] **7. Adaptive Question Selection Engine (`question-selection.ts`)**:
  - Tính điểm ưu tiên động $\text{PriorityScore}$ cho từng từ vựng: kết hợp độ yếu của từ, nguy cơ quên, quá hạn ôn tập, độ khó cá nhân hóa và thất bại gần đây.
  - Weighted probabilistic sampling (lấy mẫu có trọng số ngẫu nhiên theo phân tầng):
    - Từ rất yếu / yếu: ~50%
    - Từ trung bình: ~30%
    - Từ vững vàng: ~15%
    - Từ đã thành thạo: ~5% (đảm bảo không bị loại bỏ hoàn toàn, củng cố định kỳ).
  - Anti-repetition logic: Ngăn ngừa từ xuất hiện liên tục gây nhàm chán (`minimumReviewGap`, `recentlyShownPenalty`).

---

### III. AI ANALYSIS LAYER & HYBRID ARCHITECTURE
- [ ] **8. Multi-Provider AI Abstraction (`AIProvider`)**:
  - Hỗ trợ linh hoạt Google Gemini, OpenAI GPT-4o-mini, Anthropic Claude.
  - Local Cognitive Heuristic Engine: Fallback tự động 100% khi không có API key hoặc nhà mạng mất kết nối, hệ thống không bao giờ bị gián đoạn.
- [ ] **9. Phân tích Nhận thức Định kỳ (`LearningAnalysisService`)**:
  - Phân tích mẫu lỗi của học viên (nhầm lẫn phiên âm, sai chính tả, suy giảm trí nhớ theo thời gian, mệt mỏi nhận thức).
  - Kiểm tra và xác thực dữ liệu đầu ra nghiêm ngặt bằng Zod Schema trước khi lưu trữ hoặc phản hồi cho người dùng.

---

### IV. REST APIS NỘI BỘ (BACKEND SERVICES)
- [ ] **10. `POST /api/learning/events`**: Ghi nhận sự kiện học tập, cập nhật điểm thành thạo tức thời, tính toán lại nguy cơ quên lãng.
- [ ] **11. `GET /api/learning/mastery`**: Lấy danh sách trạng thái thành thạo từ vựng của người dùng theo bộ lọc và phân loại.
- [ ] **12. `POST /api/learning/next-question`**: Sinh câu hỏi thích ứng tiếp theo dựa trên thuật toán lấy mẫu có trọng số và anti-repetition.
- [ ] **13. `GET /api/learning/analytics`**: Cung cấp toàn bộ chỉ số phân tích thời gian thực cho trang Dashboard (phân bố từ, tỷ lệ quên, độ chính xác, chuỗi học).
- [ ] **14. `POST /api/learning/ai-analysis`**: Kích hoạt phân tích chuyên sâu AI và xuất báo cáo nhận thức.
- [ ] **15. `GET /api/learning/recommendations`**: Đề xuất các từ vựng cần ưu tiên ôn tập khẩn cấp.

---

### V. GIAO DIỆN NGƯỜI DÙNG & DASHBOARD (FRONTEND UI)
- [ ] **16. Trang Adaptive Learning Dashboard (`/vocab/adaptive`)**:
  - Biểu đồ phân bố độ thành thạo từ vựng (Weak, Medium, Strong, Mastered).
  - Radar cảnh báo từ có nguy cơ quên lãng cao & từ quá hạn ôn tập.
  - Thẻ Báo cáo AI Cognitive Report hiển thị thế mạnh, điểm yếu và khuyến nghị học tập cá nhân hóa.
  - Nút khởi động trực tiếp phiên học thích ứng thông minh ("Luyện tập thích ứng AI").
- [ ] **17. Tích hợp Adaptive Mode vào Interactive Study Engine**:
  - Hỗ trợ chế độ câu hỏi động tự động chuyển dạng bài (Recognition -> Recall -> Sentence -> Typing) tùy theo mức độ thành thạo của từ.
  - Phản hồi tăng/giảm điểm thành thạo thời gian thực sau mỗi câu trả lời.
- [ ] **18. Cập nhật Navigation & Sidebar**: Thêm lối tắt vào trang Học thích ứng AI trong menu LUYENTU.

---

### VI. BỘ TÀI LIỆU TOÁN HỌC & KIẾN TRÚC HỆ THỐNG (DOCUMENTATION)
- [ ] **19. `docs/adaptive-learning.md`**: Tổng quan kiến trúc Hybrid AI + Thuật toán toán học.
- [ ] **20. `docs/mastery-model.md`**: Chi tiết công thức toán học Knowledge Scoring & Cross-skill.
- [ ] **21. `docs/forgetting-model.md`**: Chi tiết mô hình đường cong quên lãng Ebbinghaus & Half-life memory.
- [ ] **22. `docs/ai-learning-analysis.md`**: Kiến trúc lớp phân tích AI, Prompt engineering, Zod schemas và Fallback logic.

---

### VII. AUTOMATED TESTS & PRODUCTION BUILD VERIFICATION
- [ ] **23. Automated Test Suite (`scripts/test-adaptive-learning.ts`)**:
  - Test tính điểm thành thạo liên tục (0.0 - 1.0).
  - Test nhạy cảm với thời gian phản hồi và chuỗi liên tiếp.
  - Test suy giảm theo đường cong quên lãng theo thời gian trôi qua.
  - Test thuật toán ưu tiên câu hỏi và lấy mẫu có trọng số.
  - Test cơ chế chống lặp từ liên tiếp (anti-repetition).
  - Test tính cô lập dữ liệu người dùng (User Data Isolation).
  - Test xác thực Zod Schema và cơ chế Fallback khi AI offline.
  - Test ghi nhận sự kiện và cập nhật DB end-to-end.
- [ ] **24. Build & Type Checking Verification**:
  - `npm run test:all` + `npm run test:adaptive` pass 100%.
  - `npx tsc --noEmit` pass 0 lỗi.
  - `npm run build` biên dịch 100% các routes thành công.

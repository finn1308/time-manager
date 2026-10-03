# 🤖 LUYENTU - Tầng Phân Tích Nhận Thức Bằng AI (AI Learning Analysis)

Tài liệu này trình bày chi tiết kiến trúc tầng AI, quy chuẩn Prompt Engineering, cơ chế kiểm tra tính hợp lệ dữ liệu (Zod Schema Validation), và giải pháp dự phòng (Local Cognitive Heuristic Fallback).

---

## 1. NGUYÊN TẮC VẬN HÀNH: KHÔNG PHỤ THUỘC AI CHO MỌI THAO TÁC

- **Không gửi từng câu trả lời lên AI API**: Việc chấm điểm, cập nhật độ thành thạo và tính đường cong quên lãng được thực hiện 100% bằng thuật toán toán học tối ưu phía server (độ trễ < 5ms).
- **AI chỉ can thiệp ở tầng phân tích nhận thức vĩ mô (Macro Cognitive Analysis)**:
  - Nhận diện các điểm nghẽn học tập (Learning bottlenecks).
  - Phân tích sự chênh lệch giữa nhận diện thụ động và truy xuất chủ động.
  - Dự báo xu hướng mệt mỏi nhận thức và nhầm lẫn ngữ nghĩa.
  - Đề xuất lộ trình phân bổ thời gian học tập cá nhân hóa.

---

## 2. KIẾN TRÚC ĐA NỀN TẢNG AI (MULTI-PROVIDER ABSTRACTION)

Tầng AI được thiết kế dưới dạng giao diện `AIProvider` độc lập, hỗ trợ linh hoạt 3 nhà cung cấp lớn:
1. **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-flash-latest`)
2. **OpenAI** (`gpt-4o-mini`)
3. **Anthropic** (`claude-3-5-sonnet`)
4. **LUYENTU Cognitive Heuristic Engine (Local Fallback)**

### Cơ chế Fallback 100% tự động
Nếu người dùng chưa cài đặt API key, hoặc khi API của nhà cung cấp gặp sự cố kết nối / hết hạn mức (rate limit):
Hệ thống tự động kích hoạt **Local Cognitive Heuristic Engine** (`generateLocalHeuristicAnalysis`), tính toán trực tiếp từ dữ liệu PostgreSQL và trả về báo cáo nhận thức chất lượng cao mà **không làm gián đoạn trải nghiệm người dùng**.

---

## 3. PROMPT ENGINEERING & CẤU TRÚC JSON

AI được cấu hình ở chế độ `JSON Mode` (`responseMimeType: "application/json"` hoặc `response_format: { type: "json_object" }`).

### System Prompt Chuẩn:
```text
You are a Senior Cognitive Psychologist and Adaptive Learning AI specialist for the LUYENTU vocabulary platform.
Analyze the user's historical vocabulary learning behavior, error patterns, response speeds, forgetting curves, and cross-skill performance.
Return a STRICT JSON object conforming to the schema. Ensure descriptions are in Vietnamese.
```

---

## 4. XÁC THỰC DỮ LIỆU ĐẦU RA BẰNG ZOD (STRICT VALIDATION)

Hệ thống tuyệt đối không tin tưởng trực tiếp dữ liệu thô từ AI mà luôn đi qua bộ lọc xác thực `AiLearningAnalysisSchema`:

```typescript
export const AiLearningAnalysisSchema = z.object({
  strongestArea: z.string().min(3),
  weakestArea: z.string().min(3),
  wordsNeedingAttention: z.array(
    z.object({
      term: z.string(),
      meaning: z.string(),
      reason: z.string(),
      forgettingRisk: z.number().min(0).max(1),
    })
  ).max(10),
  wordsImprovingRapidly: z.array(
    z.object({
      term: z.string(),
      masteryScore: z.number().min(0).max(1),
      notes: z.string(),
    })
  ).max(10),
  recommendedFocus: z.string().min(10),
  cognitiveInsights: z.string().min(10),
  estimatedMasteryGrade: z.enum(["A+", "A", "B", "C", "D", "F"]).optional(),
});
```

Nếu dữ liệu trả về từ AI vi phạm cấu trúc, hệ thống tự động bắt lỗi và chuyển giao sang Local Heuristic Engine, ngăn chặn hoàn toàn lỗi crash runtime.

---

## 5. BỘ NHỚ ĐỆM & TỐI ƯU HIỆU NĂNG (CACHING STRATEGY)

- Báo cáo phân tích AI sau khi sinh thành công sẽ được lưu trữ vào bảng `UserAiLearningReport`.
- Thời gian hiệu lực mặc định (Cache TTL) là **4 giờ**.
- Khi người dùng mở trang Dashboard, báo cáo được trả về ngay lập tức từ Database (< 10ms).
- Người dùng có thể chủ động bấm nút *"Làm mới phân tích AI"* khi muốn cập nhật lại báo cáo sau một buổi học dài.

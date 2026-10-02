# CHRONOMIND - AI ARCHITECTURE
## MULTI-PROVIDER AI ORCHESTRATION & CONTEXT BUILDER (`/docs/AI_ARCHITECTURE.md`)

---

## 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (CORE PRINCIPLES)

1. **Provider-Agnostic Abstraction**:
   - Hệ thống không phụ thuộc cứng vào bất kỳ nhà cung cấp AI nào.
   - Hỗ trợ mô hình Bring-Your-Own-Key (BYOK) linh hoạt cho 3 nhà cung cấp hàng đầu:
     - **Google Gemini**: Gemini 2.5 Flash, Gemini 1.5 Pro
     - **OpenAI**: GPT-4o, GPT-4o-mini
     - **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3.5 Haiku
   - Mã nguồn ứng dụng chỉ giao tiếp qua lớp Adapter/Service Layer (`src/lib/ai/client-factory.ts`).

2. **Bảo mật tuyệt đối khóa API người dùng (BYOK Encryption)**:
   - Toàn bộ API Key được mã hóa bằng thuật toán đối xứng chuẩn quân sự **AES-256-GCM**.
   - Mỗi khóa lưu trữ cùng `iv` (Initialization Vector) 96-bit và `authTag` 128-bit độc lập.
   - Tuyệt đối không bao giờ trả về API Key nguyên bản ra client (chỉ trả về masked string: `sk-...abcd`).

3. **Kiểm soát chi phí và ngân sách Token (Token Budgeting & Context Builder)**:
   - Dữ liệu tích lũy qua 4 năm đại học có thể lên đến hàng triệu từ. AI **tuyệt đối không tải toàn bộ database** vào một prompt.
   - Phân hệ **Context Builder** chắt lọc dữ liệu theo ngữ cảnh tác vụ (Task-oriented scoping).

---

## 2. KIẾN TRÚC BỘ XÂY DỰNG NGỮ CẢNH (CONTEXT BUILDER ARCHITECTURE)

```text
[Yêu cầu từ người dùng / Lịch học / Nhiệm vụ]
                     │
                     ▼
          ┌─────────────────────┐
          │   CONTEXT BUILDER   │
          └──────────┬──────────┘
                     │
     ┌───────────────┼───────────────┐
     ↓               ↓               ↓
[Academic Scope] [Schedule Scope] [Performance Scope]
- Học kỳ hiện tại- Giờ học trường - Thời gian vàng (Golden Hours)
- Môn học active - Khung giờ khóa - Tỉ lệ Deep Focus
- Bài tập & Hạn  - Giờ cá nhân   - Lịch sử hoàn thành
     │               │               │
     └───────────────┼───────────────┘
                     │
                     ▼
           [Prompt tinh gọn: < 4000 tokens]
                     │
                     ▼
         [AI Model (Gemini/GPT/Claude)]
                     │
                     ▼
        [Structured JSON Validation]
                     │
                     ▼
             [Database / UI]
```

---

## 3. CẤU TRÚC PHẢN HỒI JSON CHUẨN HÓA (AI SCHEDULER OUTPUT SCHEMA)

Để ngăn chặn lỗi hallucination và định dạng văn bản tự do, AI Auto-Scheduler bắt buộc phải phản hồi định dạng JSON có cấu trúc nghiêm ngặt:

```json
{
  "schedule": [
    {
      "taskId": "cuid...",
      "subjectId": "cuid...",
      "title": "Ôn tập Giải tích - Đạo hàm riêng",
      "startTime": "2026-10-05T19:30:00.000Z",
      "endTime": "2026-10-05T21:00:00.000Z",
      "durationMinutes": 90,
      "reasoning": "Khung giờ học vàng buổi tối của sinh viên, không trùng lịch đi học ngày thứ Hai"
    }
  ],
  "conflicts": [],
  "reasoning_summary": [
    "Đã xếp 3 phiên học cho môn Giải tích trước kỳ thi giữa kỳ 5 ngày",
    "Bảo vệ nguyên vẹn 100% thời khóa biểu đi học chính quy trên lớp"
  ],
  "unscheduled_tasks": [],
  "warnings": []
}
```

---

## 4. XỬ LÝ TÀI LIỆU HỌC TẬP & TRÍCH XUẤT THÔNG MINH (PDF & KNOWLEDGE)

1. **Lọc nhiễu tài liệu (Administrative Noise Filtering)**:
   - Tự động nhận diện và bỏ qua trang bìa, thông tin hành chính giảng viên, mục lục (TOC), và danh mục tài liệu tham khảo (References).
   - Tỷ lệ câu hỏi Quiz không bao giờ bị nhiễm thông tin tên trường, tên tác giả hay các metadata không mang giá trị học thuật.

2. **Phân đoạn ngữ cảnh theo chương (Chapter & Section Chunking)**:
   - Thuật toán `unpdf` phân tích tiêu đề phân cấp để chia nhỏ nội dung thành các chunk có ý nghĩa logic (1500 - 3000 từ).
   - Câu hỏi kiểm tra (Quiz) bắt buộc có 4 lựa chọn, 1 đáp án chính xác duy nhất, kèm theo lời giải thích (rationale) và gợi ý (hint) trích nguồn.

3. **Ghi nhớ dài hạn với Spaced Repetition (SuperMemo SM-2)**:
   - Các thẻ Flashcard sinh bởi AI được gán hệ số suy giảm trí nhớ ($EF = 2.5$) và khoảng thời gian ôn tập tự động mở rộng theo thuật toán SM-2.

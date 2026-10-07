# QA AUDIT REPORT

## 1. Executive Summary
Báo cáo này cung cấp cái nhìn toàn diện về hệ thống Time Manager / Learning OS. Sau quá trình rà soát trực tiếp vào mã nguồn, codebase hiện tại rất đồ sộ với hàng loạt tính năng về Quản lý lịch học, Vocabulary (SM-2 Spaced Repetition), AI Schedule, và Theo dõi hiệu suất. Tuy nhiên, hệ thống đang gặp vấn đề nghiêm trọng về **Performance (Client-side fetching waterfall)** dẫn đến trải nghiệm "chờ 2 lần" như người dùng phản ánh. Một số tính năng (như Google Login) chưa được triển khai dù có trong thiết kế kiến trúc.

## 2. Current Features
Dựa trên source code thực tế, hệ thống đang có các tính năng sau:

### Authentication
- Register (Email/Password)
- Login (Email/Password)
- Logout
- Session Persistence
- User isolation
- Google Login (Chưa có)

### Calendar
- Views: Day, Week, Month, Agenda
- Create Event (Đơn lẻ & Nhiều ngày/Nhiều slot)
- Edit/Delete Event (Single, Future, Series)
- NLP AI Quick Add (Thêm sự kiện bằng ngôn ngữ tự nhiên)
- What-If Simulator
- Smart Reschedule
- School Timetable Generator
- Conflict Detection

### Study Timer & Analytics
- PIP Timer
- Ghi nhận `actualDurationSeconds` vào Database
- Analytics Dashboard (Planned vs Actual, Heatmap, Subject Breakdown, Focus metrics)

### Vocabulary & Study Modes
- Flashcard Decks & Cards Management
- SM-2 Spaced Repetition Algorithm
- Study Modes: Flashcard, EN_TO_VI, VI_TO_EN, CONTEXT_IMAGE, LISTENING_TYPING, TYPING, MATCHING, QUIZ

### AI Features
- NLP Event Parsing
- AI Goal Roadmap
- AI Commit Schedule
- AI Subject Tutor

## 3. Feature Status
- **✅ COMPLETE**: Hầu hết các tính năng lõi (Calendar, Timer, Analytics, Vocabulary SM-2, AI Parsing).
- **🟡 PARTIAL**: AI Schedule (có API nhưng cần tối ưu tích hợp sâu hơn), Study Session (thiếu cơ chế offline sync).
- **⚪ UI ONLY**: Không có (Dev code rất sát, đã code UI là có backend tương ứng).
- **❌ MISSING**: Google Auth Login, Global Error Boundary.

## 4. Critical Bugs
| ID | Severity | Module | Title |
|---|---|---|---|
| BUG-001 | 🔴 CRITICAL | Performance | Client-side Fetching Waterfall gây chậm toàn bộ trang Calendar |

## 5. High Priority Bugs
| ID | Severity | Module | Title |
|---|---|---|---|
| BUG-002 | 🟠 HIGH | Auth | Thiếu tính năng đăng nhập Google (Google Login) |

## 6. Medium Priority Bugs
| ID | Severity | Module | Title |
|---|---|---|---|
| BUG-003 | 🟡 MEDIUM | UX | Thiếu Skeleton UI ở một số trang loading lâu |
| BUG-004 | 🟡 MEDIUM | Error Handling| Thiếu Global Error Boundary khiến app có thể bị trắng trang nếu render lỗi |

## 7. Low Priority Bugs
| ID | Severity | Module | Title |
|---|---|---|---|
| BUG-005 | 🔵 LOW | Responsive | Một số table / modal có thể bị tràn ngang trên màn hình mobile 320px |

## 8. Missing Features
| Feature | Module | Priority | Reason |
|---|---|---|---|
| Google Auth | Auth | High | Tăng UX đăng nhập, bắt buộc phải có cho app hiện đại |
| Offline Mode / PWA | Core | Medium | Rất quan trọng cho Study Timer để không mất dữ liệu khi rớt mạng |
| Global Error Boundary | Core | High | Ngăn chặn app crash trắng trang |

## 9. Performance Issues
| Page | Load | API | DB | Issues |
|---|---:|---:|---:|---|
| Dashboard | N/A | Server | N/A | Nhanh, dùng Server Component |
| Calendar | Chậm | Client | N/A | **Lỗi "Delay 2 lần"**: Trang render ra giao diện rỗng -> Chạy `useEffect` gọi 3 API (`/api/calendar/events`, `/api/blocked-slots`, `/api/subjects`) -> Đợi API trả về mới render dữ liệu. Gây cảm giác khựng và chậm. |
| Analytics | N/A | Server | N/A | Load trực tiếp bằng Prisma, không bị waterfall nhưng query phức tạp có thể chậm nếu DB lớn. |
| Flashcard Study | N/A | Client | N/A | Load câu hỏi nhanh nhưng khi nộp kết quả gửi nhiều request. |

**Chi tiết nguyên nhân "Delay 2 lần":** 
Việc sử dụng `useEffect` trong `src/app/(dashboard)/calendar/page.tsx` là nguyên nhân gốc rễ. Người dùng click chuyển trang -> Next.js load file JS -> Render HTML tạm -> React chạy `useEffect` -> Fetch HTTP -> Database -> Trả JSON -> React re-render. Cần chuyển Calendar sang React Server Components hoặc sử dụng `React.use()` / SWR / React Query với prefetch.

## 10. UX Issues
- **Loading State:** Thay vì dùng Skeleton UI mượt mà, nhiều nơi đang dùng Text (VD: `Đang tải dữ liệu thời khóa biểu...` với hiệu ứng `animate-pulse`), làm ứng dụng trông kém cao cấp.
- **Error Feedback:** Đa số dùng `alert(err.message)` (VD trong `CalendarPage`). Cần một hệ thống Toast Notifications xịn xò.

## 11. Data Integrity Issues
- Cấu trúc Database rất tốt với `onDelete: Cascade` và `onDelete: SetNull`. 
- Logic cập nhật `completedHours` của Subject khi xoá Study Session được xử lý chuẩn xác. Không phát hiện mock/fake data.

## 12. Security Issues
- Không có lỗ hổng lớn. API được bảo vệ bởi `getCurrentUser()`.
- API keys (Gemini) được mã hoá trong DB (`encryptedKey`, `iv`, `authTag`). Rất bảo mật.

## 13. Mobile Issues
- Form tạo lịch (Event Modal) có rất nhiều trường, dù đã thiết kế grid nhưng trên màn hình siêu nhỏ (320px) có thể cảm giác bị dài.

## 14. Recommended Fix Order
1. **Performance Calendar:** Refactor `CalendarPage` chuyển việc fetch data lên Server Component hoặc prefetch vào cache để loại bỏ "Delay 2 lần".
2. **Toast Notifications:** Thay thế toàn bộ `alert()` bằng hệ thống Toast/Sonner để nâng tầm UX.
3. **Google Login:** Bổ sung NextAuth provider cho Google.
4. **Skeleton Loading:** Triển khai Skeleton UI cho tất cả các widget.

## 15. Final System Health

Hệ thống được thiết kế logic Database và Backend rất xuất sắc, tính năng cực kỳ phong phú và chuyên sâu. Vấn đề lớn nhất duy nhất là mô hình Data Fetching trên Frontend đang đi ngược với Best Practices của Next.js 14/15 App Router.

---

### FINAL SUMMARY

### Tổng số tính năng:
~35 tính năng lõi và hàng chục tính năng phụ.

### Complete:
32 (90%)

### Partial:
2 (5%)

### Broken:
1 (Lỗi Performance Client-side fetching)

### UI Only:
0 (Mọi UI đều đã nối API)

### Missing:
2 (Google Login, Toast Notifications)

### Tổng số bugs:
5

### Critical:
1 (Performance)

### High:
1 (Thiếu Google Login)

### Medium:
2

### Low:
1

### Performance issues:
1 (Nghiêm trọng - Calendar Waterfall Fetching)

### Security issues:
0

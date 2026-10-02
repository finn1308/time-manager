---
name: screen-observer
description: Cho phép Agent quan sát màn hình hiện tại của người dùng để biết họ đang thao tác gì, gặp lỗi gì hoặc đang ở trang nào.
triggers:
  - "tôi đang làm gì"
  - "nhìn màn hình tôi"
  - "kiểm tra màn hình"
  - "xem lỗi trên màn hình"
---

# Screen Observer Skill

Khi người dùng hỏi về hoạt động hiện tại, cần trợ giúp với những gì đang hiển thị trên desktop, hoặc yêu cầu kiểm tra màn hình:

1. Đọc tệp ảnh chụp màn hình mới nhất tại đường dẫn:
   `.antigravity/skills/screen-observer/latest/current.png`
2. Phân tích nội dung hiển thị trong ảnh (cửa sổ ứng dụng, tab trình duyệt, thông báo lỗi terminal, giao diện dev tools).
3. Đưa ra câu trả lời hoặc hành động hỗ trợ tương ứng dựa trên ngữ cảnh thực tế đang diễn ra trên màn hình.

---
## 🧪 Thử nghiệm: Tích hợp Supabase Realtime cho Co-op Focus
**Ngày:** 2026-02-24 | **Giờ:** 15:15
**Mục tiêu:** Xây dựng tính năng Co-op Focus (phòng học nhóm) sử dụng Supabase Realtime để đồng bộ hoá trạng thái phòng và đếm ngược thời gian cho nhiều thiết bị mà không cần server tuỳ chỉnh (phù hợp với Vercel).

### 🛠 Cấu hình & Tham số
* **File liên quan:** `CoopRoom.js`, `RoomView.js`, `Timer.js`, `main.js`, `supabaseConfig.js`
* **Hyperparameters:** N/A
* **Dataset:** Database Supabase (rooms, users, room_participants)

### 📊 Kết quả & Quan sát
* **Metric:** Realtime state synchronization, App visibility tracking (The Strict Mechanic)
* **Hiện tượng:** Đã thay thế BroadcastChannel cũ bằng Supabase Realtime. Khi Host bấm "Start Focus", các máy tính (Guest) trong phòng tự động kết nối và chạy Timer theo Host. Nếu bất cứ ai trong phòng minimize Web/App, `visibilitychange` sẽ kích hoạt hàm Fail, và đẩy trạng thái Failed cho toàn phòng qua Supabase Broadcast, tất cả máy khác sẽ dừng Timer và báo lỗi.

### 💡 Ghi chú & Bước tiếp theo
> Cấu trúc Database rất nhẹ gọn nhưng mạnh mẽ cho MVP vì không cần phải viết server node.js mà chỉ cần subscribe PostgreSQL changes.
- [ ] Bật ứng dụng trên 2 Tabs hoặc 2 điện thoại khác nhau để kiểm tra tính năng Đồng bộ khởi động.
- [ ] Kiểm tra tính năng PACT (Minimize tab để làm fail phòng cho tất cả người chơi).
---

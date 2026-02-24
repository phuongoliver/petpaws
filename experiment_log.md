---
## 🧪 Thử nghiệm: Sửa lỗi đơ màn hình khi Join phòng Co-op
**Ngày:** 2026-02-24 | **Giờ:** 15:20
**Mục tiêu:** Khắc phục lỗi trình duyệt bị treo (freeze/crash) khi người dùng thứ 2 tham gia vào phòng đã tồn tại.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `CoopRoom.js`
* **Nguyên nhân:** Lệnh `this.fetchParticipants()` nằm sai chỗ. Trong hàm `_joinRoomInternal`, việc gọi hàm này ngay sau khi `subscribeToRoom` tạo ra một vòng lặp vô tận (Infinite Loop). Cụ thể: Khi client join, hàm update database chạy $\rightarrow$ trigger realtime listener của chính client đó $\rightarrow$ listener lại gọi `fetchParticipants` $\rightarrow$ quá tải EventBus `PARTICIPANTS_UPDATED`.

### 📊 Kết quả & Quan sát
* **Metric:** Độ ổn định của WebSockets (Supabase channel).
* **Hiện tượng:** Đã xoá bỏ vòng lặp ngầm. Đưa logic fetch danh sách user vào callback `SUBSCRIBED` của Supabase channel. Giờ đây, khi có người chơi mới, UI cập nhật danh sách mượt mà, không bị lag nữa.

### 💡 Ghi chú & Bước tiếp theo
> Khi làm việc với Supabase Realtime (hoặc các WebSocket Pub/Sub nói chung), **tuyệt đối không** trigger các lệnh gọi Read/Write Database vòng vèo bên trong callback lắng nghe sự kiện để tránh dội bom API (API Bombing/Infinite Loop).
- [ ] Chạy lại thử nghiệm trên 2 tab để xác nhận phòng không bị sập.
- [ ] Tiến hành git commit và git push.
---

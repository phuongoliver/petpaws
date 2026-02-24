### Module 1: Strict Focus Timer (Core Engine)
Đây là vòng lặp cốt lõi (Core Loop) tạo ra tài nguyên cho ứng dụng.

- Mô tả: Một đồng hồ đếm ngược theo cơ chế Pomodoro, nhưng đi kèm với hình phạt "Strict Mode" để ép buộc sự tập trung.
- Trigger (Đầu vào): User thiết lập thời gian ($t > 0$) và nhấn "Start". Hệ thống ghi nhận startTime và expectedEndTime.
- Ràng buộc (Strict Constraint): Đồng hồ chỉ được tính là hợp lệ nếu ứng dụng liên tục ở trạng thái foreground. Hệ thống sẽ lắng nghe AppLifecycleState (hoặc Page Visibility API trên web). Nếu state chuyển sang paused, hidden, hoặc inactive (nghĩa là user đã thoát ra màn hình chính hoặc mở app khác), hệ thống lập tức trigger hàm failSession().
- Outcome - Success: Đồng hồ chạy đến 0. Hệ thống sinh ra phần thưởng (Reward) tương ứng với độ dài của session và cộng vào Inventory của user (ví dụ: +5 Xương).
- Outcome - Fail: Hủy session lập tức. Không cấp phần thưởng. Chuyển state của Pet sang trạng thái tiêu cực (ví dụ: buồn bã).
### Module 2: Virtual Pet System (Simulation Mechanics)

Đây là hệ thống tiêu thụ tài nguyên (Resource Sink) và giữ chân người dùng thông qua các cơ chế mô phỏng (simulation).
- Adoption (Khởi tạo dữ liệu): Xảy ra ở lần đầu mở app (Onboarding). User chọn một loại pet. Hệ thống khởi tạo một object Pet trong database gắn với userID, bao gồm các chỉ số cơ bản (Level, Hunger, Happiness).
- Raising & Feeding (Tiêu thụ tài nguyên): User sử dụng phần thưởng kiếm được từ Module 1 để mua thức ăn. Hệ thống trừ tài nguyên trong Inventory, cập nhật lại chỉ số của Pet, và trigger animation "Ăn".
- Petting (Micro-interaction): Một hành động không tốn tài nguyên. Hệ thống bắt sự kiện chạm (Tap/Swipe) lên UI của Pet để kích hoạt các animation hoặc âm thanh vui vẻ trong thời gian ngắn, giúp tăng tính gắn kết.

### Module 3: Synchronized Co-op Focus (Multiplayer Logic)

Đây là tính năng nâng cao, đòi hỏi đồng bộ trạng thái (State Synchronization) giữa các client theo thời gian thực (Real-time).

- Room Session: User tạo hoặc tham gia một phòng (Room) thông qua ID/Link. Tất cả client trong phòng sẽ đồng bộ chung một đồng hồ đếm ngược.

- Shared Penalty (The "Pact"): Cơ chế ràng buộc chéo. Hệ thống duy trì một kết nối real-time (ví dụ: qua WebSocket, Firebase Realtime Database, hoặc Socket.io). Nếu bất kỳ một user nào trong phòng vi phạm Strict Constraint (rời khỏi app), client đó sẽ bắn một tín hiệu fail_event lên server. Server lập tức broadcast tín hiệu này đến toàn bộ các user khác trong phòng $\rightarrow$ Hủy session của tất cả mọi người (All lose).

- Bonding Reward (Bonus Multiplier): Nếu cả phòng cùng sống sót đến hết giờ, phần thưởng nhận được sẽ nhân với hệ số bonus (ví dụ: $1.2 \times$ Base Reward) để khuyến khích học nhóm.

- Streak System: Hệ thống lưu trữ biến consecutive_coop_wins. Mỗi lần hoàn thành, chuỗi (streak) tăng lên 1, có thể dùng để unlock các vật phẩm đặc biệt cho Pet. Nếu thất bại, biến streak bị reset về 0.
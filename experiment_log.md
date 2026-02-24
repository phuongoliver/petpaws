---
## 🧪 Thử nghiệm: Phát triển tính năng Đăng nhập & Chia View
**Ngày:** 2026-02-24 | **Giờ:** 12:56
**Mục tiêu:** Tách ứng dụng thành 2 giao diện riêng biệt: Auth (Đăng nhập/Đăng ký) và Main. Sử dụng LocalStorage JSON để giả lập Database.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `style.css`, `app.js`
* **Hyperparameters:** `localStorage` item `paws_db` chứa thông tin người dùng được mã hóa dưới dạng JSON string. 
* **Dataset:** Danh sách users lưu nội bộ trong trình duyệt.

### 📊 Kết quả & Quan sát
* **Metric:** Chuyển đổi qua lại giữa `display: none` và `display: flex` để đổi view.
* **Hiện tượng:** Người dùng chưa đăng nhập sẽ thấy màn hình Auth, sau khi đăng nhập mới có thể tiếp xúc với màn hình đồng hồ & thú cưng.

### 💡 Ghi chú & Bước tiếp theo
> Dùng localStorage stringify/parse là giải pháp serverless hiệu quả thay thế cho một REST API thật.
- [x] Implement phần styling CSS cho Form đăng nhập.
- [x] Chỉnh sửa `app.js` để tích hợp logic Authentication.
---

---
## 🧪 Thử nghiệm: Refactor Frontend thành kiến trúc MVC & Pub/Sub (Theo SRS.md)
**Ngày:** 2026-02-24 | **Giờ:** 13:05
**Mục tiêu:** Áp dụng mô hình Observer (EventBus) và Model-View-Controller (MVC) để xây dựng 3 module lõi từ SRS: Strict Focus Timer, Virtual Pet, và Co-op Focus (MVP).

### 🛠 Cấu hình & Tham số
* **File liên quan:** Thư mục mới `js/core`, `js/models`, `js/views`, `js/main.js`. Xóa bỏ `app.js` và `dog-renderer.js`.
* **Hyperparameters:** `BroadcastChannel('paws_coop_room')` để đồng bộ tín hiệu Real-time giữa các tab nội bộ trình duyệt. EventBus điều phối sự kiện offline.
* **Dataset:** LocalStorage `paws_db` được giữ nguyên cấu trúc.

### 📊 Kết quả & Quan sát
* **Metric:** Source code được module hóa hoàn toàn. Sự phụ thuộc (coupling) giữa giao diện DOM và logic đếm giờ/trạng thái thú cưng giảm xuống 0 nhờ có `EventBus`.
* **Hiện tượng:** 
    - (Module 1) Chế độ **Strict Focus** hoạt động hiệu quả bằng API `visibilitychange`. Nếu tab bị ẩn đi khi đang đếm giờ $\rightarrow$ Gửi `SESSION_FAILED`.
    - (Module 2) Mọi tương tác của thú cưng (nhận xương, buồn, vui) đều lắng nghe các sự kiện Pub/Sub từ hệ thống Timer. Giao diện Canvas `PetView` vẽ ra rất mượt mà.
    - (Module 3) **Co-op Focus MVP** hoàn thành: Hai tab chạy ở cùng một local mạng có thể "Nhập Room ID" chung. Nếu 1 tab vi phạm Strict Mode (thoát), tín hiệu `ROOM_FAILED` qua BroadcastChannel lập tức kích hoạt hàm Fail Session ở tab còn lại (Cả hai cùng chết/chó cùng buồn).

### 💡 Ghi chú & Bước tiếp theo
> Việc chia nhỏ code giúp App rất dễ scale thêm các module mới sau này mà không sợ đụng chạm core logic. BroadcastChannel là công cụ tuyệt vời để làm bản Demo Co-op Focus rẻ tiền trước khi cắm Firebase/Socket.io.
- [x] Mời User trải nghiệm thử tính năng Co-op bằng cách mở 2 tab ẩn danh, login 2 tài khoản, vào chung Room và ấn chuyển tab để xem "Shared Penalty" hoạt động.
---

---
## 🧪 Thử nghiệm: Phát triển Luồng Onboarding & Pet Adoption (Theo SRS.md)
**Ngày:** 2026-02-24 | **Giờ:** 13:17
**Mục tiêu:** Bổ sung luồng màn hình trung gian để người dùng mới tạo tài khoản có thể chọn và đặt tên thú cưng trước khi vào màn hình chính.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `style.css`, `js/views/OnboardingView.js`, `js/models/User.js`, `js/core/Storage.js`.
* **Hyperparameters:** Sử dụng EventBus phát sự kiện `USER_LOGGED_IN` mang theo cờ `hasAdoptedPet`. Màn hình Onboarding lắng nghe và tự bật lên nếu false.
* **Dataset:** Cấu trúc JSON `paws_db` được nâng cấp, lồng thêm object `[username].pet` (id, name, adoption_date, base_stats) và đẩy `bones` vào thẻ `inventory`.

### 📊 Kết quả & Quan sát
* **Metric:** UI Minimalism áp dụng chuẩn Material Design 3, list thú cưng dạng thẻ cuộn ngang cực sạch sẽ. Nút CTA thay đổi text động khi gõ tên.
* **Hiện tượng:** 
    - Tài khoản cũ chưa chọn Pet sẽ tự động bị kẹt ở màn hình Onboarding lúc Login.
    - Chọn thú cưng + gõ tên -> Bấm Adopt -> Routing mượt mà sang `MainView`.
    - Dữ liệu `petData` được lưu xuống localStorage.

### 💡 Ghi chú & Bước tiếp theo
> Việc tách nhỏ Router dựa trên EventBus Pub/Sub đã chứng minh sức mạnh của nó. Luồng màn hình (Login -> Onboard -> Main) chuyển đổi trơn tru mà không cần cài thêm thư viện Router nặng nề nào.
- [ ] Gắn thêm các hình ảnh SVG xịn sò thật sự (hoặc LottieFile) cho thẻ chọn Pet. Hiện tại đang giữ MVP với các icon Emoji 🐶🐱🦜 cực dễ thương.
---

---
## 🧪 Thử nghiệm: Phát triển tính năng Tạo Phòng (Co-op Focus)
**Ngày:** 2026-02-24 | **Giờ:** 13:20
**Mục tiêu:** Cho phép người dùng tạo một phòng ngẫu nhiên và tự động tham gia, thay vì chỉ có thể nhập mã tham gia thủ công.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `js/views/RoomView.js`
* **Hyperparameters:** Phát sinh chuỗi ngẫu nhiên 6 ký tự bằng `Math.random().toString(36).substring(2, 8).toUpperCase()`.
* **Dataset:** N/A

### 📊 Kết quả & Quan sát
* **Metric:** Nút bấm "Tạo Phòng" được thêm bên cạnh nút "Vào Phòng".
* **Hiện tượng:** Khi click, hệ thống tự động sinh ID (VD: `A1B2C3`), sau đó gửi qua kênh BroadcastChannel đi khắp các tab và hiện UI "Room: A1B2C3" cho phép người dùng copy mã gửi cho bạn bè.

### 💡 Ghi chú & Bước tiếp theo
> Chức năng Create Room rất tiện lợi cho User experience.
- [x] Thiết kế UI có nút copy nhanh Room ID để chia sẻ.
---

---
## 🧪 Thử nghiệm: Áp dụng UI/UX Paradigm Minimalism Beige Toàn Dự Án
**Ngày:** 2026-02-24 | **Giờ:** 13:25
**Mục tiêu:** Đồng bộ lại phong cách thiết kế Material 3 Flat Card (Cards phẳng, màu nền Beige nhẹ nhàng) xuất phát từ luồng Onboarding sang toàn bộ app. Khắc phục tình trạng các nút bấm nằm lộn xộn.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `style.css`, `index.html`
* **Hyperparameters:** Thay đổi CSS Variables (`--bg-color: #FAF8F5`, `--surface-color: #FFFFFF`). Loại bỏ `box-shadow` dư thừa ở các nút và card. Canh chỉnh lại bằng `flexbox` cho cụm Timer Controls và Room Container.
* **Dataset:** N/A

### 📊 Kết quả & Quan sát
* **Metric:** Toàn bộ component (`auth-card`, `room-container`, `bone-counter`) trở thành dạng thẻ Flat. Các khối được bo tròn lớn (20px - 24px) tạo cảm giác thân thiện.
* **Hiện tượng:** Các nút Start Focus và Feed được gom vào chung `timer-controls` gọn gàng. Cụm Room nhập ID cũng được thu gọn lại chung 1 dòng với các nút chức năng (Vào/Tạo/Rời), tránh hiển thị rườm rà.

### 💡 Ghi chú & Bước tiếp theo
> Màu nhạt giúp mắt thoải mái hơn khi Focus thời gian dài. Flat design mang lại sự hiện đại, tránh lỗi "sến" của shadow đổ bóng thô.
- [x] Chờ đánh giá tổng thể UI từ User.
---

---
## 🧪 Thử nghiệm: Nâng cấp UX Canvas Pet và Seeding Data Demo
**Ngày:** 2026-02-24 | **Giờ:** 13:28
**Mục tiêu:** Giảm sự nặng nề của Font chữ đồng hồ, làm cho nhân vật Virtual Pet trở nên "Cute" và mềm mại hơn. Chuẩn bị sẵn Data mẫu (Mock users) để dễ test.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `style.css`, `js/views/PetView.js`, `js/main.js`
* **Hyperparameters:** CSS `font-weight: 300` cho Timer. Tọa độ Canvas Pet: Thêm `bounceY` tịnh tiến toàn thân bằng hàm `Math.sin()`, Mắt tăng bán kính `arc` từ 7 -> 11, thêm 2 lớp highlight nhỏ. Má hồng (Blush) `rgba(255, 140, 160, 0.4)`.
* **Dataset:** Code hàm `seedDemoAccounts()` chạy lúc khởi động tạo ra 2 user `demo1` và `demo2`.

### 📊 Kết quả & Quan sát
* **Metric:** Pet giờ đây có "nhịp thở" nảy toàn thân rõ rệt, khi vui/nhận xương thì bật nảy mãnh liệt hơn. Khuôn mặt bầu bĩnh đáng yêu nhờ mắt to và má hồng.
* **Hiện tượng:** Có thể dùng 2 account mới là `demo1` (Pass `123`) và `demo2` (Pass `123`) login trực tiếp mà không cần đăng ký hay cài đặt Pet ban đầu. Hai account này đều có sẵn Bone để test nút "Feed".

### 💡 Ghi chú & Bước tiếp theo
> Dùng Canvas API của HTML5 để diễn hoạt (animation) thủ công đôi lúc đem lại lợi thế rất nhẹ so với dùng file GIF. Hiệu ứng nảy (Translation) làm Cún trông rất "Sống động".
- [x] User trải nghiệm animation mới của Pet và test Co-op với 2 account demo.
---

---
## 🧪 Thử nghiệm: Phát triển Module Pet Status Dashboard & Growth System
**Ngày:** 2026-02-24 | **Giờ:** 13:35
**Mục tiêu:** Cho phép người dùng theo dõi các chỉ số sinh tồn của thú cưng (Level, EXP, Hunger, Bond) và quan sát sự trưởng thành qua 3 giai đoạn (Baby, Teen, Adult) thông qua một Bottom Sheet Modal. Hỗ trợ hiển thị thêm giống loài thứ 2 (Mèo).

### 🛠 Cấu hình & Tham số
* **File liên quan:** `js/views/DashboardView.js`, `js/models/Pet.js`, `js/views/PetView.js`, `index.html`
* **Hyperparameters:**
    - Công thức Level: `100 * Level ^ 1.5`
    - Tốc độ tăng trưởng: Nhận 10 EXP mỗi phút, giảm 0.4 Hunger mỗi phút focus. Nhận 2 Bond mỗi lần tương tác (cooldown 5 giây test nhanh). Mốc tiến hóa: Level 10 (Teen), Level 25 (Adult).
    - Scale thay đổi tỷ lệ thuận: X0.8 (Baby), X1.0 (Teen), X1.2 (Adult).
* **Dataset:** Schema được nâng cấp với object `stats` (level, current_exp, hunger, bond) và `current_stage`. Demo data account `demo1` được khởi tạo sẵn ở Level 5 (Stage 1), account `demo2` (Mèo) ở Level 12 (Stage 2).

### 📊 Kết quả & Quan sát
* **Metric:** Nút `🐾` trên góc màn hình mở ra bảng điều khiển trực quan dạng Bottom Sheet. Thanh Progress Bars màu sắc phân định rõ ràng. Đặc biệt thú vị: Tài khoản `demo2` vẽ ra hình một **bé mèo** (có ria, đôi tai nhọn và đuôi dài) và to lớn hơn hẳn vì đang ở Stage 2!
* **Hiện tượng:** Click vào Canvas nuôi thú sẽ được cộng 2 điểm Bond và kích hoạt nụ cười của thú. Bấm nút Feed trong Dashboard sẽ trừ 1 xương và cộng 20 lượng máu Hunger. Có thể chứng kiến mốc trưởng thành (phóng to) ngay lập tức nếu test cày exp đủ. 

### 💡 Ghi chú & Bước tiếp theo
> Logic MVC hoàn toàn cô lập giúp việc thêm View Dashboard và tính toán EXP không làm rối các module UI khác. Canvas API tuy phức tạp nhưng nếu code khéo léo biến hóa màu sắc, các đường Curve và tỷ lệ Scale thì vẫn đủ sức vẽ ra N loài vật, N giai đoạn trưởng thành mà không tốn 1 file hình ảnh lưu trữ nào.
- [x] Chờ đánh giá từ User về cơ chế trưởng thành và giao diện bảng chỉ số.
---

---
## 🧪 Thử nghiệm: Hệ Thống Tiền Tệ (Coins), Split Header & Pet Collection
**Ngày:** 2026-02-24 | **Giờ:** 13:46
**Mục tiêu:** Cải tiến lại thanh Header tránh việc dồn nút gây ấn lộn. Bổ sung thêm Đơn vị Tiền tệ mới (Coins) thu thập cùng với Xương đẻ chuẩn bị cho Shop/Items trong tương lai. Thêm 1 "Tủ Đồ" để xem lại các bộ sưu tập và các dạng tiến hóa của Pet.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `Storage.js`, `User.js`, `index.html`, `style.css`, `CollectionView.js` (Mới)
* **Hyperparameters:**
    - Tỷ giá: `Coins = Bones * 5`. Khi Timer nhảy 1 Xương -> User được cộng 5 Coins ẩn ở layer Model.
    - Component Header: Tách ra CSS Grid/Flex - Trái (Resources Panel chứa 🦴 và 🪙), Giữa (`.pet-btn-wrapper` chứa 🐾 to tròn nổi bật), Phải (`.logout-btn` 🚪 độc lập).
    - Mảng `unlocked_stages`: Lưu vết các Stage 1, 2, 3 đã được trải qua của con Pet đó.
* **Dataset:** Seed thêm `inventory.coins = 75` cho demo1 và `0` cho demo2. `unlocked_stages` được gán = `[1]` mặc định lúc adopt.

### 📊 Kết quả & Quan sát
* **Metric:** UI trên cùng giờ đã phân bổ 3 phân khu rất khoa học. Nút Resources bên trái đóng vai trò là "Nút Bấm" để gọi cái Modal **My Collection**.
* **Hiện tượng:** Trong modal Collection, hệ thống vẽ ra giao diện dạng Grid. Tab "Stages" trưng bày 3 thẻ của thú cưng. 
  - Với `demo1` (level 5), chỉ có thẻ Stage 1 sáng rõ, 2 thẻ Stage 2 và Stage 3 bị bôi hiệu ứng bóng đen (Silhouette `filter: brightness(0) opacity(40%);`) vì chưa đạt tới.

### 💡 Ghi chú & Bước tiếp theo
> Việc chia tách Controller và View giúp việc gọi Modal thứ 3 (Collection) hay gửi Event về Tiền rảnh tay hơn hẳn. Hiện tại tab "Items" đã được chuẩn bị sẵn Layout (Disabled) để có thể code tiếp logic mua sắm Item và mặc cho thú ở các Task sau.
- [x] Done! Các tính năng đã lên sóng đầy đủ.

---

---
## 🛠 Hotfix: Khôi phục Giao Diện Đăng Nhập (Auth View)
**Ngày:** 2026-02-24 | **Giờ:** 13:51
**Mục tiêu:** Sửa lỗi giao diện màn hình Đăng nhập/Đăng ký bị vỡ layout (mất card, text dính chùm).

### 📊 Kết quả & Quan sát
* Lỗi xảy ra do trong lúc xây dựng cấu trúc Modal Collection đã vô tình ghi đè mất block HTML `.auth-card` và các class CSS đi kèm.
* **Đã khôi phục:** Trả lại thẻ `<div class="auth-card">`, phục hồi class `.input-group` để tách khoảng cách form. Trả lại nút bấm "Vào ngay". Mọi thứ đã trở lại giao diện Beige bo tròn gọn gàng.
---

---
## 🧪 Thử nghiệm: Hệ Thống Cửa Hàng (Shop) & Phụ Kiện
**Ngày:** 2026-02-24 | **Giờ:** 14:02
**Mục tiêu:** Cho phép người dùng dùng Coin để mua Item trong Shop và mặc trực tiếp lên người Pet.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `Storage.js`, `User.js`, `CollectionView.js`, `PetView.js`
* **Hyperparameters:**
    - Giá cả: Mũ rơm (50), Vòng cổ đỏ (30), Áo thun sọc (100).
    - Phân lớp vẽ (Canvas Layers): Thân -> Áo (Shirt) -> Đầu -> Vòng cổ (Collar nằm vị trí -60 to -45) -> Mặt mũi tai -> Mũ (Hat nằm trên cùng toạ độ -65 tịnh tiến).

### 📊 Kết quả & Quan sát
* **Metric:** Hệ thống đã ghi nhận đúng luồng: Bấm túi tiền góc trái -> Vào Shop -> Trừ Coin -> Tủ đồ (Owned) -> Mặc (Equip) -> Canvas render ngay lập tức.
* **Hiện tượng:** Mũ rơm, Vòng cổ có cái lục lạc vàng và chiếc áo xanh kẻ sọc trắng viền tay áo được hiển thị hoàn chỉnh ngay trên frame vẽ động của chó/mèo. Mặc đồ thành công và gắn chết với tài khoản khi reload trang.

### 💡 Ghi chú & Bước tiếp theo
> Logic Data đã ổn định, event payload đã đầy đủ tính năng. User có thể cày cuốc thoải mái và thay đổi ngoại hình rồi.
- [x] Chờ Review UI/UX phòng thay đồ từ user.
---

---
## 🧪 Thử nghiệm: Tối ưu UI Cửa hàng & Hiệu ứng Tương tác (VFX)
**Ngày:** 2026-02-24 | **Giờ:** 14:08
**Mục tiêu:** Giúp giao diện cửa hàng (Shop) dễ nhìn thấy hơn và thêm phản hồi thị giác (Particle effect) khi chạm vào pet hoặc cho ăn để tăng cảm giác "nuôi thú".

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `style.css`, `DashboardView.js`, `PetView.js`, `CollectionView.js`
* **Cơ chế Particle (Hệ hạt):**
    - Mảng `this.particles` liên tục được tính toán `x, y` và `alpha` (độ mờ) theo hàm `requestAnimationFrame`.
    - Lực đẩy `vx, vy` sinh số ngẫu nhiên nhẹ để tốc độ và khoảng bay phân tán cho đẹp mắt.

### 📊 Kết quả & Quan sát
* Nút "🛒 Shop" màu xanh đậm đứng cạnh thông số tiền tệ hoàn toàn nổi bật ở thanh Navigation trên cùng. Bấm vào là nảy popup Tủ Đồ và tự focus sang Tab Items.
* Hành vi vuốt/chạm Pet ở màn hình ngoài nảy ra các Emoji `❤️` bay bổng và từ từ mờ dần.
* Nút Feed trong Dashboard Modal đẩy event `PET_FED`, nhả combo chùm đùi gà `🍗` và chữ nổi `+20` xanh lá bắt mắt ngay giữa ngực con Pet.

### 💡 Ghi chú & Bước tiếp theo
> Các mảng gamification và tương tác như vậy đã "thổi hồn" vào game đáng kể. Framework vẽ Canvas có vẻ vẫn chịu tải xuất sắc với những hiệu ứng vật lý nhẹ tay này.
- [x] Tính năng cơ bản của App đã hoàn chỉnh. Xác nhận lại các tính năng chờ SRS.

---

---
## 🛠 Hotfix: Nút Shop & Sửa lỗi Feed (Break) Timer
**Ngày:** 2026-02-24 | **Giờ:** 14:15
**Mục tiêu:** Chỉnh nút Shop thành Icon do text bị mờ, và sửa lỗi nút Feed (Break) ngoài màn hình chính không hoạt động.

### 📊 Kết quả & Quan sát
* **Nút Shop:** Đã chuyển thành hình tròn nền nhạt, biểu tượng 🛒, bo tròn và có đổ bóng. Hover vào sẽ nổi màu cam như cũ để đồng bộ.
* **Nút Feed (Break):** Nguyên nhân lỗi là trong `Timer.js`, logic nhầm dấu chấm than `!this.isFocusing` khiến code chặn mất lệnh tạo Break khi đang ở trạng thái Rảnh rỗi (Idle). Đã sửa lại thành `if (this.isFocusing || this.isOnBreak) return;`. Bây giờ bạn có thể ấn Feed (Break) khi chưa bắt đầu Focus để trừ Xương và chạy chế độ Break (5 phút) bình thường.
---

---
## 🛠 Hotfix: Đồng bộ Hiệu ứng Feed & Sửa lỗi tràn Layout Mobile
**Ngày:** 2026-02-24 | **Giờ:** 14:18
**Mục tiêu:** Nút Feed ngoài màn hình (Break) cũng phải xổ ra cục đùi gà giống nút Pet Dashboard. Sửa giao diện Dashboard tránh chữ số EXP bị rớt dòng trên điện thoại màn hình nhỏ.

### 📊 Kết quả & Quan sát
* **Hiệu ứng Feed (Break):** Đã nhúng event `PET_FED` vào trong logic xử lý `REQUEST_BREAK` tại `Pet.js`. Giờ ấn Feed ngoài màn hình chính cũng sẽ làm bung hiệu ứng đùi gà bay lên như lúc cho ăn trong lồng ấp.
* **Layout Điện Thoại:** Đã sửa class `.stat-text` trong `style.css`, đổi từ `width: 60px` ép cứng thành `min-width: 60px` và buộc `white-space: nowrap`. Kết hợp giảm nhẹ size chữ. Số lượng EXP hay Hunger dù có lên đến ngàn vẫn sẽ nằm thẳng trên 1 hàng, không bị rớt làm biến dạng thanh Progress Bar nữa.
---

---
## 🛠 Hotfix 4: Sắp xếp lại Header & Logic Nút Feed ngoài
**Ngày:** 2026-02-24 | **Giờ:** 14:26
**Mục tiêu:** Nút Shop và Pet Dashboard bị đè lên nhau trên màn hình nhỏ. Nút Feed ngoài màn hình bị nhầm chức năng (tạo Break thay vì chỉ là Cho ăn).

### 📊 Kết quả & Quan sát
* **Header Layout:** Sửa thuộc tính `.app-header` và `.pet-btn-wrapper` trong `style.css` để bảo đảm tụi nó tách biệt nhau (tránh chồng Z-index) và có khoảng hở an toàn.
* **Nút Feed:** Gỡ chức năng ghép cùng Break (`takeBreak`) khỏi nút Feed ngoài. Giờ nút tên là **FEED 🍗**. Khi bấm sẽ đẩy `REQUEST_SIMPLE_FEED` làm đầy độ no bụng (+20), tốn 1 xương và bắn đùi gà lên (không đụng gì tới đồng hồ bấm giờ).
* **Mini Hunger Bar:** Bổ tiết thanh trạng thái Đói nhỏ phía trên vùng Canvas của Pet. Trạng thái và màu sắc (Xanh/Cam/Đỏ) hoạt động real-time theo độ no hiện tại, giúp user ko cần mở Dashboard vẫn biết lúc nào cần cho chó ăn.
---

---
## 🛠 Hotfix 5: Phục hồi Nút Tủ Đồ & Tăng tốc độ mến chủ (Bond)
**Ngày:** 2026-02-24 | **Giờ:** 14:28
**Mục tiêu:** Thêm lại nút xem bộ sưu tập (Collection) do lúc trước sửa giao diện bị ẩn đi. Tăng tốc độ tăng thanh tim (love) của pet để người dùng không phải click quá nhiều lần.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `js/models/Pet.js`

### 📊 Kết quả & Quan sát
* **Nút Tủ Đồ:** Đã bổ sung nút hình ba lô 🎒 (id: `resources-btn`) cạnh nút Shop. Bấm vào sẽ mở Tủ đồ.
* **Điểm Tim (Bond):** Sửa trong `Pet.js`, mỗi lần bấm vào Pet điểm Bond tăng +10 (trước là +2), cooldown giảm còn 2 giây (trước là 5giây).

### 💡 Ghi chú & Bước tiếp theo
> Trải nghiệm nuôi thú mướt mát hơn.
- [x] Tiếp tục theo dõi độ mượt UI
---

---
## 🛠 Hotfix 6: Chú thích progress bar, Fix lỗi Level-up, Tối ưu Mobile
**Ngày:** 2026-02-24 | **Giờ:** 14:32
**Mục tiêu:** Thêm chú thích cho các thanh trạng thái EXP, Năng lượng, Tình cảm trong Dashboard. Cập nhật logic Level-up ngay khi Load Game. Chỉnh sửa CSS phòng để hiển thị nút tốt hơn trên mobile.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `style.css`, `js/models/Pet.js`

### 📊 Kết quả & Quan sát
* **Dashboard Label:** Đã đổi `.stat-icon` thành `.stat-label` chứa Icon + text (EXP, Năng lượng, Tình cảm) giúp người dùng dễ nhận biết thông số.
* **Level-up Logic:** Trong `Pet.js` gọi thêm `this.checkLevelUp()` khi bắt Event `USER_LOGGED_IN`. Con Pet giờ đây sẽ tự động reset stage và nhảy Cấp (Level up) khi exp vượt mốc ngay từ lúc mở Game (fix lỗi bị kẹt exp 4200/4156).
* **Phòng (Mobile):** Sửa CSS `.room-inputs` thêm `flex-wrap: wrap` và `.btn.small` thành `flex: 1` giúp 3 nút Vào/Tạo/Rời sẽ được dàn đều, không tự ép bẹp trên các thiết bị màn nhỏ (laptop/mobile).

### 💡 Ghi chú & Bước tiếp theo
> Giao diện tối ưu và mượt mà hơn. Đã khắc phục triệt để lỗi logic Level-up lúc Login.
- [x] Tiếp tục theo dõi và fix các UI bug khác nếu có.
---

---
## 🛠 Hotfix 7: Thêm nền trắng (Background) cho Tủ Đồ/Shop
**Ngày:** 2026-02-24 | **Giờ:** 14:35
**Mục tiêu:** Cửa sổ Collection Modal / Shop bị thiếu background làm các nút mua thẻ vật phẩm chồng lên nền của giao diện chính rất khó nhìn.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `style.css`

### 📊 Kết quả & Quan sát
* **CSS Update:** Trong phần `.collection-box`, đã bổ sung thuộc tính `background-color: var(--surface-color);`. Thay đổi này giúp Modal hiện ra một popup thẻ cứng trắng tinh, che phủ mờ background xung quanh, làm rõ các khung Items.
---

---
## 🛠 Hotfix 8: Gộp chung nút Tủ Đồ và Cửa Hàng
**Ngày:** 2026-02-24 | **Giờ:** 14:38
**Mục tiêu:** Giao diện có quá nhiều nút dẫn đến chật chội. Cần gộp nút mở Tủ Đồ (Collection) và Cửa Hàng (Shop) lại thành 1 nút duy nhất.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `index.html`, `js/views/CollectionView.js`

### 📊 Kết quả & Quan sát
* **Giao diện chính:** Bỏ bớt nút `resources-btn` hình balo 🎒. Chỉ giữ lại nút `shop-btn` và thay đổi icon thành hình Cửa hàng tiện lợi 🏪 mang ý nghĩa bao hàm chứa cả Tủ đồ lẫn Shop mua sắm.
* **Logic UI:** Khi click vào nút `shop-btn`, Modal "My Collection" sẽ mở ra. Bên trong modal đã có sẵn 2 Tab giúp người dùng tùy ý chuyển đổi qua lại giữa việc Cài đặt Item (Stages) và Mua Sắm (Items).

### 💡 Ghi chú & Bước tiếp theo
> Việc gom nhóm nút giúp không gian Header thoáng đản hơn.
- [x] Tính năng ổn định.
---

---
## 🛠 Hotfix 9: Thêm hiệu ứng chúc mừng (Particle Effects) & Bật hình render thật trong Tủ Đồ (Collection) thay vì Icon Emoji
**Ngày:** 2026-02-24 | **Giờ:** 14:48
**Mục tiêu:** Tăng trải nghiệm phần thưởng (Reward experience) khi Pet Level-up hoặc tiến hóa (Stage up). Đồng thời, hiển thị đúng hình dáng nhân vật thú cưng khi đang ở các Stage trong Tủ đồ thay vì dùng các icon 🐶 🐱 đơn điệu.

### 🛠 Cấu hình & Tham số
* **File liên quan:** `js/views/PetView.js`, `js/views/CollectionView.js`, tạo mới `js/utils/drawPetStatic.js`

### 📊 Kết quả & Quan sát
* **Hiệu ứng Level Up & Stage Up:** Trong `PetView.js`, đã bắt các sự kiện `PET_LEVEL_UP` và `PET_STAGE_UPDATED` để phun ra hạt pháo hoa (🎉) cùng với dòng chữ ("STAGE UP!", "LEVEL UP!") tạo cảm giác phấn khích.
* **Tủ Đồ (Stages):** Đã code riêng một module tách biệt là `drawPetStatic.js` để giúp tái nạp lại giao diện đồ hoạ Canvas của Pet theo từng cấp độ Stage (tỉ lệ 0.8, 1.0, 1.2). Thay vì hiển thị thẻ Emoji rỗng tuếch, giờ đây Tủ đồ sẽ vẽ lại và hiển thị ảnh Snapshot hiện tại của thú cưng, đúng màu lông, đúng quần áo đội mũ, một cách sống động như trong màn hình chính.

### 💡 Ghi chú & Bước tiếp theo
> Tính cá nhân hóa đã được nâng cấp đáng kể!
- [x] Tính năng ổn định.
---

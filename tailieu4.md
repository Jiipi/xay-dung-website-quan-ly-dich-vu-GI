📁 SƠ ĐỒ TRANG (SITEMAP) ĐẦY ĐỦ
Dưới đây là toàn bộ các page cần phát triển, được chia theo nhóm đối tượng. Bạn nên tổ chức thư mục Next.js App Router tương ứng.

1. Trang Chung (Không cần đăng nhập)
/ — Landing Page (Trang chủ)

/services — Bảng giá dịch vụ

/login — Đăng nhập

/register — Đăng ký

/forgot-password — Quên mật khẩu

/terms — Điều khoản dịch vụ

/privacy — Chính sách bảo mật

/refund — Chính sách hoàn tiền

/faq — Câu hỏi thường gặp

/contact — Liên hệ (có thể để form hoặc thông tin)

2. Trang Khách hàng (Yêu cầu đăng nhập, role CUSTOMER)
Layout: Sidebar hoặc Topbar hiển thị avatar, tên, số dư ví.

/dashboard — Tổng quan (số dư, đơn gần đây, thông báo)

/dashboard/orders — Danh sách đơn hàng của tôi (có filter trạng thái)

/dashboard/orders/[id] — Chi tiết đơn hàng (timeline, chat, ảnh kết quả)

/dashboard/deposit — Nạp tiền (tạo QR, lịch sử nạp)

/dashboard/wallet — Lịch sử ví (sổ cái giao dịch)

/dashboard/profile — Hồ sơ cá nhân (đổi mật khẩu web, thông tin cơ bản)

/dashboard/notifications — Thông báo (nếu có)

3. Trang Admin (Yêu cầu đăng nhập, role ADMIN)
Layout: Sidebar quản trị chuyên nghiệp.

/admin/login — Đăng nhập admin (trang riêng)

/admin — Dashboard tổng quan (doanh thu, đơn mới, biểu đồ)

/admin/orders — Quản lý đơn hàng (bảng lọc, tìm kiếm)

/admin/orders/[id] — Chi tiết đơn hàng (admin) (xem/che mật khẩu, cập nhật trạng thái, upload ảnh)

/admin/services — Quản lý dịch vụ & bảng giá (CRUD)

/admin/users — Quản lý khách hàng (danh sách, khóa/mở, xem lịch sử)

/admin/wallet/transactions — Quản lý giao dịch ví (xem tất cả, filter)

/admin/wallet/adjust — Điều chỉnh số dư (tạo adjustment thủ công)

/admin/deposits — Quản lý nạp tiền (duyệt tay nếu cần, đối soát webhook)

/admin/audit-logs — Nhật ký admin (xem log xem mật khẩu, sửa đơn, v.v.)

/admin/settings — Cài đặt hệ thống (thông tin ngân hàng, API keys, thông báo)

/admin/pages — Quản lý nội dung tĩnh (sửa trang điều khoản, FAQ, v.v.)

🎨 ĐỀ XUẤT THIẾT KẾ & CẢM HỨNG
🌟 Phong cách thiết kế chủ đạo
Tối giản, hiện đại, có chiều sâu (flat design 2.5D)

Màu sắc: Xanh dương đậm (#1e3a8a) làm chủ đạo, vàng (#f59e0b) làm điểm nhấn. Gradient từ blue-900 đến blue-700.

Hình ảnh: Sử dụng các illustration vector liên quan đến game (nhưng không vi phạm bản quyền), hoặc abstract art với các biểu tượng nguyên tố.

Hiệu ứng: Chuyển động mượt (Framer Motion), parallax nhẹ ở hero, card có shadow nâng lên khi hover.

Font chữ: Inter (hoặc Noto Sans Vietnamese) cho nội dung; có thể dùng font display cho heading (ví dụ: "Be Vietnam Pro" hoặc "Space Grotesk").

🔍 Cảm hứng từ các website thực tế
Eldorado.gg / PlayerAuctions — Các sàn giao dịch tài khoản game lớn. Học cách họ hiển thị bảng giá, đánh giá, và form đặt hàng.

Hoyolab (trang chính thức của Genshin) — Màu sắc, icon, cách sắp xếp thông tin về nhân vật, sự kiện. Có thể mô phỏng phong cách "game UI" nhưng tinh tế hơn.

Stripe / Linear — Cho phần dashboard admin: tối giản, tập trung vào dữ liệu, bảng biểu rõ ràng, màu sắc trung tính.

Dribbble — Tìm kiếm "game service dashboard", "genshin impact UI", "wallet app" để lấy ý tưởng component.

🧩 Các kỹ năng mẫu UI/UX nên áp dụng
a. Trang Landing Page
Hero section với background có hiệu ứng particles nhẹ (dùng tsparticles hoặc tự tạo bằng canvas).

Bộ đếm số (animation đếm lên) cho: "Đơn hàng đã hoàn thành", "Khách hàng hài lòng", "Năm kinh nghiệm".

Testimonials slider (có thể mock bằng ảnh đại diện giả).

FAQ accordion đẹp (shadcn/ui có sẵn).

b. Bảng giá
Dùng Card có ribbon cho gói phổ biến.

Toggle giữa các danh mục dịch vụ (Endgame, Farm, ...) hoặc tabs.

Hiệu ứng hover: card nâng lên, border chuyển màu vàng.

c. Form tạo đơn (phần nhập mật khẩu)
Stepper (bước 1, bước 2, ...) rõ ràng, có icon.

Cảnh báo dạng callout box (như đã code) với viền cam, nền vàng nhạt.

Input password có toggle ẩn/hiện, kèm thanh độ mạnh mật khẩu (nếu cần).

Checkbox đồng ý điều khoản thiết kế nổi bật, không bị bỏ qua.

d. Dashboard khách
Sidebar thu gọn với icon, khi mở rộng hiện text.

Số dư ví hiển thị lớn ở topbar, có animation khi thay đổi.

Timeline cho trạng thái đơn hàng (dùng thư viện framer-motion cho animation cuộn).

Chat box đơn giản trong trang chi tiết đơn.

e. Admin Panel
Data table (có thể dùng tanstack/react-table kết hợp shadcn/ui) hỗ trợ sort, filter, pagination.

Modal xác nhận khi xem mật khẩu: "Bạn sắp xem mật khẩu. Hành động này sẽ được ghi log." kèm nút "Xem trong 20 giây".

Biểu đồ doanh thu cơ bản (dùng Recharts hoặc Chart.js).

Trạng thái đơn hàng dùng badge màu: chờ (xám), đang làm (xanh), hoàn thành (xanh lá), hủy (đỏ).

🛠️ THƯ VIỆN & CÔNG CỤ HỖ TRỢ THIẾT KẾ
Mục đích	Gợi ý
Icon	lucide-react (đã dùng), react-icons (bổ sung)
Animation	framer-motion, react-spring
Particles background	@tsparticles/react (hoặc tự code css)
Biểu đồ admin	recharts (đơn giản, đẹp)
Timeline	react-chrono hoặc tự làm với flex + motion
Form validation	react-hook-form + zod
Toast notification	sonner (nhẹ, đẹp)
Avatar upload	react-dropzone + cloudinary (tương lai)
Carousel	embla-carousel-react
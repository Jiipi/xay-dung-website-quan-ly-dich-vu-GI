# KẾ HOẠCH PHÁT TRIỂN WEB DỊCH VỤ GENSHIN IMPACT

> **Mục tiêu:** Xây dựng nền tảng quản lý dịch vụ game chuyên nghiệp, tập trung vào trải nghiệm khách hàng và bảo mật dữ liệu.
> **Công nghệ:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, payOS, Cloudflare.
> **Người vận hành:** Một mình (Admin kiêm Staff). Chạy localhost trước khi triển khai production.

---

## 1. CẢNH BÁO QUAN TRỌNG TRƯỚC KHI LÀM

### 1.1 Rủi ro tài khoản game
- HoYoverse nghiêm cấm chia sẻ tài khoản. Web phải có điều khoản yêu cầu khách đồng ý, nêu rõ rủi ro và **tuyệt đối không cam kết an toàn tuyệt đối** cho account.
- Không sử dụng bot, cheat, tool can thiệp game.

### 1.2 Luật Bảo vệ dữ liệu cá nhân (có hiệu lực từ 01/01/2026)
- Cần chính sách thu thập, xử lý, lưu trữ và xoá dữ liệu cá nhân (email, số điện thoại, thông tin game, lịch sử thanh toán…).
- Dữ liệu phải được bảo vệ đúng chuẩn.

### 1.3 Ví nội bộ
- **Không** xây dựng ví điện tử cho phép chuyển/rút tiền giữa người dùng.
- Chỉ dùng số dư trả trước nội bộ để thanh toán dịch vụ trên web.

---

## 2. MÔ HÌNH WEB

# KẾ HOẠCH PHÁT TRIỂN WEB DỊCH VỤ GENSHIN IMPACT

> **Mục tiêu:** Xây dựng nền tảng quản lý dịch vụ game chuyên nghiệp, tập trung vào trải nghiệm khách hàng và bảo mật dữ liệu.
> **Công nghệ:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, payOS, Cloudflare.
> **Người vận hành:** Một mình (Admin kiêm Staff). Chạy localhost trước khi triển khai production.

---

## 1. CẢNH BÁO QUAN TRỌNG TRƯỚC KHI LÀM

### 1.1 Rủi ro tài khoản game
- HoYoverse nghiêm cấm chia sẻ tài khoản. Web phải có điều khoản yêu cầu khách đồng ý, nêu rõ rủi ro và **tuyệt đối không cam kết an toàn tuyệt đối** cho account.
- Không sử dụng bot, cheat, tool can thiệp game.

### 1.2 Luật Bảo vệ dữ liệu cá nhân (có hiệu lực từ 01/01/2026)
- Cần chính sách thu thập, xử lý, lưu trữ và xoá dữ liệu cá nhân (email, số điện thoại, thông tin game, lịch sử thanh toán…).
- Dữ liệu phải được bảo vệ đúng chuẩn.

### 1.3 Ví nội bộ
- **Không** xây dựng ví điện tử cho phép chuyển/rút tiền giữa người dùng.
- Chỉ dùng số dư trả trước nội bộ để thanh toán dịch vụ trên web.

---

## 2. MÔ HÌNH WEB


### 2.1 Nhóm dịch vụ mẫu
| Nhóm | Ví dụ |
|------|-------|
| Endgame | La Hoàn Thâm Cảnh, Nhà Hát Giả Tưởng, Ảo Cảnh Hiểm Ác |
| Gacha | Roll nhân vật / vũ khí hộ |
| Map | Mở map, thần đồng, rương, nhiệm vụ thế giới |
| Farm | Nguyên liệu, thánh di vật, boss tuần/ngày |
| Sự kiện | Làm event theo phiên bản |
| Gói tùy chỉnh | Yêu cầu riêng, admin báo giá |

---

## 3. THIẾT KẾ HỆ THỐNG QUAN TRỌNG

### 3.1 Ví sổ cái (Ledger)
- **Không lưu `balance` trực tiếp.** Số dư = tổng các giao dịch thành công.
- Các loại giao dịch: `deposit`, `hold`, `charge`, `refund`, `adjustment`, `bonus`.
- Bảng `wallet_transactions` lưu vết mọi thay đổi.

### 3.2 Xử lý mật khẩu Genshin
- **Mã hóa hai chiều** (AES-256-GCM), **không hash**.
- Lưu ciphertext trong `order_credentials`.
- Admin xem mật khẩu phải qua bước xác thực, hiển thị tạm thời, có ghi log (`AdminAuditLog`).
- Tự động xóa hoặc vô hiệu hóa sau khi đơn hoàn tất.

### 3.3 Thanh toán QR tự động (payOS)
- Tạo mã nạp duy nhất: `NAP-USER123-PAYID456`.
- Webhook verify signature + kiểm tra amount, orderCode, idempotency.
- Tuyệt đối **không** cộng tiền dựa trên ảnh chụp màn hình.

---

## 4. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Lựa chọn |
|-----------|----------|
| Frontend + Backend | Next.js (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Form | React Hook Form + Zod |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth/Auth.js hoặc custom JWT |
| Thanh toán | payOS (VietQR) |
| Hosting (tương lai) | VPS / Railway / Vercel |
| Monitoring | Sentry, Uptime monitor |

---

## 5. DATABASE SCHEMA CHÍNH (liệt kê)

- `users`, `roles`, `user_roles`
- `services`, `service_categories`, `service_price_options`
- `orders`, `order_items`, `order_status_logs`, `order_credentials`
- `wallet_accounts`, `wallet_transactions`
- `payment_intents`, `payment_webhook_events`
- `staff_assignments`, `support_messages`, `attachments`
- `admin_audit_logs`
- `coupons`, `system_settings`, `pages_content`

---

## 6. QUY TRÌNH ĐẶT ĐƠN & TRẠNG THÁI

Trạng thái đơn hàng (nội bộ → hiển thị tiếng Việt):
- `pending_payment` → Chờ thanh toán
- `paid_waiting_account` → Đã thanh toán, chờ gửi tài khoản
- `waiting_admin_accept` → Chờ nhận đơn
- `in_progress` → Đang xử lý
- `need_customer_action` → Cần khách xác minh
- `paused` → Tạm dừng
- `completed_waiting_confirm` → Chờ xác nhận hoàn tất
- `completed` → Đã hoàn tất
- `cancelled` → Đã hủy
- `refunded` → Đã hoàn tiền

---

## 7. BẢNG GIÁ LINH HOẠT

- Admin có thể thêm/sửa/ẩn dịch vụ, thiết lập giá cố định hoặc “báo giá sau”.
- Hỗ trợ các trường: tên, mô tả, giá gốc, giá sale, độ khó, thời gian dự kiến, yêu cầu, trạng thái.

---

## 8. BẢO MẬT – CHECKLIST OWASP

- Hash mật khẩu web (Argon2/bcrypt), 2FA cho Admin.
- HttpOnly, Secure, SameSite Cookie.
- CSRF protection, Rate limiting, Input validation (Zod).
- Mã hóa mật khẩu game (AES-256-GCM), không log ra console.
- Webhook verify signature, idempotency.
- Audit log tất cả hành động nhạy cảm.
- Sử dụng Prisma (prevent SQL Injection), escape output chống XSS.

---

## 9. LỘ TRÌNH PHÁT TRIỂN (6 giai đoạn)

**A. Thiết lập nền móng & UI tĩnh (ưu tiên hiện tại)**  
**B. Back-end cốt lõi (Auth, DB, Ví, Đơn hàng)**  
**C. Tích hợp thanh toán payOS**  
**D. Bảo mật tài khoản game (mã hóa, log, tự xóa)**  
**E. Kiểm thử bảo mật toàn diện**  
**F. Chuẩn bị production (2FA, HTTPS, backup, chính sách)**

---

## 10. CHÍNH SÁCH WEBSITE

- Điều khoản dịch vụ, Chính sách bảo mật, Chính sách hoàn tiền.
- Cảnh báo rủi ro chia sẻ account (không gửi mật khẩu email/backup).
- Cam kết không cheat/bot.

# Kiến trúc hệ thống

GenshinFlow là ứng dụng Next.js 16 sử dụng App Router, TypeScript 5 và Prisma 7. Mã nguồn được tổ chức theo kiến trúc 3 tầng để tách biệt giao diện, nghiệp vụ và các tích hợp bên ngoài.

## Kiến trúc 3 tầng

| Tầng | Thư mục chính | Trách nhiệm | Quy ước |
| --- | --- | --- | --- |
| Presentation | `src/app/`, `src/components/` | Route, layout, page, UI component và Server Action nhận input từ người dùng | Không truy vấn Prisma trực tiếp trong page/layout; ủy quyền cho module nghiệp vụ |
| Application / Domain | `src/modules/` | Use case và quy tắc nghiệp vụ theo module như orders, wallet và services | Không phụ thuộc chi tiết HTTP hoặc adapter database |
| Infrastructure | `src/infrastructure/`, `src/lib/db.ts`, `src/lib/` | Prisma, PostgreSQL, thanh toán PayOS, mã hóa, rate limit và tích hợp bên ngoài | Đóng gói truy cập tài nguyên ngoài qua adapter/service có thể kiểm thử |

Luồng phụ thuộc chuẩn là `Presentation → Application / Domain → Infrastructure`. Infrastructure không gọi ngược lên UI; domain chỉ nhận dữ liệu và dependency cần thiết thay vì biết chi tiết framework.

## Route groups

Tên route group trong ngoặc chỉ dùng để tổ chức mã nguồn và không xuất hiện trong URL công khai.

| Route group | URL chính | Mục đích |
| --- | --- | --- |
| `(marketing)` | `/`, `/services`, `/pricing`, `/faq`, `/blog`, `/terms`, `/privacy`, `/refund`, `/refund-policy`, `/contact` | Trang giới thiệu, nội dung SEO, danh mục dịch vụ và chính sách công khai |
| `(auth)` | `/login`, `/register`, `/forgot-password` | Đăng nhập, đăng ký và khôi phục quyền truy cập |
| `(customer)` | `/order`, `/dashboard`, `/dashboard/orders`, `/dashboard/wallet`, `/dashboard/profile` | Đặt dịch vụ và quản lý đơn hàng, ví, hồ sơ của khách hàng |
| `(admin)` | `/admin`, `/admin/orders`, `/admin/services`, `/admin/users`, `/admin/settings` | Vận hành dịch vụ, xử lý đơn và quản trị hệ thống |
| API Route Handlers | `/api/auth/**`, `/api/orders/**`, `/api/services`, `/api/wallet/**`, `/api/admin/**`, `/api/webhooks/**` | API nội bộ, xác thực, nghiệp vụ dashboard và webhook thanh toán |

Route handler chịu trách nhiệm chuyển đổi request/response và gọi module nghiệp vụ; validation, authorization và truy vấn dữ liệu không nên bị dồn vào component giao diện.

## Tổng quan database

Prisma schema hiện có 27 model, được lưu trong PostgreSQL và truy cập qua `src/lib/db.ts`:

- **Identity và phân quyền:** `User`.
- **Danh mục dịch vụ:** `ServiceCategory`, `Service`, `ServicePriceOption`, `Tag`, `ServiceTag`, `Favorite`.
- **Đơn hàng và trao đổi:** `Order`, `OrderStatusLog`, `OrderCredential`, `OrderMessage`.
- **Ví và thanh toán:** `WalletTransaction`, `PaymentIntent`, `PaymentWebhookEvent`.
- **Quản trị và nội dung hệ thống:** `AdminAuditLog`, `SystemSetting`, `PagesContent`.
- **Tương tác khách hàng:** `Review`, `Notification`, `Conversation`, `ConversationMessage`.
- **Hoàn tiền và khuyến mãi:** `RefundRequest`, `Coupon`, `CouponRedemption`.
- **FAQ và blog:** `FaqCategory`, `FaqItem`, `Article`.

Mọi thao tác dữ liệu cần giữ đúng ranh giới người dùng/đơn hàng, kiểm tra quyền trước khi đọc dữ liệu nhạy cảm và ưu tiên soft delete khi bổ sung các thực thể CRM. Thay đổi schema phải đi kèm migration và cập nhật seed/test liên quan.

## Skills và convention liên quan

- [FreelanceHub Architecture](../.agents/skills/freelancehub-architecture/SKILL.md) — phân lớp và vị trí mã nguồn.
- [FreelanceHub DB Schema](../.agents/skills/freelancehub-db-schema/SKILL.md) — Prisma schema, tenant boundary và sequence.
- [FreelanceHub Design System](../.agents/skills/freelancehub-design-system/SKILL.md) — màu sắc, typography và component UI.

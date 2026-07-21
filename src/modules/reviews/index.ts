/**
 * Domain module: Reviews.
 *
 * Business logic xoay quanh đánh giá dịch vụ (Review):
 *  - Khách hàng tạo đánh giá sau khi đơn COMPLETED.
 *  - Quản trị viên kiểm duyệt (PENDING -> APPROVED | REJECTED).
 *  - Public xem các review APPROVED cùng thống kê tổng hợp.
 *
 * Tất cả logic thuần DB, KHÔNG phụ thuộc Next.js / HTTP — chỉ chứa business rule.
 */

export * from "./service";

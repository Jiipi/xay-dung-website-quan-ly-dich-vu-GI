/**
 * Lớp lỗi tiêu chuẩn cho các module domain.
 *
 * Mỗi lớp ánh xạ 1-1 sang HTTP status code tại route handler:
 *  - ValidationError  -> 400
 *  - UnauthorizedError -> 401
 *  - ForbiddenError   -> 403
 *  - NotFoundError    -> 404
 *  - ConflictError    -> 409
 *
 * Việc tách lớp lỗi ra đây giúp các module `src/modules/*` có thể ném lỗi
 * semantic mà KHÔNG cần biết tới Next.js / Response API.
 */

/** Lỗi 400 — dữ liệu đầu vào không hợp lệ. */
export class ValidationError extends Error {
  override readonly name = "ValidationError";
  constructor(message: string) {
    super(message);
  }
}

/** Lỗi 401 — chưa đăng nhập hoặc phiên hết hạn. */
export class UnauthorizedError extends Error {
  override readonly name = "UnauthorizedError";
  constructor(message: string) {
    super(message);
  }
}

/** Lỗi 403 — đã đăng nhập nhưng thiếu quyền. */
export class ForbiddenError extends Error {
  override readonly name = "ForbiddenError";
  constructor(message: string) {
    super(message);
  }
}

/** Lỗi 404 — không tìm thấy bản ghi / tài nguyên. */
export class NotFoundError extends Error {
  override readonly name = "NotFoundError";
  constructor(message: string) {
    super(message);
  }
}

/** Lỗi 409 — xung đột trạng thái (đã tồn tại, đã xử lý, vượt giới hạn). */
export class ConflictError extends Error {
  override readonly name = "ConflictError";
  constructor(message: string) {
    super(message);
  }
}

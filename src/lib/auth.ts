import { cookies } from "next/headers";
import { verifyToken, type TokenPayload } from "@/lib/jwt";

/**
 * Kết quả trả về từ `getCurrentUser()`.
 * - `null`: chưa đăng nhập / phiên hết hạn.
 * - `payload`: thông tin người dùng đã xác thực.
 */
export type CurrentUser = TokenPayload;

/**
 * Lấy thông tin người dùng hiện tại từ cookie `token`.
 * Trả về `null` nếu không có cookie hoặc token không hợp lệ.
 *
 * Lưu ý: KHÔNG truy vấn DB ở đây — chỉ đọc JWT đã ký.
 * Dùng hàm này ở đầu mỗi Route Handler để kiểm tra session.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload;
}

/**
 * Yêu cầu một người dùng đã đăng nhập, ném lỗi nếu không có.
 * Dùng cho Server Action / Route Handler đã xác thực session
 * và muốn throw thay vì trả về `{ error }`.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Helpers HTTP-side để bóc tách session / payload từ cookie trong App Router.
 *
 * Các module `src/modules/*` KHÔNG dùng trực tiếp file này — chúng chỉ nhận
 * `userId` / `adminId` đã trích xuất sẵn. Đây là lớp adapter mỏng, giúp giữ
 * ranh giới domain ↔ presentation (3-tier architecture).
 */

import { cookies } from "next/headers";
import { verifyToken, type TokenPayload } from "@/lib/jwt";

export async function getCurrentSession(): Promise<TokenPayload | null> {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

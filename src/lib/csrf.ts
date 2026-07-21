/**
 * Chống CSRF ở tầng ứng dụng (defense-in-depth cùng cookie SameSite=lax).
 * KHÔNG import "next" để giữ thuần & test được.
 */

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Trả về true nếu request CHẮC CHẮN đến từ site khác:
 * - Có header Origin nhưng host của nó không khớp Host và không nằm trong allowedOrigins.
 * Nếu KHÔNG có Origin -> trả false (không kết luận; dựa vào SameSite cookie) để tránh
 * chặn nhầm client hợp lệ. Origin dị dạng -> coi là đáng ngờ (true).
 */
export function isCrossSiteRequest(
  origin: string | null,
  host: string | null,
  allowedOrigins: string[] = []
): boolean {
  if (!origin) return false;
  const originHost = safeHost(origin);
  if (!originHost) return true;
  if (host && originHost === host) return false;
  if (allowedOrigins.some((a) => safeHost(a) === originHost)) return false;
  return true;
}

/** Đọc Origin/Host từ Request + NEXTAUTH_URL và quyết định có chặn (cross-site) hay không. */
export function isBlockedCrossSite(request: Request): boolean {
  const allowed = process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : [];
  return isCrossSiteRequest(
    request.headers.get("origin"),
    request.headers.get("host"),
    allowed
  );
}

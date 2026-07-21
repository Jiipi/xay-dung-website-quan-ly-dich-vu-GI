/**
 * Server-Sent Events endpoint cho notifications realtime.
 *
 * Cơ chế: poll DB mỗi 5s để phát hiện notification mới tạo cho user hiện tại.
 *  - Đơn giản, không phụ thuộc hạ tầng pub/sub.
 *  - Với vài trăm concurrent user thì đủ dùng; nếu scale lớn cần thay bằng
 *    Supabase Realtime / Postgres LISTEN.
 *
 * Lưu ý Next.js 16: route handler này MẶC ĐỊNH dynamic (vì header set
 * cache-control: no-store). Không cache.
 */

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Không cache route này — stream realtime. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Khoảng cách poll (ms). 5 giây — đủ nhanh với UX, đủ nhẹ cho DB. */
const POLL_INTERVAL_MS = 5_000;

/** Format một SSE event đúng chuẩn: `data: <json>\n\n`. */
function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * GET /api/notifications/stream
 *
 * Trả về Content-Type `text/event-stream` và stream các notification mới.
 * Khi client disconnect → stream tự đóng (controller.abort()).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    // Trả về JSON một lần nếu chưa đăng nhập (EventSource không đọc status code dễ dàng).
    return new Response(
      JSON.stringify({ error: "Chưa đăng nhập" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const userId = user.userId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let isClosed = false;
      let lastSeenAt = new Date();

      const safeEnqueue = (chunk: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          isClosed = true;
        }
      };

      // Gửi "ready" ngay để client biết connection đã mở.
      safeEnqueue(sse("ready", { ok: true, userId, ts: new Date().toISOString() }));

      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          const recent = await db.notification.findMany({
            where: {
              userId,
              createdAt: { gt: lastSeenAt },
            },
            orderBy: { createdAt: "asc" },
            take: 25,
          });

          if (recent.length > 0) {
            lastSeenAt = recent[recent.length - 1]!.createdAt;
            for (const n of recent) {
              safeEnqueue(
                sse("notification", {
                  id: n.id,
                  type: n.type,
                  title: n.title,
                  content: n.content,
                  href: n.href,
                  payload: n.payload,
                  createdAt: n.createdAt.toISOString(),
                }),
              );
            }
            // Heartbeat cùng với batch.
            safeEnqueue(sse("heartbeat", { ts: new Date().toISOString() }));
          } else {
            // Heartbeat để giữ kết nối và qua CDN/proxy.
            safeEnqueue(sse("heartbeat", { ts: new Date().toISOString() }));
          }
        } catch (err) {
          console.error("Lỗi poll notifications stream:", err);
          safeEnqueue(
            sse("error", { message: "Lỗi khi lấy thông báo mới" }),
          );
        }
      }, POLL_INTERVAL_MS);

      // Khi client đóng kết nối → dừng interval + đóng controller.
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // đã đóng rồi — bỏ qua
        }
      };

      // signal:abort không có sẵn trên mọi runtime — dùng fallback.
      // Trong Node.js runtime (mặc định Next.js), khi request bị abort,
      // việc enqueue sẽ throw, và ta cleanup ở catch của safeEnqueue.
      // Đặt thêm timeout tối đa 10 phút để tránh treo connection.
      const maxLifetimeMs = 10 * 60 * 1000;
      setTimeout(cleanup, maxLifetimeMs);
    },
    cancel() {
      // Được gọi khi consumer (EventSource) hủy stream.
      // clearInterval đã chạy ở cleanup() trong scope start.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Tắt buffering ở reverse proxy (nginx) để event tới tay client ngay.
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * REST endpoint cho thông báo của user hiện tại.
 *
 * - GET    ?limit=&cursor=&read=  -> list + unreadCount
 * - PATCH  body { ids?, all? }    -> markAsRead(many) | markAllAsRead
 * - DELETE body { id }            -> xóa một notification
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "@/modules/notifications";

const patchSchema = z
  .object({
    ids: z.array(z.string().min(1)).optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.ids && v.ids.length > 0) || v.all === true, {
    message: "Cần truyền `ids` (mảng id) hoặc `all: true`",
  });

const deleteSchema = z.object({ id: z.string().min(1) });

/** GET /api/notifications — list + unread count. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const readRaw = url.searchParams.get("read"); // 'unread' | 'read' | 'all'
    const readState: "unread" | "read" | "all" =
      readRaw === "unread" || readRaw === "read" || readRaw === "all"
        ? readRaw
        : "all";

    const limit = limitRaw ? Math.min(Math.max(Number(limitRaw), 1), 100) : 20;

    const [page, unreadCount] = await Promise.all([
      listNotifications(user.userId, { limit, cursor, readState }),
      getUnreadCount(user.userId),
    ]);

    return NextResponse.json({
      success: true,
      notifications: page.items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        href: n.href,
        payload: n.payload,
        isRead: n.readAt !== null,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      })),
      nextCursor: page.nextCursor ?? null,
      unreadCount,
    });
  } catch (error) {
    console.error("Lỗi GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lấy thông báo" },
      { status: 500 },
    );
  }
}

/** PATCH /api/notifications — đánh dấu đã đọc. */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) ?? {};
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 },
      );
    }

    if (parsed.data.all === true) {
      const count = await markAllAsRead(user.userId);
      return NextResponse.json({ success: true, updated: count });
    }

    const ids = parsed.data.ids ?? [];
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Danh sách id trống" },
        { status: 400 },
      );
    }
    await Promise.all(ids.map((id) => markAsRead(id, user.userId)));
    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error("Lỗi PATCH /api/notifications:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi cập nhật thông báo" },
      { status: 500 },
    );
  }
}

/** DELETE /api/notifications — xóa một notification. */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) ?? {};
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Thiếu id notification" },
        { status: 400 },
      );
    }
    await deleteNotification(parsed.data.id, user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi DELETE /api/notifications:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi xóa thông báo" },
      { status: 500 },
    );
  }
}

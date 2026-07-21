/**
 * /api/conversations
 *
 * - GET  /api/conversations           -> list conversation của user hiện tại (customer)
 *                                       nếu role = ADMIN, trả về list cho admin (hỗ trợ filter)
 * - POST /api/conversations           -> start conversation (customer)
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBlockedCrossSite } from "@/lib/csrf";
import {
  ConversationError,
  listAdminConversations,
  listUserConversations,
  startConversation,
} from "@/modules/conversations";

/** GET /api/conversations — list. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const limit = limitRaw ? Math.min(Math.max(Number(limitRaw), 1), 100) : 20;

    const isAdmin = user.role === "ADMIN";
    const result = isAdmin
      ? await listAdminConversations({
          limit,
          cursor,
          onlyUnassigned:
            url.searchParams.get("onlyUnassigned") === "true",
          ...(statusParam === "OPEN" ||
          statusParam === "CLOSED" ||
          statusParam === "ARCHIVED" ||
          statusParam === "ALL"
            ? { status: statusParam }
            : {}),
        })
      : await listUserConversations(user.userId, {
          limit,
          cursor,
          ...(statusParam === "OPEN" ||
          statusParam === "CLOSED" ||
          statusParam === "ARCHIVED" ||
          statusParam === "ALL"
            ? { status: statusParam }
            : {}),
        });

    return NextResponse.json({
      success: true,
      conversations: result.items.map((c) => ({
        id: c.id,
        userId: c.userId,
        adminId: c.adminId,
        subject: c.subject,
        status: c.status,
        lastMessageAt: c.lastMessageAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
        user: c.user,
        admin: c.admin,
        messageCount: c.messages.length,
      })),
      nextCursor: result.nextCursor ?? null,
    });
  } catch (error) {
    console.error("Lỗi GET /api/conversations:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lấy danh sách hội thoại" },
      { status: 500 },
    );
  }
}

/** POST /api/conversations — start conversation (customer only). */
export async function POST(request: Request) {
  try {
    if (isBlockedCrossSite(request)) {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối (nguồn không hợp lệ)" },
        { status: 403 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Chỉ khách hàng mới có thể bắt đầu hội thoại" },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) ?? {};
    const conversation = await startConversation(user.userId, {
      subject: typeof body?.subject === "string" ? body.subject : undefined,
      initialMessage:
        typeof body?.initialMessage === "string"
          ? body.initialMessage
          : "",
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        subject: conversation.subject,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        messages: conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    if (error instanceof ConversationError) {
      const status =
        error.code === "INVALID_INPUT"
          ? 400
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "FORBIDDEN"
              ? 403
              : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Lỗi POST /api/conversations:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi tạo hội thoại" },
      { status: 500 },
    );
  }
}

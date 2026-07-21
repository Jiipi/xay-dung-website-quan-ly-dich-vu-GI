/**
 * /api/conversations/[id]/messages
 *
 * - POST  /api/conversations/[id]/messages  -> gửi tin nhắn
 *   Body: { content: string, attachments?: string[] }
 * - PATCH /api/conversations/[id]/messages  -> đánh dấu đã đọc
 *   (chỉ cần truy cập endpoint; service.markConversationRead xử lý logic)
 *
 * Lưu ý: conversationId lấy từ URL [id].
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isBlockedCrossSite } from "@/lib/csrf";
import {
  ConversationError,
  markConversationRead,
  sendMessage,
} from "@/modules/conversations";

/** POST /api/conversations/[id]/messages. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: conversationId } = await params;
    const body = (await request.json().catch(() => null)) ?? {};
    const message = await sendMessage(
      user.userId,
      {
        conversationId,
        content: typeof body?.content === "string" ? body.content : "",
        ...(Array.isArray(body?.attachments)
          ? { attachments: body.attachments }
          : {}),
      },
      user.role,
    );

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderRole: message.senderRole,
        content: message.content,
        attachments: message.attachments,
        readAt: message.readAt?.toISOString() ?? null,
        createdAt: message.createdAt.toISOString(),
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
              : error.code === "ALREADY_CLOSED"
                ? 409
                : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Lỗi POST /api/conversations/[id]/messages:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi gửi tin nhắn" },
      { status: 500 },
    );
  }
}

/** PATCH /api/conversations/[id]/messages — đánh dấu đã đọc. */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const result = await markConversationRead(
      conversationId,
      user.userId,
      user.role,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ConversationError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "INVALID_INPUT"
              ? 400
              : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Lỗi PATCH /api/conversations/[id]/messages:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đánh dấu đã đọc" },
      { status: 500 },
    );
  }
}

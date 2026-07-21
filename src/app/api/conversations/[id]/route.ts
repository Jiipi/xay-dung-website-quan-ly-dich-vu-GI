/**
 * /api/conversations/[id] — GET 1 conversation + messages.
 *
 * Quyền truy cập do service.getConversation đảm nhiệm:
 * - CUSTOMER: chỉ conversation của mình.
 * - ADMIN:    mọi conversation (cả unassigned).
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ConversationError,
  getConversation,
} from "@/modules/conversations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getConversation(id, user.userId, user.role);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        adminId: conversation.adminId,
        subject: conversation.subject,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        user: conversation.user,
        admin: conversation.admin,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          content: m.content,
          attachments: m.attachments,
          readAt: m.readAt?.toISOString() ?? null,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
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
    console.error("Lỗi GET /api/conversations/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi lấy hội thoại" },
      { status: 500 },
    );
  }
}

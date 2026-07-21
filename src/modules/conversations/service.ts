/**
 * Module Conversations — pre-sale chat giữa khách và admin.
 *
 * Module này thuộc tầng Application/Domain (freelancehub-architecture).
 * Được phép gọi Prisma trực tiếp. KHÔNG xử lý HTTP, KHÔNG đọc cookie.
 */

import type {
  Conversation,
  ConversationMessage,
  Prisma,
  Role,
  User,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  sendMessageSchema,
  startConversationSchema,
  type SendMessageInput,
  type StartConversationInput,
} from "@/lib/validation";

/* ============================================================================
 *  Types
 * ========================================================================== */

/** Trạng thái hợp lệ của conversation. */
export type ConversationStatus = "OPEN" | "CLOSED" | "ARCHIVED";

/** Conversation kèm messages. */
export type ConversationWithMessages = Conversation & {
  messages: ConversationMessage[];
  user: Pick<User, "id" | "name" | "email">;
  admin: Pick<User, "id" | "name" | "email"> | null;
};

/** Kết quả list phân trang. */
export interface Paginated<T> {
  items: T[];
  nextCursor?: string;
}

/** Options list. */
export interface ListUserConversationsOptions {
  limit?: number;
  cursor?: string;
  /** Lọc theo trạng thái. Mặc định: tất cả trừ ARCHIVED. */
  status?: ConversationStatus | "ALL";
}

export interface ListAdminConversationsOptions {
  limit?: number;
  cursor?: string;
  status?: ConversationStatus | "ALL";
  /** Nếu true → chỉ lấy conversation CHƯA có admin nhận (`adminId = null`). */
  onlyUnassigned?: boolean;
  /** Nếu cung cấp → chỉ lấy conversation do admin này phụ trách. */
  adminId?: string;
}

/* ============================================================================
 *  Errors
 * ========================================================================== */

/** Lỗi domain cho conversations. */
export class ConversationError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "INVALID_INPUT"
      | "ALREADY_CLOSED"
      | "INTERNAL",
    public cause?: unknown,
  ) {
    super(message);
    this.name = "ConversationError";
  }
}

/* ============================================================================
 *  Service: user side
 * ========================================================================== */

/**
 * Khách bắt đầu một conversation pre-sale chat.
 * - Validate input bằng `startConversationSchema`.
 * - Tạo conversation với tin nhắn đầu tiên.
 */
export async function startConversation(
  userId: string,
  input: StartConversationInput,
): Promise<ConversationWithMessages> {
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConversationError(
      parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      "INVALID_INPUT",
    );
  }
  const { subject, initialMessage } = parsed.data;

  try {
    const created = await db.conversation.create({
      data: {
        userId,
        subject: subject ?? null,
        status: "OPEN",
        messages: {
          create: {
            senderId: userId,
            // Khách luôn là CUSTOMER khi bắt đầu conversation.
            senderRole: "CUSTOMER",
            content: initialMessage,
          },
        },
      },
      include: {
        messages: true,
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });
    return created;
  } catch (error) {
    console.error("[conversations] Lỗi startConversation:", error);
    throw new ConversationError(
      "Không thể tạo cuộc hội thoại",
      "INTERNAL",
      error,
    );
  }
}

/**
 * Gửi một tin nhắn vào conversation.
 * - Customer chỉ được gửi nếu là chủ sở hữu.
 * - Admin gửi được nếu đã được assign (hoặc unassigned).
 * - Cập nhật `lastMessageAt` của conversation.
 */
export async function sendMessage(
  userId: string,
  input: SendMessageInput,
  role: Role = "CUSTOMER",
): Promise<ConversationMessage> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConversationError(
      parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      "INVALID_INPUT",
    );
  }
  const { conversationId, content, attachments } = parsed.data;

  try {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, adminId: true, status: true },
    });
    if (!conversation) {
      throw new ConversationError(
        "Cuộc hội thoại không tồn tại",
        "NOT_FOUND",
      );
    }
    if (conversation.status === "CLOSED") {
      throw new ConversationError(
        "Cuộc hội thoại đã đóng",
        "ALREADY_CLOSED",
      );
    }
    if (role === "CUSTOMER" && conversation.userId !== userId) {
      throw new ConversationError(
        "Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này",
        "FORBIDDEN",
      );
    }

    // Tạo message + cập nhật lastMessageAt.
    const [msg] = await db.$transaction([
      db.conversationMessage.create({
        data: {
          conversationId,
          senderId: userId,
          senderRole: role,
          content,
          attachments: attachments ?? [],
        },
      }),
      db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return msg;
  } catch (error) {
    if (error instanceof ConversationError) throw error;
    console.error("[conversations] Lỗi sendMessage:", error);
    throw new ConversationError(
      "Không thể gửi tin nhắn",
      "INTERNAL",
      error,
    );
  }
}

/**
 * Đếm số tin nhắn CHƯA ĐỌC của user trong tất cả conversation.
 * Quy tắc:
 *   - CUSTOMER: messages do ADMIN gửi mà `readAt = null`, ở conversation thuộc user đó.
 *   - ADMIN:   messages do CUSTOMER gửi mà `readAt = null`, trong conversation
 *     do admin đó phụ trách (adminId = userId).
 */
export async function getUnreadMessageCount(
  userId: string,
  role: Role = "CUSTOMER",
): Promise<number> {
  try {
    if (role === "ADMIN") {
      return await db.conversationMessage.count({
        where: {
          senderRole: "CUSTOMER",
          readAt: null,
          conversation: { adminId: userId },
        },
      });
    }
    return await db.conversationMessage.count({
      where: {
        senderRole: "ADMIN",
        readAt: null,
        conversation: { userId },
      },
    });
  } catch (error) {
    console.error("[conversations] Lỗi getUnreadMessageCount:", error);
    throw error;
  }
}

/* ============================================================================
 *  Service: list / fetch
 * ========================================================================== */

/**
 * Helper: encode/decode cursor cho conversations (lastMessageAt + id).
 */
function encodeCursor(c: { lastMessageAt: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ id: c.id, lastMessageAt: c.lastMessageAt.toISOString() }),
  ).toString("base64");
}

function decodeCursor(
  raw: string,
): { id: string; lastMessageAt: Date } | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(raw, "base64").toString("utf-8"),
    ) as { id: string; lastMessageAt: string };
    return { id: decoded.id, lastMessageAt: new Date(decoded.lastMessageAt) };
  } catch {
    return null;
  }
}

/**
 * Liệt kê conversation của một user (customer).
 */
export async function listUserConversations(
  userId: string,
  opts: ListUserConversationsOptions = {},
): Promise<Paginated<ConversationWithMessages>> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

  const whereBase: Prisma.ConversationWhereInput = { userId };
  if (opts.status && opts.status !== "ALL") {
    whereBase.status = opts.status;
  } else if (!opts.status) {
    // Mặc định: bỏ ARCHIVED.
    whereBase.status = { not: "ARCHIVED" };
  }

  let cursorClause: Prisma.ConversationWhereInput = {};
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (c) {
      cursorClause = {
        OR: [
          { lastMessageAt: { lt: c.lastMessageAt } },
          {
            lastMessageAt: c.lastMessageAt,
            id: { lt: c.id },
          },
        ],
      };
    }
  }

  try {
    const items = await db.conversation.findMany({
      where: { AND: [whereBase, cursorClause] },
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: {
        messages: true,
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const last = slice[slice.length - 1];
    return {
      items: slice,
      nextCursor:
        hasMore && last ? encodeCursor(last) : undefined,
    };
  } catch (error) {
    console.error("[conversations] Lỗi listUserConversations:", error);
    throw error;
  }
}

/**
 * Liệt kê conversation cho admin (có nhiều bộ lọc hơn).
 */
export async function listAdminConversations(
  opts: ListAdminConversationsOptions = {},
): Promise<Paginated<ConversationWithMessages>> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

  const where: Prisma.ConversationWhereInput = {
    ...(opts.status && opts.status !== "ALL"
      ? { status: opts.status }
      : { status: { not: "ARCHIVED" } }),
    ...(opts.onlyUnassigned ? { adminId: null } : {}),
    ...(opts.adminId ? { adminId: opts.adminId } : {}),
  };

  let cursorClause: Prisma.ConversationWhereInput = {};
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (c) {
      cursorClause = {
        OR: [
          { lastMessageAt: { lt: c.lastMessageAt } },
          {
            lastMessageAt: c.lastMessageAt,
            id: { lt: c.id },
          },
        ],
      };
    }
  }

  try {
    const items = await db.conversation.findMany({
      where: { AND: [where, cursorClause] },
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: {
        messages: true,
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const last = slice[slice.length - 1];
    return {
      items: slice,
      nextCursor:
        hasMore && last ? encodeCursor(last) : undefined,
    };
  } catch (error) {
    console.error("[conversations] Lỗi listAdminConversations:", error);
    throw error;
  }
}

/**
 * Lấy 1 conversation + toàn bộ messages.
 * - CUSTOMER chỉ xem được của mình.
 * - ADMIN xem được mọi conversation (bao gồm unassigned).
 * @throws ConversationError nếu không tìm thấy / không có quyền.
 */
export async function getConversation(
  conversationId: string,
  viewerId: string,
  role: Role = "CUSTOMER",
): Promise<ConversationWithMessages> {
  try {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });
    if (!conversation) {
      throw new ConversationError(
        "Cuộc hội thoại không tồn tại",
        "NOT_FOUND",
      );
    }

    const isOwner = conversation.userId === viewerId;
    // Admin xem mọi conversation; nếu có adminId thì check match.
    const isAssignedAdmin =
      role === "ADMIN" &&
      (conversation.adminId === null || conversation.adminId === viewerId);
    if (!isOwner && !isAssignedAdmin) {
      throw new ConversationError(
        "Bạn không có quyền truy cập cuộc hội thoại này",
        "FORBIDDEN",
      );
    }
    return conversation;
  } catch (error) {
    if (error instanceof ConversationError) throw error;
    console.error("[conversations] Lỗi getConversation:", error);
    throw new ConversationError(
      "Không thể lấy cuộc hội thoại",
      "INTERNAL",
      error,
    );
  }
}

/* ============================================================================
 *  Service: conversation lifecycle
 * ========================================================================== */

/**
 * Đánh dấu conversation là đã đọc đối với viewer.
 * - CUSTOMER: đánh dấu các message do ADMIN gửi là `readAt = now`.
 * - ADMIN:    đánh dấu các message do CUSTOMER gửi là `readAt = now`.
 *
 * KHÔNG đánh dấu các message do chính viewer gửi.
 */
export async function markConversationRead(
  conversationId: string,
  viewerId: string,
  role: Role = "CUSTOMER",
): Promise<{ updated: number }> {
  try {
    // Bảo đảm viewer có quyền truy cập conversation.
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, adminId: true },
    });
    if (!conv) {
      throw new ConversationError(
        "Cuộc hội thoại không tồn tại",
        "NOT_FOUND",
      );
    }
    const allowed =
      (role === "CUSTOMER" && conv.userId === viewerId) ||
      (role === "ADMIN" &&
        (conv.adminId === null || conv.adminId === viewerId));
    if (!allowed) {
      throw new ConversationError(
        "Bạn không có quyền với cuộc hội thoại này",
        "FORBIDDEN",
      );
    }

    const result = await db.conversationMessage.updateMany({
      where: {
        conversationId,
        senderRole: role === "CUSTOMER" ? "ADMIN" : "CUSTOMER",
        readAt: null,
        // Không cần check senderId != viewerId vì senderRole đã khác role viewer.
      },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  } catch (error) {
    if (error instanceof ConversationError) throw error;
    console.error("[conversations] Lỗi markConversationRead:", error);
    throw new ConversationError(
      "Không thể đánh dấu đã đọc",
      "INTERNAL",
      error,
    );
  }
}

/**
 * Admin nhận (assign) một conversation.
 * - Chỉ admin (role = ADMIN) mới được gọi.
 * - Nếu conversation đã có admin khác → giữ nguyên (tránh hai admin cùng claim).
 *   Trả về `ConversationError` với code FORBIDDEN.
 */
export async function assignAdmin(
  conversationId: string,
  adminId: string,
  callerRole: Role = "ADMIN",
): Promise<Conversation> {
  if (callerRole !== "ADMIN") {
    throw new ConversationError(
      "Chỉ admin mới có thể nhận conversation",
      "FORBIDDEN",
    );
  }
  try {
    const existing = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, adminId: true },
    });
    if (!existing) {
      throw new ConversationError(
        "Cuộc hội thoại không tồn tại",
        "NOT_FOUND",
      );
    }
    if (existing.adminId && existing.adminId !== adminId) {
      throw new ConversationError(
        "Conversation đã có admin khác phụ trách",
        "FORBIDDEN",
      );
    }
    return await db.conversation.update({
      where: { id: conversationId },
      data: { adminId },
    });
  } catch (error) {
    if (error instanceof ConversationError) throw error;
    console.error("[conversations] Lỗi assignAdmin:", error);
    throw new ConversationError(
      "Không thể nhận conversation",
      "INTERNAL",
      error,
    );
  }
}

/**
 * Đóng một conversation.
 * - CUSTOMER: chỉ đóng được conversation của mình.
 * - ADMIN: đóng được conversation mình phụ trách hoặc unassigned.
 */
export async function closeConversation(
  conversationId: string,
  byUserId: string,
  role: Role = "CUSTOMER",
): Promise<Conversation> {
  try {
    const existing = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, adminId: true, status: true },
    });
    if (!existing) {
      throw new ConversationError(
        "Cuộc hội thoại không tồn tại",
        "NOT_FOUND",
      );
    }
    if (existing.status === "CLOSED") {
      return await db.conversation.findUniqueOrThrow({
        where: { id: conversationId },
      });
    }

    const allowed =
      (role === "CUSTOMER" && existing.userId === byUserId) ||
      (role === "ADMIN" &&
        (existing.adminId === null || existing.adminId === byUserId));
    if (!allowed) {
      throw new ConversationError(
        "Bạn không có quyền đóng cuộc hội thoại này",
        "FORBIDDEN",
      );
    }

    return await db.conversation.update({
      where: { id: conversationId },
      data: { status: "CLOSED" },
    });
  } catch (error) {
    if (error instanceof ConversationError) throw error;
    console.error("[conversations] Lỗi closeConversation:", error);
    throw new ConversationError(
      "Không thể đóng cuộc hội thoại",
      "INTERNAL",
      error,
    );
  }
}

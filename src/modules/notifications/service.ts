/**
 * Module quản lý thông báo trong app (Notification model).
 *
 * Module này thuộc tầng Application/Domain (theo freelancehub-architecture).
 * Được phép gọi Prisma trực tiếp vì đây là Application/Domain layer.
 * KHÔNG xử lý HTTP — chỉ trả về Promise / giá trị thuần.
 */

import type { Notification, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/constants";

/* ============================================================================
 *  Types
 * ========================================================================== */

/** Loại thông báo được phép. */
export type NotificationType =
  | "order_status"
  | "payment"
  | "message"
  | "refund"
  | "promotion"
  | "system"
  | "review_reply";

/** Payload đầu vào khi tạo một notification. */
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  href?: string;
  payload?: Record<string, unknown>;
}

/** Kết quả phân trang. */
export interface PaginatedNotifications {
  items: Notification[];
  nextCursor?: string;
}

/** Options cho {@link listNotifications}. */
export interface ListNotificationsOptions {
  limit?: number;
  /** Cursor ở dạng JSON-encoded `{ id, createdAt }` từ response trước. */
  cursor?: string;
  /** Chỉ lấy thông báo đã đọc / chưa đọc. Mặc định: tất cả. */
  readState?: "unread" | "read" | "all";
}

/* ============================================================================
 *  CRUD / basic operations
 * ========================================================================== */

/**
 * Tạo một notification mới cho user.
 * Throws nếu userId không tồn tại (do Prisma FK).
 */
export async function createNotification(
  input: NotificationPayload,
): Promise<Notification> {
  try {
    return await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        href: input.href,
        payload: input.payload as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[notifications] Lỗi tạo notification:", error);
    throw error;
  }
}

/**
 * Tạo nhiều notification trong một transaction.
 * Trả về số lượng thực tế đã tạo.
 */
export async function createBulkNotifications(
  inputs: NotificationPayload[],
): Promise<number> {
  if (inputs.length === 0) return 0;
  try {
    const result = await db.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        content: i.content,
        href: i.href,
        payload: i.payload as Prisma.InputJsonValue | undefined,
      })),
    });
    return result.count;
  } catch (error) {
    console.error("[notifications] Lỗi tạo bulk notifications:", error);
    throw error;
  }
}

/**
 * Đếm số notification chưa đọc của một user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await db.notification.count({
      where: { userId, readAt: null },
    });
  } catch (error) {
    console.error("[notifications] Lỗi đếm unread:", error);
    throw error;
  }
}

/**
 * Lấy danh sách notification của user, phân trang theo cursor.
 * Mặc định limit = 20, tối đa 100.
 */
export async function listNotifications(
  userId: string,
  opts: ListNotificationsOptions = {},
): Promise<PaginatedNotifications> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

  let cursorWhere: Prisma.NotificationWhereInput = {};
  if (opts.cursor) {
    try {
      const decoded = JSON.parse(
        Buffer.from(opts.cursor, "base64").toString("utf-8"),
      ) as { id: string; createdAt: string };
      // cursor là (createdAt, id) của item cuối — lấy các cái cũ hơn.
      cursorWhere = {
        OR: [
          { createdAt: { lt: new Date(decoded.createdAt) } },
          {
            createdAt: new Date(decoded.createdAt),
            id: { lt: decoded.id },
          },
        ],
      };
    } catch {
      // cursor lỗi -> bỏ qua, trả về trang đầu
    }
  }

  const readFilter: Prisma.NotificationWhereInput =
    opts.readState === "unread"
      ? { readAt: null }
      : opts.readState === "read"
        ? { readAt: { not: null } }
        : {};

  try {
    const items = await db.notification.findMany({
      where: { userId, AND: [cursorWhere, readFilter] },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const last = slice[slice.length - 1];
    const nextCursor =
      hasMore && last
        ? Buffer.from(
            JSON.stringify({ id: last.id, createdAt: last.createdAt.toISOString() }),
          ).toString("base64")
        : undefined;

    return { items: slice, nextCursor };
  } catch (error) {
    console.error("[notifications] Lỗi list notifications:", error);
    throw error;
  }
}

/**
 * Đánh dấu một notification là đã đọc.
 * Đảm bảo notification thuộc về user trước khi cập nhật.
 * Returns void; im lặng nếu không tìm thấy / không thuộc user.
 */
export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  try {
    const existing = await db.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true, readAt: true },
    });
    if (!existing || existing.readAt) return;
    await db.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  } catch (error) {
    console.error("[notifications] Lỗi markAsRead:", error);
    throw error;
  }
}

/**
 * Đánh dấu tất cả notification chưa đọc của user là đã đọc.
 * Trả về số lượng đã cập nhật.
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const result = await db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  } catch (error) {
    console.error("[notifications] Lỗi markAllAsRead:", error);
    throw error;
  }
}

/**
 * Xóa một notification của user.
 * Im lặng nếu không tồn tại / không thuộc user.
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<void> {
  try {
    const existing = await db.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });
    if (!existing) return;
    await db.notification.delete({ where: { id: notificationId } });
  } catch (error) {
    console.error("[notifications] Lỗi delete:", error);
    throw error;
  }
}

/* ============================================================================
 *  Templates cho các sự kiện thường gặp
 *  Trả về payload sẵn sàng cho createNotification / createBulkNotifications.
 * ========================================================================== */

/** Shape trả về của mỗi template helper. */
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  content: string;
  href: string;
  payload?: Record<string, unknown>;
}

/** Đầu vào tối thiểu: đối tượng user nhận thông báo. */
export interface TemplateUser {
  id: string;
  name?: string | null;
}

/** Order tối thiểu cho template. */
export interface TemplateOrder {
  id: string;
  orderNumber: string;
  status?: string;
  amount?: number;
}

export const notificationTemplates = {
  /**
   * Khi admin đổi trạng thái đơn hàng.
   */
  orderStatus(
    user: TemplateUser,
    order: TemplateOrder,
    newStatus: string,
  ): NotificationTemplate {
    return {
      type: "order_status",
      title: `Đơn hàng ${order.orderNumber}`,
      content: `Trạng thái mới: ${newStatus}`,
      href: `/dashboard/orders/${order.id}`,
      payload: { orderId: order.id, status: newStatus },
    };
  },

  /**
   * Thanh toán thành công (PayOS deposit / wallet charge).
   */
  paymentSuccess(
    user: TemplateUser,
    order: TemplateOrder,
    amount: number,
  ): NotificationTemplate {
    return {
      type: "payment",
      title: "Thanh toán thành công",
      content: `Đơn hàng ${order.orderNumber} đã được thanh toán ${formatCurrency(amount)}`,
      href: `/dashboard/orders/${order.id}`,
      payload: { orderId: order.id, amount },
    };
  },

  /**
   * Hoàn tiền được duyệt.
   */
  refundApproved(
    user: TemplateUser,
    order: TemplateOrder,
    amount: number,
  ): NotificationTemplate {
    return {
      type: "refund",
      title: "Yêu cầu hoàn tiền được duyệt",
      content: `Đơn hàng ${order.orderNumber} đã hoàn ${formatCurrency(amount)}`,
      href: `/dashboard/orders/${order.id}`,
      payload: { orderId: order.id, amount },
    };
  },

  /**
   * Có tin nhắn mới trong conversation pre-sale chat.
   */
  newMessage(
    user: TemplateUser,
    conversationId: string,
    preview: string,
  ): NotificationTemplate {
    return {
      type: "message",
      title: "Tin nhắn mới",
      content: preview.length > 120 ? `${preview.slice(0, 117)}...` : preview,
      href: `/dashboard/messages/${conversationId}`,
      payload: { conversationId },
    };
  },

  /**
   * Admin phản hồi review của khách.
   */
  reviewReply(
    user: TemplateUser,
    serviceId: string,
    adminReply: string,
  ): NotificationTemplate {
    return {
      type: "review_reply",
      title: "Phản hồi đánh giá",
      content: adminReply.length > 200 ? `${adminReply.slice(0, 197)}...` : adminReply,
      href: `/dashboard/services/${serviceId}`,
      payload: { serviceId },
    };
  },

  /**
   * Thông báo khuyến mãi / coupon mới.
   */
  promotion(
    user: TemplateUser,
    title: string,
    content: string,
    href: string,
  ): NotificationTemplate {
    return { type: "promotion", title, content, href, payload: undefined };
  },

  /**
   * Thông báo hệ thống chung (bảo trì, cập nhật chính sách, ...).
   */
  system(
    user: TemplateUser,
    title: string,
    content: string,
    href: string,
  ): NotificationTemplate {
    return { type: "system", title, content, href, payload: undefined };
  },
} as const;

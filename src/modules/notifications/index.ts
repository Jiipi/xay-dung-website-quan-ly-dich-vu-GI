/**
 * Public surface của module notifications.
 * Re-export từ `service.ts` + cung cấp `safeCreateNotification` cho các
 * call-site không quan tâm lỗi (ví dụ: gửi notif ngầm khi cập nhật đơn).
 */

export {
  notificationTemplates,
  createBulkNotifications,
  createNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
  type ListNotificationsOptions,
  type NotificationPayload,
  type NotificationTemplate,
  type NotificationType,
  type PaginatedNotifications,
  type TemplateOrder,
  type TemplateUser,
} from "./service";
import { createNotification } from "./service";
import type { NotificationPayload, NotificationTemplate } from "./service";

/**
 * Tạo notification mà không throw nếu có lỗi.
 * Dùng cho fire-and-forget (ví dụ: best-effort notify khi đổi trạng thái đơn).
 * Logs lỗi chi tiết ra console để vẫn truy vết được.
 */
export async function safeCreateNotification(
  input: NotificationPayload,
): Promise<void> {
  try {
    await createNotification(input);
  } catch (error) {
    console.error(
      "[notifications.safeCreateNotification] Bỏ qua lỗi:",
      error,
    );
  }
}

/**
 * Biến template thành NotificationPayload sẵn sàng tạo.
 * Tiện cho call-site chỉ cần kết quả gọi createNotification.
 */
export function templateToPayload(
  userId: string,
  template: NotificationTemplate,
): NotificationPayload {
  return {
    userId,
    type: template.type,
    title: template.title,
    content: template.content,
    href: template.href,
    payload: template.payload,
  };
}

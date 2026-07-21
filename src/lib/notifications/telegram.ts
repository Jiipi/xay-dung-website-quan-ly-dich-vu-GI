/**
 * Telegram Bot Notification Utility
 */

import { logger } from "@/lib/logger";

export interface NewOrderNotifyParams {
  orderNumber: string;
  serviceName: string;
  amount: number;
  userName: string;
  server: string;
}

export interface DepositNotifyParams {
  userName: string;
  userEmail: string;
  amount: number;
  paymentCode: string;
  newBalance: number;
}

export interface ClaimOrderNotifyParams {
  orderNumber: string;
  boosterName: string;
  serviceName: string;
}

async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === "YOUR_TELEGRAM_BOT_TOKEN") {
    logger.debug("telegram_not_configured", { preview: text.replace(/<[^>]*>?/gm, "") });
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      logger.warn("telegram_send_failed", { error: await response.text() });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("telegram_api_exception", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Bắn thông báo khi Khách hàng tạo Đơn hàng mới
 */
export async function notifyNewOrder(params: NewOrderNotifyParams) {
  const message = `
<b>🛒 [ĐƠN HÀNG MỚI KHỞI TẠO]</b>
━━━━━━━━━━━━━━━━━━━━
<b>Mã đơn:</b> <code>${params.orderNumber}</code>
<b>Dịch vụ:</b> ${params.serviceName}
<b>Giá trị:</b> <code>${params.amount.toLocaleString("vi-VN")}đ</code>
<b>Khách hàng:</b> ${params.userName}
<b>Server:</b> ${params.server}
━━━━━━━━━━━━━━━━━━━━
<i>⚡ Booster/Admin vui lòng đăng nhập Dashboard để tiếp nhận đơn!</i>
`;
  return sendTelegramMessage(message);
}

/**
 * Bắn thông báo khi Khách nạp tiền ví thành công qua VietQR/Ngân hàng
 */
export async function notifyDepositCompleted(params: DepositNotifyParams) {
  const message = `
<b>💰 [NẠP TIỀN TỰ ĐỘNG THÀNH CÔNG]</b>
━━━━━━━━━━━━━━━━━━━━
<b>Khách hàng:</b> ${params.userName} (${params.userEmail})
<b>Số tiền nạp:</b> +${params.amount.toLocaleString("vi-VN")}đ
<b>Mã GD:</b> <code>${params.paymentCode}</code>
<b>Số dư mới:</b> <code>${params.newBalance.toLocaleString("vi-VN")}đ</code>
━━━━━━━━━━━━━━━━━━━━
<i>✅ Hệ thống đã tự động ghi sổ cái Ledger.</i>
`;
  return sendTelegramMessage(message);
}

/**
 * Bắn thông báo khi Booster nhận đơn hàng (Claim order)
 */
export async function notifyOrderClaimed(params: ClaimOrderNotifyParams) {
  const message = `
<b>🎮 [BOOSTER ĐÃ NHẬN ĐƠN HÀNG]</b>
━━━━━━━━━━━━━━━━━━━━
<b>Mã đơn:</b> <code>${params.orderNumber}</code>
<b>Dịch vụ:</b> ${params.serviceName}
<b>Booster nhận:</b> <b>${params.boosterName}</b>
━━━━━━━━━━━━━━━━━━━━
<i>🚀 Tiến độ đơn hàng đang được cập nhật.</i>
`;
  return sendTelegramMessage(message);
}
